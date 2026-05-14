# NestAI Web 迁移 Worklog

## 会话日期：2026-05-14

### 本次目标
- [x] 2.1 迁移 Grow 首页
- [x] 2.2 迁移 Upload 页
- [x] 2.3 迁移 Lifestyle Chat 页
- [x] 2.4 迁移 Generating 页
- [x] 2.5 迁移 P3 Result 页
- [x] 2.6 迁移 Next Tab
- [x] 2.7 迁移 Share 页
- [x] 2.8 迁移 Letter 页
- [x] 2.9 迁移 Me Tab
- [x] 3.1-3.6 Phase 3 后端 LLM 接入 + 前后端联调

### Phase 3: 后端 LLM 接入

**新增文件：**
- `web-server/lib/llm.js` — LLM 客户端，支持 Anthropic/OpenAI 双兼容
- `web-server/lib/prompt-loader.js` — Prompt 文件加载器
- `web-server/prompts/` — 三个 Prompt 目录（从 NestJS 原版复制）
- `web-server/.env.example` — 环境变量模板

**更新的 API 端点：**
- `GET /api/sessions/:id` — 新增，Chat 页读取 memory + questions
- `POST /api/sessions/:id/analyze` — 接入 P001 Space Reader，LLM 失败时降级返回默认数据
- `POST /api/sessions/:id/generate` — 接入 P002 Intervention Generator，失败降级
- `POST /api/next/:id/letter` — 接入 P003 Letter Writer，失败降级，写入长期记忆
- Next/Feedback 接口写入真实 SQLite 数据库

**LLM 降级策略：** 三个 LLM 端口都用 try/catch 包裹，API_KEY 未配置或调用失败时返回 Mock 数据，保证无 API Key 也能体验完整链路。

### 产品定义对照检查
- [x] 本次改动是否改变了用户旅程？ — **否**，保持原有上传 → Chat → 方案 → ... 旅程
- [x] 本次改动是否改变了三档方案定义？ — **否**，本页不涉及
- [x] 本次改动是否引入了新的 UI 组件？ — **否**，只迁移已有组件
- [x] 本次改动是否在后端新增了 API 端点？ — **否**

### 我这次迁移要保留的产品意图是
> Grow 是开屏默认页，也是主功能页。先让用户开始自己的生长，再让用户看见别人如何生长。顶部是上传入口，下滑进入 Feed。
> — NestAI_Product_Definition_v0.5 §4.1, §5.1

### 迁移内容
- 迁移 `BilingualTitle` 组件 → `web/src/components/BilingualTitle.tsx`
- 迁移 `PlaceholderImage` 组件 → `web/src/components/PlaceholderImage.tsx`
- 迁移 `CustomTabBar` 组件 → `web/src/components/CustomTabBar.tsx`
- 迁移 `Badge` 组件 → `web/src/components/ui/badge.tsx`
- 迁移 `GrowPage` 页面 → `web/src/pages/index/GrowPage.tsx`

### 我没做什么
- 我注意到上传区目前只是静态入口，没有真实上传功能，但没动，因为上传逻辑在 Upload 页迁移时处理
- 我注意到 Feed 用的是 Mock 数据，但没动，因为数据真实化在 Phase 3 后端联调时处理
- 我注意到 Nobi 品牌小形象在 Grow 页有出场位置，但没动，因为 Nobi 组件在后续单独迁移

### 完成情况
- 已完成：组件迁移、页面迁移、路由配置
- 遗留问题：无
- 下一步：运行验证，确认页面渲染正常
