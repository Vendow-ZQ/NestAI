# NestAI Design Guidelines

## 品牌定位

- **应用定位**: 空间生活方式转译器 — 看见你的 Nest，理解你的 lifestyle，给出你的 Next
- **设计风格**: Refined Minimalism + Clean White + Warm Accent
- **目标用户**: 泛年轻租住人群与宿舍人群

## 配色方案

### 主色板

| 语义 | CSS 变量 | 色值 | 用途 |
|------|----------|------|------|
| 主背景 | --background | #ffffff | 页面背景 |
| 卡片背景 | --card | #f5f5f5 | 卡片、区块背景 |
| 主文字 | --ink / --foreground | #1a1814 | 标题、正文 |
| 次文字 | #3a3530 | #3a3530 | 辅助文字 |
| 弱化文字 | #999 | #999999 | 注释、placeholder |
| 分隔线 | #e5e5e5 | #e5e5e5 | 分隔线、边框 |
| 最弱色 | #b5ad9f | #b5ad9f | 虚线边框 |
| 主品牌色(豆黄) | --bean | #d9a823 | 强调、选中态 |
| 浅豆黄(高亮) | #f0d77a | #f0d77a | 高亮背景 |
| 成功反馈 | --success | #6b8e4e | 成功状态 |

## 字体规范

- **全局字体**: Noto Sans SC, sans-serif — 统一使用思源黑体
- 中文和英文均使用 Noto Sans SC
- 标题: font-semibold / font-bold
- 正文: font-normal
- 辅助文字: font-normal + text-[#999]

## 间距系统

| 变量 | 值 | 用途 |
|------|-----|------|
| --space-1 | 4px | 微间距 |
| --space-2 | 8px | 小间距 |
| --space-3 | 12px | 紧凑间距 |
| --space-4 | 16px | 卡片之间 |
| --space-5 | 24px | 卡片内边距 |
| --space-6 | 32px | 大间距 |

页面边距: 20px

## 组件使用原则

- 按钮、输入框、弹窗、Tabs、Toast、Card 等通用组件**优先使用** `@/components/ui/*`
- 图片占位使用 `@/components/placeholder-image`
- 禁止用 View/Text 手搓按钮/输入框/弹窗等通用 UI

## 容器样式

- 卡片圆角: rounded (8px)
- 按钮圆角: 主按钮 rounded-full (pill 形)
- 边框: 1.5px solid, 颜色 #b5ad9f / #e5e5e5
- 主行动按钮阴影: box-shadow: 4px 4px 0 #d9a823
- 严禁: 模糊大阴影(blur)、内阴影、新拟态

## 导航结构

底部 3 Tab:
- **Grow(生长)**: 默认 Tab，产品主入口 — pages/index/index
- **Next(下一步)**: 用户收藏的动作集合 — pages/next/index
- **Me(我的)**: 我的空间、信件、历史干预 — pages/me/index

Tab 图标: 未选中 #7a736a，选中 #d9a823

## 状态展示

- 空状态: 温柔提示文案
- 加载态: Skeleton 骨架屏优先
- 生成中: 进度条 + 步骤文字逐项亮起
- 图片占位: PlaceholderImage 组件（灰色背景 + 标签文字）

## 设计禁忌

- 严禁审美权威语、焦虑营销语、导购语、测评机构语、任务管理语
- 严禁模糊大阴影、大圆角、渐变背景
- 动效严禁旋转、弹性回弹、视差
- 禁止使用狗狗图片，所有图片位置使用 PlaceholderImage 占位
