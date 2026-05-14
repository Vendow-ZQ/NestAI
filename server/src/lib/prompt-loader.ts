import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface PromptFiles {
  systemPrompt: string;
  userTemplate: string;
  outputSchema: object;
  fewShots: object[];
  config: Record<string, unknown>;
}

const PROMPTS_DIR = join(__dirname, '..', 'prompts');

export function loadPrompt(promptId: string): PromptFiles {
  const dir = join(PROMPTS_DIR, promptId);

  if (!existsSync(dir)) {
    throw new Error(`找不到 Prompt 目录: ${dir}`);
  }

  const systemPrompt = readFileSync(join(dir, 'system_prompt.md'), 'utf-8');
  const userTemplate = readFileSync(join(dir, 'user_template.md'), 'utf-8');
  const outputSchemaRaw = readFileSync(join(dir, 'output_schema.json'), 'utf-8');
  const fewShotsRaw = readFileSync(join(dir, 'few_shots.json'), 'utf-8');
  const configRaw = readFileSync(join(dir, 'config.py'), 'utf-8');

  return {
    systemPrompt,
    userTemplate,
    outputSchema: outputSchemaRaw.trim() ? JSON.parse(outputSchemaRaw) : {},
    fewShots: fewShotsRaw.trim() ? JSON.parse(fewShotsRaw) : [],
    config: parseConfig(configRaw),
  };
}

function parseConfig(raw: string): Record<string, unknown> {
  const config: Record<string, unknown> = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)$/);
    if (m) {
      const [, key, val] = m;
      config[key] = tryParse(val.trim());
    }
  }
  return config;
}

function tryParse(s: string): unknown {
  if (s === 'true') return true;
  if (s === 'false') return false;
  if (/^\d+$/.test(s)) return parseInt(s, 10);
  if (/^\d+\.\d+$/.test(s)) return parseFloat(s);
  if (s.startsWith('"') && s.endsWith('"')) return s.slice(1, -1);
  return s;
}
