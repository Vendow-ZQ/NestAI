import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { BilingualTitle } from '@/components/BilingualTitle'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { Badge } from '@/components/ui/badge'
import { api, type FeedItemData } from '@/lib/api'

export default function GrowPage() {
  const navigate = useNavigate()
  const [feed, setFeed] = useState<FeedItemData[]>([])
  const [loading, setLoading] = useState(true)
  const [showTopButton, setShowTopButton] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([])
  const frameRef = useRef<number | null>(null)
  const snapTimerRef = useRef<number | null>(null)
  const isSnappingRef = useRef(false)

  useEffect(() => {
    api
      .listSessions()
      .then((data) => setFeed(data.feed))
      .catch((err) => {
        console.error('读取 Grow 数据失败:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  const updateFeedFocus = useCallback(() => {
    const viewport = scrollRef.current
    if (!viewport) return

    const viewportRect = viewport.getBoundingClientRect()
    const focusCenter = viewportRect.top + viewportRect.height * 0.48
    const focusRange = Math.max(220, viewportRect.height * 0.42)

    cardRefs.current.forEach((card) => {
      if (!card) return

      if (card.dataset.feedRole === 'upload') {
        card.style.setProperty('--feed-focus', '1')
        card.style.setProperty('--feed-card-blur', '0px')
        card.style.setProperty('--feed-image-blur', '0px')
        card.style.setProperty('--feed-card-alpha', '1')
        card.style.setProperty('--feed-card-scale', '1')
        card.style.setProperty('--feed-card-y', '0px')
        card.style.setProperty('--feed-card-saturation', '1.05')
        card.style.setProperty('--feed-card-brightness', '1.02')
        card.style.setProperty('--feed-shadow-alpha', '0.12')
        card.style.setProperty('--feed-glass-alpha', '0.8')
        return
      }

      const rect = card.getBoundingClientRect()
      const cardCenter = rect.top + rect.height * 0.5
      const distance = Math.abs(cardCenter - focusCenter)
      const linearFocus = Math.max(0, 1 - distance / focusRange)
      const focus = linearFocus * linearFocus * (3 - 2 * linearFocus)
      const softDistance = 1 - focus

      card.style.setProperty('--feed-focus', focus.toFixed(3))
      card.style.setProperty('--feed-card-blur', `${(softDistance * 3.5).toFixed(2)}px`)
      card.style.setProperty('--feed-image-blur', `${(softDistance * 5).toFixed(2)}px`)
      card.style.setProperty('--feed-card-alpha', (0.78 + focus * 0.22).toFixed(3))
      card.style.setProperty('--feed-card-scale', (0.986 + focus * 0.014).toFixed(4))
      card.style.setProperty('--feed-card-y', `${(softDistance * 6).toFixed(2)}px`)
      card.style.setProperty('--feed-card-saturation', (0.92 + focus * 0.16).toFixed(3))
      card.style.setProperty('--feed-card-brightness', (0.985 + focus * 0.035).toFixed(3))
      card.style.setProperty('--feed-shadow-alpha', (0.04 + focus * 0.12).toFixed(3))
      card.style.setProperty('--feed-glass-alpha', (0.5 + focus * 0.3).toFixed(3))
    })

    frameRef.current = null
  }, [])

  const scheduleFeedFocus = useCallback(() => {
    if (frameRef.current !== null) return
    frameRef.current = window.requestAnimationFrame(updateFeedFocus)
  }, [updateFeedFocus])

  const snapToNearestFeedCard = useCallback(() => {
    const viewport = scrollRef.current
    if (!viewport || cardRefs.current.length === 0) return

    const viewportRect = viewport.getBoundingClientRect()
    const focusCenter = viewportRect.top + viewportRect.height * 0.48
    const cards = cardRefs.current.filter((card): card is HTMLButtonElement => Boolean(card))
    let nearestCard: HTMLButtonElement | null = null
    let nearestDistance = Number.POSITIVE_INFINITY

    for (const card of cards) {
      const rect = card.getBoundingClientRect()
      const cardCenter = rect.top + rect.height * 0.5
      const distance = Math.abs(cardCenter - focusCenter)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestCard = card
      }
    }

    if (!nearestCard || nearestDistance < 4) return

    const cardRect = nearestCard.getBoundingClientRect()
    const targetTop = viewport.scrollTop + (cardRect.top + cardRect.height * 0.5 - focusCenter)
    const maxTop = viewport.scrollHeight - viewport.clientHeight
    const clampedTop = Math.max(0, Math.min(maxTop, targetTop))
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    isSnappingRef.current = true
    viewport.scrollTo({
      top: clampedTop,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })

    window.setTimeout(() => {
      isSnappingRef.current = false
      scheduleFeedFocus()
    }, reduceMotion ? 0 : 360)
  }, [scheduleFeedFocus])

  const scheduleMagneticSnap = useCallback(() => {
    if (snapTimerRef.current !== null) {
      window.clearTimeout(snapTimerRef.current)
    }
    snapTimerRef.current = window.setTimeout(() => {
      snapTimerRef.current = null
      snapToNearestFeedCard()
    }, isSnappingRef.current ? 220 : 96)
  }, [snapToNearestFeedCard])

  const handleFeedScroll = useCallback(() => {
    const viewport = scrollRef.current
    if (viewport) {
      const shouldShow = viewport.scrollTop > 420
      setShowTopButton((current) => (current === shouldShow ? current : shouldShow))
    }
    scheduleFeedFocus()
    scheduleMagneticSnap()
  }, [scheduleFeedFocus, scheduleMagneticSnap])

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, feed.length + 1)
    scheduleFeedFocus()
    const settleTimer = window.setTimeout(() => {
      scheduleFeedFocus()
      snapToNearestFeedCard()
    }, 260)

    window.addEventListener('resize', scheduleFeedFocus)
    return () => {
      window.removeEventListener('resize', scheduleFeedFocus)
      window.clearTimeout(settleTimer)
      if (snapTimerRef.current !== null) {
        window.clearTimeout(snapTimerRef.current)
        snapTimerRef.current = null
      }
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [feed.length, scheduleFeedFocus, snapToNearestFeedCard])

  const openFeedItem = (item: FeedItemData) => {
    if (item.sessionId) {
      navigate(`/result?sessionId=${item.sessionId}`)
    }
  }

  const scrollToFeedTop = () => {
    const viewport = scrollRef.current
    if (!viewport) return

    viewport.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })

    window.setTimeout(() => {
      scheduleFeedFocus()
      setShowTopButton(false)
    }, 280)
  }

  return (
    <div className="grow-page-shell min-h-full overflow-hidden" style={{ maxWidth: '100vw' }}>
      <div className="px-5 pt-12 pb-4 relative z-10">
        <BilingualTitle en="NestAI" zh="栖巢" size="lg" />
      </div>

      <div
        ref={scrollRef}
        className="feed-scroll-viewport relative z-10"
        style={{ overflowY: 'auto', height: 'calc(var(--app-height) - 128px)' }}
        onScroll={handleFeedScroll}
      >
        <div className="px-5">
          <section className="mb-4">
            <div className="flex items-center justify-between mb-3 feed-section-header">
              <div>
                <span className="block text-sm text-[#6e6e73] font-semibold">Grow Feed</span>
                <span className="block text-xs text-[#8e8e93] mt-0.5">上传入口和大家的 Next 都在这里流动</span>
              </div>
            </div>

            {!loading && feed.length === 0 && (
              <div className="feed-empty-card rounded-[18px] p-5 text-center mb-4">
                <span className="block text-sm text-ink">还没有公开的 Next</span>
                <span className="block text-xs text-[#8e8e93] mt-1">先上传一个空间，Feed 会从第一张卡片开始生长。</span>
              </div>
            )}

            <div className="feed-card-stack grid gap-4">
              <button
                ref={(node) => {
                  cardRefs.current[0] = node
                }}
                type="button"
                data-feed-role="upload"
                className="feed-card-future grow-upload-card overflow-hidden text-left"
                onClick={() => navigate('/upload', { state: { transition: 'feed-upload' } })}
              >
                <div className="feed-upload-stage flex items-center justify-center">
                  <span className="feed-upload-plus leading-none">+</span>
                </div>
                <div className="p-4 relative z-10 text-center">
                  <span className="block text-[17px] leading-snug font-semibold text-ink">让空间长出一个 Next</span>
                  <span className="block text-sm text-[#6e6e73] mt-2 leading-relaxed">
                    上传一张图片，生成一个可执行的空间行动。
                  </span>
                </div>
              </button>

              {feed.map((item, index) => (
                <button
                  key={item.id}
                  ref={(node) => {
                    cardRefs.current[index + 1] = node
                  }}
                  type="button"
                  className="feed-card-future overflow-hidden text-left"
                  onClick={() => openFeedItem(item)}
                >
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3 relative z-10">
                    <div className="feed-avatar flex items-center justify-center overflow-hidden">
                      {item.userAvatar ? (
                        <img src={item.userAvatar} alt={item.userName || 'User'} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-semibold text-[#6e6e73]">{(item.userName || 'U').slice(0, 1)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-ink truncate">{item.userName || 'NestAI User'}</span>
                      <span className="block text-xs text-[#8e8e93] truncate">{item.location || 'Shared Next'}</span>
                    </div>
                  </div>

                  <div className="feed-image-stage">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="feed-image w-full h-64 object-cover bg-[#f2f2f7]" />
                    ) : (
                      <PlaceholderImage label={item.title} className="feed-image w-full h-64" />
                    )}
                  </div>

                  <div className="p-4 relative z-10">
                    <span className="block text-[17px] leading-snug font-semibold text-ink">{item.title}</span>
                    <span className="block text-sm text-[#6e6e73] mt-2 leading-relaxed">{item.description}</span>
                    <div className="flex flex-row gap-1.5 flex-wrap mt-3">
                      {item.lifestyleKeywords.map((kw) => (
                        <Badge key={kw} variant="secondary" className="feed-keyword text-xs py-0.5 px-2 rounded-full">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <div className="h-24" />
        </div>
      </div>

      <button
        type="button"
        className={`feed-top-button ${showTopButton ? 'is-visible' : ''}`}
        onClick={scrollToFeedTop}
        aria-label="Back to top"
      >
        <ArrowUp size={20} strokeWidth={2.25} />
      </button>
    </div>
  )
}
