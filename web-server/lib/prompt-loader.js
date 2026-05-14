import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROMPTS_DIR = join(__dirname, '..', 'prompts')

export function loadPrompt(promptId) {
  const dir = join(PROMPTS_DIR, promptId)

  if (!existsSync(dir)) {
    throw new Error(`Prompt not found: ${dir}`)
  }

  const systemPrompt = readFileSync(join(dir, 'system_prompt.md'), 'utf-8')
  const userTemplate = readFileSync(join(dir, 'user_template.md'), 'utf-8')
  const outputSchemaRaw = readFileSync(join(dir, 'output_schema.json'), 'utf-8')
  const fewShotsRaw = readFileSync(join(dir, 'few_shots.json'), 'utf-8')
  const configRaw = readFileSync(join(dir, 'config.py'), 'utf-8')

  return {
    systemPrompt,
    userTemplate,
    outputSchema: outputSchemaRaw.trim() ? JSON.parse(outputSchemaRaw) : {},
    fewShots: fewShotsRaw.trim() ? JSON.parse(fewShotsRaw) : [],
    config: parseConfig(configRaw),
  }
}

function parseConfig(raw) {
  const config = {}
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/)
    if (m) {
      const [, key, val] = m
      config[key] = tryParse(val.trim())
    }
  }
  return config
}

function tryParse(s) {
  if (s === 'true') return true
  if (s === 'false') return false
  if (/^\d+$/.test(s)) return parseInt(s, 10)
  if (/^\d+\.\d+$/.test(s)) return parseFloat(s)
  if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1)
  return s
}
