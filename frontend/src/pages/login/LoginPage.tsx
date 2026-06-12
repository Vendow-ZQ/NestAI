import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { BilingualTitle } from '@/components/BilingualTitle'
import { NobiWorking } from '@/components/NobiWorking'
import { api } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { useUserStore } from '@/stores/user-store'

export default function LoginPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const setCurrentUser = useUserStore((s) => s.setCurrentUser)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const name = displayName.trim()
    if (!name || submitting) return

    setSubmitting(true)
    setError('')
    try {
      const user = await api.loginUser({
        displayName: name,
        email: email.trim() || undefined,
      })
      setCurrentUser({
        id: user.id,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
      })
      navigate('/grow', { replace: true })
    } catch (err) {
      console.error('Login failed:', err)
      setError(t('loginError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page-shell min-h-full flex flex-col px-5 pt-12 pb-7">
      <div>
        <BilingualTitle en="NestAI" zh="栖巢" size="lg" />
      </div>

      <form className="login-card nest-glass-card mx-auto mt-5 w-full max-w-[370px] rounded-[24px] px-5 py-6" onSubmit={handleSubmit}>
        <div className="flex justify-center mb-3">
          <NobiWorking className="login-nobi" />
        </div>
        <span className="block text-[22px] font-semibold text-ink leading-tight text-center">
          {t('loginTitle')}
        </span>
        <span className="block text-sm text-[#6e6e73] mt-2 leading-relaxed text-center">
          {t('loginSubtitle')}
        </span>

        <label className="block mt-5">
          <span className="nest-section-label">{t('loginName')}</span>
          <input
            className="login-input"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={t('loginNamePlaceholder')}
            autoComplete="name"
          />
        </label>

        <label className="block mt-3">
          <span className="nest-section-label">{t('loginEmail')}</span>
          <input
            className="login-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t('loginEmailPlaceholder')}
            autoComplete="email"
            inputMode="email"
          />
        </label>

        {error && <span className="block text-xs text-[#ff3b30] mt-3">{error}</span>}

        <button
          type="submit"
          className="ios-primary-button w-full rounded-full py-3.5 mt-5 disabled:opacity-40 disabled:cursor-not-allowed"
          disabled={!displayName.trim() || submitting}
        >
          <span className="text-white text-[16px] font-semibold">
            {submitting ? t('loginSubmitting') : t('loginSubmit')}
          </span>
        </button>
      </form>

    </div>
  )
}
