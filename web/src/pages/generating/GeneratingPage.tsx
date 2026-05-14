import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useUserStore } from '@/stores/user-store'
import { useSpaceStore } from '@/stores/space-store'
import { BilingualTitle } from '@/components/BilingualTitle'
import { errorMessages } from '@/lib/error-messages'

export default function GeneratingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const setHasUploadedSpace = useUserStore((s) => s.setHasUploadedSpace)
  const setSpaceProfile = useSpaceStore((s) => s.setSpaceProfile)

  const type = searchParams.get('type') || 'space'
  const sceneId = searchParams.get('sceneId') || 'scene-01'
  const sessionId = searchParams.get('sessionId')

  const spaceSteps = [
    { zh: '看见这个空间...', en: 'SEEING THE SPACE' },
    { zh: '识别物件与布局...', en: 'IDENTIFYING OBJECTS' },
    { zh: '注意可干预点...', en: 'FINDING POSSIBILITIES' },
  ]

  const interventionSteps = [
    { zh: '理解你想靠近的生活...', en: 'UNDERSTANDING YOUR LIFE' },
    { zh: '在养料库里找参考...', en: 'FINDING REFERENCES' },
    { zh: '把方案翻译成今晚就能做的事...', en: 'MAKING IT ACTIONABLE' },
  ]

  const letterSteps = [
    { zh: '看见你做了什么...', en: 'SEEING WHAT YOU DID' },
    { zh: '想想这次变化说出了什么...', en: 'REFLECTING ON CHANGES' },
    { zh: '写一封信...', en: 'WRITING A LETTER' },
  ]

  const steps = type === 'intervention' ? interventionSteps : type === 'letter' ? letterSteps : spaceSteps
  const duration = type === 'intervention' ? 4500 : type === 'letter' ? 5500 : 3000
  const stepDuration = duration / steps.length

  const titleMap: Record<string, { zh: string; en: string }> = {
    space: { zh: '空间识别', en: 'SPACE ANALYSIS' },
    intervention: { zh: '方案生成', en: 'INTERVENTION' },
    letter: { zh: '信件生成', en: 'LETTER' },
  }

  const currentTitle = titleMap[type] || titleMap.space

  useEffect(() => {
    if (type === 'space') {
      setHasUploadedSpace(true)
      setSpaceProfile({ type: 'dorm', layout: '7+1 single room', detectedObjects: [], constraints: [] })
    }

    // space 类型 & 有 sessionId: 真调用 analyze API
    if (type === 'space' && sessionId) {
      const timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) return prev
          return prev + 1
        })
      }, stepDuration)

      fetch(`/api/sessions/${sessionId}/analyze`, { method: 'POST' })
        .then(() => {
          clearInterval(timer)
          navigate(`/chat?sessionId=${sessionId}`, { replace: true })
        })
        .catch((err) => {
          clearInterval(timer)
          console.error('analyze 失败:', err)
          alert(errorMessages.analyzeFailed)
        })

      return () => clearInterval(timer)
    }

    // intervention / letter / 无 sessionId 的 space
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(timer)
          setTimeout(() => {
            if (type === 'space') {
              navigate(`/chat?sceneId=${sceneId}`, { replace: true })
            } else if (type === 'intervention') {
              navigate(`/result?sceneId=${sceneId}`, { replace: true })
            } else {
              navigate('/letter', { replace: true })
            }
          }, 800)
          return prev
        }
        return prev + 1
      })
    }, stepDuration)

    return () => clearInterval(timer)
  }, [])

  const progress = ((currentStep + 1) / steps.length) * 100

  return (
    <div className="min-h-full bg-background overflow-hidden flex flex-col items-center justify-center" style={{ fontFamily: "'Noto Sans SC', sans-serif", maxWidth: '100vw' }}>
      {/* 标题 */}
      <div className="mb-8">
        <BilingualTitle en={currentTitle.en} zh={currentTitle.zh} size="lg" />
      </div>

      {/* 进度条 */}
      <div className="w-48 h-1 bg-[#f0f0f0] rounded-full mb-10 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${progress}%`, backgroundColor: '#d9a823', transition: 'width 0.5s ease-out' }}
        />
      </div>

      {/* 步骤文字 */}
      <div className="flex flex-col items-center gap-6">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center" style={{ opacity: i <= currentStep ? 1 : 0.3, transition: 'opacity 0.5s ease-out' }}>
            <span className="block text-base text-ink">{step.zh}</span>
            <span className="block text-xs text-[#999] mt-1" style={{ fontFamily: "'Arial Black', sans-serif" }}>{step.en}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
