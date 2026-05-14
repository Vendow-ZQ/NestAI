/**
 * NestAI 温柔错误文案表
 * 所有 LLM / API 调用失败的提示都走这里，保持产品调性一致
 */

export const errorMessages = {
  /** LLM analyze 调用超时或失败 */
  analyzeFailed: 'AI 正在仔细看你的空间，但好像走神了。再试一次？',

  /** 网络请求通用失败 */
  networkFailed: '信号好像不太好，请检查一下网络再试一次',

  /** 上传失败 */
  uploadFailed: '图片上传时出了点小状况，再试一次？',

  /** 获取 session 信息失败 */
  sessionFailed: '正在读取你的空间记忆，但好像卡了一下。刷新试试？',
} as const

export type ErrorMessageKey = keyof typeof errorMessages
