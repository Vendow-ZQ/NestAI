import { useLanguageStore, type AppLanguage } from '@/stores/language-store'

const options: { value: AppLanguage; label: string }[] = [
  { value: 'zh', label: 'ZH' },
  { value: 'en', label: 'EN' },
]

export function LanguageToggle() {
  const language = useLanguageStore((s) => s.language)
  const setLanguage = useLanguageStore((s) => s.setLanguage)

  return (
    <div className="language-toggle" role="group" aria-label="Language">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`language-toggle-button ${language === option.value ? 'is-active' : ''}`}
          onClick={() => setLanguage(option.value)}
          aria-pressed={language === option.value}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
