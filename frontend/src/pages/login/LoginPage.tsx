import { FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { BilingualTitle } from '@/components/BilingualTitle'
import { NobiWorking } from '@/components/NobiWorking'
import { api } from '@/lib/api'
import { useUserStore } from '@/stores/user-store'

export default function LoginPage() {
  const navigate = useNavigate()
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
      setError('没有连上你的 Nest 档案，确认后端启动后再试一次。')
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
          先认识你一下
        </span>
        <span className="block text-sm text-[#6e6e73] mt-2 leading-relaxed text-center">
          每一次看见空间，都会写进独属于你的记忆。
        </span>

        <label className="block mt-5">
          <span className="nest-section-label">昵称</span>
          <input
            className="login-input"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="比如 Nobi 的朋友"
            autoComplete="name"
          />
        </label>

        <label className="block mt-3">
          <span className="nest-section-label">邮箱（可选）</span>
          <input
            className="login-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="用于在本机复用同一个档案"
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
            {submitting ? '正在建立档案...' : '进入栖巢'}
          </span>
        </button>
      </form>

    </div>
  )
}
