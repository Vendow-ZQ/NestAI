import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { BilingualTitle } from '@/components/BilingualTitle'
import { ImageLightbox } from '@/components/ImageLightbox'
import { NobiWorking } from '@/components/NobiWorking'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { api, type InterventionItem, type Level, type SessionData } from '@/lib/api'
import { useInterventionStore } from '@/stores/intervention-store'

const LEVELS: { key: Level; label: string; en: string }[] = [
  { key: 'free', label: '0 元', en: 'FREE' },
  { key: 'low', label: '低成本', en: 'LOW COST' },
  { key: 'advanced', label: '进阶', en: 'ADVANCED' },
]

const EMPTY_ITEM: InterventionItem = {
  level: 'low',
  title: '空间干预方案',
  changes: ['先完成一次空间分析，Nobi 会在这里生成真实方案。'],
  diagnosis: '这里还没有生成方案。请从上传空间开始，让图片和问卷一起进入分析流程。',
  firstSteps: ['上传空间图片'],
  recommendations: [],
  estimatedTime: '约 10 分钟',
  costRange: '0 元',
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
  const sessionId = searchParams.get('sessionId')
  const levelParam = searchParams.get('level') as Level | null
  const initialLevel = levelParam && ['free', 'low', 'advanced'].includes(levelParam) ? levelParam : 'low'

  const [selectedLevel, setSelectedLevel] = useState<Level>(initialLevel)
  const [addedToNext, setAddedToNext] = useState(false)
  const [session, setSession] = useState<SessionData | null>(null)
  const [generatingImage, setGeneratingImage] = useState(false)
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
        if (data.interventionPlan?.free && data.interventionPlan.low && data.interventionPlan.advanced) {
          setCurrentPlan(sessionId, data.interventionPlan)
        }
      })
      .catch((err) => {
        console.error('读取方案失败:', err)
      })
  }, [sessionId, setCurrentPlan])

  const livePlan = sessionId && currentSessionId === sessionId ? currentPlan : session?.interventionPlan
  const currentData = livePlan?.[selectedLevel] ?? EMPTY_ITEM
  const beforeImage = session?.spaceAnalysis?.images?.[0] || ''
  const generatedImage = currentData.generatedImages?.render1 || currentData.afterImage || ''
  const displayImage = generatedImage || beforeImage
  const imageLabel = generatedImage ? '改造后效果图' : '上传空间图'
  const imageSlides = generatedImage
    ? [
        { key: 'before', src: beforeImage, label: '改造前' },
        { key: 'after', src: generatedImage, label: '改造后' },
      ].filter((item) => item.src)
    : beforeImage
      ? [{ key: 'before', src: beforeImage, label: '上传空间图' }]
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
      spaceName: '我的空间',
      lifestyleGoal: currentData.diagnosis,
      firstStep: currentData.firstSteps[0] || '选择一个最小动作开始',
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
        const patchedPlan = {
          ...sourcePlan,
          [selectedLevel]: {
            ...sourcePlan[selectedLevel],
            generatedImages: {
              ...(sourcePlan[selectedLevel]?.generatedImages || {}),
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
      alert(err instanceof Error ? err.message : '生成改造图失败')
    } finally {
      setGeneratingImage(false)
    }
  }

  return (
    <div className="nest-page-shell min-h-full overflow-hidden" style={{ maxWidth: '100vw' }}>
      <div className="nest-page-content px-5 pt-12 mb-4">
        <BilingualTitle en="INTERVENTION RESULT" zh="空间干预方案" size="lg" />
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
                <div className="result-generation-overlay" aria-label="正在生成效果图">
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
                  <span className="text-sm font-semibold">{generatingImage ? '正在生成效果...' : '看看效果'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-row gap-2 mt-4">
            {LEVELS.map((level) => (
              <button
                key={level.key}
                type="button"
                className={`nest-pill-button flex-1 py-2 flex items-center justify-center cursor-pointer ${
                  selectedLevel === level.key ? 'is-active' : ''
                }`}
                onClick={() => setSelectedLevel(level.key)}
              >
                <span className="text-sm font-semibold">{level.label}</span>
              </button>
            ))}
          </div>

          <section className="mt-5">
            <span className="nest-section-label">会发生什么变化</span>
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
            <BilingualTitle en="WHY" zh="为什么这样改" size="sm" align="left" />
            <div className="nest-glass-card rounded-[22px] p-4 mt-2">
              <span className="block text-sm text-[#3a3a3c] leading-relaxed">{currentData.diagnosis}</span>
            </div>
          </section>

          <section className="mt-5">
            <BilingualTitle en="HOW" zh="怎么做" size="sm" align="left" />
            <div className="nest-glass-card rounded-[22px] p-4 mt-2">
              <span className="block text-xs text-[#8e8e93] font-semibold mb-3">最轻第一步</span>
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
                  <span className="block text-xs text-[#8e8e93] font-semibold mb-2">推荐方向</span>
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
            {!isInNext ? (
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
            <span className="block text-center text-xs text-[#8e8e93] mt-2">Tonight, try.</span>
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
