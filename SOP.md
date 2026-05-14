# NestAI 后端 AI 链路开发 SOP

> 从"外表完整、没有大脑"推进到"完整闭环跑通"的标准操作流程
> 编写时间:2026-05-13
> 基于:NestAI Product Definition v0.5 + TECH_STACK.md 现状 + 共创对话决策

---

## 0. 一句话目标

让用户走完一次完整闭环——**上传图片 → AI 真实分析 → 生成针对性问题 → 收集回答 → AI 生成方案(图先 Mock)→ 保存到 Next → 用户回访 → AI 写出一封信**——所有 AI 调用都是真的,所有数据都真实存取,所有 Prompt 都独立可迭代。

---

## 1. 核心架构决策

### 1.1 双层记忆系统

```
┌────────────────────────────────────────────────────┐
│           短期记忆 (Session Memory)                  │
│           ─────────────────────────────              │
│  作用域: 一次链路(从上传到一封信)                    │
│  存储: 单 Markdown 文件,数据库 BLOB 字段             │
│  生命周期: 链路完成后归档,不再修改                   │
│  内容: 空间观察、Lifestyle 推断、方案要点、用户反馈   │
│  调用: 每次 LLM 调用都把它完整传入 context           │
└────────────────────────────────────────────────────┘
                       │
                       │ 链路结束时,提炼并写入长期记忆
                       ▼
┌────────────────────────────────────────────────────┐
│           长期记忆 (Persistent Memory)               │
│           ─────────────────────────────              │
│  作用域: 跨链路、跨栖,持续累积                       │
│  存储: 用户级 Markdown 文件,数据库结构化字段          │
│  更新时机:                                          │
│   ① 用户保存方案到 Next 时                          │
│   ② 用户完成回访 + 信件生成后                       │
│  内容: 用户的 lifestyle profile、审美偏移、反复需求   │
│  调用: 链路启动时载入,作为 Prompt001 的前置上下文     │
└────────────────────────────────────────────────────┘
```

### 1.2 三个 LLM 接入点

| 接入点 | 触发时机 | 输入 | 输出 | Prompt 文件 |
|--------|----------|------|------|-------------|
| **Prompt001 · Space Reader** | 用户上传图片后 | 1-5 张图 + 长期记忆 | 短期记忆初稿 + 3 个动态问题 | `prompts/p001_space_reader.py` |
| **Prompt002 · Intervention Generator** | 用户答完问题后 | 短期记忆 + 答案 + 原图 | 短期记忆扩写 + 方案文本 + 图像 prompt(留待生图) | `prompts/p002_intervention_generator.py` |
| **Prompt003 · Letter Writer** | 用户完成回访后 | 短期记忆 + 回访照片描述 + 回访文字 | 一封信 + 长期记忆更新指令 | `prompts/p003_letter_writer.py` |

### 1.3 .env 配置约定

```env
# LLM 配置(Anthropic / OpenAI 兼容)
LLM_PROVIDER=anthropic              # anthropic | openai | compatible
LLM_BASE_URL=                       # 留空使用默认;可填中转/代理
LLM_API_KEY=
LLM_MODEL_TEXT=claude-sonnet-4-5    # 文本模型
LLM_MODEL_VISION=claude-sonnet-4-5  # 视觉模型(可同一个)

# 生图模型(第一版预留,不调用)
IMAGE_PROVIDER=                     # 留空 = Mock
IMAGE_BASE_URL=
IMAGE_API_KEY=
IMAGE_MODEL=

# 数据库 / 存储
DATABASE_URL=                       # Supabase PostgreSQL
S3_ENDPOINT=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=

# 应用配置
NODE_ENV=development
PORT=3000
```

### 1.4 Prompt 文件结构

```
server/src/prompts/
├── __init__.py                          # 或 index.ts
├── p001_space_reader/
│   ├── system_prompt.md                 # 系统提示词
│   ├── user_template.md                 # 用户消息模板(带变量插槽)
│   ├── output_schema.json               # 期望的 JSON 输出格式
│   ├── few_shots.json                   # 少样本示例
│   └── config.py                        # 模型参数(temperature 等)
├── p002_intervention_generator/
│   └── (同上结构)
└── p003_letter_writer/
    └── (同上结构)
```

> **为什么分这么细**:让 PE(Prompt Engineering)迭代时只动 `.md` 和 `.json`,不动代码逻辑。每次改 prompt 不需要重启服务、不需要改 controller。

---

## 2. 数据库表结构(MVP 必须的 7 张表)

```
users
  id (uuid)
  openid (微信)  -- 可选,第一版可硬编码 dev_user
  created_at

spaces
  id (uuid)
  user_id (fk → users)
  type (dorm | rental | hdb | owned)
  layout (text)  -- "Tsinghua SIGS 7+1 single room" 等
  images (jsonb)  -- [{s3_url, uploaded_at, position}]
  long_term_memory (text)  -- 长期记忆 Markdown
  created_at, updated_at

sessions  -- 一次完整链路 = 一个 session
  id (uuid)
  space_id (fk → spaces)
  short_term_memory (text)  -- 短期记忆 Markdown(累积)
  status (uploaded | chat_done | intervention_generated | saved_to_next | feedback_submitted | letter_done | abandoned)
  created_at, updated_at

chat_responses
  id (uuid)
  session_id (fk → sessions)
  questions (jsonb)  -- [{q, options}] 三个动态问题
  answers (jsonb)    -- [{selected_option, free_text}]
  created_at

interventions
  id (uuid)
  session_id (fk → sessions)
  tier (zero_cost | low_cost | advanced)
  diagnosis (text)        -- Why 段落
  actions (jsonb)         -- 最轻第一步列表
  image_prompts (jsonb)   -- 生图 prompts(留待第二阶段)
  rendered_images (jsonb) -- {axonometric: null, view_1: url, view_2: url}  -- 第一版 Mock
  saved_to_next (boolean)
  created_at

next_actions
  id (uuid)
  user_id (fk → users)
  intervention_id (fk → interventions)
  status (pending | tried | done | abandoned)
  before_images (jsonb)
  created_at, completed_at

feedbacks
  id (uuid)
  next_action_id (fk → next_actions)
  after_images (jsonb)
  user_note (text)
  missed_steps (jsonb)
  created_at

letters
  id (uuid)
  feedback_id (fk → feedbacks)
  content (text)        -- 信件正文
  signature (text)      -- "—— Nobi"
  created_at
```

---

## 3. API 端点清单(MVP)

按链路顺序排列,后面 Phase 1 主要做这些。

### 3.1 链路相关

| Method | 路径 | 干什么 | LLM 调用 |
|--------|------|--------|----------|
| POST | `/api/upload` | 多图上传到 S3 | 无 |
| POST | `/api/sessions` | 创建一个 session,绑定 space | 无 |
| POST | `/api/sessions/:id/analyze` | **触发 Prompt001**,返回 3 个问题 | ✅ P001 |
| POST | `/api/sessions/:id/chat` | 保存用户答题(含自由输入) | 无 |
| POST | `/api/sessions/:id/generate` | **触发 Prompt002**,返回方案 | ✅ P002 |
| GET | `/api/sessions/:id` | 获取 session 详情(含 memory) | 无 |
| POST | `/api/sessions/:id/save-to-next` | 保存方案到 Next + 更新长期记忆 | 无 |

### 3.2 Next & 反馈相关

| Method | 路径 | 干什么 |
|--------|------|--------|
| GET | `/api/next` | 获取用户的 Next 列表 |
| POST | `/api/next/:id/start` | 标记"今晚试试看" |
| POST | `/api/next/:id/feedback` | 提交回访照片+文字 |
| POST | `/api/next/:id/letter` | **触发 Prompt003**,生成信件 + 更新长期记忆 |

### 3.3 辅助

| Method | 路径 | 干什么 |
|--------|------|--------|
| GET | `/api/me/memory` | 看自己的长期记忆(调试/产品反思用) |
| GET | `/api/letters` | 信件列表 |
| GET | `/api/letters/:id` | 单封信详情 |

---

## 4. 开发顺序(必须按这个顺序做)

### Day 1-2 | 地基

- [ ] `.env` 配好,Supabase 连通
- [ ] 7 张表 Drizzle migration 跑通
- [ ] S3 上传跑通(POST /api/upload 返回 URL)
- [ ] `prompts/` 目录骨架建好
- [ ] 写一个 `lib/llm.ts`,封装 Anthropic + OpenAI 双兼容客户端

> **验收**:能用 Postman 上传 1 张图,收到 S3 URL;能用 Postman 在数据库里创建一条 space 记录。

### Day 3 | 最小端到端骨架(关键!)

> 这一天目标是"通电试灯"——不追求完整,只追求一通到底。

- [ ] 写 Prompt001 的 v0.1 初稿(只让它做"看图说一段话",不输出问题)
- [ ] 写 `POST /api/sessions/:id/analyze` 接口
- [ ] 前端把"生成中"页改成真等待后端响应
- [ ] 前端把"对话页"的 Agent 第一句改成后端返回的内容

> **验收**:用户在前端上传 1 张真实宿舍图,30 秒内 Agent 在对话页用真实图理解回应一段话。这一刻是项目的"心跳第一次跳"。

### Day 4-5 | 完整 Prompt001

- [ ] Prompt001 完整版:输出空间观察 + 生活习惯推断 + 3 个动态问题 + 选项
- [ ] 写入短期记忆(Markdown 格式追加到 session.short_term_memory)
- [ ] 前端对话页对接动态问题(取消所有 mock 问题)
- [ ] 用户答完三题后,把答案存到 chat_responses 表

> **验收**:走完上传 → 对话流程,数据库里有完整的 session + chat_responses 记录,short_term_memory 字段里能看到 Markdown 形式的记忆累积。

### Day 6-8 | Prompt002 + 方案展示

- [ ] Prompt002 v0.1:输入"短期记忆 + 答案 + 原图",输出"诊断 + 三档方案文本 + 图像 prompts"
- [ ] `POST /api/sessions/:id/generate` 接口
- [ ] 短期记忆扩写(Prompt002 输出追加进去)
- [ ] 前端 P3 干预方案页对接真实数据
- [ ] 图像部分用 Mock(返回预设的 3 张图 URL 之一)

> **验收**:走完链路到 P3 页面,看到的方案文本是真 LLM 生成的(每次结果不一样),三档可切换。

### Day 9-10 | Next + 长期记忆更新

- [ ] 保存到 Next 的接口
- [ ] **第一次写长期记忆**:用一个轻量 LLM 调用(或简单字符串拼接)从短期记忆里提炼"用户偏好要点",追加到 spaces.long_term_memory
- [ ] 前端 Next Tab 对接真实数据(取消所有 mock)

> **验收**:在 `/api/me/memory` 能看到长期记忆里多了一条"这次链路的提炼"。

### Day 11-13 | 回访 + Prompt003 + 信件

- [ ] 反馈上传接口
- [ ] Prompt003 v0.1:输入"短期记忆 + 长期记忆 + 回访照片描述 + 回访文字",输出"一封信 + 长期记忆更新建议"
- [ ] 应用长期记忆更新(追加到 spaces.long_term_memory)
- [ ] 前端 P5 反馈页 + P6 信件页对接真实数据

> **验收**:从头到尾走完完整链路,所有数据真实存取,所有 LLM 调用真实发生,**关掉 mock/data.ts 文件后产品仍能运行**。

### Day 14 | 收尾

- [ ] 错误处理:LLM 调用失败时,前端展示统一的"AI 临时罢工"提示页
- [ ] 长期记忆查看页(Me Tab 加入口)
- [ ] 一次完整 demo 演示录屏

---

## 5. Prompt PE(Prompt Engineering)迭代约定

这一节是给你和未来 PE 协作者看的工作流。

### 5.1 改 Prompt 的标准动作

**不直接改 `.py`,只改 `.md` 和 `.json`。**

每个 Prompt 目录下:
- `system_prompt.md` —— 系统提示词,改这里调"角色 / 任务 / 约束"
- `user_template.md` —— 用户消息模板,改这里调"输入怎么组装"
- `output_schema.json` —— 输出契约,改这里调"要 LLM 吐什么字段"
- `few_shots.json` —— 少样本,改这里增加好/坏例子
- `config.py` —— 模型参数,改这里调 temperature / max_tokens 等

### 5.2 Prompt 版本管理

每个 Prompt 文件夹下保留:
```
p001_space_reader/
├── current/          # 当前生效版本
│   ├── system_prompt.md
│   └── ...
├── v0_1/             # 历史版本归档
├── v0_2/
└── README.md         # 版本演进记录
```

切版本时改一行符号链接即可。

### 5.3 PE 评估机制(下次共创聊)

后续我们要专门讨论:
- 每个 Prompt 的评估维度(准确度 / 温柔度 / 不卡壳率)
- 评估数据集(从真实用户对话里挑 20 条做 golden set)
- A/B 对照的工程化方案

**这次不展开,先把链路跑通**。

---

## 6. 给 Claude Code 协作时的几个原则

### 6.1 一次只做一件事

不要让 Claude Code 一次性完成"Day 1-14 全部任务"。**按 SOP 拆好的每一步,单独发指令**。每一步完成后,你自己跑一遍验收标准,确认无误再进下一步。

### 6.2 让 Claude Code 持续读 SOP

每次新会话开始时,**先让它读这份 SOP**:
```
请先读 SOP.md 和 NestAI_Product_Definition_v0.5.md 和 TECH_STACK.md,
理解当前进度。我们现在进度到 Day X,接下来要做 Day X 的 Y。
```

### 6.3 让 Claude Code 写好测试再写代码

对每个 API 端点,先让 Claude Code 写 Postman/curl 测试用例(放在 `docs/api-tests/`),再写实现。这样你能立刻验证。

### 6.4 不要让 Claude Code 改 Prompt

**Prompt 文件是 PE 的领地**。Claude Code 只负责"调用 Prompt"的代码,**不修改 Prompt 内容**。如果 Prompt 输出格式变了,先你手改 Prompt,再让 Claude Code 适配代码。

---

## 7. 一份"接下来三周"的简明计划表

| 周 | 主目标 | 验收 |
|----|--------|------|
| **第 1 周** | Day 1-5 完成 | Prompt001 跑通,上传 → 对话流程数据真实 |
| **第 2 周** | Day 6-10 完成 | Prompt002 跑通,方案是真生成,Next 持久化 |
| **第 3 周** | Day 11-14 完成 | Prompt003 跑通,完整闭环可演示 |

---

## 8. 关键文件清单(开发完成后应该长这样)

```
NestAI/
├── .env                                    # 配好的环境变量
├── .env.example                            # 模板
├── src/
│   ├── lib/
│   │   └── mock/                           # 可删除(已不依赖)
│   ...
├── server/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── upload/
│   │   │   ├── sessions/
│   │   │   ├── interventions/
│   │   │   ├── next/
│   │   │   ├── feedback/
│   │   │   ├── letters/
│   │   │   └── memory/
│   │   ├── prompts/                        # 三个 Prompt 独立目录
│   │   │   ├── p001_space_reader/
│   │   │   ├── p002_intervention_generator/
│   │   │   └── p003_letter_writer/
│   │   ├── lib/
│   │   │   ├── llm.ts                      # LLM 客户端封装
│   │   │   ├── memory.ts                   # 短期/长期记忆读写
│   │   │   └── prompt-loader.ts            # 加载 prompt 文件
│   │   ├── db/
│   │   │   ├── schema.ts                   # Drizzle schema
│   │   │   └── migrations/
│   │   └── main.ts
├── docs/
│   ├── api-tests/                          # Postman / curl 测试
│   └── memory-examples/                    # 短期/长期记忆示例
└── SOP.md                                  # 本文档
```

---

## 9. 风险与红线

- **不要在第一版做真实生图**——会拖垮链路调试
- **不要让 Claude Code 改 Prompt 内容**——它会过度优化导致风格漂移
- **不要把短期记忆做成结构化 JSON**——必须是 Markdown,这是产品哲学
- **不要在 LLM 出错时静默回退到 Mock**——会让 bug 难以发现,第一版必须直接报错
- **不要省略数据库 schema 设计**——Day 1-2 做扎实,后面就不返工

---

*SOP 结束。下次共创聊 Prompt 内容设计。*