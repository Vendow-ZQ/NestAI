import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { BilingualTitle } from '@/components/BilingualTitle'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { api } from '@/lib/api'
import { useInterventionStore } from '@/stores/intervention-store'

const DELETED_NEXT_KEY = 'nestai.deletedNextIds'
const LONG_PRESS_MS = 360
const DELETE_DISTANCE = 128

type DragState = {
  id: string
  index: number
  pointerId: number
  startX: number
  startY: number
  armed: boolean
  dragging: boolean
}

function readDeletedNextIds() {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(DELETED_NEXT_KEY) || '[]') as string[])
  } catch {
    return new Set<string>()
  }
}

function writeDeletedNextId(id: string) {
  const ids = readDeletedNextIds()
  ids.add(id)
  window.localStorage.setItem(DELETED_NEXT_KEY, JSON.stringify(Array.from(ids)))
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('button, a, input, textarea, select, label'))
}

export default function NextPage() {
  const navigate = useNavigate()
  const nextList = useInterventionStore((s) => s.nextList)
  const setNextList = useInterventionStore((s) => s.setNextList)
  const removeFromNext = useInterventionStore((s) => s.removeFromNext)
  const [loading, setLoading] = useState(nextList.length === 0)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(() => new Set())
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const cardRefs = useRef<(HTMLElement | null)[]>([])
  const frameRef = useRef<number | null>(null)
  const snapTimerRef = useRef<number | null>(null)
  const isSnappingRef = useRef(false)
  const longPressTimerRef = useRef<number | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const suppressClickRef = useRef(false)

  useEffect(() => {
    if (nextList.length > 0) return

    api
      .listSessions()
      .then((data) => {
        const deletedIds = readDeletedNextIds()
        setNextList(data.nextActions.filter((item) => !deletedIds.has(item.id)))
      })
      .catch((err) => {
        console.error('读取 Next 数据失败:', err)
      })
      .finally(() => setLoading(false))
  }, [nextList.length, setNextList])

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }, [])

  const resetDragCard = useCallback((index: number) => {
    const card = cardRefs.current[index]
    if (!card) return
    card.style.setProperty('--next-drag-x', '0px')
    card.style.setProperty('--next-drag-rotate', '0deg')
    card.dataset.dragging = 'false'
    card.dataset.deleteReady = 'false'
  }, [])

  const deleteNextCard = useCallback((id: string, index: number) => {
    const card = cardRefs.current[index]
    writeDeletedNextId(id)
    suppressClickRef.current = true
    setDeletingIds((current) => new Set(current).add(id))

    if (card) {
      card.style.setProperty('--next-drag-x', '46vw')
      card.style.setProperty('--next-drag-rotate', '2.5deg')
      card.dataset.deleteReady = 'true'
    }

    window.setTimeout(() => {
      removeFromNext(id)
      setDeletingIds((current) => {
        const next = new Set(current)
        next.delete(id)
        return next
      })
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 80)
    }, 220)
  }, [removeFromNext])

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLElement>, id: string, index: number) => {
    if (event.button !== 0) return
    if (isInteractiveTarget(event.target)) return

    clearLongPressTimer()
    dragStateRef.current = {
      id,
      index,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      armed: false,
      dragging: false,
    }

    longPressTimerRef.current = window.setTimeout(() => {
      const state = dragStateRef.current
      if (!state || state.id !== id) return
      state.armed = true
      const card = cardRefs.current[index]
      card?.setPointerCapture?.(event.pointerId)
      card?.setAttribute('data-dragging', 'true')
    }, LONG_PRESS_MS)
  }, [clearLongPressTimer])

  const handlePointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const state = dragStateRef.current
    if (!state || state.pointerId !== event.pointerId) return

    const dx = event.clientX - state.startX
    const dy = event.clientY - state.startY

    if (!state.armed) {
      if (Math.abs(dy) > 10 || Math.abs(dx) > 10) {
        clearLongPressTimer()
        if (Math.abs(dy) > Math.abs(dx)) {
          dragStateRef.current = null
        }
      }
      return
    }

    if (dx < 0 || Math.abs(dy) > 72) return

    event.preventDefault()
    state.dragging = true
    suppressClickRef.current = true

    const card = cardRefs.current[state.index]
    const dragX = Math.min(dx, window.innerWidth * 0.52)
    const progress = Math.min(1, dragX / DELETE_DISTANCE)
    card?.style.setProperty('--next-drag-x', `${dragX.toFixed(1)}px`)
    card?.style.setProperty('--next-drag-rotate', `${(progress * 2.4).toFixed(2)}deg`)
    if (card) {
      card.dataset.deleteReady = dragX >= DELETE_DISTANCE ? 'true' : 'false'
    }
  }, [clearLongPressTimer])

  const handlePointerEnd = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const state = dragStateRef.current
    clearLongPressTimer()
    if (!state || state.pointerId !== event.pointerId) return

    const dx = event.clientX - state.startX
    const shouldDelete = state.armed && state.dragging && dx >= DELETE_DISTANCE
    const index = state.index
    const id = state.id
    dragStateRef.current = null

    if (shouldDelete) {
      deleteNextCard(id, index)
      return
    }

    resetDragCard(index)
    if (state.dragging) {
      window.setTimeout(() => {
        suppressClickRef.current = false
      }, 80)
    }
  }, [clearLongPressTimer, deleteNextCard, resetDragCard])

  const handleClickCapture = useCallback((event: React.MouseEvent<HTMLElement>) => {
    if (isInteractiveTarget(event.target)) return
    if (!suppressClickRef.current) return
    event.preventDefault()
    event.stopPropagation()
    window.setTimeout(() => {
      suppressClickRef.current = false
    }, 80)
  }, [])

  const updateCardFocus = useCallback(() => {
    const viewport = scrollRef.current
    if (!viewport) return

    const viewportRect = viewport.getBoundingClientRect()
    const focusCenter = viewportRect.top + viewportRect.height * 0.5
    const focusRange = Math.max(280, viewportRect.height * 0.55)

    cardRefs.current.forEach((card) => {
      if (!card) return

      const rect = card.getBoundingClientRect()
      const cardCenter = rect.top + rect.height * 0.5
      const distance = Math.abs(cardCenter - focusCenter)
      const linearFocus = Math.max(0, 1 - distance / focusRange)
      const focus = linearFocus * linearFocus * (3 - 2 * linearFocus)
      const softDistance = 1 - focus

      card.style.setProperty('--next-focus', focus.toFixed(3))
      card.style.setProperty('--next-card-blur', '0px')
      card.style.setProperty('--next-image-blur', `${(softDistance * 1.6).toFixed(2)}px`)
      card.style.setProperty('--next-card-alpha', (0.9 + focus * 0.1).toFixed(3))
      card.style.setProperty('--next-card-scale', (0.992 + focus * 0.008).toFixed(4))
      card.style.setProperty('--next-card-y', `${(softDistance * 4).toFixed(2)}px`)
      card.style.setProperty('--next-card-saturation', (0.98 + focus * 0.08).toFixed(3))
      card.style.setProperty('--next-shadow-alpha', (0.04 + focus * 0.1).toFixed(3))
    })

    frameRef.current = null
  }, [])

  const scheduleFocus = useCallback(() => {
    if (frameRef.current !== null) return
    frameRef.current = window.requestAnimationFrame(updateCardFocus)
  }, [updateCardFocus])

  const snapToNearestCard = useCallback(() => {
    const viewport = scrollRef.current
    if (!viewport || cardRefs.current.length === 0) return

    const viewportRect = viewport.getBoundingClientRect()
    const focusCenter = viewportRect.top + viewportRect.height * 0.5
    const cards = cardRefs.current.filter((card): card is HTMLElement => Boolean(card))
    let nearestCard: HTMLElement | null = null
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

    const rect = nearestCard.getBoundingClientRect()
    const targetTop = viewport.scrollTop + (rect.top + rect.height * 0.5 - focusCenter)
    const maxTop = viewport.scrollHeight - viewport.clientHeight
    const clampedTop = Math.max(0, Math.min(maxTop, targetTop))
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    isSnappingRef.current = true
    viewport.scrollTo({ top: clampedTop, behavior: reduceMotion ? 'auto' : 'smooth' })
    window.setTimeout(() => {
      isSnappingRef.current = false
      scheduleFocus()
    }, reduceMotion ? 0 : 280)
  }, [scheduleFocus])

  const scheduleSnap = useCallback(() => {
    if (snapTimerRef.current !== null) {
      window.clearTimeout(snapTimerRef.current)
    }
    snapTimerRef.current = window.setTimeout(() => {
      snapTimerRef.current = null
      snapToNearestCard()
    }, isSnappingRef.current ? 220 : 96)
  }, [snapToNearestCard])

  const handleScroll = useCallback(() => {
    scheduleFocus()
    scheduleSnap()
  }, [scheduleFocus, scheduleSnap])

  useEffect(() => {
    cardRefs.current = cardRefs.current.slice(0, nextList.length)
    scheduleFocus()
    const settleTimer = window.setTimeout(() => {
      scheduleFocus()
      snapToNearestCard()
    }, 220)

    window.addEventListener('resize', scheduleFocus)
    return () => {
      window.removeEventListener('resize', scheduleFocus)
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
  }, [nextList.length, scheduleFocus, snapToNearestCard])

  const openResult = (sessionId?: string, sceneId?: string, level?: string) => {
    if (sessionId) {
      const levelQuery = level ? `&level=${encodeURIComponent(level)}` : ''
      navigate(`/result?sessionId=${sessionId}${levelQuery}`)
    } else {
      navigate(`/result?sceneId=${sceneId || 'scene-01'}`)
    }
  }

  const handleCardClick = (event: React.MouseEvent<HTMLElement>, sessionId?: string, sceneId?: string, level?: string) => {
    if (suppressClickRef.current || isInteractiveTarget(event.target)) return
    openResult(sessionId, sceneId, level)
  }

  return (
    <div className="nest-page-shell min-h-full overflow-hidden" style={{ maxWidth: '100vw' }}>
      <div className="nest-page-content px-5 pt-12 pb-4">
        <BilingualTitle en="NEXT" zh="准备试试" size="lg" />
      </div>

      <div
        ref={scrollRef}
        className="nest-page-content next-scroll-viewport"
        style={{ overflowY: 'auto', height: 'calc(var(--app-height) - 120px)' }}
        onScroll={handleScroll}
      >
        {!loading && nextList.length === 0 ? (
          <div className="px-5">
            <div className="nest-glass-card nest-page-enter rounded-[22px] p-6 text-center">
              <span className="block text-base font-semibold text-ink">还没有收藏的动作</span>
              <span className="block text-sm text-[#6e6e73] mt-2 leading-relaxed">
                完成一次空间分析后，这里会出现你可以继续尝试的小行动。
              </span>
            </div>
          </div>
        ) : (
          <div className="px-5 grid gap-3 next-card-stack">
            {nextList.map((item, index) => (
              <article
                key={item.id}
                ref={(node) => {
                  cardRefs.current[index] = node
                }}
                className={`nest-glass-card next-focus-card rounded-[22px] overflow-hidden ${deletingIds.has(item.id) ? 'is-deleting' : ''}`}
                onPointerDown={(event) => handlePointerDown(event, item.id, index)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerEnd}
                onPointerCancel={handlePointerEnd}
                onClickCapture={handleClickCapture}
                onClick={(event) => handleCardClick(event, item.sessionId, item.sceneId, item.level)}
              >
                <div className="next-delete-cue" aria-hidden="true">Delete</div>
                <button
                  type="button"
                  className="next-card-media nest-media-stage block w-full text-left"
                  onClick={() => openResult(item.sessionId, item.sceneId, item.level)}
                >
                  {item.previewImage ? (
                    <img src={item.previewImage} alt={item.title} className="next-card-image w-full h-full object-cover" />
                  ) : (
                    <PlaceholderImage label={item.title} className="next-card-image w-full h-full" />
                  )}
                </button>

                <div className="p-3.5">
                  <span className="block text-[16px] leading-snug font-semibold text-ink">{item.title}</span>
                  <span className="block text-sm text-[#6e6e73] mt-1 leading-relaxed line-clamp-1">{item.lifestyleGoal}</span>

                  <div className="mt-3 p-2.5 rounded-[15px] bg-white/55 border border-white/60">
                    <span className="block text-xs text-[#8e8e93] font-semibold">最轻第一步</span>
                    <span className="block text-sm text-ink mt-1 leading-relaxed line-clamp-2">{item.firstStep}</span>
                  </div>

                  <div className="flex flex-row items-center gap-2 mt-2.5">
                    <span className="text-xs text-[#6e6e73] bg-white/60 rounded-full px-2 py-1">{item.estimatedTime}</span>
                    <span className="text-xs text-[#6e6e73] bg-white/60 rounded-full px-2 py-1">{item.costRange}</span>
                  </div>

                  <div className="flex flex-row gap-3 mt-3">
                    <button
                      type="button"
                      className="ios-primary-button flex-1 rounded-full py-2.5 flex items-center justify-center cursor-pointer"
                      onClick={() => openResult(item.sessionId, item.sceneId, item.level)}
                    >
                      <span className="text-white text-sm font-semibold">Let&apos;s do it!</span>
                    </button>
                    <button
                      type="button"
                      className="nest-pill-button flex-1 py-2.5 flex items-center justify-center cursor-pointer"
                      onClick={() => navigate(item.sessionId ? `/share?sessionId=${item.sessionId}&level=${item.level}` : '/share')}
                    >
                      <span className="text-sm font-semibold">Done</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="h-24" />
      </div>
    </div>
  )
}
