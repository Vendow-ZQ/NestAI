import { useMemo } from 'react'
import { useLanguageStore, type AppLanguage } from '@/stores/language-store'

const localizedErrorMessages = {
  zh: {
    analyzeFailed: 'AI 正在仔细看你的空间，但好像走神了。再试一次？',
    networkFailed: '信号好像不太好，请检查一下网络再试一次。',
    uploadFailed: '图片上传时出了点小状况，再试一次？',
    sessionFailed: '正在读取你的空间记忆，但好像卡了一下。刷新试试？',
    interventionFailed: '方案生成时卡了一下。我们回到对话，再试一次？',
    letterFailed: '这封信还没写好。先回到反馈页，再试一次？',
  },
  en: {
    analyzeFailed: 'AI was looking closely at your space, but got interrupted. Try again?',
    networkFailed: 'The connection seems unstable. Please check the network and try again.',
    uploadFailed: 'Something went wrong while uploading the image. Try again?',
    sessionFailed: 'Your space memory took too long to load. Refresh and try again?',
    interventionFailed: 'The plan generation paused unexpectedly. Let’s go back to chat and try again.',
    letterFailed: 'This letter is not ready yet. Go back to feedback and try once more?',
  },
} as const

export type ErrorMessageKey = keyof typeof localizedErrorMessages.zh

export const errorMessages = localizedErrorMessages.zh

export function getErrorMessage(key: ErrorMessageKey, language: AppLanguage) {
  return localizedErrorMessages[language][key]
}

export function useErrorMessages() {
  const language = useLanguageStore((s) => s.language)
  return useMemo(() => localizedErrorMessages[language], [language])
}
