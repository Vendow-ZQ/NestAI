# NestAI

NestAI 是一个空间生活方式 Agent：用户上传真实空间图片，系统先理解空间与生活方式，再生成动态问卷、空间干预方案、图生图改造效果、行动收藏、反馈信件与长期记忆。

## 当前结构

```text
NestAI/
  web/                         # React + Vite 前端
    src/
      pages/                   # Grow / Upload / Chat / Result / Next / Share / Letter / Me
      stores/                  # 前端状态
      lib/                     # API、工具、错误文案

  python-server/               # FastAPI 后端
    app/
      api/                     # REST API 路由
      core/                    # 配置与 LLM Manager
      services/                # 视觉、工作流、图像生成、Memory 服务
      workflows/               # LangGraph 节点与图
      prompts/                 # Prompt builder，不直接存放可编辑 Prompt 文本

  prompts/                     # 可编辑生产 Prompt
    P001_space_analysis.md     # 图片理解 + Memory01 + 动态问卷
    P002_intervention_plan.md  # 问卷 + Memory -> 三档空间干预方案
    P003_reflection_letter.md  # 完成/反馈后生成信件
    P004_image_prompt.md       # 行动文本 + 原图 -> 图生图 Prompt
    P005_bauhaus_image_edit.md # 独立图生图测试 Prompt

  tests/
    api/                       # API / LLM 手动测试脚本
    assets/images/             # 标准测试图片 Pic1-Pic3
    fixtures/                  # 测试输入样例

  docs/                        # 架构、LLM 调用图、项目同步文档
```

旧的 `api_test/` 已废弃，不再作为后端 Prompt 或测试素材来源。

## 启动

先准备后端环境变量：

```bash
cp python-server/.env.example python-server/.env
```

至少需要：

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

Windows 也可以直接双击根目录的 `start.bat`，它会分别打开 Backend 和 Frontend 两个终端窗口。

PowerShell 用户可以运行：

```powershell
.\start.ps1
```

默认地址：

- 前端：`http://localhost:5000`
- 后端：`http://localhost:8000`
- API 文档：`http://localhost:8000/docs`

也可以分开启动：

```bash
pnpm dev:web
pnpm dev:server
```

## 核心流程

1. Upload：上传空间图片。
2. P001：视觉 LLM 根据图片生成 `Memory01`、一句话空间概览和动态问卷。
3. Chat：用户回答问卷。
4. P002：文本 LLM 根据图片理解、问卷答案、压缩长期记忆生成三档干预方案。
5. Result：用户选择 tier，点击“看看变化”。
6. P004：多模态 LLM 把行动文本和原图翻译成图生图 Prompt。
7. Image API：使用原图 + P004 输出生成改造后图片。
8. Next / Share / Letter / Me：收藏行动、记录完成反馈、生成回信并沉淀长期记忆。

## 测试

前端构建：

```bash
pnpm --dir web build
```

后端语法检查：

```bash
python -m py_compile python-server/app/main.py
```

图生图链路干跑：

```bash
python tests/api/test_generation.py --dry-run
```

真实调用图生图：

```bash
python tests/api/test_generation.py
```

## Prompt Engineering

优先编辑根目录 `prompts/` 下的 P001-P005 文件。后端运行时会读取这些 Markdown 文件；`python-server/app/prompts/__init__.py` 只负责把 Prompt 装配进 LangChain 模板，不再承载主要 Prompt 文案。

每次改 Prompt 后，建议至少跑：

```bash
python tests/api/test_generation.py --dry-run
pnpm --dir web build
```
