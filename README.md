# NestAI

NestAI 是一个空间生活方式 Agent：用户上传真实房间、桌面或角落照片后，系统会理解空间与生活方式，生成动态问卷、三档空间干预方案、图生图改造预览、行动收藏、反馈信件和长期记忆。

当前部署架构：

- 前端：Vercel
- 后端：Render
- 数据库与图片存储：Supabase Postgres + Supabase Storage

## 当前进展

- 前端是 React + Vite，位于 `frontend/`。
- 后端是 FastAPI，位于 `backend/`。
- 本地开发默认使用 SQLite 和本地 `uploads/`。
- 生产环境通过 `DATABASE_URL` 使用 Supabase Postgres。
- 上传图片和生成图片通过 `StorageService` 支持 Supabase Storage。
- 已加入 `render.yaml` 和 `vercel.json`。
- `tests/`、`scripts/`、`integration/`、`integrations/` 为本地辅助目录，不上传 GitHub。

## 项目结构

```text
NestAI/
  frontend/                    # React + Vite 前端
    public/nobi/               # Nobi 动画素材
    src/
      components/              # 通用 UI 组件
      pages/                   # Grow / Upload / Chat / Result / Next / Share / Letter / Me
      stores/                  # Zustand 前端状态
      lib/                     # API、文案、工具函数

  backend/                     # FastAPI 后端
    app/
      api/                     # REST API 路由
      core/                    # 配置与 LLM Manager
      services/                # Vision / Workflow / Image Generation / Memory / Storage
      workflows/               # LangGraph 节点与状态

  prompts/                     # 可编辑生产 Prompt P001-P005
  docs/                        # 架构与部署文档
  render.yaml                  # Render 后端部署配置
  vercel.json                  # Vercel 前端部署配置
```

## 本地启动

安装依赖：

```bash
pnpm install
python -m pip install -r backend/requirements.txt
```

创建后端环境变量文件：

```bash
cp backend/.env.example backend/.env
```

至少需要配置：

```env
OPENAI_API_KEY=your_key
DEFAULT_LLM_PROVIDER=OPENAI
VISION_LLM_PROVIDER=OPENAI
IMAGE_PROVIDER=OPENAI
IMAGE_MODEL=gpt-image-1.5
```

启动前后端：

```bash
pnpm dev
```

默认地址：

- 前端：`http://localhost:5000`
- 后端：`http://localhost:8000`
- API 文档：`http://localhost:8000/docs`

也可以分开启动：

```bash
pnpm dev:frontend
pnpm dev:backend
```

## 云部署

完整 SOP：

```text
docs/Vercel_Render_Supabase_SOP.md
```

简版流程：

1. 创建 Supabase 项目。
2. 创建 Supabase Storage bucket：`nestai-uploads`。
3. 用 `render.yaml` 在 Render 部署 FastAPI 后端。
4. 用 `vercel.json` 在 Vercel 部署 Vite 前端。
5. 在 Vercel 设置 `VITE_API_BASE_URL` 指向 Render 后端地址。

Render 后端关键环境变量：

```env
APP_ENV=production
DATABASE_URL=postgresql://...
STORAGE_BACKEND=supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_STORAGE_BUCKET=nestai-uploads
PUBLIC_BASE_URL=https://your-render-service.onrender.com
CORS_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:5000
OPENAI_API_KEY=your_key
```

Vercel 前端关键环境变量：

```env
VITE_API_BASE_URL=https://your-render-service.onrender.com
```

不要把 `SUPABASE_SERVICE_ROLE_KEY` 放到 Vercel 或任何前端代码里。

## 核心流程

1. Upload：用户上传真实空间照片。
2. P001：视觉 LLM 生成 `Memory01`、空间概览、动态问题和安全的人格/生活方式线索。
3. Chat：用户回答动态问卷。
4. P002：文本 LLM 根据图片理解、问卷答案和长期记忆生成三档干预方案。
5. Result：用户选择方案档位，并点击预览变化。
6. P004：把所选行动方案转换成图生图 prompt。
7. Image API：用原图生成改造后的 after-image。
8. Next / Share / Letter / Me：收藏行动、记录反馈、生成回信，并更新长期记忆。

## 数据与存储

本地开发：

- SQLite：`backend/nestai.db`
- 上传/生成图片：`backend/uploads/`

生产环境：

- Supabase Postgres：通过 `DATABASE_URL`
- Supabase Storage：通过 `STORAGE_BACKEND=supabase`
- 后端通过 `PUBLIC_BASE_URL` 返回可访问图片 URL

后端统一保留 `/uploads/...` 的 URL 形态，所以前端不需要关心图片实际来自本地文件系统还是 Supabase Storage。

## 测试与检查

完整项目构建：

```bash
pnpm build
```

前端构建：

```bash
pnpm --dir frontend build
```

后端语法检查：

```bash
cd backend
python -m compileall app
```

如果本地保留了未上传 GitHub 的 `tests/` 目录，可以继续运行本地专项测试；线上仓库和云部署不依赖这些测试文件。

## Prompt Engineering

生产 Prompt 位于根目录 `prompts/`：

- `P001_space_analysis.md`：图片理解、Memory01、动态问卷
- `P002_intervention_plan.md`：问卷 + memory 到三档干预方案
- `P003_reflection_letter.md`：反馈到 reflection letter
- `P004_image_prompt.md`：行动方案 + 原图到图生图 prompt
- `P005_bauhaus_image_edit.md`：独立图生图测试 prompt

每次修改 Prompt 后，建议至少运行：

```bash
pnpm build
```
