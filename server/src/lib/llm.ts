import { loadPrompt } from './prompt-loader';

export type PromptId = 'p001_space_reader' | 'p002_intervention_generator' | 'p003_letter_writer';

export interface LLMRequest {
  promptId: PromptId;
  variables: Record<string, unknown>;
  images?: string[];
}

export interface LLMResponse {
  raw: string;
  parsed?: unknown;
}

// ─── 变量插值 ───────────────────────────────────────────
function interpolate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = vars[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

// ─── 从响应中提取 JSON ───────────────────────────────────
function extractJson(raw: string): unknown {
  const codeBlock = raw.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (codeBlock) {
    return JSON.parse(codeBlock[1]);
  }
  const bare = raw.match(/\{[\s\S]*\}/);
  if (bare) {
    return JSON.parse(bare[0]);
  }
  throw new Error('响应中没有找到有效的 JSON');
}

// ─── 构造多模态消息 (Anthropic 格式) ─────────────────────
function buildAnthropicContent(userText: string, imageUrls?: string[]) {
  const content: Array<Record<string, unknown>> = [];
  if (imageUrls?.length) {
    for (const url of imageUrls) {
      content.push({
        type: 'image',
        source: {
          type: 'url',
          url,
        },
      });
    }
  }
  content.push({ type: 'text', text: userText });
  return content;
}

// ─── 构造多模态消息 (OpenAI 格式) ────────────────────────
function buildOpenAIContent(userText: string, imageUrls?: string[]) {
  const content: Array<Record<string, unknown>> = [];
  if (imageUrls?.length) {
    for (const url of imageUrls) {
      content.push({
        type: 'image_url',
        image_url: { url },
      });
    }
  }
  content.push({ type: 'text', text: userText });
  return content;
}

// ─── 调用 Anthropic API ──────────────────────────────────
async function callAnthropic(
  baseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userContent: Array<Record<string, unknown>>,
  config: Record<string, unknown>,
): Promise<string> {
  const url = baseUrl || 'https://api.anthropic.com/v1/messages';
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: config.MAX_TOKENS || 4096,
      temperature: config.TEMPERATURE ?? 0.7,
      top_p: config.TOP_P ?? 1.0,
      system: systemPrompt || undefined,
      messages: [{ role: 'user', content: userContent }],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Anthropic API 调用失败 (${resp.status}): ${err}`);
  }

  const data = await resp.json() as { content: Array<{ type: string; text?: string }> };
  return data.content?.[0]?.text ?? '';
}

// ─── 调用 OpenAI 兼容 API ────────────────────────────────
async function callOpenAI(
  baseUrl: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userContent: Array<Record<string, unknown>>,
  config: Record<string, unknown>,
): Promise<string> {
  const url = baseUrl || 'https://api.openai.com/v1/chat/completions';
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: config.MAX_TOKENS || 4096,
      temperature: config.TEMPERATURE ?? 0.7,
      top_p: config.TOP_P ?? 1.0,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: userContent },
      ],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenAI API 调用失败 (${resp.status}): ${err}`);
  }

  const data = await resp.json() as { choices: Array<{ message: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? '';
}

// ─── 主入口 ──────────────────────────────────────────────
export async function callLLM(req: LLMRequest): Promise<LLMResponse> {
  const provider = process.env.LLM_PROVIDER || 'anthropic';
  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || '';
  const hasImages = !!req.images?.length;
  const model = hasImages
    ? (process.env.LLM_MODEL_VISION || process.env.LLM_MODEL_TEXT || 'claude-sonnet-4-5')
    : (process.env.LLM_MODEL_TEXT || 'claude-sonnet-4-5');

  if (!apiKey) {
    throw new Error('LLM_API_KEY 未配置,请在 .env 中设置');
  }

  // 加载 Prompt 文件
  const prompt = loadPrompt(req.promptId);

  // 检查 Prompt 是否已写好 (保护:空 prompt 不真发请求)
  if (!prompt.systemPrompt.trim() || !prompt.userTemplate.trim()) {
    throw new Error(
      `Prompt "${req.promptId}" 的 system_prompt.md 或 user_template.md 是空的,` +
      `请先写好 Prompt 内容再调用。`,
    );
  }

  // 变量插值
  const userText = interpolate(prompt.userTemplate, req.variables);

  // 构造多模态消息
  const userContent =
    provider === 'anthropic'
      ? buildAnthropicContent(userText, req.images)
      : buildOpenAIContent(userText, req.images);

  // 调用 LLM
  let raw: string;
  if (provider === 'anthropic') {
    raw = await callAnthropic(baseUrl, apiKey, model, prompt.systemPrompt, userContent, prompt.config);
  } else {
    raw = await callOpenAI(baseUrl, apiKey, model, prompt.systemPrompt, userContent, prompt.config);
  }

  // 解析 JSON (如果配置了 output_schema)
  let parsed: unknown | undefined;
  if (Object.keys(prompt.outputSchema).length > 0) {
    try {
      parsed = extractJson(raw);
    } catch {
      // JSON 解析失败时保留 raw,让调用方决定
    }
  }

  return { raw, parsed };
}
