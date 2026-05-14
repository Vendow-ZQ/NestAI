# NestAI · 栖巢

> **看见你的 Nest，理解你的 lifestyle，然后给出你的 Next。**

NestAI 是一个帮助泛年轻租住人群与宿舍人群生长出自己生活方式的空间 Agent。它通过理解用户的真实空间、当前与向往的 lifestyle、外部灵感与个人约束，生成可视化、可执行、可反馈的空间干预方案，推动用户把想过的生活一步步外化到真实物理世界中。

---

## 产品定位

NestAI 不是帮你装修空间，而是帮你把想过的生活，转译成下一步可执行的空间改变。

NestAI 不生成"一张漂亮图"就结束，而是：

1. 看见用户真实拥有的空间
2. 理解用户现在的生活方式和向往的生活方式
3. 判断当前空间与用户想过的生活之间哪里不匹配
4. 生成可视化、可执行、由轻到重的空间干预方案
5. 让用户从一个很小的动作开始，在真实物理空间中改变一点点
6. 通过拍照与感受反馈，记录这次变化
7. 把变化沉淀为 Memory，并生成下一步 Next
8. 让用户看到相似的人如何生长，从而获得新的灵感

---

## 核心架构

### 三 Tab 设计

| Tab | 定位 |
| --- | --- |
| **Grow** | 开屏默认页，主功能入口。用户上传空间、启动分析、进入 Lifestyle Chat、查看 Feed |
| **Next** | 行动收藏夹。用户"今晚试试看"的干预动作集合 |
| **Me** | 用户自己的内容：我的空间、我的信件、我的 Living Memory、历史干预、设置 |

### 用户主链路

```text
Grow 上传空间 → Lifestyle Chat → Intervention Result → 今晚试试看 → Next → 新变化分享 → 一封信 → 回到 Grow Feed
```

### P3 方案页：三档方案

| 档位 | 说明 |
| --- | --- |
| **0 元调整** | 不需要购买，强调移动、清理、收纳、重新摆放、改变使用规则 |
| **低成本软装** | 通过灯、布、收纳、植物、海报、小家具、床品等低成本物件改善空间 |
| **进阶改造** | 更完整的局部布置方案，可能包含效果图、购物清单、组合物件和更强的风格表达 |

### 品牌小形象：Nobi / 豆鼻

大鼻子狗是 NestAI 的空间嗅探员。它"闻得到空间里的生活痕迹"，陪伴用户完成空间干预闭环。

---

## 技术栈

### 前端（移动端优先）

- **框架**: [Taro 4](https://docs.taro.zone/docs/) + React 18
- **语言**: TypeScript 5.4.5
- **样式**: TailwindCSS 4 + weapp-tailwindcss
- **状态管理**: Zustand 5
- **图标**: lucide-react-taro
- **工程化**: Vite 4
- **包管理**: pnpm
- **运行时**: Node.js >= 18

### 后端

- **框架**: [NestJS 10](https://nestjs.com/)
- **数据库 ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **类型校验**: [Zod](https://zod.dev/)
- **LLM**: 支持 Anthropic / OpenAI 等多模型接入

---

## 项目结构

```text
├── .cozeproj/           # Coze 平台配置
├── config/              # Taro 构建配置
├── src/                  # 前端源码
│   ├── pages/            # 页面组件
│   │   ├── index/        # Grow 首页
│   │   ├── next/         # Next 收藏夹
│   │   ├── me/           # Me 个人中心
│   │   ├── upload/       # 上传空间
│   │   ├── chat/         # Lifestyle Chat
│   │   ├── result/       # P3 方案页
│   │   ├── generating/   # 生成中状态页
│   │   ├── letter/       # P6 一封信
│   │   └── share/        # 分享页
│   ├── components/       # UI 组件
│   ├── stores/           # Zustand 状态管理
│   ├── lib/              # 工具函数
│   ├── app.config.ts     # 应用配置
│   └── app.css           # 全局样式
├── server/               # NestJS 后端
│   └── src/
│       ├── main.ts      # 服务入口
│       ├── app.module.ts # 根模块
│       ├── modules/      # 业务模块
│       │   ├── upload/   # 文件上传
│       │   ├── spaces/   # 空间管理
│       │   └── sessions/ # 会话管理
│       ├── lib/          # 工具库 (LLM 调用、Prompt 加载)
│       ├── db/           # 数据库 (Drizzle ORM)
│       │   ├── schema.ts # 数据模型
│       │   └── migrations/ # 数据库迁移
│       └── prompts/      # AI Prompt 配置
│           ├── p001_space_reader/         # P1 空间读取
│           ├── p002_intervention_generator/ # P2 干预方案生成
│           └── p003_letter_writer/         # P3 写信模块
├── docs/                 # 文档
├── test/                 # 测试素材
├── NestAI_Product_Definition_v0.5.md # 产品定义文档
├── SOP.md               # 标准操作流程
└── TECH_STACK.md         # 技术栈详解
```

---

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 本地开发

同时启动 H5 前端和 NestJS 后端：

```bash
pnpm dev
```

- 前端地址：<http://localhost:5000>
- 后端地址：<http://localhost:3000>

单独启动：

```bash
pnpm dev:web      # 仅 H5 前端
pnpm dev:weapp    # 仅微信小程序
pnpm dev:server   # 仅后端服务
```

### 构建

```bash
pnpm build        # 构建所有（H5 + 小程序 + 后端）
pnpm build:web    # 仅构建 H5，输出到 dist-web
pnpm build:weapp  # 仅构建微信小程序，输出到 dist
pnpm build:server # 仅构建后端
```

### 预览小程序

```bash
pnpm preview:weapp # 构建并生成预览小程序二维码
```

---

## 后端模块说明

### AI Prompt 工作流

后端实现了基于 LLM 的空间干预生成流程：

```text
用户上传空间图片 → P001 空间读取 → 空间诊断
                               ↓
                         Lifestyle Chat ← 用户偏好输入
                               ↓
                         P002 干预方案生成 → 三档方案
                               ↓
                         用户点击"今晚试试看"
                               ↓
                         用户反馈 → P003 写信 → Memory 更新
```

### 数据库模型

| 表 | 说明 |
| --- | --- |
| `spaces` | 空间记录，存储空间类型、物件、约束条件 |
| `sessions` | 会话记录，关联用户与空间的分析会话 |
| `interventions` | 干预方案记录，包含三档方案详情 |
| `feedbacks` | 用户反馈，记录拍照、文字感受与执行情况 |

---

## 前端页面说明

| 页面 | 路由 | 说明 |
| --- | --- |
| Grow 首页 | `/pages/index` | 上传入口 + Feed |
| 上传空间 | `/pages/upload` | 拍照/上传空间图片 |
| Lifestyle Chat | `/pages/chat` | 问答式了解用户 lifestyle |
| 生成中 | `/pages/generating` | 进度展示（空间识别→方案生成→写信） |
| 方案页 | `/pages/result` | P3 三档方案展示 |
| Next 收藏夹 | `/pages/next` | 待执行的干预动作 |
| 一封信 | `/pages/letter` | P6 温柔总结信 |
| 分享页 | `/pages/share` | 改造前后对比分享 |
| Me | `/pages/me` | 个人中心与历史记录 |

---

## AI 硬约束

效果图必须锚定用户原始空间环境：

- ❌ 不改变墙面颜色
- ❌ 不改变地板材质
- ❌ 不改变窗户位置
- ❌ 不改变光线方向
- ❌ 不改变整体空间尺度
- ❌ 禁止理想化打光和脱离原环境的氛围渲染
- ✅ 只呈现干预动作：新增物件、调整摆放、局部优化

目的：避免数字预览和真实执行之间产生过大落差。

---

## Memory 系统

NestAI 通过 Memory 持续记住用户的生活方式生长轨迹：

| 文件 | 记录内容 |
| --- | --- |
| `USER_LIFESTYLE.md` | 当前 habit / interest / aspiration / 审美偏好 |
| `SPACE_PROFILE.md` | 空间类型 / 物理对象 / 光照 / 收纳 / 动线 |
| `INTERVENTION_HISTORY.md` | 干预时间 / 类型 / 执行反馈 |
| `CONSTRAINTS.md` | 逐步显影的空间 / 经济 / 身体限制 |
| `LIVING_MEMORY.md` | 用户如何通过空间行动逐渐改变生活 |

Memory 驱动个性化推荐，让用户"完成一次闭环后，看到和自己相似的人如何生长"。

---

## 团队与协作

- **产品定义**: 扣子编程 Coze CLI (Design Studio Ⅱ 2026 Spring)
- **协作者**: Vendow × 文欢 × ChatGPT
- **第一版切口**: 清华大学深圳国际研究生院二期宿舍 · 研究生居住场景

---

## License

MIT