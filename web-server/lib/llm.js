import { loadPrompt } from './prompt-loader.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function interpolate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key]
    return val !== undefined ? String(val) : `{{${key}}}`
  })
}

function extractJson(raw) {
  const codeBlock = raw.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
  if (codeBlock) return JSON.parse(codeBlock[1])
  const bare = raw.match(/\{[\s\S]*\}/)
  if (bare) return JSON.parse(bare[0])
  throw new Error('No JSON found in LLM response')
}

/**
 * 将图片URL转换为可发送给LLM的格式
 * - 本地文件 (/uploads/xxx.jpg) → base64 data URL
 * - 远程URL → 保持原样
 */
function processImageUrl(imageUrl) {
  // 本地文件路径，需要转换为base64
  if (imageUrl.startsWith('/uploads/')) {
    try {
      const filePath = path.join(__dirname, '..', imageUrl)
      if (fs.existsSync(filePath)) {
        const data = fs.readFileSync(filePath)
        const base64 = data.toString('base64')
        // 根据文件扩展名判断MIME类型
        const ext = path.extname(filePath).toLowerCase()
        const mimeType = ext === '.png' ? 'image/png' :
                         ext === '.gif' ? 'image/gif' :
                         ext === '.webp' ? 'image/webp' : 'image/jpeg'
        return `data:${mimeType};base64,${base64}`
      } else {
        console.warn(`Image file not found: ${filePath}`)
        return imageUrl
      }
    } catch (err) {
      console.error(`Failed to convert image to base64: ${imageUrl}`, err)
      return imageUrl
    }
  }
  // 远程URL，保持原样
  return imageUrl
}

export async function callLLM({ promptId, variables = {}, images = [] }) {
  const provider = process.env.LLM_PROVIDER || 'anthropic'
  const apiKey = process.env.LLM_API_KEY
  const baseUrl = process.env.LLM_BASE_URL || ''
  const hasImages = images.length > 0
  const model = hasImages
    ? (process.env.LLM_MODEL_VISION || 'claude-sonnet-4-5')
    : (process.env.LLM_MODEL_TEXT || 'claude-sonnet-4-5')

  if (!apiKey) {
    throw new Error('LLM_API_KEY not configured')
  }

  const prompt = loadPrompt(promptId)
  const userText = interpolate(prompt.userTemplate, variables)

  // 处理图片URL（本地文件转base64）
  const processedImages = images.map(processImageUrl)

  let raw
  if (provider === 'anthropic') {
    const content = []
    for (const imgUrl of processedImages) {
      if (imgUrl.startsWith('data:')) {
        // base64格式: data:image/jpeg;base64,/9j/4AAQ...
        const match = imgUrl.match(/^data:(.+?);base64,(.+)$/)
        if (match) {
          const [, mediaType, data] = match
          content.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: data
            }
          })
        }
      } else {
        // 普通URL
        content.push({ type: 'image', source: { type: 'url', url: imgUrl } })
      }
    }
    content.push({ type: 'text', text: userText })

    const url = baseUrl || 'https://api.anthropic.com/v1/messages'
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: prompt.config.MAX_TOKENS || 4096,
        temperature: prompt.config.TEMPERATURE ?? 0.7,
        system: prompt.systemPrompt || undefined,
        messages: [{ role: 'user', content }],
      }),
    })

    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`Anthropic API error (${resp.status}): ${err}`)
    }

    const data = await resp.json()
    raw = data.content?.[0]?.text ?? ''
  } else {
    // OpenAI 兼容
    const content = []
    for (const imgUrl of processedImages) {
      content.push({ type: 'image_url', image_url: { url: imgUrl } })
    }
    content.push({ type: 'text', text: userText })

    const url = baseUrl || 'https://api.openai.com/v1/chat/completions'
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: prompt.config.MAX_TOKENS || 4096,
        temperature: prompt.config.TEMPERATURE ?? 0.7,
        messages: [
          ...(prompt.systemPrompt ? [{ role: 'system', content: prompt.systemPrompt }] : []),
          { role: 'user', content },
        ],
      }),
    })

    if (!resp.ok) {
      const err = await resp.text()
      throw new Error(`OpenAI API error (${resp.status}): ${err}`)
    }

    const data = await resp.json()
    raw = data.choices?.[0]?.message?.content ?? ''
  }

  let parsed
  if (Object.keys(prompt.outputSchema).length > 0) {
    try { parsed = extractJson(raw) } catch {}
  }

  return { raw, parsed }
}
