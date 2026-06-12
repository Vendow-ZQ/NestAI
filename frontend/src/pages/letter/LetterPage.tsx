import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { BilingualTitle } from '@/components/BilingualTitle'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { api, getPlanItem, normalizeLevel, type SessionData } from '@/lib/api'
import { useI18n } from '@/lib/i18n'
import { useMemoryStore } from '@/stores/memory-store'

function splitLetter(content?: string | null) {
  return (content || '')
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
}

export default function LetterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t } = useI18n()
  const sessionId = searchParams.get('sessionId')
  const addLetter = useMemoryStore((s) => s.addLetter)
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(Boolean(sessionId))
  const [error, setError] = useState('')
  const [sharing, setSharing] = useState(false)
  const [shared, setShared] = useState(false)

  useEffect(() => {
    if (!sessionId) {
      setLoading(false)
      return
    }

    api
      .getSession(sessionId)
      .then((data) => {
        setSession(data)
        if (data.letter) {
          addLetter({
            id: `letter-${sessionId}`,
            sessionId,
            title: '这次空间变化',
            content: splitLetter(data.letter),
            date: data.updatedAt.slice(0, 10),
            lifestyleDirection: '空间行动',
            beforeImage: data.spaceAnalysis?.images?.[0] || '',
            afterImage: data.feedback?.after_images?.[0] || '',
            nextStep: getPlanItem(data.interventionPlan)?.firstSteps?.[0],
          })
        }
      })
      .catch((err) => {
        console.error('读取 Letter 失败:', err)
        setError(err instanceof Error ? err.message : t('letterReadFailed'))
      })
      .finally(() => setLoading(false))
  }, [addLetter, sessionId, t])

  const paragraphs = useMemo(() => {
    const content = splitLetter(session?.letter)
    return content.length > 0 ? content : [t('letterEmpty')]
  }, [session?.letter, t])

  const selectedLevel = normalizeLevel(session?.feedback?.selected_level)
  const selectedPlan = getPlanItem(session?.interventionPlan, selectedLevel)
  const beforeImage = session?.spaceAnalysis?.images?.[0] || ''
  const generatedImages = selectedPlan?.generatedImages || {}
  const generatedImage = generatedImages.render1 || generatedImages.render2 || generatedImages.axonometric || ''
  const afterImage = session?.feedback?.after_images?.[0] || generatedImage || selectedPlan?.afterImage || ''
  const nextStep = selectedPlan?.firstSteps?.[0]

  const handleShareToGrow = async () => {
    if (!sessionId || sharing || shared) return

    setSharing(true)
    setError('')
    try {
      await api.publishToGrow(sessionId, {
        level: selectedLevel,
        image: afterImage,
      })
      setShared(true)
    } catch (err) {
      console.error('分享到 Grow 失败:', err)
      setError(err instanceof Error ? err.message : t('letterShareFailed'))
    } finally {
      setSharing(false)
    }
  }

  const renderImage = (src: string, label: string) => (
    <div className="nest-glass-card flex-shrink-0 rounded-[22px] overflow-hidden" style={{ width: '85vw', maxWidth: '360px' }}>
      <div className="nest-media-stage" style={{ aspectRatio: '4 / 3' }}>
        {src ? (
          <img src={src} alt={label} className="w-full h-full object-cover" />
        ) : (
          <PlaceholderImage label={label} className="w-full h-full" />
        )}
      </div>
    </div>
  )

  return (
    <div className="nest-page-shell min-h-full overflow-hidden" style={{ maxWidth: '100vw' }}>
      <div className="nest-page-content flex flex-row items-center px-5 pt-12 pb-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer nest-glass-card"
          aria-label="Back"
        >
          <span className="text-ink text-sm">&lt;</span>
        </button>
      </div>

      <div className="nest-page-content px-5 mb-4">
        <BilingualTitle en="A LETTER" zh={t('letterTitle')} size="lg" />
      </div>

      <div className="nest-page-content" style={{ overflowY: 'auto', height: 'calc(var(--app-height) - 160px)' }}>
        <div className="px-5 mb-6">
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div className="flex flex-row gap-3" style={{ paddingRight: '16px' }}>
              {renderImage(afterImage, t('letterAfter'))}
              {renderImage(beforeImage, t('letterBefore'))}
            </div>
          </div>
          <span className="block text-xs text-[#8e8e93] mt-2 text-center">{t('letterSwipeHint')}</span>
        </div>

        <div className="px-5">
          <div className="nest-glass-card rounded-[22px] p-5">
            <span className="block text-base text-ink mb-6 font-semibold">{t('letterGreeting')}</span>

            {loading ? (
              <p className="block text-sm text-[#6e6e73] leading-relaxed mb-3">{t('letterLoading')}</p>
            ) : (
              paragraphs.map((paragraph, i) => (
                <p key={i} className="block text-sm text-[#3a3a3c] leading-relaxed mb-3">
                  {paragraph}
                </p>
              ))
            )}

            <div className="mt-6">
              <span className="block text-sm text-ink">-- Nobi</span>
            </div>
          </div>

          {nextStep && (
            <div className="mt-5">
              <BilingualTitle en="NEXT STEP" zh={t('letterNextStep')} size="sm" align="left" />
              <button
                type="button"
                className="nest-glass-card rounded-[22px] p-4 mt-3 cursor-pointer w-full text-left"
                onClick={() => sessionId && navigate(`/result?sessionId=${sessionId}&level=${selectedLevel}`)}
              >
                <span className="block text-sm text-ink font-semibold">{t('letterContinueSpace')}</span>
                <span className="block text-xs text-[#8e8e93] mt-1">{nextStep}</span>
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-[18px] bg-[#ff3b30]/10 border border-[#ff3b30]/15 px-4 py-3">
              <span className="block text-xs text-[#c02b22] leading-relaxed">{error}</span>
            </div>
          )}

          <div className="my-8 flex flex-col gap-3">
            <button
              type="button"
              className="ios-primary-button rounded-full py-3 flex items-center justify-center cursor-pointer disabled:opacity-60"
              onClick={handleShareToGrow}
              disabled={!sessionId || sharing || shared || !afterImage}
            >
              <span className="text-white text-sm font-semibold">
                {shared ? t('letterShared') : sharing ? t('letterSharing') : t('letterShareGrow')}
              </span>
            </button>
            <button type="button" className="nest-pill-button rounded-full py-3 flex items-center justify-center cursor-pointer">
              <span className="text-sm font-semibold">{t('letterShareFriend')}</span>
            </button>
          </div>
        </div>

        <div className="h-20" />
      </div>
    </div>
  )
}
