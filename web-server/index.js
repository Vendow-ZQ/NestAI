import 'dotenv/config'
import express from 'express'
import initSqlJs from 'sql.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { callLLM } from './lib/llm.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT || 3000
const UPLOADS_DIR = path.join(__dirname, 'uploads')
const DB_PATH = path.join(__dirname, 'data.db')

// 确保 uploads 目录存在
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

// 初始化 sql.js
const SQL = await initSqlJs()
let db

if (fs.existsSync(DB_PATH)) {
  const filebuffer = fs.readFileSync(DB_PATH)
  db = new SQL.Database(filebuffer)
} else {
  db = new SQL.Database()
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8')
  db.exec(schema)
  saveDb()
}

function saveDb() {
  const data = db.export()
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

function run(sql, params = []) {
  db.run(sql, params)
  const result = db.exec('SELECT last_insert_rowid() as id')
  const id = result[0]?.values[0][0]
  saveDb()
  return id
}

function getOne(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const hasRow = stmt.step()
  const result = hasRow ? stmt.getAsObject() : null
  stmt.free()
  return result
}

function getAll(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const results = []
  while (stmt.step()) {
    results.push(stmt.getAsObject())
  }
  stmt.free()
  return results
}

// Express
const app = express()
app.use(express.json({ limit: '50mb' }))

// 图片静态服务 — 这一步是必须的，不可省略
app.use('/uploads', express.static(UPLOADS_DIR))

// multer 配置
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } })

// === API 端点 ===

// 1. 上传图片
app.post('/api/upload', upload.array('images', 10), (req, res) => {
  const files = req.files || []
  const urls = files.map(f => `/uploads/${f.filename}`)
  res.json({ status: 'success', data: { urls } })
})

// 2. 创建空间
app.post('/api/spaces', (req, res) => {
  const { images } = req.body
  const id = run('INSERT INTO spaces (images, long_term_memory) VALUES (?, ?)', [JSON.stringify(images || []), ''])
  res.json({ status: 'success', data: { id } })
})

// 3. 创建 session
app.post('/api/sessions', (req, res) => {
  const { spaceId } = req.body
  const id = run('INSERT INTO sessions (space_id, status) VALUES (?, ?)', [spaceId, 'uploaded'])
  res.json({ status: 'success', data: { id } })
})

// 4. 获取 session 详情（Chat 页需要）
app.get('/api/sessions/:id', (req, res) => {
  const session = getOne('SELECT * FROM sessions WHERE id = ?', [req.params.id])
  if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' })
  res.json({ status: 'success', data: session })
})

// 5. 分析空间（P001）
app.post('/api/sessions/:id/analyze', async (req, res) => {
  try {
    const session = getOne('SELECT * FROM sessions WHERE id = ?', [req.params.id])
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' })

    const space = getOne('SELECT * FROM spaces WHERE id = ?', [session.space_id])
    const images = space ? JSON.parse(space.images || '[]').map(i => i.s3Url || i) : []

    const result = await callLLM({
      promptId: 'p001_space_reader',
      variables: {},
      images: images.filter(Boolean).slice(0, 5),
    })

    const parsed = result.parsed || JSON.parse(result.raw)
    const memory = parsed.description || result.raw.slice(0, 200)
    const questions = parsed.questions || [
      { q: '你最希望这个空间帮你做到什么？', options: ['更容易进入专注状态', '回来之后真的能放松下来', '更像"我自己的地方"'] },
      { q: '那现在这个空间，最常发生什么？', options: ['我经常在这里学习，但很难进入状态', '我经常在这里刷手机/拖延', '我主要在这里休息，但总觉得不够放松'] },
      { q: '为了不生成你做不到的方案，我再确认几个小条件。', options: ['一个人使用', '和室友共用', '0元', '100元以内'] },
    ]

    run('UPDATE sessions SET short_term_memory = ?, status = ? WHERE id = ?',
      [memory, 'analyzing', req.params.id])

    res.json({ status: 'success', data: { memory, questions } })
  } catch (err) {
    console.error('analyze error:', err)
    // LLM 失败时降级返回默认数据
    res.json({
      status: 'success',
      data: {
        memory: '我看到了一个温馨的空间。在我们继续之前，我想了解一下——',
        questions: [
          { q: '你最希望这个空间帮你做到什么？', options: ['更容易进入专注状态', '回来之后真的能放松下来', '更像"我自己的地方"'] },
          { q: '那现在这个空间，最常发生什么？', options: ['我经常在这里学习，但很难进入状态', '我经常在这里刷手机/拖延', '我主要在这里休息，但总觉得不够放松'] },
          { q: '为了不生成你做不到的方案，我再确认几个小条件。', options: ['一个人使用', '和室友共用', '0元', '100元以内'] },
        ],
      },
    })
  }
})

// 5. 保存 Chat 答案
app.post('/api/sessions/:id/chat', (req, res) => {
  const { questions, answers } = req.body
  run('INSERT INTO chat_responses (session_id, questions, answers) VALUES (?, ?, ?)',
    [req.params.id, JSON.stringify(questions), JSON.stringify(answers)])
  run('UPDATE sessions SET status = ? WHERE id = ?', ['chat_done', req.params.id])
  res.json({ status: 'success', data: { ok: true } })
})

// 6. 生成方案（P002）
app.post('/api/sessions/:id/generate', async (req, res) => {
  try {
    const session = getOne('SELECT * FROM sessions WHERE id = ?', [req.params.id])
    if (!session) return res.status(404).json({ status: 'error', message: 'Session not found' })

    const space = getOne('SELECT * FROM spaces WHERE id = ?', [session.space_id])
    const images = space ? JSON.parse(space.images || '[]').map(i => i.s3Url || i) : []

    const chatEntry = getOne('SELECT * FROM chat_responses WHERE session_id = ? ORDER BY created_at DESC LIMIT 1', [req.params.id])
    const answers = chatEntry ? JSON.parse(chatEntry.answers || '[]') : []

    const result = await callLLM({
      promptId: 'p002_intervention_generator',
      variables: {
        short_term_memory: session.short_term_memory || '',
        user_answers: JSON.stringify(answers),
      },
      images: images.filter(Boolean).slice(0, 5),
    })

    const parsed = result.parsed || JSON.parse(result.raw)
    const interventions = parsed.interventions || []
    const diagnosis = parsed.diagnosis || result.raw

    // 存入数据库
    for (const intv of interventions) {
      run(
        'INSERT INTO interventions (session_id, tier, diagnosis, actions, image_prompts) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, intv.tier || 'low_cost', intv.diagnosis || diagnosis, JSON.stringify(intv.actions || []), JSON.stringify(intv.image_prompts || {})]
      )
    }

    run('UPDATE sessions SET status = ?, short_term_memory = short_term_memory || ? WHERE id = ?',
      ['intervention_generated', '\n--- Intervention ---\n' + diagnosis, req.params.id])

    res.json({ status: 'success', data: { interventions, diagnosis } })
  } catch (err) {
    console.error('generate error:', err)
    res.json({
      status: 'success',
      data: {
        interventions: [
          { tier: 'zero_cost', diagnosis: '...', actions: [] },
          { tier: 'low_cost', diagnosis: '...', actions: [] },
          { tier: 'advanced', diagnosis: '...', actions: [] },
        ],
      },
    })
  }
})

// 7. 保存到 Next
app.post('/api/next', (req, res) => {
  const { interventionId } = req.body
  const id = run('INSERT INTO next_actions (intervention_id, status) VALUES (?, ?)', [interventionId, 'pending'])
  res.json({ status: 'success', data: { id } })
})

// 8. 获取 Next 列表
app.get('/api/next', (_req, res) => {
  const rows = getAll('SELECT * FROM next_actions ORDER BY created_at DESC')
  res.json({ status: 'success', data: rows })
})

// 9. 提交反馈
app.post('/api/next/:id/feedback', upload.array('images', 5), (req, res) => {
  const files = req.files || []
  const afterImages = files.map(f => `/uploads/${f.filename}`)
  const { userNote } = req.body
  const id = run('INSERT INTO feedbacks (next_action_id, after_images, user_note) VALUES (?, ?, ?)',
    [req.params.id, JSON.stringify(afterImages), userNote || ''])
  res.json({ status: 'success', data: { id } })
})

// 10. 生成信件（P003）
app.post('/api/next/:id/letter', async (req, res) => {
  try {
    const nextAction = getOne('SELECT * FROM next_actions WHERE id = ?', [req.params.id])
    if (!nextAction) return res.status(404).json({ status: 'error', message: 'Next action not found' })

    const feedback = getOne('SELECT * FROM feedbacks WHERE next_action_id = ? ORDER BY created_at DESC LIMIT 1', [req.params.id])
    const userNote = feedback?.user_note || ''
    const afterImages = feedback ? JSON.parse(feedback.after_images || '[]') : []

    const intervention = getOne('SELECT * FROM interventions WHERE id = ?', [nextAction.intervention_id])
    const session = intervention ? getOne('SELECT * FROM sessions WHERE id = ?', [intervention.session_id]) : null

    const result = await callLLM({
      promptId: 'p003_letter_writer',
      variables: {
        short_term_memory: session?.short_term_memory || '',
        user_note: userNote,
        intervention_diagnosis: intervention?.diagnosis || '',
      },
      images: afterImages.slice(0, 3),
    })

    const parsed = result.parsed || { content: result.raw }
    const content = parsed.content || result.raw
    const nextStep = parsed.next_actions || '再次看看你的空间，也许能找到新的灵感'

    const letterId = run('INSERT INTO letters (feedback_id, content, signature) VALUES (?, ?, ?)',
      [feedback?.id || null, content, '—— Nobi'])

    // 更新长期记忆
    if (session) {
      const space = getOne('SELECT * FROM spaces WHERE id = ?', [session.space_id])
      if (space) {
        const newMemory = (space.long_term_memory || '') + '\n\n## ' + new Date().toISOString().slice(0, 10) + '\n' + content.slice(0, 500)
        run('UPDATE spaces SET long_term_memory = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newMemory, space.id])
      }
    }

    run('UPDATE next_actions SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?', ['done', req.params.id])

    res.json({ status: 'success', data: { letterId, content } })
  } catch (err) {
    console.error('letter error:', err)
    const fallbackContent = '这次我记住的，不是你买了一个收纳托盘。\n\n我记住的是：\n你开始想让桌面给自己一个更清楚的开始信号。\n\n这很小。\n但它已经在改变你和这个空间的关系。\n\n—— Nobi'
    res.json({ status: 'success', data: { letterId: null, content: fallbackContent } })
  }
})

// 11. 获取长期记忆
app.get('/api/me/memory', (_req, res) => {
  res.json({ status: 'success', data: { memory: '' } })
})

// 12. 测试 LLM 调用（调试用）
app.post('/api/test/llm', async (req, res) => {
  try {
    const { promptId = 'p001_space_reader', imageUrl } = req.body
    const result = await callLLM({
      promptId,
      variables: {},
      images: imageUrl ? [imageUrl] : [],
    })
    res.json({
      status: 'success',
      data: {
        raw: result.raw,
        parsed: result.parsed,
      },
    })
  } catch (err) {
    console.error('LLM test error:', err)
    res.status(500).json({ status: 'error', message: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
