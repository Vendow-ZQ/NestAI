# NestAI Product Definition v1.0
> 栖巢 NestAI · 产品定义文档
> 版本：v1.0
> 当前用途：作为当前 Web App、AI Pipeline、Prompt Engineering、Memory 系统和后续开发协作的统一产品定义
> 当前状态：从 v0.5 的概念与 Demo 定义，升级为已基本成型的本地可运行产品定义
---
## 0. v1.0 的定位
v0.5 的任务是回答“NestAI 是什么、用户旅程是什么、第一版应该长什么样”。v1.0 的任务是回答另一个问题：
> **现在这个 Web App 已经基本成型之后，NestAI 到底是一套怎样的真实产品系统？**
因此 v1.0 不再只写概念、页面设想和 Demo 假设，而是把最新决策和当前代码状态合并起来，作为后续产品、设计、Prompt、前后端和其他 agent 协作的标准参考。
这一版要明确：
1. NestAI 的产品哲学和边界。
2. 当前 Web App 的用户旅程。
3. Grow / Upload / Chat / Result / Next / Share / Letter / Me / Login 的职责。
4. 每一步调用哪个 Prompt、读写什么 Memory、产生什么 Schema。
5. 当前技术架构、文件结构和数据归属。
6. Nobi 在产品里的角色与出现方式。
7. 还没有打通或需要继续加强的部分。
v1.0 的核心共识是：
> **NestAI 是一个帮助年轻租住者、宿舍用户和小空间居住者，把真实空间转译成可执行生活方式改变的空间 Agent。它不是一次性生成装修效果图，而是通过“看见空间 - 理解生活 - 生成 Next - 促成行动 - 记录反馈 - 更新记忆”的闭环，让用户的生活方式从自己的空间里一点点长出来。**
---
## 1. 一句话定义
> **NestAI 看见你的 Nest，理解你的生活方式，然后给出你的 Next。**
更具体地说：
> **NestAI 不是帮你把房间装修成别人的样板间，而是把你想靠近的生活状态，翻译成下一步真正能在你当前空间里做出来的小改变。**
当前产品命名与表达：
- 中文名：栖巢
- 英文名：NestAI
- 核心隐喻：Nest 是真实生活的容器，Next 是下一步可执行的空间行动。
- 品牌角色：Nobi / 豆鼻，是空间观察员和陪伴者。
---
## 2. 产品不是这些
NestAI 不应被定义为：
- 普通 AI 室内设计生成器
- 家装效果图工具
- 风格测试工具
- 家居导购工具
- To-do List 或打卡工具
- 纯内容社区
- 纯人格测评产品
这些方向都容易把产品带偏。
NestAI 的重点不是“生成一张漂亮图”，而是：
> **用 AI 对真实空间进行理解、模拟和反馈，推动用户回到物理世界中行动。**
效果图是重要的 Aha Moment，但不是产品终点。真正的终点是：用户做了一点真实改变，NestAI 记住这次改变，并在下一次变得更懂用户。
---
## 3. 用户痛点
目标用户并不缺“灵感”。他们通常已经在小红书、Pinterest、Instagram、B 站、淘宝、宜家、家居品牌图册里看过大量空间样板。
真正的痛点是：
1. **灵感无法落地**
   别人的房间很美，但自己的空间大小、预算、租房限制、物品数量、采光和生活习惯完全不同。
2. **不知道先做哪一步**
   用户常常想改变空间，但一想到“整理、买东西、布置、收纳、风格统一”，就不知道从哪里开始。
3. **效果图和真实执行之间落差太大**
   传统 AI 效果图容易改掉墙体、窗户、家具比例和真实杂物，让用户看完觉得“好看但不是我的房间”。
4. **生活方式没有被持续记住**
   一次方案结束后，系统不知道用户上次做了什么、什么有效、什么没做成、用户真实喜欢什么。
5. **空间改变缺少情绪上的陪伴**
   改造小空间不是装修工程，而是和生活秩序、自我表达、压力、休息、专注、社交有关的日常行动。它需要轻一点、温柔一点的产品语气。
---
## 4. 目标用户
NestAI 第一阶段面向：
- 大学生 / 研究生宿舍用户
- 留学生租住用户
- 初入职场的城市租房者
- 小户型、HDB、公寓、合租空间用户
- 拥有小型书桌、床边、角落、工作区、创作区的人
他们的共同点不是“没有房子”，而是：
> **他们正在使用一个有限、受约束、可能并不长期属于自己的空间，但仍然希望认真地把自己的生活放进去。**
当前产品优先支持的空间类型：
- 桌面 / 工作区
- 卧室 / 宿舍
- 床边区域
- 客厅角落
- 收纳角落
- 小型创作区
---
## 5. 产品哲学
### 5.1 从“风格”退后一步
NestAI 可以理解风格，例如包豪斯、孟菲斯、新中式、工业风、奶油风、绿植感，但风格不是起点。
起点应该是：
- 用户现在如何使用空间
- 用户想靠近什么生活状态
- 当前空间哪里卡住了这种生活
- 什么动作是今天真的能做的
风格是让行动可视化、可感知、可期待的语言，而不是方案的唯一目的。
### 5.2 从“装修”转向“干预”
NestAI 使用“空间干预”而不是“装修方案”。
干预可以很小：
- 清出一块 30cm x 30cm 的桌面
- 把常用物品聚到一个托盘
- 加一盏暖色台灯
- 把床边变成放松信号
- 让书桌有一个“开始工作”的视觉锚点
这些动作不宏大，但它们会改变用户和空间的关系。
### 5.3 从“一次生成”转向“生活方式生长”
NestAI 的核心机制是 Lifestyle Growth System：
```text
真实空间
  -> 空间观察
  -> 生活方式问卷
  -> 三档干预方案
  -> 效果预览
  -> Next 行动
  -> 用户反馈
  -> 一封信
  -> 长期记忆更新
  -> 下一次更懂你
```
---
## 6. 当前主用户旅程
当前 v1.0 主链路：
```text
Login
  -> Grow
  -> Upload
  -> Space Analysis Loading
  -> Lifestyle Chat
  -> Intervention Loading
  -> Result
  -> 看看效果
  -> Let's do it
  -> Next
  -> Done
  -> Share Changes
  -> Letter Loading
  -> Letter
  -> Share to Grow
  -> Me / LongTermMemory
```
### 6.1 Login
轻登录入口。用户输入昵称和可选邮箱。
产品目的：
- 建立用户身份。
- 让所有空间、Session、短期记忆、长期记忆有明确归属。
- 先不引入复杂 OAuth，不增加多余云服务。
技术状态：
- 前端：`frontend/src/pages/login/LoginPage.tsx`
- 状态：`frontend/src/stores/user-store.ts`
- 后端：`backend/app/api/users.py`
- 数据表：`users`
### 6.2 Grow
Grow 是默认主入口，也是一体化 Feed。
当前 Grow 包含：
- 顶部品牌：栖巢 / NestAI
- Section 文案：Growing... / See Your Nest, See Your Next
- 第一张上传卡片：Hi~我是 Nobi！
- 公共 Feed 卡片
- 当前观看卡片清晰，上下卡片轻微模糊
- 磁吸式滚动
- 回到顶部按钮
- Nobi 在上传卡片上出现
产品定位：
> **Grow 先让用户开始自己的生长，再让用户看见别人如何生长。**
技术状态：
- 前端：`frontend/src/pages/index/GrowPage.tsx`
- Feed 数据：`GET /api/sessions/?userId=...` 返回 `feed`
- Feed 持久化：`feed_posts`
- 分享来源：Letter 页调用 `POST /api/sessions/{session_id}/publish-feed`
### 6.3 Upload
Upload 是看见空间的入口。
当前支持：
- 拍照
- 从本地选择图片
- 多图上传
- 上传后缩略图展示
- 删除传错的图片
- 点击图片查看大图
- 上传框内可以放大填满，实际图片比例在查看和后续生成时保留
- 上传页和 Grow 上传卡片保持相同视觉尺度与渐变转场
产品原则：
- 手机优先，因为真实空间行动发生在手机和物理空间之间。
- 上传页不应该像表单，而应该像“把 Nobi 带去看空间”。
技术状态：
- 前端：`frontend/src/pages/upload/UploadPage.tsx`
- 上传 API：`POST /api/upload/`
- 创建空间：`POST /api/spaces/`
- 创建 Session：`POST /api/sessions/`
- 上传时会传入当前 `userId`
### 6.4 Generating / Loading
当前有三类加载页：
- Space Analysis：P001 图片理解
- Intervention：P002 方案生成
- Letter：P003 回信生成
产品要求：
- 不使用假进度条到 100% 卡住。
- 使用 Nobi 8 Frame 动画和 Apple 风格三点呼吸动效。
- 问卷加载页和结果加载页使用不同 Nobi 状态。
- 背景保持纯白，减少干扰。
技术状态：
- 前端：`frontend/src/pages/generating/GeneratingPage.tsx`
- Nobi 动画组件：`frontend/src/components/NobiWorking.tsx`
- 动画资源路径：
  - `frontend/public/nobi/questionnaire-frames/`
  - `frontend/public/nobi/result-frames/`
  - `frontend/public/nobi/effect-frames/`
### 6.5 Lifestyle Chat
Lifestyle Chat 不是通用聊天，而是由 P001 动态生成的三题问卷。
当前逻辑：
- P001 根据图片生成 `questions`
- 前端只展示用户可读的空间一句话总结，不展示 Memory01 原文
- 每题可以多选
- 用户也可以输入自由文本
- 必须至少选择一项或输入文字，才能继续
- 点击“继续”即提交当前题，不需要额外箭头按钮
三题结构：
1. 用户希望空间先支持哪种生活状态。
2. 当前空间最卡住体验的点是什么。
3. 这次改造的现实约束是什么。
技术状态：
- 前端：`frontend/src/pages/chat/ChatPage.tsx`
- 数据来源：`GET /api/sessions/{session_id}`
- 进入方案生成：`/generating?type=intervention&sessionId=...`
### 6.6 Result
Result 是当前产品的核心 Aha Moment 页面。
当前逻辑：
- 默认展示所选方案的图片区域。
  - 如果还没有生成效果图，展示上传原图。
  - 点击“看看效果”后调用 P004 + Image Generation。
  - 生成完成后横向滑动可以看改造前 / 改造后。
- 三档方案可切换：
  - 低预算
  - 标准预算
  - 预算充足
- 图片可点击放大。
- 横图按 4:3，竖图按 3:4，生成图尽量保持上传图比例。
- 点击 `Let's do it!` 后收入 Next。
- 已收入 Next 后按钮变为 `Done`，进入 Share Changes。
产品原则：
> **先让用户看见一个可信的变化，再解释为什么这样改，最后告诉用户怎么做。**
技术状态：
- 前端：`frontend/src/pages/result/ResultPage.tsx`
- 方案生成：`POST /api/sessions/{session_id}/intervention`
- 图生图：`POST /api/sessions/{session_id}/generate-images`
- 图像服务：`backend/app/services/image_generation_service.py`
- Prompt：`prompts/P003_Image_Prompt.md`
### 6.7 Next
Next 是用户准备尝试的空间行动集合。
当前逻辑：
- 从真实 Session 的 intervention plan 派生 Next Action。
- 当前观看卡片清晰，上下卡片轻微模糊。
- 磁吸式滚动。
- 卡片可点击回到 Result。
- `Done` 进入 Share Changes。
- 支持长按拖到右侧删除。
- 删除状态按用户存在 localStorage，避免不同用户相互污染。
产品原则：
Next 不是任务清单，也不是压力系统。
> **Next 是一个温柔的行动收藏夹，提醒用户可以从一个很小的空间动作开始。**
技术状态：
- 前端：`frontend/src/pages/next/NextPage.tsx`
- 数据来源：`GET /api/sessions/?userId=...` 返回 `nextActions`
### 6.8 Share Changes
用户完成或部分完成一个 Next 后，在这里记录变化。
当前支持：
- 上传改造后的图片
- 输入完成后的感受
- 输入哪一步没有做到
- 提交后进入 Letter 生成
产品原则：
- 拍照为主，文字为辅。
- 不要求用户完美完成。
- 没做完也可以生成一封有效的回信。
技术状态：
- 前端：`frontend/src/pages/share/SharePage.tsx`
- 上传 after images：`POST /api/upload/`
- 回信生成入口：`/generating?type=letter&sessionId=...`
### 6.9 Letter
Letter 是闭环页，不是评分页。
当前逻辑：
- 展示一封由 P003 生成的中文信。
- 展示改造后 / 改造前图。
- 可分享至 Grow，真实写入 `feed_posts`。
- Letter 会进入 Me 页面。
产品原则：
> **Letter 不是总结报告，而是把一次小小空间行动的意义，温柔地还给用户。**
技术状态：
- 前端：`frontend/src/pages/letter/LetterPage.tsx`
- 生成：`POST /api/sessions/{session_id}/letter`
- 分享：`POST /api/sessions/{session_id}/publish-feed`
- Prompt：`prompts/P004_reflection_letter.md`
### 6.10 Me
Me 是用户的个人档案页。
当前包含：
- 当前用户信息
- 我的空间名，可双击编辑
- LongTermMemory.md 查看
- 我的信件
- 历史干预
- 设置与隐私占位
产品原则：
Me 不承载主流程入口，而是承载“我和我的空间如何被记住”。
技术状态：
- 前端：`frontend/src/pages/me/MePage.tsx`
- 长期记忆 API：`GET /api/memory/long-term?userId=...`
---
## 7. AI Pipeline 与 Prompt 工程
当前 Prompt 文件位于根目录 `prompts/`。
### 7.1 P001：空间理解与动态问卷
文件：
- `prompts/P001_space_analysis.md`
- `prompts/P001_retry_safe_space.md`
调用位置：
- `backend/app/services/vision_service.py`
- `POST /api/sessions/{session_id}/analyze`
输入：
- 用户上传的空间图片
- 当前用户的压缩长期记忆 `long_term_context`
输出：
- `Memory01`：内部空间观察 Markdown
- `display_summary`：给前端展示的一句话概述
- `questions`：3 个动态问题，每题 4 个选项
- `personality_insights`：轻量结构化空间洞察
安全边界：
- 只观察空间、物品、布局、光线、收纳、动线和使用痕迹。
- 不识别人。
- 不推断身份、职业、收入、健康、人格诊断。
- 模型拒答时使用 safe retry prompt。
### 7.2 P002：空间干预方案
文件：
- `prompts/P002_intervention_plan.md`
调用位置：
- `backend/app/workflows/nodes.py`
- `plan_intervention_node`
- `POST /api/sessions/{session_id}/intervention`
输入：
- P001 的 `space_summary`
- 问卷答案 `aspiration`
- 当前状态 `current_state`
- 约束 `constraints`
- 压缩长期记忆 `long_term_context`
输出 Schema：
```json
{
  "core_intent": "string",
  "low_budget": {
    "level": "low_budget",
    "title": "string",
    "changes": ["string"],
    "diagnosis": "string",
    "firstSteps": ["string"],
    "recommendations": [],
    "estimatedTime": "string",
    "costRange": "string"
  },
  "standard_budget": {},
  "sufficient_budget": {}
}
```
核心规则：
- 三档不是三个不相关方案，而是同一个核心干预意图的三个投入层级。
- `low_budget` 低预算打通最卡的动作路径。
- `standard_budget` 用几件关键物件加强同一意图。
- `sufficient_budget` 做更完整但仍真实可行的局部升级。
### 7.3 P004：行动文本转图生图 Prompt
文件：
- `prompts/P003_Image_Prompt.md`
调用位置：
- `backend/app/workflows/nodes.py`
- `build_image_prompt_node`
- `POST /api/sessions/{session_id}/generate-images`
输入：
- 原图
- 所选 tier
- 所选方案的行动文本
- Memory01 / 问卷 / 长期记忆摘要
输出：
```json
{
  "render1": "<image_edit_prompt>...</image_edit_prompt>",
  "axonometric": "<image_edit_prompt>...</image_edit_prompt>",
  "render2": "<image_edit_prompt>...</image_edit_prompt>",
  "negative": "string"
}
```
当前产品只在前端重点使用 `render1`。
核心规则：
- P004 不是重新生成方案。
- P004 的任务是把“空间改造行动文本 + 原图”翻译成图生图 prompt。
- 必须保留原始空间结构、镜头、墙体、窗、门、天花、地板、主要家具身份和生活痕迹。
- `standard_budget` 和 `sufficient_budget` 不能只是“稍微整洁一点”，需要选择一个清晰但可执行的风格方向；`low_budget` 也要体现具体、可见的低预算改善。
### 7.4 Image Generation
调用位置：
- `backend/app/services/image_generation_service.py`
当前模型：
- OpenAI image edit API
- 默认配置来自 `.env`
- 代码支持 `IMAGE_MODEL`，当前项目决策优先走 OpenAI
关键处理：
- 上传图片会先标准化成 RGB PNG，避免 OpenAI 拒绝异常 JPG / MPO / EXIF-heavy 图片。
- 输出尺寸根据原图横竖比例选择。
- 保存路径进入 `uploads/generated/...` 或 Supabase Storage。
### 7.5 P003：反馈到一封信
文件：
- `prompts/P004_reflection_letter.md`
调用位置：
- `backend/app/workflows/nodes.py`
- `write_letter_node`
- `POST /api/sessions/{session_id}/letter`
输入：
- 所选 tier
- 方案内容
- 用户完成状态
- 用户感受
- after images
- 未完成步骤
- 压缩长期记忆
输出：
- 一封中文信
- `memory_update`
回写：
- Letter 写入短期记忆
- `memory_update` 追加到长期记忆
---
## 8. Memory 系统
v1.0 中，Memory 不再是概念，而是产品链路里的真实数据层。
### 8.1 用户身份
当前采用轻登录：
- 用户输入昵称
- 可选邮箱
- 后端创建 / 复用 `User`
- 前端 localStorage 保存 `currentUser`
数据表：
- `users`
代码位置：
- `backend/app/api/users.py`
- `backend/app/services/memory_service.py`
- `frontend/src/stores/user-store.ts`
### 8.2 短期记忆
短期记忆绑定一次 session。
数据表：
- `session_memories`
字段包含：
- `session_id`
- `space_id`
- `user_id`
- `content`
- `space_analysis`
- `chat_responses`
- `intervention_plan`
- `feedback`
- `letter_content`
- `status`
它记录一次完整链路：
```text
上传图
  -> P001 空间观察
  -> 问卷答案
  -> P002 方案
  -> P004 生图结果
  -> 用户反馈
  -> P003 Letter
```
### 8.3 长期记忆
长期记忆绑定用户。
数据表：
- `long_term_memories`
文件：
- `backend/memory/users/<userId>/LongTermMemory.md`
内容包含：
- Lifestyle Profile
- Preferences
- Space History
- Intervention History
Prompt 注入时，不会把完整 Markdown 塞进上下文，而是通过：
- `MemoryService.get_compact_long_term_memory(user_id)`
压缩为更短的用户核心画像、偏好和最近干预历史。
### 8.4 当前长期记忆的不足
当前长期记忆已经能被读取、展示和追加，但仍然偏“追加日志”。
下一步应该升级为：
- P003 后由 Memory Curator 总结本轮稳定信息。
- 去重、压缩、合并偏好。
- 区分“稳定偏好”和“单次情绪”。
- Me 页面支持导出 / 清空 / 用户可编辑。
---
## 9. 当前技术架构
### 9.1 前端
技术栈：
- React
- Vite
- TypeScript
- Tailwind
- Zustand
- lucide-react
目录：
```text
frontend/
  public/
    nobi/
      questionnaire-frames/
      result-frames/
      effect-frames/
  src/
    components/
    pages/
      login/
      index/
      upload/
      generating/
      chat/
      result/
      next/
      share/
      letter/
      me/
    stores/
    lib/
```
前端设计原则：
- 手机 Web App 优先。
- PC 打开时像一个独立设备容器，而不是简单放大成大网页。
- 整体更接近 Apple 风格：克制、玻璃质感、轻动效、圆角不过度夸张。
- Grow 和 Next 采用磁吸式卡片滚动。
- 页面之间尽量保持连续转场，而不是闪切。
### 9.2 后端
技术栈：
- FastAPI
- SQLAlchemy
- SQLite 本地开发
- Supabase Postgres 可迁移
- Local uploads 本地开发
- Supabase Storage 可迁移
- LangGraph
- LangChain-compatible LLM wrapper
- OpenAI image edit
目录：
```text
backend/
  app/
    api/
      upload.py
      spaces.py
      sessions.py
      memory.py
      users.py
    core/
      config.py
      llm_manager.py
    services/
      vision_service.py
      workflow_service.py
      image_generation_service.py
      memory_service.py
      storage_service.py
    workflows/
      nestai_graph.py
      nodes.py
      state.py
      utils.py
```
### 9.3 LangGraph 状态
当前不是一个完全自主多 Agent 系统，而是：
> **产品级 AI Workflow + 多个专业节点 + 用户暂停点。**
当前 LangGraph stage graphs：
- `create_intervention_graph`
  - `plan_intervention`
  - `build_image_prompts`
- `create_image_prompt_graph`
  - `build_image_prompts`
- `create_image_generation_graph`
  - `build_image_prompts`
  - `generate_images`
- `create_letter_graph`
  - `write_letter`
  - `update_memory_summary`
状态类型：
- `backend/app/workflows/state.py`
关键状态：
- `session_id`
- `user_id`
- `space_summary`
- `long_term_context`
- `questions`
- `aspiration`
- `current_state`
- `constraints`
- `intervention_plan`
- `selected_level`
- `source_images`
- `image_prompts`
- `generated_images`
- `completion_status`
- `user_feeling`
- `farewell_letter`
- `error`
---
## 10. 是否是多 Agent 系统
当前准确说法：
> **NestAI v1.0 是一个多阶段 AI Workflow，不是完全自主的开放式多 Agent 系统。**
但它已经具备“多专业 Agent 节点”的雏形：
| 角色 | 当前实现 | Prompt / 代码 |
|---|---|---|
| Space Observer / Nobi | 图片理解、Memory01、问卷 | `P001_space_analysis.md` + `vision_service.py` |
| Intervention Planner | 三档方案 | `P002_intervention_plan.md` + `plan_intervention_node` |
| Image Prompt Translator | 行动文本转图生图 Prompt | `P003_Image_Prompt.md` + `build_image_prompt_node` |
| Image Generation Tool | 调 OpenAI image edit | `image_generation_service.py` |
| Letter Writer | 写一封信 | `P004_reflection_letter.md` + `write_letter_node` |
| Memory Curator | 当前为轻量 memory_update | `update_memory_summary_node` |
下一阶段可以把这些节点继续拆成更清晰的 agent 模块，但不建议过早做复杂多 Agent 对话。当前更重要的是：
- Schema 稳定。
- Memory 读写稳定。
- 用户暂停点稳定。
- 失败 fallback 稳定。
- 图像生成稳定。
---
## 11. 数据与存储
### 11.1 本地开发
本地默认：
- 前端：`http://localhost:5000`
- 后端：`http://localhost:8000`
- API Docs：`http://localhost:8000/docs`
数据：
- SQLite：`backend/nestai.db`
- 上传图片：`backend/uploads/`
- 长期记忆 Markdown：`backend/memory/users/`
启动：
```bash
pnpm dev
```
### 11.2 生产可迁移方案
当前决策是：不设计过多云服务，保持最简单、最便宜、最可迁移。
推荐生产组合：
- Frontend：Vercel
- Backend：Render
- Database：Supabase Postgres
- Storage：Supabase Storage
但本地开发仍然优先：
- SQLite
- Local uploads
- `.env`
### 11.3 当前主要数据模型
当前后端模型集中在：
- `backend/app/services/memory_service.py`
包括：
- `UserModel`
- `SpaceModel`
- `SessionMemoryModel`
- `LongTermMemoryModel`
- `WorkflowRunModel`
- `FeedPostModel`
---
## 12. Grow Feed
Grow Feed 当前已经从 mock 走向真实数据。
来源包括：
1. `feed_posts` 中发布的真实帖子。
2. 如果没有真实帖子，则从 public session 或 seed images 派生。
3. Letter 页可将用户结果真实发布到 Grow。
Feed 的产品定位不是传统社区。
> **Feed 不是让用户比较谁的房间更好看，而是让用户看见别人如何从一个小行动开始改变生活。**
Feed 内容应包含：
- 用户名 / 头像
- 改造标题
- 改造图
- 简短描述
- lifestyle keywords
- 来源 session
后续增强：
- 用户授权公开 / 私密切换。
- Feed 根据长期记忆做轻量匹配。
- 收藏别人的 Next 并改写为适合自己的空间行动。
---
## 13. Nobi / 豆鼻
Nobi 是 NestAI 的品牌角色。
角色定义：
> **Nobi 是空间观察员，不是设计师、老师、管家或评分员。**
它的语义：
- 陪伴
- 观察
- 等你回来
- 记得你的习惯
- 不审判你
当前出现位置：
- Grow 上传卡片：Nobi 蹲在上传区域里，邀请用户让它看看小窝。
- Upload 卡片：无图时出现，有图后消失。
- Loading 页面：Working 状态 8 Frame 动画。
- 生成效果图遮罩：Nobi 居中工作。
当前资源结构：
```text
frontend/public/nobi/
  questionnaire-frames/
  result-frames/
  effect-frames/
```
使用原则：
- Nobi 不制造愧疚。
- Nobi 不惩罚用户。
- Nobi 不过度拟人。
- Nobi 是一种轻陪伴和空间观察的温度。
---
## 14. UI 设计原则
当前视觉方向：
- Apple-like
- Mobile Web App first
- 玻璃质感
- 白色 / 淡蓝 / 淡青的清爽背景
- 卡片轻阴影
- 克制动效
- 底部 Tab：Grow / Next / Me
- PC 端以手机设备容器展示
关键交互：
- Grow：卡片磁吸滚动，当前卡片清晰。
- Next：卡片磁吸滚动，长按右拖删除。
- Upload：拍照 / 本地上传 action sheet。
- Result：图片点击放大，改造前后横滑。
- Loading：Nobi 8 Frame + 三点呼吸。
当前需要继续注意：
- 避免按钮和底部导航重叠。
- 避免卡片文字溢出。
- 避免过强模糊导致看不清内容。
- 中文文案需要统一修复编码和最终表达。
---
## 15. Prompt Engineering 工作方式
如果要做 Prompt Engineering，应该按下面的方式改：
1. 确认要改的是哪一步：
   - 图片理解 / 问卷：P001
   - 方案生成：P002
   - 效果图 prompt：P004
   - Letter：P003
2. 修改 `prompts/` 下对应 Markdown。
3. 确认该 Prompt 的输入字段：
   - P001：图片 + long_term_context
   - P002：space_summary + questionnaire + constraints + long_term_context
   - P004：before image + selected intervention action text + memory
   - P003：feedback + selected plan + long_term_context
4. 确认输出 Schema 没有破坏前端：
   - P001 必须能解析出 3 个问题。
   - P002 必须返回 `low_budget / standard_budget / sufficient_budget`。
   - P004 必须返回 `render1 / axonometric / render2 / negative`。
   - P003 返回自然语言信，不是 JSON。
5. 至少运行：
```bash
pnpm build
```
---
## 16. 当前已完成的关键能力
当前 v1.0 已经具备：
- 项目结构整理为 `frontend/` 和 `backend/`
- 一键启动 `pnpm dev`
- 前端 React/Vite 移动 Web App
- 轻登录与用户归属
- 图片上传
- 拍照 / 本地上传入口
- P001 图片理解与动态问卷
- P001 拒答重试 Prompt
- Chat 问卷收集
- P002 三档干预方案
- Result 方案展示
- P004 行动文本转图生图 Prompt
- OpenAI 图生图调用
- 生成图按原图比例处理
- Next 收藏与删除
- Share Changes 反馈输入
- P003 Letter 生成
- Letter 保存到 Me
- Letter 分享到 Grow Feed
- 长期记忆 Markdown
- LangGraph 阶段图
- Local / Supabase Storage 抽象
- Grow / Next Apple-like 磁吸动效
- Nobi 基础形象与帧动画路径
---
## 17. 当前仍需加强的部分
### 17.1 Memory Curator
当前长期记忆更新偏简单，下一步要做真正的 Memory Curator：
- 从每次 session 中提炼稳定偏好。
- 去掉重复和一次性情绪。
- 形成更清晰的用户画像。
- 支持用户在 Me 页面查看、编辑、清空。
### 17.2 Feed 的用户系统
当前 Feed 已有真实存储，但仍然是轻量公共 Feed。
后续要补：
- 用户公开授权。
- 只发布用户允许发布的内容。
- Feed 根据相似空间 / 相似目标推荐。
- 收藏他人 Next 后，为当前用户重写方案。
### 17.3 图生图质量
当前图生图已经接入，但质量还取决于：
- 原图质量
- P004 prompt
- 风格锚点是否明确
- 模型稳定性
后续方向：
- 加强 P004 的 style anchor。
- 让用户可选择风格方向。
- 支持失败重试。
- 显示生成状态和错误解释。
### 17.4 异步任务
当前生成图和 LLM 调用仍然偏同步。
后续可以引入：
- 后台任务队列
- 生成中状态轮询
- workflow run resume
- 失败重试
但 MVP 阶段不急着加复杂基础设施。
### 17.5 文案与编码
当前部分源码中文在终端里出现乱码显示风险。最终产品需要统一：
- 中文 UI 文案
- Prompt 中文
- README / docs 编码
- 前端显示文案
---
## 18. v1.0 当前最终表达
> **NestAI 是一个空间生活方式 Agent。用户上传自己的真实空间后，Nobi 会先观察空间，再用动态问卷确认用户想靠近的生活状态。系统根据图片、问卷和长期记忆生成三档可执行空间干预方案，并把所选行动翻译成可信的图生图效果预览。用户把一个方案收入 Next，回到真实空间里尝试；完成后上传变化和感受，NestAI 写下一封信，并把这次行动沉淀进长期记忆。下一次，它会更懂这个用户的空间、偏好和生活节奏。**
一句更短的版本：
> **NestAI 让你的生活方式，从你的真实空间里长出下一个 Next。**
