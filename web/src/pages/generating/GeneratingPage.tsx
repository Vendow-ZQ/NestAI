import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useUserStore } from '@/stores/user-store'
import { useSpaceStore } from '@/stores/space-store'
import { useLifestyleStore } from '@/stores/lifestyle-store'
import { useInterventionStore } from '@/stores/intervention-store'
import { useMemoryStore } from '@/stores/memory-store'
import { useShareStore } from '@/stores/share-store'
import { BilingualTitle } from '@/components/BilingualTitle'
import { NobiWorking } from '@/components/NobiWorking'
import { errorMessages } from '@/lib/error-messages'
import { api, apiUrl, type Level } from '@/lib/api'

export default function GeneratingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const setHasUploadedSpace = useUserStore((s) => s.setHasUploadedSpace)
  const setSpaceProfile = useSpaceStore((s) => s.setSpaceProfile)
  const aspiration = useLifestyleStore((s) => s.aspiration)
  const currentState = useLifestyleStore((s) => s.currentState)
  const softConstraints = useLifestyleStore((s) => s.softConstraints)
  const setCurrentPlan = useInterventionStore((s) => s.setCurrentPlan)
  const addLetter = useMemoryStore((s) => s.addLetter)
  const shareFeedback = useShareStore((s) => s.feedback)

  const type = searchParams.get('type') || 'space'
  const sceneId = searchParams.get('sceneId') || 'scene-01'
  const sessionId = searchParams.get('sessionId')
  const selectedLevel = (searchParams.get('level') as Level | null) || 'low'

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
  const nobiVariant = type === 'space' ? 'questionnaire' : 'result'

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

      fetch(apiUrl(`/api/sessions/${sessionId}/analyze`), { method: 'POST' })
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

    if (type === 'intervention' && sessionId) {
      const timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) return prev
          return prev + 1
        })
      }, stepDuration)

      api.generateIntervention(sessionId, {
        aspiration,
        current_state: currentState,
        constraints: {
          sharing: softConstraints.sharing,
          budget: softConstraints.budget,
          wall_modification: softConstraints.wallModification,
        },
      })
        .then(({ interventionPlan }) => {
          clearInterval(timer)
          setCurrentPlan(sessionId, interventionPlan)
          navigate(`/result?sessionId=${sessionId}`, { replace: true })
        })
        .catch((err) => {
          clearInterval(timer)
          console.error('生成方案失败:', err)
          alert(errorMessages.interventionFailed)
          navigate(`/chat?sessionId=${sessionId}`, { replace: true })
        })

      return () => clearInterval(timer)
    }

    if (type === 'letter' && sessionId) {
      const timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) return prev
          return prev + 1
        })
      }, stepDuration)

      api.generateLetter(sessionId, {
        selected_level: selectedLevel,
        completion_status: shareFeedback?.sessionId === sessionId ? shareFeedback.completionStatus : '部分做到',
        user_feeling: shareFeedback?.sessionId === sessionId
          ? shareFeedback.userFeeling
          : '我试着照着方案做了一些改变，想看看这次变化意味着什么。',
        after_images: shareFeedback?.sessionId === sessionId ? shareFeedback.afterImages : [],
        unfinished_steps: shareFeedback?.sessionId === sessionId ? shareFeedback.unfinishedSteps : [],
      })
        .then(({ letter }) => {
          clearInterval(timer)
          addLetter({
            id: `letter-${sessionId}`,
            sessionId,
            title: '这次空间变化',
            content: letter.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean),
            date: new Date().toISOString().slice(0, 10),
            lifestyleDirection: '空间行动',
            beforeImage: '',
            afterImage: shareFeedback?.sessionId === sessionId ? shareFeedback.afterImages[0] || '' : '',
          })
          navigate(`/letter?sessionId=${sessionId}`, { replace: true })
        })
        .catch((err) => {
          clearInterval(timer)
          console.error('生成信件失败:', err)
          alert(errorMessages.letterFailed)
          navigate(`/share?sessionId=${sessionId}&level=${selectedLevel}`, { replace: true })
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

  return (
    <div className="min-h-full bg-white overflow-hidden flex flex-col items-center justify-center" style={{ maxWidth: '100vw' }}>
      {/* 标题 */}
      <div className="mb-8">
        <BilingualTitle en={currentTitle.en} zh={currentTitle.zh} size="lg" />
      </div>

      <NobiWorking className="mb-7" variant={nobiVariant} />

      {/* 进度条 */}
      <div className="flex items-center justify-center gap-2 mb-10" aria-label="loading">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="generating-dot" style={{ animationDelay: `${dot * 180}ms` }} />
        ))}
      </div>

      {/* 步骤文字 */}
      <div className="flex flex-col items-center gap-6">
        {steps.map((step, i) => (
          <div key={i} className="flex flex-col items-center" style={{ opacity: i <= currentStep ? 1 : 0.3, transition: 'opacity 0.5s ease-out' }}>
            <span className="block text-base text-ink">{step.zh}</span>
            <span className="block text-xs text-[#8e8e93] mt-1 font-medium">{step.en}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
