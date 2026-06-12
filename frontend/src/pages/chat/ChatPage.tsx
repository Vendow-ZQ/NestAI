import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { BilingualTitle } from '@/components/BilingualTitle'
import { apiUrl } from '@/lib/api'
import { useErrorMessages } from '@/lib/error-messages'
import { useI18n } from '@/lib/i18n'
import { useLifestyleStore } from '@/stores/lifestyle-store'

type Question = {
  q: string
  options: string[]
}

const DEFAULT_QUESTIONS: Question[] = [
  {
    q: '你最向往这个空间支持哪种生活状态和生活方式?',
    options: ['更容易进入专注状态', '回来后真的能放松', '更像我自己的地方', '更容易保持整洁'],
  },
  {
    q: '现在这个空间和你向往的生活状态最不匹配的是哪里?',
    options: ['想专注，但桌面或地面容易打断启动', '想放松，但工作和休息物品混在一起', '想表达自己，但展示物和常用工具互相挤压', '想顺手生活，但常用物缺少稳定收尾位置'],
  },
  {
    q: '这次改造最重要的现实约束是什么?',
    options: ['低预算，优先复用现有物品', '标准预算，可以买几件关键小物', '预算充足，希望做完整一点', '只能无痕调整，尽量不移动大件'],
  },
]

const DEFAULT_QUESTIONS_EN: Question[] = [
  {
    q: 'What lifestyle do you most want this space to support?',
    options: ['Get into focus more easily', 'Relax when you come back', 'Feel more like your own place', 'Stay tidy with less effort'],
  },
  {
    q: 'Where does this space most mismatch that lifestyle?',
    options: ['I want focus, but the center interrupts my start', 'I want rest, but work and rest items blur together', 'I want self-expression, but display and tools crowd each other', 'I want smoother routines, but daily items lack a landing place'],
  },
  {
    q: 'What is the most important constraint for this change?',
    options: ['Low budget; reuse what I have', 'Standard budget; a few key small items are okay', 'Enough budget for a fuller change', 'No-trace changes; avoid moving large pieces'],
  },
]

function validQuestionnaire(value: unknown): value is Question[] {
  return (
    Array.isArray(value) &&
    value.length >= 3 &&
    value.slice(0, 3).every((item) => {
      const question = item as Question
      return (
        typeof question?.q === 'string' &&
        question.q.trim().length > 0 &&
        Array.isArray(question.options) &&
        question.options.length >= 4 &&
        question.options.slice(0, 4).every((option) => typeof option === 'string' && option.trim().length > 0)
      )
    })
  )
}

function normalizeQuestionnaire(value: Question[]): Question[] {
  return value.slice(0, 3).map((question) => ({
    q: question.q.trim(),
    options: question.options.slice(0, 4).map((option) => option.trim()),
  }))
}

export default function ChatPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { language, t } = useI18n()
  const errorMessages = useErrorMessages()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<string[][]>([[], [], []])
  const [customInput, setCustomInput] = useState('')
  const [agentFirstMsg, setAgentFirstMsg] = useState('')
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)

  const setStoreAspiration = useLifestyleStore((s) => s.setAspiration)
  const setStoreCurrentState = useLifestyleStore((s) => s.setCurrentState)
  const setStoreSoftConstraints = useLifestyleStore((s) => s.setSoftConstraints)

  const sessionId = searchParams.get('sessionId')
  const fallbackQuestions = useMemo(() => (language === 'en' ? DEFAULT_QUESTIONS_EN : DEFAULT_QUESTIONS), [language])
  const currentQuestion = questions[step] || fallbackQuestions[step]
  const canContinue = useMemo(() => answers[step].length > 0 || customInput.trim().length > 0, [answers, customInput, step])

  useEffect(() => {
    if (!sessionId) {
      setQuestions(fallbackQuestions)
      return
    }

    setLoadingAnalysis(true)
    fetch(apiUrl(`/api/sessions/${sessionId}`))
      .then((res) => res.json())
      .then((res) => {
        const data = res.data
        const displaySummary = data?.spaceAnalysis?.display_summary as string | undefined
        const qList = data?.questions as Question[] | undefined

        setAgentFirstMsg(
          displaySummary ||
            t('chatSessionFallback'),
        )
        setQuestions(validQuestionnaire(qList) ? normalizeQuestionnaire(qList) : fallbackQuestions)
      })
      .catch((err) => {
        console.error('获取 session 失败:', err)
        alert(errorMessages.sessionFailed)
        setQuestions(fallbackQuestions)
      })
      .finally(() => setLoadingAnalysis(false))
  }, [fallbackQuestions, sessionId, t])

  const handleSelectOption = (option: string) => {
    setAnswers((prev) => {
      const next = [...prev]
      const current = next[step]
      next[step] = current.includes(option) ? current.filter((item) => item !== option) : [...current, option]
      return next
    })
  }

  const commitCurrentAnswer = () => {
    const text = customInput.trim()
    const finalAnswers = answers.map((items) => [...items])
    if (text && !finalAnswers[step].includes(text)) {
      finalAnswers[step].push(text)
    }
    setAnswers(finalAnswers)
    setCustomInput('')
    return finalAnswers
  }

  const handleNext = () => {
    if (!canContinue) return

    const finalAnswers = commitCurrentAnswer()

    if (step === 0) {
      setStoreAspiration(finalAnswers[0])
      setStep(1)
      return
    }

    if (step === 1) {
      setStoreCurrentState(finalAnswers[1])
      setStep(2)
      return
    }

    const constraints = finalAnswers[2]
    setStoreSoftConstraints({
      sharing: constraints.join(' / '),
      budget: constraints.join(' / '),
      wallModification: constraints.join(' / '),
    })

    navigate(sessionId ? `/generating?type=intervention&sessionId=${sessionId}` : '/generating?type=intervention&sceneId=scene-01')
  }

  const handleBack = () => {
    setCustomInput('')
    if (step > 0) {
      setStep(step - 1)
      return
    }
    navigate(-1)
  }

  return (
    <div className="nest-page-shell min-h-full overflow-hidden" style={{ maxWidth: '100vw' }}>
      <div className="nest-page-content flex flex-row items-center px-5 pt-12 pb-4">
        <button
          type="button"
          onClick={handleBack}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer nest-glass-card"
          aria-label={t('commonBack')}
        >
          <span className="text-ink text-sm">&lt;</span>
        </button>
      </div>

      <div className="nest-page-content px-5 mb-4">
        <BilingualTitle en="LIFESTYLE CHAT" zh={t('chatTitle')} size="lg" />
      </div>

      <div className="nest-page-content" style={{ overflowY: 'auto', height: 'calc(var(--app-height) - 160px)' }}>
        <div className="px-5 mb-5">
          <div className="nest-glass-card rounded-[22px] p-4 mb-4">
            <span className="block text-sm text-ink leading-relaxed">
              {loadingAnalysis
                ? t('chatLoading')
                : agentFirstMsg || t('chatFallbackIntro')}
            </span>
          </div>

          <div className="nest-glass-card rounded-[22px] p-4">
            <span className="block text-xs text-[#8e8e93] font-semibold mb-2">{step + 1} / 3</span>
            <span className="block text-[17px] text-ink font-semibold leading-snug">{currentQuestion.q}</span>
          </div>
        </div>

        <div className="px-5 grid gap-3">
          {currentQuestion.options.map((option) => {
            const selected = answers[step].includes(option)
            return (
              <button
                key={option}
                type="button"
                className={`nest-glass-card rounded-[18px] p-4 cursor-pointer w-full text-left ${selected ? 'ring-1 ring-[#007aff]' : ''}`}
                onClick={() => handleSelectOption(option)}
              >
                <span className={`text-sm ${selected ? 'text-[#007aff] font-semibold' : 'text-ink'}`}>{option}</span>
              </button>
            )
          })}
        </div>

        <div className="px-5 mt-4">
          <input
            className="nest-glass-card rounded-[18px] px-4 py-3 text-sm w-full outline-none"
            placeholder={t('chatPlaceholder')}
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canContinue) handleNext()
            }}
          />
        </div>

        <div className="px-5 mt-4">
          <button
            type="button"
            className="ios-primary-button rounded-full py-4 flex items-center justify-center cursor-pointer w-full disabled:cursor-default disabled:opacity-35 disabled:shadow-none"
            onClick={handleNext}
            disabled={!canContinue}
          >
            <span className="text-white text-base font-semibold">{step < 2 ? t('chatContinue') : t('chatGenerate')}</span>
          </button>
        </div>

        <div className="h-24" />
      </div>
    </div>
  )
}
