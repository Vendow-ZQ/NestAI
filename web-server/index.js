import express from 'express'
import initSqlJs from 'sql.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

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

// 4. 分析空间（P001）— TODO: 接真实 LLM
app.post('/api/sessions/:id/analyze', (req, res) => {
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
})

// 5. 保存 Chat 答案
app.post('/api/sessions/:id/chat', (req, res) => {
  const { questions, answers } = req.body
  run('INSERT INTO chat_responses (session_id, questions, answers) VALUES (?, ?, ?)',
    [req.params.id, JSON.stringify(questions), JSON.stringify(answers)])
  run('UPDATE sessions SET status = ? WHERE id = ?', ['chat_done', req.params.id])
  res.json({ status: 'success', data: { ok: true } })
})

// 6. 生成方案（P002）— TODO: 接真实 LLM
app.post('/api/sessions/:id/generate', (req, res) => {
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

// 10. 生成信件（P003）— TODO: 接真实 LLM
app.post('/api/next/:id/letter', (req, res) => {
  res.json({
    status: 'success',
    data: {
      content: '这次我记住的，不是你买了一个收纳托盘。\n\n我记住的是：\n你开始想让桌面给自己一个更清楚的开始信号。\n\n这很小。\n但它已经在改变你和这个空间的关系。\n\n—— Nobi',
    },
  })
})

// 11. 获取长期记忆
app.get('/api/me/memory', (_req, res) => {
  res.json({ status: 'success', data: { memory: '' } })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
