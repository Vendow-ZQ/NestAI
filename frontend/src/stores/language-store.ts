import { create } from 'zustand'

export type AppLanguage = 'zh' | 'en'

interface LanguageState {
  language: AppLanguage
  setLanguage: (language: AppLanguage) => void
  toggleLanguage: () => void
}

const LANGUAGE_KEY = 'nestai.language'

function readStoredLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'zh'
  return window.localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'zh'
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: readStoredLanguage(),
  setLanguage: (language) => {
    window.localStorage.setItem(LANGUAGE_KEY, language)
    set({ language })
  },
  toggleLanguage: () => {
    const next = get().language === 'zh' ? 'en' : 'zh'
    window.localStorage.setItem(LANGUAGE_KEY, next)
    set({ language: next })
  },
}))
