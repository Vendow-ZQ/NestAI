# NestAI Design Guidelines

## 品牌定位

- **应用定位**: 空间生活方式转译器 — 看见你的 Nest，理解你的 lifestyle，给出你的 Next
- **设计风格**: Refined Minimalism + Paper Warmth + Hand-Crafted Detail
- **参考气质**: Notion 的克制 + Day One 的温度 + Are.na 的留白 + 老笔记本的纸质感
- **目标用户**: 泛年轻租住人群与宿舍人群

## 配色方案

### 主色板（Tailwind 映射）

| 语义 | CSS 变量 | 色值 | Tailwind 类名 |
|------|----------|------|---------------|
| 主背景(米白纸色) | --paper / --background | #f7f3ea | bg-background |
| 深层背景(卡片) | --paper-deep / --card | #ede6d4 | bg-card |
| 主文字(墨黑) | --ink / --foreground | #1a1814 | text-foreground |
| 次文字 | --ink-soft / --secondary-foreground | #3a3530 | text-secondary-foreground |
| 弱化文字 | --ink-mute / --muted-foreground | #7a736a | text-muted-foreground |
| 分隔线/placeholder | --ink-faint / --border | #b5ad9f | border-border |
| 主品牌色(豆黄) | --bean / --primary | #d9a823 | bg-primary, text-primary |
| 浅豆黄(高亮背景) | --bean-soft / --accent | #f0d77a | bg-accent |
| 成功反馈 | --success | #6b8e4e | 自定义 |

**严禁使用**: 紫蓝渐变、纯白(#FFF)、纯黑(#000)、霓虹色、SaaS 蓝

## 字体规范

- **手写感标题/品牌名**: Caveat, cursive → 用于大标题、Agent 对话、品牌名
- **抒情/信件正文**: Crimson Pro, Georgia, serif → 斜体表达情感
- **界面元素(按钮/表单/Tab)**: Inter Tight, sans-serif → UI 交互元素
- **中文**: Noto Serif SC, serif → 中文内容，字号比英文小

## 间距系统

| 变量 | 值 | 用途 |
|------|-----|------|
| --space-1 | 4px | 微间距 |
| --space-2 | 8px | 小间距 |
| --space-3 | 12px | 紧凑间距 |
| --space-4 | 16px | 卡片之间 |
| --space-5 | 24px | 卡片内边距 |
| --space-6 | 32px | 大间距 |
| --space-7 | 48px | 章节之间 |
| --space-8 | 64px | 最大间距 |

页面边距: 20px

## 组件使用原则

- 按钮、输入框、弹窗、Tabs、Toast、Card 等通用组件**优先使用** `@/components/ui/*`
- Agent 对话气泡、Nobi 角色、手绘装饰等**业务专属组件**放 `@/components/nobi`、`@/components/agent`、`@/components/hand-drawn`
- 禁止用 View/Text 手搓按钮/输入框/弹窗等通用 UI

## 容器样式

- 卡片圆角: 4px（克制，不用大圆角）
- 按钮圆角: 小按钮 4px，主按钮 pill 形(100px)
- 边框: 1.5px solid var(--ink)，不用细于 1px 的边框
- 阴影: 仅主行动按钮使用 box-shadow: 4px 4px 0 var(--ink)（手绘风偏移阴影）
- 严禁: 模糊大阴影(blur)、内阴影、新拟态

## 导航结构

底部 3 Tab:
- **Grow(生长)**: 默认 Tab，产品主入口 — pages/index/index
- **Next(下一步)**: 用户收藏的动作集合 — pages/next/index
- **Me(我的)**: 我的空间、信件、历史干预 — pages/me/index

Tab 图标: 手绘风格，未选中 #7a736a，选中 #d9a823

## 状态展示

- 空状态: Nobi 插画 + 温柔提示文案（"还没开始呢，上传你的空间看看？"）
- 加载态: Skeleton 骨架屏优先
- 生成中: 进度条 + Nobi 嗅探动画 + 文字步骤逐项亮起

## 设计禁忌

- 严禁审美权威语(高级感、ins风)、焦虑营销语、导购语、测评机构语、任务管理语
- 严禁模糊大阴影、大圆角、渐变背景
- 严禁纯白纯黑、霓虹色
- 动效严禁旋转、弹性回弹、视差
