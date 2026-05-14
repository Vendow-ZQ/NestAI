import { loadPrompt } from './prompt-loader.js'

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

  let raw
  if (provider === 'anthropic') {
    const content = []
    for (const url of images) {
      content.push({ type: 'image', source: { type: 'url', url } })
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
    for (const url of images) {
      content.push({ type: 'image_url', image_url: { url } })
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