# NestAI LLM / Prompt 调用地图

更新时间：2026-05-19

## 入口总览

| 阶段 | 前端页面 | 前端 API | 后端入口 | 是否调用 LLM / 图像 API | Prompt 位置 |
| --- | --- | --- | --- | --- | --- |
| P001 图片理解 + 问卷 | Upload -> Generating(space) -> Chat | `POST /api/sessions/{id}/analyze` | `python-server/app/api/sessions.py` | 是，视觉 LLM | `api_test/Prompt1.md` |
| P002 空间干预方案 | Chat -> Generating(intervention) -> Result | `POST /api/sessions/{id}/intervention` | `WorkflowService.run_intervention_generation()` | 是，文本 LLM | `python-server/app/prompts/__init__.py:create_p002_prompt()` |
| P004 图生图提示词翻译 | Result 点击“看看变化” | `POST /api/sessions/{id}/generate-images` | `WorkflowService.run_image_generation()` | 是，多模态 LLM | `api_test/Prompt4.md` |
| 图生图生成 | Result 点击“看看变化” | 同上 | `image_generation_service.generate_from_original()` | 是，OpenAI Image API | 使用 P004 的输出作为 image edit prompt |
| P003 回信 | Share/Done -> Generating(letter) -> Letter | `POST /api/sessions/{id}/letter` | `WorkflowService.run_letter_generation()` | 是，文本 LLM | `api_test/Prompt3.md` |

## P001：图片理解与动态问卷

调用链：

1. 用户上传图片。
2. 前端进入 `/generating?type=space`。
3. 前端调用 `POST /api/sessions/{session_id}/analyze`。
4. 后端 `vision_service.analyze_space_image()` 读取上传图片。
5. `vision_service` 通过 `llm_manager.get_model(provider=VISION_LLM_PROVIDER, model_name=VISION_LLM_MODEL)` 调用视觉模型。

系统 Prompt：

- `api_test/Prompt1.md`

输入：

- 上传的原始空间图片；
- 一句 human 指令，要求输出 Memory01、QA、JSON。

输出：

- `space_summary`：内部 Memory01，用于后续方案生成；
- `questions`：前端展示的 3 道动态问卷；
- `qa_markdown`：调试/过程内容，不应该直接完整展示在前端。

## P002：空间干预方案

调用链：

1. 用户在 Chat 页面完成问卷。
2. 前端调用 `POST /api/sessions/{session_id}/intervention`。
3. `WorkflowService.run_intervention_generation()` 启动 LangGraph。
4. Graph 节点 `plan_intervention_node()` 调用文本 LLM。

系统 Prompt：

- `python-server/app/prompts/__init__.py`
- 函数：`create_p002_prompt()`

输入：

- P001 的 `space_summary`；
- 问卷答案：`aspiration`、`current_state`、`constraints`。

输出：

- 三档方案：`free`、`low`、`advanced`。

## P004：从行动文本到图生图 Prompt

调用链：

1. 用户在 Result 页面点击“看看变化”。
2. 前端调用 `POST /api/sessions/{session_id}/generate-images`。
3. `WorkflowService.run_image_generation()` 启动图像生成 Graph。
4. Graph 节点 `build_image_prompt_node()` 先读取当前选择的 tier，例如 `low`。
5. 节点把“空间改造行动文本 + 改造前图片”一起发给多模态 LLM。

系统 Prompt：

- `api_test/Prompt4.md`

输入：

- 当前 tier 的行动文本；
- 改造前图片；
- 用户问卷/空间摘要的上下文。

输出：

- `render1`
- `axonometric`
- `render2`
- `negative`

这些输出不是最终图片，而是发给图生图模型的 image edit prompt。

## 图生图生成

调用链：

1. `build_image_prompt_node()` 得到 P004 翻译后的 `imagePrompts`。
2. Graph 节点 `generate_images_node()` 调用 `image_generation_service.generate_from_original()`。
3. 当前配置使用 OpenAI Image API。

配置：

- `IMAGE_PROVIDER=OPENAI`
- `IMAGE_MODEL=gpt-image-1.5`

输出：

- 生成图保存到 `python-server/uploads/generated/YYYYMMDD/`。
- 前端通过 `/uploads/generated/...` 展示。

失败调试：

- 图像生成失败会写入 `python-server/uploads/debug/`。

## P003：完成后的回信

调用链：

1. 用户在 Next/Result/Share 流程里提交完成状态和感受。
2. 前端调用 `POST /api/sessions/{session_id}/letter`。
3. `WorkflowService.run_letter_generation()` 启动 Letter Graph。
4. Graph 节点 `write_letter_node()` 调用文本 LLM。

系统 Prompt：

- `api_test/Prompt3.md`

输入：

- 用户选择的 tier；
- 对应空间干预方案；
- 完成情况；
- 用户感受；
- 对话摘要。

输出：

- 一封 4-7 段的中文回信，保存到 session memory。

## 现在的 LangGraph 结构

当前不是“很多独立 Agent 互相聊天”的多 Agent 系统，而是一个 LangGraph 编排的多节点工作流：

- `intervention_graph`：生成空间干预方案，再准备图片 Prompt；
- `image_generation_graph`：用 P004 翻译图生图 Prompt，再调用图像生成 API；
- `letter_graph`：生成回信，再准备记忆更新。

它更像“单协调器 + 多能力节点”的产品工作流。现阶段这样更稳、更轻，不需要过早做成复杂多 Agent。
