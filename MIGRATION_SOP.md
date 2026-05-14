# NestAI Web 迁移 SOP

> Taro（微信小程序+抖音小程序+H5）→ 纯 Web App（React + Vite）
> 目标：最小阻力迁移，保留所有产品定义和 UI 资产，去掉平台适配包袱

---

## 0. 为什么迁移

| 问题 | Taro 现状 | Web App 解决方式 |
|------|----------|-----------------|
| 调试效率 | 编译 → 微信开发者工具 → 扫码预览 | Vite HMR，浏览器刷新即可 |
| 平台适配 | 同时维护 weapp / tt / h5 三套逻辑 | 只写一套浏览器标准 API |
| API 限制 | 小程序没有 `getUserMedia`，拍照要走微信专用 API | 标准 `navigator.mediaDevices` |
| 部署 | 提交微信审核，发版周期不可控 | Vercel/Netlify 秒级部署 |
| 组件冗余 | 50+ shadcn/ui 桌面组件被拖进小程序 | 只保留移动端实际使用的组件 |

产品定义 v0.5 第 15 节已明确：**技术 MVP 应优先做成移动端竖屏 Web App。**

---

## 1. 迁移红线（防止语义滑动）

### 1.1 不准改产品逻辑

- **不准** 改变用户旅程顺序（上传 → Chat → 方案 → Next → 反馈 → 信件）
- **不准** 改变三档方案定义（0元 / 低成本 / 进阶）
- **不准** 改变三 Tab 架构（Grow / Next / Me）
- **不准** 改变"今晚试试看"按钮文案和行为
- **不准** 在 P6 信件页加入标签卡、评分、人格测评
- **不准** 把 Next 改成任务清单或打卡工具
- **不准** 在 Feed 中加入排名、审美竞赛

### 1.2 不准改设计语言

- **不准** 改变当前配色、圆角、字体风格
- **不准** 引入新设计系统或组件库
- **不准** 改变 Nobi 品牌小形象的出场位置和交互方式
- **不准** 把诊断语气改得更"工具化"或更"销售化"

### 1.3 不准增加复杂度

- **不准** 引入 Next.js（SSR 对这个产品无意义）
- **不准** 引入新的状态管理库（继续用 Zustand）
- **不准** 引入新的 CSS 方案（继续用 TailwindCSS）
- **不准** 引入 TypeScript 以外的类型系统
- **不准** 在迁移阶段做任何"优化重构"（只迁移，不改进）
- **不准** 给后端加 ORM、迁移工具、Docker

### 1.4 后端极简红线

- **只允许** 8 个 API 端点（见下方清单）
- **不准** 用 PostgreSQL、Supabase、AWS S3
- **不准** 用 NestJS、Drizzle ORM、Zod
- **数据库** = SQLite 单文件，直接写 SQL
- **图片存储** = 本地 `uploads/` 目录
- **LLM 调用** = 直接用 fetch 调 Anthropic/OpenAI API，不包装 LangChain

---

## 1.5 语义保护规则

### 1.5.1 迁移前必读产品定义

迁移**每个页面前**，先读 `NestAI_Product_Definition_v0.5.md` 中对应的小节，在 Worklog 里写一句：

> **"我这次迁移要保留的产品意图是 X。"**

| 页面 | 必读章节 |
|------|----------|
| Grow 首页 | §4.1, §5.1 |
| 上传空间 | §5.1 |
| Lifestyle Chat | §5.3 |
| 生成中 | §5.2 |
| P3 方案页 | §6 |
| Next Tab | §7 |
| P5 新变化分享 | §8 |
| P6 一封信 | §9 |
| Me Tab | §4.3 |

### 1.5.2 UI 文案一律不改

**按钮 label、错误提示、诊断语气、产品语言资产**——即使你觉得"可以更专业"，也不准动。

特别保护：
- "今晚试试看"
- "AI 临时罢工"
- "为了不生成你做不到的方案，我再确认几个小条件"
- 诊断语气的温柔观察式表达

### 1.5.3 单页迁移，单页验收

**不能批量迁移完再测试。** 迁移完一个页面，前后端必须跑通完整链路才能进下一个。

顺序必须是：
```
迁移页面 A → 跑通链路 → 验收通过 → 才能开始页面 B
```

### 1.5.4 Worklog 必须包含"我没做什么"

除了记录做了什么，还要记录：

> **"我注意到 X，但没动，因为不在范围内。"**

示例：
- "我注意到 Upload 页可以支持视频上传，但没动，因为不在范围内。"
- "我注意到 Chat 的问题选项可以动态排序，但没动，因为不在范围内。"

---

## 2. 技术选型

### 前端

| 层 | 选择 | 原因 |
|----|------|------|
| 构建工具 | Vite | 与现有代码最兼容，HMR 最快 |
| 框架 | React 18 | 现有组件直接复用，零学习成本 |
| 路由 | React Router DOM | 替换 Taro 页面路由 |
| 状态 | Zustand | 现有 5 个 Store 直接复制 |
| 样式 | TailwindCSS | 现有类名全部可用 |
| 图标 | lucide-react | 替换 lucide-react-taro |
| HTTP | 原生 fetch | 替换 Taro.request |

### 后端

| 层 | 选择 | 原因 |
|----|------|------|
| 运行时 | Node.js 18+ | 与现有 server 目录一致 |
| 框架 | Express 4 | 最小够用，没有 NestJS 的模块/装饰器负担 |
| 数据库 | better-sqlite3 | 同步 API，零配置，单文件 |
| 上传 | multer | 最简文件上传中间件 |
| LLM | 原生 fetch | 直接调 API，没有 SDK 依赖 |

---

## 2.5 Taro → Web 工程映射表

### 组件映射

| Taro 组件 | Web 替代 | 备注 |
|-----------|----------|------|
| `<View>` | `<div>` | 块级容器 |
| `<Text>` | `<span>` | 行内文本 |
| `<Image>` | `<img>` | 图片，注意 `src` 属性直接可用 |
| `<ScrollView>` | `<div style="overflow-y: auto">` | 滚动容器 |
| `<Swiper>` | 手写或 `swiper` npm 包 | 目前仅 Result 页可能用到 |
| `<Input>` | `<input>` | 原生表单元素 |
| `<Textarea>` | `<textarea>` | 原生表单元素 |
| `<Button>` | `<button>` | 原生按钮 |
| `<Navigator>` | React Router `<Link>` 或 `useNavigate` | 页面跳转 |
| `<Picker>` | 手写选择器或 `@radix-ui/react-select` | Chat 页选项选择 |

### API 映射

| Taro API | Web 替代 | 备注 |
|----------|----------|------|
| `Taro.chooseImage` | `<input type="file" accept="image/*">` 或 `navigator.mediaDevices.getUserMedia` | Upload 页拍照/选图 |
| `Taro.uploadFile` | `fetch(url, {method: 'POST', body: formData})` | 图片上传 |
| `Taro.request` | `fetch()` | 所有 HTTP 请求 |
| `Taro.navigateTo` | `useNavigate()` (React Router) | 页面跳转 |
| `Taro.redirectTo` | `navigate('/path', {replace: true})` | 替换当前页 |
| `Taro.getCurrentInstance().router.params` | `useParams()` / `useSearchParams()` | 获取路由参数 |
| `Taro.setStorage` | `localStorage.setItem()` | 本地存储 |
| `Taro.getStorage` | `localStorage.getItem()` | 读取本地存储 |
| `Taro.showToast` | `sonner` toast 库或自写 | 轻提示 |
| `Taro.showLoading` | 自写 Loading 组件 | 加载中提示 |
| `Taro.showModal` | 自写 Dialog 组件 | 确认弹窗 |
| `Taro.previewImage` | 自写图片预览组件 | 大图预览 |
| `Taro.saveImageToPhotosAlbum` | **删除** | Web 不支持，迁移时移除该功能 |
| `Taro.getSystemInfo` | `window.innerWidth / innerHeight` | 获取视口尺寸 |
| `Taro.onWindowResize` | `window.addEventListener('resize')` | 监听尺寸变化 |

### CORS 处理

**方案 A（采用）**：Vite 配置里加 proxy，把 `/api/*` 代理到 Express 3000 端口。

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

**不采用方案 B**：Express CORS 中间件。因为生产环境前端后端分离部署时，CORS 仍需处理，而开发阶段用 proxy 更干净。

### 图片静态服务

Express **必须显式注册**静态文件服务，否则上传成功但访问 404：

```javascript
// 这一步是必须的，不可省略
app.use('/uploads', express.static('uploads'))
```

上传流程：
1. 前端 `POST /api/upload` → multer 保存到 `uploads/uuid.jpg`
2. 后端返回 `{url: '/uploads/uuid.jpg'}`
3. 前端直接用 `<img src="/uploads/uuid.jpg">` 显示
4. Vite proxy 把 `/uploads/*` 代理到 Express

---

## 3. 页面迁移清单（按依赖顺序）

### 前置任务：shadcn/ui 组件清理（迁移页面前必做）

**不在迁移过程中边迁边清。** 在进入 Phase 1 之前，先做一次性清理：

1. 用 ripgrep 扫一遍 `src/` 中**真正被 import** 的 UI 组件：
   ```bash
   rg "from '@/components/ui/" src/ --no-heading -o | sort | uniq
   ```

2. 只保留实际被引用的组件，其余 40+ 个未使用组件**一次性删除**。

3. 单独 commit：
   ```bash
   git add -A
   git commit -m "chore: remove unused shadcn/ui components before migration"
   ```

预估保留的组件（约 12 个）：button, card, dialog, input, textarea, tabs, badge, avatar, progress, skeleton, scroll-area, separator, toast。

> **为什么先做这件事**：避免"边迁移边发现这个组件其实没用"造成的混乱，也减少迁移时的视觉噪音。

---

### Phase 1：骨架 + 基础设施（1-2 天）

| # | 任务 | 验收标准 | 产品定义对照 |
|---|------|----------|-------------|
| 1.1 | 新建 `web/` 目录，搭 Vite + React + Tailwind 骨架 | `pnpm dev` 能在浏览器打开空白页 | — |
| 1.2 | 迁移 `src/components/ui/` 中**实际使用**的组件 | 只保留：button, card, dialog, input, textarea, tabs, badge, avatar, progress, skeleton, scroll-area, separator, toast | — |
| 1.3 | 迁移 `src/components/`（agent, nobi, tab-bar, hand-drawn, placeholder-image, bilingual-title） | 组件能在浏览器正常渲染 | v0.5 §13 |
| 1.4 | 配置 React Router + 底部 Tab 栏 | 三个 Tab 能切换，URL 变化正确 | v0.5 §4 |
| 1.5 | 迁移 Zustand Store（user-store, space-store） | Store 数据在页面间能共享 | — |

### Phase 2：核心链路页面（2-3 天）

| # | 任务 | 验收标准 | 产品定义对照 |
|---|------|----------|-------------|
| 2.1 | **Grow 首页** (`pages/index`) | 上传入口 + Feed 下滑 + Nobi 出场 | v0.5 §4.1, §5.1 |
| 2.2 | **上传空间页** (`pages/upload`) | 拍照/选图/多图预览/大图查看/追加多图 | v0.5 §5.1 |
| 2.3 | **Lifestyle Chat** (`pages/chat`) | 向往生活 → 当前状态 → 轻确认，支持自由文字输入 | v0.5 §5.3 |
| 2.4 | **生成中页** (`pages/generating`) | 进度展示（3 阶段），支持真实等待后端响应 | v0.5 §5.2 |
| 2.5 | **P3 方案页** (`pages/result`) | 三档 Tab 切换，默认低成本，改造后图 + 诊断 + 变化标注 + "今晚试试看" | v0.5 §6 |
| 2.6 | **Next Tab** (`pages/next`) | Next 卡片列表，展示预览图/目标/最轻第一步/成本 | v0.5 §7 |
| 2.7 | **P5 新变化分享** (`pages/share`) | 拍照 + 文字感受 + "哪一步没做到" | v0.5 §8 |
| 2.8 | **P6 一封信** (`pages/letter`) | 信件正文 + 改造前后对比 + 分享入口 + 下一个 Next | v0.5 §9 |
| 2.9 | **Me Tab** (`pages/me`) | 我的信件/空间/历史/设置入口 | v0.5 §4.3 |

### Phase 3：后端极简版（2-3 天）

| # | 任务 | 验收标准 | 产品定义对照 |
|---|------|----------|-------------|
| 3.1 | 新建 `web-server/` 目录，Express + better-sqlite3 骨架 | `node index.js` 能跑，数据库文件自动创建 | — |
| 3.2 | 实现 `POST /api/upload` | 用 Postman 上传图片，返回可访问的 URL | v0.5 §5.1 |
| 3.3 | 实现 `POST /api/spaces` + `POST /api/sessions` + `POST /api/sessions/:id/analyze` | 前端上传图片后，30 秒内收到 AI 返回的空间分析 | v0.5 §5.2, §5.3 |
| 3.4 | 实现 `POST /api/sessions/:id/chat` + `POST /api/sessions/:id/generate` | Chat 答案能保存，方案能生成 | v0.5 §6 |
| 3.5 | 实现 Next + Feedback + Letter 接口 | 完整链路：试试看 → 反馈 → 信件 | v0.5 §7-9 |
| 3.6 | 前后端联调 | 关掉 `mock/data.ts` 后，产品仍能跑通一次完整闭环 | — |

---

## 4. 后端 API 清单（8 个端点，不许增加）

```
POST   /api/upload              → 接收 multipart/form-data 图片 → 存 uploads/ → 返回 {url}
POST   /api/spaces              → 创建空间 {images: string[]} → 返回 {id}
POST   /api/sessions            → 创建 session {spaceId} → 返回 {id}
POST   /api/sessions/:id/analyze → 触发 P001 Space Reader → 返回 {questions: [...]}
POST   /api/sessions/:id/chat   → 保存问卷答案 → 返回 {ok}
POST   /api/sessions/:id/generate → 触发 P002 Intervention Generator → 返回 {interventions: [...]}
POST   /api/next                → 保存到 Next {interventionId} → 返回 {id}
GET    /api/next                → 获取用户 Next 列表
POST   /api/next/:id/feedback   → 提交反馈 {afterImages, userNote} → 返回 {id}
POST   /api/next/:id/letter     → 触发 P003 Letter Writer → 返回 {content}
GET    /api/me/memory           → 获取长期记忆文本
```

> 允许合并：如果前端调用方便，`/api/spaces` 和 `/api/sessions` 可以合并为一步创建。

---

## 5. 数据库设计（SQLite 单文件）

保留原 schema 的 7 张表结构，但用原生 SQL 建表：

```sql
-- users, spaces, sessions, chat_responses, interventions, next_actions, feedbacks, letters
-- 字段与原 Drizzle schema 一致，去掉外键约束（SQLite 简化）
-- 用 TEXT 存 JSON 数组/对象
-- long_term_memory / short_term_memory 用 TEXT 存 Markdown
```

建表脚本放在 `web-server/schema.sql`，启动时自动执行。

---

## 6. Git 分支策略

```
main                    ← 干净基线，最终稳定版本
  └── 0514              ← 当前分支，保留完整 Taro 版本（含本次 README 更新）
       └── webapp       ← 新分支，从 0514 切出，进行 Web 迁移
```

### 操作步骤

```bash
# 1. 查看当前未提交变更
git status

# 2. 提交 0514 当前所有改动
git add -A
git commit -m "chore: freeze Taro version before web migration"

# 3. 加 tag（比单纯分支更安全，即使分支误删也能找回）
git tag taro-final-v0.5

# 4. 推送分支 + tag 到远程
git push origin 0514
git push origin taro-final-v0.5

# 5. 从 0514 切出 webapp 分支
git checkout -b webapp

# 6. 在 webapp 分支上开始迁移
# 新建 web/ 和 web-server/ 目录，不动原有 src/ 和 server/
```

### 保留策略

- `0514` 分支永久保留为 **Taro 版本存档**
- `taro-final-v0.5` tag 指向 Taro 版本最终状态（分支误删时可找回）
- `webapp` 分支上做所有迁移工作
- 迁移完成后，`web/` 成为新的前端源码目录，`web-server/` 成为新的后端目录
- 原 `src/` 和 `server/` 在 `webapp` 分支上可逐步删除（Phase 3 结束后）
- 最终 `webapp` 合并到 `main`，`taro-final-v0.5` tag 永久保留

---

## 7. 目录结构（迁移完成后）

```
NestAI/
├── web/                    # 新前端（React + Vite）
│   ├── index.html
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx           # React Router
│   │   ├── pages/            # 10 个页面（从原 src/pages/ 迁移）
│   │   ├── components/       # 共享组件 + 精简后的 ui/
│   │   ├── stores/           # Zustand（从原 src/lib/store/ 迁移）
│   │   ├── lib/
│   │   │   ├── mock/         # Phase 3 结束后删除
│   │   │   └── utils.ts
│   │   └── index.css
│   └── package.json
├── web-server/             # 新后端（Express + SQLite）
│   ├── index.js            # 入口
│   ├── schema.sql          # 建表脚本
│   ├── db.js               # SQLite 封装
│   ├── uploads/            # 图片存储目录
│   ├── prompts/            # 从原 server/src/prompts/ 复制
│   └── package.json
├── docs/                   # 保留
├── NestAI_Product_Definition_v0.5.md
├── MIGRATION_SOP.md        # 本文档
├── TECH_STACK.md           # 更新为 Web 版本
└── README.md               # 已更新（产品定义风格）
```

---

## 8. Worklog 模板（每次会话开始前填写）

```markdown
## 会话日期：2026-XX-XX

### 本次目标
- [ ] 任务编号：具体任务

### 产品定义对照检查
- [ ] 本次改动是否改变了用户旅程？
- [ ] 本次改动是否改变了三档方案定义？
- [ ] 本次改动是否引入了新的 UI 组件？
- [ ] 本次改动是否在后端新增了 API 端点？（只允许 8 个）

### 完成情况
- 已完成：...
- 遗留问题：...
- 下一步：...
```

---

## 9. 常见语义滑动风险点

| 风险 | 错误做法 | 正确做法 |
|------|----------|----------|
| "上传页再加个视频上传吧" | 增加新功能 | 迁移阶段只复制现有功能，不加新功能 |
| "Chat 的问题选项不够智能，我改一下" | 改动产品逻辑 | 只迁移 UI 和交互，问题选项内容保持原样 |
| "这个页面布局在手机上不太好看，我调整一下" | 改动设计 | 先 1:1 复制，布局优化放在迁移完成后 |
| "后端还是用 Drizzle 吧，熟悉一点" | 增加复杂度 | 用 better-sqlite3 + 原生 SQL，不许回头 |
| "加个用户登录系统吧" | 增加功能 | 第一版硬编码 dev_user，不做登录 |
| "API 加个分页吧，以后数据多了" | 过度设计 | 没这个需求，不加 |

---

## 10. 迁移完成验收标准

1. [ ] 浏览器打开 `http://localhost:5173`，能看到 NestAI 首页
2. [ ] 能上传图片（真实上传到后端，刷新后还在）
3. [ ] 能走完 Chat → 方案 → Next → 反馈 → 信件 完整链路
4. [ ] 所有 AI 调用都是真实的（不是 Mock 数据）
5. [ ] 关掉 mock/data.ts 后产品仍能运行
6. [ ] 原 Taro 版本的 `0514` 分支可以独立检出并运行
7. [ ] 没有新增超出 8 个的后端 API 端点
8. [ ] 没有引入新的框架/库（除了 React Router 和 better-sqlite3）
