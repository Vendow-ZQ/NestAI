import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { BilingualTitle } from '@/components/BilingualTitle'
import { ImageLightbox } from '@/components/ImageLightbox'
import { NobiWorking } from '@/components/NobiWorking'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import {
  DEFAULT_LEVEL,
  LEVEL_OPTIONS,
  api,
  getPlanItem,
  hasAllBudgetLevels,
  normalizeLevel,
  type InterventionItem,
  type Level,
  type SessionData,
} from '@/lib/api'
import { useI18n, type CopyKey } from '@/lib/i18n'
import { useInterventionStore } from '@/stores/intervention-store'

function createEmptyItem(t: (key: CopyKey) => string): InterventionItem {
  return {
  level: DEFAULT_LEVEL,
  title: t('resultFallbackTitle'),
  changes: [t('resultFallbackChange')],
  diagnosis: t('resultFallbackDiagnosis'),
  firstSteps: [t('resultFallbackStep')],
  recommendations: [],
  estimatedTime: '10 min',
  costRange: 'Standard',
  }
}

function ResultImageSlide({
  image,
  onOpen,
}: {
  image: { key: string; src: string; label: string }
  onOpen: () => void
}) {
  const [aspectRatio, setAspectRatio] = useState('4 / 3')

  return (
    <button
      type="button"
      className="result-image-slide nest-media-stage"
      style={{ aspectRatio }}
      onClick={onOpen}
    >
      <img
        src={image.src}
        alt={image.label}
        className="result-image"
        loading="eager"
        decoding="async"
        fetchPriority="high"
        onLoad={(event) => {
          const img = event.currentTarget
          setAspectRatio(img.naturalHeight > img.naturalWidth ? '3 / 4' : '4 / 3')
        }}
      />
      <span className="result-image-badge">{image.label}</span>
    </button>
  )
}

export default function ResultPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { language, t } = useI18n()
  const sessionId = searchParams.get('sessionId')
  const source = searchParams.get('source')
  const feedId = searchParams.get('feedId')
  const initialLevel = normalizeLevel(searchParams.get('level'))

  const [selectedLevel, setSelectedLevel] = useState<Level>(initialLevel)
  const [addedToNext, setAddedToNext] = useState(false)
  const [session, setSession] = useState<SessionData | null>(null)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [disliking, setDisliking] = useState(false)
  const [lightboxImage, setLightboxImage] = useState<{ src: string; alt: string } | null>(null)
  const imageScrollerRef = useRef<HTMLDivElement | null>(null)

  const addToNext = useInterventionStore((s) => s.addToNext)
  const nextList = useInterventionStore((s) => s.nextList)
  const currentPlan = useInterventionStore((s) => s.currentPlan)
  const currentSessionId = useInterventionStore((s) => s.currentSessionId)
  const setCurrentPlan = useInterventionStore((s) => s.setCurrentPlan)

  useEffect(() => {
    setSelectedLevel(initialLevel)
  }, [initialLevel])

  useEffect(() => {
    if (!sessionId) return

    api
      .getSession(sessionId)
      .then((data) => {
        setSession(data)
        const interventionPlan = data.interventionPlan
        if (interventionPlan && hasAllBudgetLevels(interventionPlan)) {
          setCurrentPlan(sessionId, interventionPlan)
        }
      })
      .catch((err) => {
        console.error('读取方案失败:', err)
      })
  }, [sessionId, setCurrentPlan])

  const livePlan = sessionId && currentSessionId === sessionId ? currentPlan : session?.interventionPlan
  const currentData = getPlanItem(livePlan, selectedLevel) ?? createEmptyItem(t)
  const beforeImage = session?.spaceAnalysis?.images?.[0] || ''
  const generatedImage = currentData.generatedImages?.render1 || currentData.afterImage || ''
  const displayImage = generatedImage || beforeImage
  const imageLabel = generatedImage ? t('resultGeneratedImage') : t('resultUploadedImage')
  const imageSlides = generatedImage
    ? [
        { key: 'before', src: beforeImage, label: t('resultImageBefore') },
        { key: 'after', src: generatedImage, label: t('resultImageAfter') },
      ].filter((item) => item.src)
    : beforeImage
      ? [{ key: 'before', src: beforeImage, label: t('resultUploadedImage') }]
      : []

  useEffect(() => {
    const scroller = imageScrollerRef.current
    if (!scroller || !generatedImage) return

    const timer = window.setTimeout(() => {
      scroller.scrollTo({ left: scroller.clientWidth, behavior: 'auto' })
    }, 0)

    return () => window.clearTimeout(timer)
  }, [generatedImage, selectedLevel])

  const currentInterventionId = `${sessionId || 'local'}-${selectedLevel}`
  const isInNext = addedToNext || nextList.some((item) => {
    if (sessionId && item.sessionId === sessionId) return true
    return item.interventionId === currentInterventionId
  })

  const handleAddToNext = () => {
    if (isInNext) return
    addToNext({
      id: `next-${Date.now()}`,
      title: currentData.title,
      spaceName: t('resultFallbackSpaceName'),
      lifestyleGoal: currentData.diagnosis,
      firstStep: currentData.firstSteps[0] || t('resultFallbackFirstStep'),
      estimatedTime: currentData.estimatedTime,
      costRange: currentData.costRange,
      previewImage: displayImage,
      completed: false,
      interventionId: currentInterventionId,
      level: selectedLevel,
      sceneId: session?.spaceId || 'scene-01',
      sessionId: sessionId || undefined,
    })
    setAddedToNext(true)
  }

  const handleShare = () => {
    if (sessionId) {
      navigate(`/share?sessionId=${sessionId}&level=${selectedLevel}`)
    } else {
      navigate('/share')
    }
  }

  const handleGenerateImage = async () => {
    if (!sessionId || generatingImage) return

    setGeneratingImage(true)
    try {
      const result = await api.generateImages(sessionId, selectedLevel, ['render1'])
      if (result.status !== 'generated' || !result.generatedImages?.render1) {
        throw new Error(result.message || 'Image generation returned no image.')
      }

      const sourcePlan = result.interventionPlan || livePlan
      if (sourcePlan) {
        const sourceItem = getPlanItem(sourcePlan, selectedLevel) || currentData
        const patchedPlan = {
          ...sourcePlan,
          [selectedLevel]: {
            ...sourceItem,
            level: selectedLevel,
            generatedImages: {
              ...(sourceItem.generatedImages || {}),
              ...result.generatedImages,
            },
            afterImage: result.generatedImages.render1,
          },
        }
        setCurrentPlan(sessionId, patchedPlan)
        setSession((prev) => (prev ? { ...prev, interventionPlan: patchedPlan } : prev))
      }
    } catch (err) {
      console.error('生成改造图失败:', err)
      alert(err instanceof Error ? err.message : t('resultGenerateImageFailed'))
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleDislikeGrowCard = async () => {
    if (!feedId || disliking) return

    setDisliking(true)
    try {
      await api.deleteGrowPost(feedId)
      navigate('/grow', { replace: true })
    } catch (err) {
      console.error('Delete Grow card failed:', err)
      alert(err instanceof Error ? err.message : t('resultDislikeHint'))
      setDisliking(false)
    }
  }

  return (
    <div className="nest-page-shell min-h-full overflow-hidden" style={{ maxWidth: '100vw' }}>
      <div className="nest-page-content px-5 pt-12 mb-4">
        <BilingualTitle en="INTERVENTION RESULT" zh={t('resultTitle')} size="lg" />
      </div>

      <div className="nest-page-content" style={{ overflowY: 'auto', height: 'calc(var(--app-height) - 160px)' }}>
        <div className="px-5">
          <div className="nest-glass-card nest-page-enter rounded-[22px] overflow-hidden">
            <div className="result-image-area">
              <div ref={imageScrollerRef} className="result-image-strip">
                {imageSlides.length > 0 ? (
                  imageSlides.map((image) => (
                    <ResultImageSlide
                      key={image.key}
                      image={image}
                      onOpen={() => setLightboxImage({ src: image.src, alt: image.label })}
                    />
                  ))
                ) : (
                  <div className="result-image-slide nest-media-stage">
                    <PlaceholderImage label={imageLabel} className="w-full h-full" />
                  </div>
                )}
              </div>

              {generatingImage && (
                <div className="result-generation-overlay" aria-label={t('resultGeneratingImage')}>
                  <NobiWorking className="result-generation-nobi" variant="effect" />
                </div>
              )}
            </div>

            <div className="p-4">
              <span className="block text-[17px] font-semibold text-ink">{currentData.title}</span>
              <span className="block text-sm text-[#6e6e73] mt-1">{imageLabel}</span>

              {!currentData.generatedImages?.render1 && sessionId && (
                <button
                  type="button"
                  className="nest-pill-button w-full py-3 mt-3 flex items-center justify-center cursor-pointer disabled:opacity-60"
                  onClick={handleGenerateImage}
                  disabled={generatingImage}
                >
                  <span className="text-sm font-semibold">{generatingImage ? t('resultGeneratingImage') : t('resultSeeEffect')}</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-row gap-2 mt-4">
            {LEVEL_OPTIONS.map((level) => (
              <button
                key={level.key}
                type="button"
                className={`nest-pill-button flex-1 py-2 flex items-center justify-center cursor-pointer ${
                  selectedLevel === level.key ? 'is-active' : ''
                }`}
                onClick={() => setSelectedLevel(level.key)}
              >
                <span className="text-sm font-semibold">{language === 'en' ? level.en : level.label}</span>
              </button>
            ))}
          </div>

          <section className="mt-5">
            <span className="nest-section-label">{t('resultChanges')}</span>
            <div className="nest-glass-card rounded-[22px] p-4">
              <div className="grid gap-3">
                {currentData.changes.map((change, i) => (
                  <div key={i} className="flex flex-row items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/70 border border-white/70 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-[#007aff] font-semibold">{i + 1}</span>
                    </div>
                    <span className="flex-1 text-sm text-ink leading-relaxed">{change}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-5">
            <BilingualTitle en="WHY" zh={t('resultWhy')} size="sm" align="left" />
            <div className="nest-glass-card rounded-[22px] p-4 mt-2">
              <span className="block text-sm text-[#3a3a3c] leading-relaxed">{currentData.diagnosis}</span>
            </div>
          </section>

          <section className="mt-5">
            <BilingualTitle en="HOW" zh={t('resultHow')} size="sm" align="left" />
            <div className="nest-glass-card rounded-[22px] p-4 mt-2">
              <span className="block text-xs text-[#8e8e93] font-semibold mb-3">{t('resultFirstStep')}</span>
              <div className="grid gap-3">
                {currentData.firstSteps.map((step, i) => (
                  <div key={i} className="flex flex-row items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/70 border border-white/70 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs text-[#8e8e93]">{i + 1}</span>
                    </div>
                    <span className="flex-1 text-sm text-ink leading-relaxed">{step}</span>
                  </div>
                ))}
              </div>

              {currentData.recommendations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/70">
                  <span className="block text-xs text-[#8e8e93] font-semibold mb-2">{t('resultRecommendations')}</span>
                  <div className="grid gap-2">
                    {currentData.recommendations.map((rec, i) => {
                      const name = typeof rec === 'string' ? rec : rec.name
                      const price = typeof rec === 'string' ? '' : rec.price
                      return (
                        <span key={i} className="block text-sm text-[#3a3a3c] leading-relaxed">
                          {name}{price ? <span className="text-[#8e8e93]"> {price}</span> : ''}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>

          <div className="mt-6">
            {source === 'grow' && feedId ? (
              <button
                type="button"
                className="w-full rounded-full py-4 flex items-center justify-center cursor-pointer disabled:opacity-60"
                style={{ backgroundColor: '#ff3b30', boxShadow: '0 12px 28px rgba(255, 59, 48, 0.18)' }}
                onClick={handleDislikeGrowCard}
                disabled={disliking}
              >
                <span className="text-white text-lg font-semibold">{disliking ? t('resultDisliking') : t('resultDislike')}</span>
              </button>
            ) : !isInNext ? (
              <button
                type="button"
                className="ios-primary-button w-full rounded-full py-4 flex items-center justify-center cursor-pointer"
                onClick={handleAddToNext}
              >
                <span className="text-white text-lg font-semibold">Let&apos;s do it!</span>
              </button>
            ) : (
              <button
                type="button"
                className="w-full rounded-full py-4 flex items-center justify-center cursor-pointer"
                style={{ backgroundColor: '#34c759', boxShadow: '0 12px 28px rgba(52, 199, 89, 0.2)' }}
                onClick={handleShare}
              >
                <span className="text-white text-lg font-semibold">Done</span>
              </button>
            )}
            <span className="block text-center text-xs text-[#8e8e93] mt-2">
              {source === 'grow' && feedId ? t('resultDislikeHint') : 'Tonight, try.'}
            </span>
          </div>
        </div>

        <div className="h-20" />
      </div>

      {lightboxImage && (
        <ImageLightbox src={lightboxImage.src} alt={lightboxImage.alt} onClose={() => setLightboxImage(null)} />
      )}
    </div>
  )
}
