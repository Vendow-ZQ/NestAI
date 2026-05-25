import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { BilingualTitle } from '@/components/BilingualTitle'
import { apiUrl } from '@/lib/api'
import { errorMessages } from '@/lib/error-messages'
import { useLifestyleStore } from '@/stores/lifestyle-store'

type Question = {
  q: string
  options: string[]
}

const DEFAULT_QUESTIONS: Question[] = [
  {
    q: '你最希望这个空间先帮你做到什么?',
    options: ['更容易进入专注状态', '回来后真的能放松', '更像我自己的地方', '更容易保持整洁'],
  },
  {
    q: '现在最影响你使用这个空间的是什么?',
    options: ['东西容易堆在手边', '光线或氛围不够舒服', '取放物品不顺手', '工作和休息边界混在一起'],
  },
  {
    q: '这次改造最重要的现实约束是什么?',
    options: ['尽量 0 元完成', '可以低预算买小物', '只能无痕调整', '可以移动家具或重新布局'],
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
  const currentQuestion = questions[step] || DEFAULT_QUESTIONS[step]
  const canContinue = useMemo(() => answers[step].length > 0 || customInput.trim().length > 0, [answers, customInput, step])

  useEffect(() => {
    if (!sessionId) {
      setQuestions(DEFAULT_QUESTIONS)
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
            '我看见了你的空间。在继续生成方案之前，我想再确认几个和你日常有关的小问题。',
        )
        setQuestions(validQuestionnaire(qList) ? normalizeQuestionnaire(qList) : DEFAULT_QUESTIONS)
      })
      .catch((err) => {
        console.error('获取 session 失败:', err)
        alert(errorMessages.sessionFailed)
        setQuestions(DEFAULT_QUESTIONS)
      })
      .finally(() => setLoadingAnalysis(false))
  }, [sessionId])

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
          aria-label="返回"
        >
          <span className="text-ink text-sm">&lt;</span>
        </button>
      </div>

      <div className="nest-page-content px-5 mb-4">
        <BilingualTitle en="LIFESTYLE CHAT" zh="生活方式对话" size="lg" />
      </div>

      <div className="nest-page-content" style={{ overflowY: 'auto', height: 'calc(var(--app-height) - 160px)' }}>
        <div className="px-5 mb-5">
          <div className="nest-glass-card rounded-[22px] p-4 mb-4">
            <span className="block text-sm text-ink leading-relaxed">
              {loadingAnalysis
                ? '正在观察你的空间...'
                : agentFirstMsg || '我看见了一个有待被重新理解的空间。我们先确认几个小问题。'}
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
            placeholder="或者直接告诉我..."
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
            <span className="text-white text-base font-semibold">{step < 2 ? '继续' : '生成方案'}</span>
          </button>
        </div>

        <div className="h-24" />
      </div>
    </div>
  )
}
