/**
 * NestAI 温柔错误文案表
 */

export const errorMessages = {
  analyzeFailed: 'AI 正在仔细看你的空间，但好像走神了。再试一次？',
  networkFailed: '信号好像不太好，请检查一下网络再试一次',
  uploadFailed: '图片上传时出了点小状况，再试一次？',
  sessionFailed: '正在读取你的空间记忆，但好像卡了一下。刷新试试？',
  interventionFailed: '方案生成时卡了一下。我们回到对话，再试一次？',
  letterFailed: '这封信还没写好。先回到反馈页，再试一次？',
} as const

export type ErrorMessageKey = keyof typeof errorMessages
