import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { BilingualTitle } from '@/components/BilingualTitle'
import { api, getPlanItem, normalizeLevel, type LongTermMemoryData, type SessionData } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { useInterventionStore } from '@/stores/intervention-store'
import { type Letter, useMemoryStore } from '@/stores/memory-store'
import { useUserStore } from '@/stores/user-store'

const SPACE_NAME_KEY = 'nestai.spaceName'

function spaceNameKey(userId = 'dev_user') {
  return `${SPACE_NAME_KEY}.${userId}`
}

function sessionToLetter(session: SessionData): Letter | null {
  if (!session.letter) return null

  const selectedLevel = normalizeLevel(session.feedback?.selected_level)
  const plan = getPlanItem(session.interventionPlan, selectedLevel)
  const generated = plan?.generatedImages || {}

  return {
    id: `letter-${session.sessionId}`,
    sessionId: session.sessionId,
    title: plan?.title || '这次空间变化',
    content: session.letter
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean),
    date: session.updatedAt.slice(0, 10),
    lifestyleDirection: '空间行动',
    beforeImage: session.spaceAnalysis?.images?.[0] || '',
    afterImage: session.feedback?.after_images?.[0] || generated.render1 || generated.render2 || '',
    nextStep: plan?.firstSteps?.[0],
  }
}

export default function MePage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const { language, t } = useI18n()
  const currentUser = useUserStore((s) => s.currentUser)
  const hasUploadedSpace = useUserStore((s) => s.hasUploadedSpace)
  const localLetters = useMemoryStore((s) => s.letters)
  const interventionHistory = useInterventionStore((s) => s.nextList)
  const [dbLetters, setDbLetters] = useState<Letter[]>([])
  const [longTermMemory, setLongTermMemory] = useState<LongTermMemoryData | null>(null)
  const [showMemory, setShowMemory] = useState(false)
  const [spaceName, setSpaceName] = useState(t('meDefaultSpace'))
  const [editingSpaceName, setEditingSpaceName] = useState(false)

  useEffect(() => {
    if (!currentUser) return
    const saved = window.localStorage.getItem(spaceNameKey(currentUser.id))
    if (saved?.trim()) {
      setSpaceName(saved.trim())
    } else {
      setSpaceName(t('meDefaultSpace'))
    }
  }, [currentUser, language, t])

  useEffect(() => {
    if (!currentUser) return

    api
      .listSessions(currentUser.id)
      .then((data) => {
        const persistedLetters = data.sessions
          .map(sessionToLetter)
          .filter((letter): letter is Letter => Boolean(letter))
        setDbLetters(persistedLetters)
      })
      .catch((err) => {
        console.error('读取我的 Letter 失败:', err)
      })

    api
      .getLongTermMemory(currentUser.id)
      .then(setLongTermMemory)
      .catch((err) => {
        console.error('读取长期 Memory 失败:', err)
      })
  }, [currentUser])

  useEffect(() => {
    if (editingSpaceName) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editingSpaceName])

  const displayLetters = useMemo(() => {
    const merged = new Map<string, Letter>()
    for (const letter of localLetters) merged.set(letter.id, letter)
    for (const letter of dbLetters) merged.set(letter.id, letter)
    return Array.from(merged.values()).sort((a, b) => b.date.localeCompare(a.date))
  }, [dbLetters, localLetters])

  const commitSpaceName = () => {
    const next = spaceName.trim() || t('meDefaultSpace')
    setSpaceName(next)
    window.localStorage.setItem(spaceNameKey(currentUser?.id), next)
    setEditingSpaceName(false)
  }

  return (
    <div className="nest-page-shell min-h-full overflow-hidden" style={{ maxWidth: '100vw' }}>
      <div className="nest-page-content px-5 pt-12 pb-4">
        <BilingualTitle en="ME" zh={t('meTitle')} size="lg" />
      </div>

      <div className="nest-page-content" style={{ overflowY: 'auto', height: 'calc(var(--app-height) - 120px)' }}>
        <div className="px-5 mb-4">
          <div className="nest-glass-card nest-page-enter rounded-[22px] p-5 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-white/70 flex items-center justify-center mb-3 border border-white/70">
              <span className="text-2xl text-[#8e8e93]">{t('meTitle')}</span>
            </div>
            <span className="block text-sm text-[#6e6e73]">{t('meProfile')}</span>
          </div>
        </div>

        <div className="px-5 mb-5">
          <div className="nest-glass-card nest-page-enter rounded-[22px] p-4">
            <span className="nest-section-label">{t('meSpaceName')}</span>
            {editingSpaceName ? (
              <input
                ref={inputRef}
                className="w-full bg-transparent text-[17px] text-ink font-semibold outline-none"
                value={spaceName}
                onChange={(event) => setSpaceName(event.target.value)}
                onBlur={commitSpaceName}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') commitSpaceName()
                  if (event.key === 'Escape') setEditingSpaceName(false)
                }}
              />
            ) : (
              <button
                type="button"
                className="block w-full text-left"
                onDoubleClick={() => setEditingSpaceName(true)}
              >
                <span className="block text-[17px] text-ink font-semibold">{spaceName}</span>
                <span className="block text-sm text-[#6e6e73] mt-1">
                  {hasUploadedSpace ? t('meEditHint') : t('meNoSpace')}
                </span>
              </button>
            )}
          </div>
        </div>

        <section className="px-5 mb-5">
          <span className="nest-section-label">{t('meLongMemory')}</span>
          <button
            type="button"
            className="nest-glass-card nest-page-enter rounded-[18px] p-4 w-full text-left"
            onClick={() => setShowMemory((value) => !value)}
          >
            <span className="block text-sm text-ink font-semibold">LongTermMemory.md</span>
            <span className="block text-xs text-[#8e8e93] mt-1">
              {longTermMemory?.compact ? t('meMemoryReady') : t('meMemoryEmpty')}
            </span>
            {showMemory && (
              <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-[14px] bg-white/55 border border-white/60 p-3 text-xs leading-relaxed text-[#3a3a3c]">
                {longTermMemory?.markdown || t('meMemoryLoading')}
              </pre>
            )}
          </button>
        </section>

        <section className="px-5 mb-5">
          <span className="nest-section-label">{t('meLetters')} ({displayLetters.length})</span>
          {displayLetters.length > 0 ? (
            <div className="grid gap-2">
              {displayLetters.slice(0, 5).map((letter, index) => (
                <button
                  key={letter.id}
                  type="button"
                  className="nest-glass-card nest-page-enter rounded-[18px] p-4 w-full text-left"
                  style={{ animationDelay: `${index * 45}ms` }}
                  onClick={() => navigate(letter.sessionId ? `/letter?sessionId=${letter.sessionId}` : `/letter?id=${letter.id}`)}
                >
                  <span className="block text-sm text-ink font-semibold">{letter.title}</span>
                  <span className="block text-xs text-[#8e8e93] mt-1">{letter.date}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="nest-glass-card rounded-[18px] p-4">
              <span className="block text-sm text-[#6e6e73]">{t('meNoLetters')}</span>
            </div>
          )}
        </section>

        <section className="px-5 mb-5">
          <span className="nest-section-label">{t('meHistory')} ({interventionHistory.length})</span>
          {interventionHistory.length > 0 ? (
            <div className="grid gap-2">
              {interventionHistory.slice(0, 5).map((item, index) => (
                <div
                  key={item.id}
                  className="nest-glass-card nest-page-enter rounded-[18px] p-3 flex flex-row items-center"
                  style={{ animationDelay: `${index * 45}ms` }}
                >
                  <div className="w-11 h-11 rounded-[14px] bg-white/70 flex items-center justify-center flex-shrink-0 border border-white/70">
                    <span className="text-xs text-[#8e8e93]">Next</span>
                  </div>
                  <div className="flex-1 ml-3 min-w-0">
                    <span className="block text-sm text-ink font-semibold truncate">{item.title}</span>
                    <span className="block text-xs text-[#8e8e93] mt-0.5">{item.costRange}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="nest-glass-card rounded-[18px] p-4">
              <span className="block text-sm text-[#6e6e73]">{t('meNoHistory')}</span>
            </div>
          )}
        </section>

        <div className="px-5 mb-6">
          <div className="nest-glass-card rounded-[18px] p-4">
            <span className="block text-sm text-ink font-semibold">{t('meSettings')}</span>
            <span className="block text-xs text-[#8e8e93] mt-1">{t('meSettingsBody')}</span>
          </div>
        </div>

        <div className="h-20" />
      </div>
    </div>
  )
}
