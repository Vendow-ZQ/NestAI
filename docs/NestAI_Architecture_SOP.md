# NestAI Architecture SOP

## 1. 当前定位

NestAI 当前是一个多阶段 AI 工作流产品，不是成熟意义上的多 Agent 系统。

现在已经具备：

- 图片上传
- 空间视觉分析
- Memory01 / 人格洞察 / 动态问卷生成
- 问卷回答收集
- 空间干预方案生成
- 分享页图片与感受输入
- 告别信生成

仍未完全打通：

- 真实图生图改造图
- Grow / Feed / Next / Me 的真实数据源
- 空间数据持久化
- 长期记忆的系统化更新
- LangGraph 状态机的完整接管

目标不是做一组自由对话的 Agent，而是做一个产品级 AI Workflow：

```text
Frontend
  -> FastAPI
  -> LangGraph Workflow
  -> Agent Nodes
  -> Tools
  -> Memory / DB / Storage
```

## 2. 推荐技术架构

### Frontend

- React
- Vite
- TypeScript
- Tailwind
- Zustand

### Backend

- FastAPI
- LangGraph
- LangChain-compatible LLM wrapper
- SQLite
- Local file storage
- Simple background jobs

### MVP 原则

- 尽量本地优先
- 尽量少服务
- 尽量少账号
- 尽量少部署复杂度
- 先把真实产品链路跑通，再考虑迁移云服务

### MVP 最小技术栈

- Frontend: React + Vite + TypeScript + Tailwind
- Backend: FastAPI
- Database: SQLite
- File Storage: 本地 `uploads/`
- Workflow: LangGraph, 只用于主 AI 链路
- Background Jobs: FastAPI `BackgroundTasks`
- LLM / Vision / Image Generation: 一个统一 Provider 配置

如果后续需要上线给更多用户使用，再考虑迁移到 Supabase 或其他云服务。

## 3. 数据存储分层

### SQLite

用于结构化业务数据：

- `users`
- `spaces`
- `space_images`
- `sessions`
- `space_analyses`
- `question_answers`
- `intervention_plans`
- `generated_images`
- `feedbacks`
- `letters`
- `next_actions`
- `feed_posts`
- `long_term_memories`
- `workflow_runs`

MVP 阶段直接使用 SQLite 即可。它足够支撑早期 demo、小规模测试和本地开发。

未来如果出现这些情况，再迁移 Postgres：

- 多用户并发明显增加
- 需要线上持久部署
- 需要复杂查询和权限隔离
- 需要 pgvector 做长期记忆检索

### Local File Storage

用于存放大文件：

- 用户上传的原始空间图
- AI 生成的空间改造图
- 用户分享的 after 图
- Feed 卡片封面图

MVP 阶段直接存到本地：

```text
python-server/
  uploads/
    originals/
    generated/
    feedback/
```

数据库只保存图片路径和元数据：

```json
{
  "session_id": "...",
  "image_url": "...",
  "local_path": "...",
  "kind": "original | generated | after",
  "created_at": "..."
}
```

未来需要公网访问、多人使用或部署到无状态服务器时，再迁移到 Supabase Storage / Cloudflare R2。

### Memory

短期记忆：

- 绑定 `session_id`
- 保存本轮空间分析、问卷、方案、反馈、信件

长期记忆：

- 绑定 `user_id`
- 保存审美偏好、预算偏好、行动习惯、空间历史

## 4. Agent 划分

NestAI 应该采用“多个专业 Agent 节点 + 一个工作流图”的结构。

### SpaceReaderAgent

输入：

- 用户上传图片

输出：

- Memory01
- 空间人格洞察
- 用户可读的一句话空间概述
- 动态问卷

### QuestionnaireAgent

输入：

- Memory01
- 用户回答

输出：

- 结构化问卷结果
- 用户目标
- 当前阻碍
- 预算与空间约束

### InterventionPlannerAgent

输入：

- Memory01
- 问卷结果
- 长期记忆

输出：

- 0 元方案
- 低成本方案
- 进阶方案
- 每个方案的行动步骤
- 每个方案的改造逻辑

### ImagePromptAgent

输入：

- 原图描述
- 人格洞察
- 问卷结果
- 干预方案

输出：

- 图生图 prompt
- 轴测图 prompt
- 局部细节 prompt
- negative prompt

### ImageGenerationTool

输入：

- 原图
- image prompt

输出：

- generated image URLs
- generation status
- provider metadata

### LetterWriterAgent

输入：

- 干预方案
- 用户 after 图片
- 用户感受
- 未完成步骤

输出：

- 告别信
- 下一步温和行动建议

### MemoryCuratorAgent

输入：

- 本轮完整 session

输出：

- 长期记忆更新
- 用户偏好更新
- next actions
- 可选 feed draft

## 5. LangGraph 工作流

目标工作流：

```text
START
  -> load_session
  -> analyze_space_images
  -> generate_questions
  -> wait_for_user_answers
  -> plan_intervention
  -> build_image_prompts
  -> generate_images
  -> save_result
  -> wait_for_feedback
  -> write_letter
  -> update_long_term_memory
  -> create_next_actions
  -> END
```

需要支持两个暂停点：

- 等待用户回答问卷
- 等待用户上传改造结果与感受

每个节点都必须写入 `workflow_runs`，便于恢复、调试和审计。

## 6. Planning / Tool Calling / Memory 使用边界

### Planning

用于：

- 生成空间干预方案
- 拆分 0 元、低成本、进阶方案
- 生成 Next Actions
- 判断预算、墙面、共用空间等限制

### Tool Calling

用于：

- 调用视觉模型
- 调用图生图模型
- 上传图片到对象存储
- 读取历史记忆
- 保存生成图片
- 查询用户历史 session
- 生成 Feed 卡片

### Memory

用于：

- P001 后写入空间观察
- P002 前读取 Memory01 与问卷结果
- 图生图前读取人格洞察与改造目标
- P003 前读取方案与反馈
- session 结束后更新长期记忆
- Grow / Next 页面生成个性化内容

## 7. 推荐文件结构

```text
python-server/
  app/
    main.py

    api/
      routes/
        upload.py
        spaces.py
        sessions.py
        feed.py
        actions.py
        memories.py

    core/
      config.py
      database.py
      llm.py
      storage.py

    db/
      models.py
      schemas.py

    workflows/
      nestai_graph.py
      state.py
      nodes/
        load_session.py
        analyze_space.py
        generate_questions.py
        plan_intervention.py
        build_image_prompts.py
        generate_images.py
        write_letter.py
        update_memory.py
        create_next_actions.py

    agents/
      space_reader/
        system.md
        output_schema.json
      questionnaire/
        system.md
        output_schema.json
      intervention_planner/
        system.md
        output_schema.json
      image_prompt_builder/
        system.md
        output_schema.json
      memory_curator/
        system.md
        output_schema.json
      letter_writer/
        system.md
        output_schema.json

    services/
      vision_service.py
      image_generation_service.py
      memory_service.py
      storage_service.py
      feed_service.py
      action_service.py

    repositories/
      session_repo.py
      space_repo.py
      image_repo.py
      memory_repo.py
      feed_repo.py

web/
  src/
    pages/
    components/
    features/
      upload/
      chat/
      result/
      share/
      feed/
      profile/
    lib/
      api.ts
      types.ts
    stores/
```

## 8. 实施顺序

### Phase 1: 数据真实化

目标：核心页面不再依赖 mock。

任务：

- 把 `spaces.py` 从内存存储迁移到 SQLite
- 增加 Feed / Actions API
- Result 页面只读真实 `intervention_plan`
- Letter 页面展示真实 before / after 图片
- Grow / Next / Me 从真实 session 派生内容

### Phase 2: 图生图闭环

目标：空间干预方案可以生成真实视觉结果。

任务：

- P002 输出增加 `image_prompts`
- 新增 `ImagePromptAgent`
- 新增 `image_generation_service.py`
- 新增 `generated_images` 表
- Result 页面展示真实生成图
- 图像生成改为异步任务

### Phase 3: LangGraph 正式化

目标：主流程变成可暂停、可恢复、可追踪的状态机。

任务：

- 定义统一 `NestAIState`
- 每个 Agent 变成 LangGraph node
- 每个节点输出写入 `workflow_runs`
- 支持用户输入暂停点
- 支持图像生成异步恢复
- 支持失败重试与 fallback

### Phase 4: 长期记忆与 Grow

目标：用户越用越准，Grow 页面有真实内容。

任务：

- session 结束后生成 memory summary
- 更新长期审美偏好、预算偏好、行动习惯
- 基于长期记忆生成 Next Actions
- 用户授权后生成 Feed post
- Grow 页面区分个人成长记录与公共案例

## 9. 近期优先级

当前最应该先做：

```text
SQLite + Local uploads
  -> 去掉核心 Mock
  -> 增加 image prompt schema
  -> 接入图生图
  -> LangGraph 正式化
  -> Grow / Feed / Memory 进化
```

判断标准：

- 用户上传的图片必须成为后续所有输出的真实输入
- 问卷结果必须影响干预方案
- 干预方案必须影响图生图 prompt
- 用户反馈必须影响信件和长期记忆
- Grow / Next / Me 不能再只是静态 mock
