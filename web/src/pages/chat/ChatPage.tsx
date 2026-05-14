import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useLifestyleStore } from '@/stores/lifestyle-store'
import { BilingualTitle } from '@/components/BilingualTitle'
import { errorMessages } from '@/lib/error-messages'

const DEFAULT_QUESTIONS = [
  {
    q: '你最希望这个空间帮你做到什么？',
    options: ['更容易进入专注状态', '回来之后真的能放松下来', '更像"我自己的地方"', '更适合朋友来坐一会儿', '更容易保持整洁和秩序', '更适合睡觉和恢复'],
  },
  {
    q: '那现在这个空间，最常发生什么？',
    options: ['我经常在这里学习，但很难进入状态', '我经常在这里刷手机/拖延', '我主要在这里休息，但总觉得不够放松', '我想让它更像"我的"，但不知道从哪开始', '东西越来越多，越来越乱', '我其实很少待在这个房间里'],
  },
  {
    q: '为了不生成你做不到的方案，我再确认几个小条件。',
    options: ['一个人使用', '和室友共用', '0元', '100元以内', '300元以内', '300元以上', '可以打孔', '只能无痕', '都不太方便'],
  },
]

type ChatStep = 0 | 1 | 2

export default function ChatPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState<ChatStep>(0)
  const [answers, setAnswers] = useState<string[][]>([[], [], []])
  const [customInput, setCustomInput] = useState('')
  const [agentFirstMsg, setAgentFirstMsg] = useState('')
  const [questions, setQuestions] = useState<Array<{ q: string; options: string[] }>>([])
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)

  const setStoreAspiration = useLifestyleStore((s) => s.setAspiration)
  const setStoreCurrentState = useLifestyleStore((s) => s.setCurrentState)
  const setStoreSoftConstraints = useLifestyleStore((s) => s.setSoftConstraints)

  // 从 URL 获取 sessionId，调用后端获取 analyze 结果
  useEffect(() => {
    const sessionId = searchParams.get('sessionId')
    if (!sessionId) {
      setQuestions(DEFAULT_QUESTIONS)
      return
    }

    setLoadingAnalysis(true)
    fetch(`/api/sessions/${sessionId}`)
      .then((res) => res.json())
      .then((res) => {
        const data = res.data
        const memory = data?.shortTermMemory as string | undefined
        const qList = data?.questions as Array<{ q: string; options: string[] }> | undefined
        if (memory) {
          setAgentFirstMsg(memory)
        }
        if (qList && qList.length >= 3) {
          setQuestions(qList)
        } else {
          setQuestions(DEFAULT_QUESTIONS)
        }
        setLoadingAnalysis(false)
      })
      .catch((err) => {
        console.error('获取 session 失败:', err)
        alert(errorMessages.sessionFailed)
        setLoadingAnalysis(false)
        setQuestions(DEFAULT_QUESTIONS)
      })
  }, [searchParams])

  const currentQuestion = questions[step] || DEFAULT_QUESTIONS[step]

  const handleSelectOption = (option: string) => {
    setAnswers((prev) => {
      const next = [...prev]
      const current = next[step]
      if (current.includes(option)) {
        next[step] = current.filter((o) => o !== option)
      } else {
        next[step] = [...current, option]
      }
      return next
    })
  }

  const handleSubmitCustomInput = () => {
    if (!customInput.trim()) return
    setAnswers((prev) => {
      const next = [...prev]
      next[step] = [...next[step], customInput.trim()]
      return next
    })
    setCustomInput('')
  }

  const handleNext = () => {
    if (step === 0) {
      setStoreAspiration(answers[0])
      setStep(1)
    } else if (step === 1) {
      setStoreCurrentState(answers[1])
      setStep(2)
    } else {
      // 第3步：把选项分类为 sharing/budget/wall
      const step2Answers = answers[2]
      const sharing = step2Answers.find((a) => ['一个人使用', '和室友共用'].includes(a)) || ''
      const budget = step2Answers.find((a) => ['0元', '100元以内', '300元以内', '300元以上'].includes(a)) || ''
      const wall = step2Answers.find((a) => ['可以打孔', '只能无痕', '都不太方便'].includes(a)) || ''
      setStoreSoftConstraints({ sharing, budget, wallModification: wall })
      navigate('/generating?type=intervention&sceneId=scene-01')
    }
  }

  const handleBack = () => {
    if (step === 1) setStep(0)
    else if (step === 2) setStep(1)
    else navigate(-1)
  }

  return (
    <div className="min-h-full bg-background overflow-hidden" style={{ fontFamily: "'Noto Sans SC', sans-serif", maxWidth: '100vw' }}>
      {/* Header */}
      <div className="flex flex-row items-center px-5 pt-12 pb-4">
        <div
          onClick={handleBack}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
          style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
        >
          <span className="text-ink text-sm">&lt;</span>
        </div>
      </div>

      {/* 标题 */}
      <div className="px-5 mb-4">
        <BilingualTitle en="LIFESTYLE CHAT" zh="生活方式对话" size="lg" />
      </div>

      <div style={{ overflowY: 'auto', height: 'calc(100vh - 160px)' }}>
        {/* Agent 消息 */}
        <div className="px-5 mb-6">
          <div className="bg-card rounded p-4 mb-4">
            <span className="block text-sm text-ink leading-relaxed">
              {loadingAnalysis
                ? '正在观察你的空间...'
                : agentFirstMsg || '我看到了一个温馨的空间。在我们继续之前，我想了解一下——'}
            </span>
          </div>

          {/* 当前问题 */}
          <div className="bg-card rounded p-4 mb-4">
            <span className="block text-sm text-ink leading-relaxed">
              {currentQuestion?.q || '请选择'}
            </span>
          </div>
        </div>

        {/* 选项 */}
        <div className="px-5">
          {currentQuestion?.options.map((opt, i) => (
            <div
              key={i}
              className={`mb-3 rounded p-4 hover-lift cursor-pointer ${
                answers[step].includes(opt) ? 'bg-[#f0d77a]' : 'bg-card'
              }`}
              style={{ borderWidth: '1.5px', borderColor: answers[step].includes(opt) ? '#d9a823' : '#b5ad9f' }}
              onClick={() => handleSelectOption(opt)}
            >
              <span className="text-sm text-ink">{opt}</span>
            </div>
          ))}
        </div>

        {/* 自定义输入框 */}
        <div className="px-5 mt-2 mb-4">
          <div
            className="flex flex-row items-center gap-2 rounded-lg p-1"
            style={{ backgroundColor: '#f5f5f5' }}
          >
            <div className="flex-1 px-3">
              <input
                className="bg-transparent text-sm py-2 w-full outline-none"
                style={{ backgroundColor: 'transparent' }}
                placeholder="或者直接告诉我..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmitCustomInput()
                }}
              />
            </div>
            {/* 发送按钮 */}
            <div
              className="flex items-center justify-center rounded-full cursor-pointer"
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: customInput.trim() ? '#1a1814' : '#ccc',
              }}
              onClick={handleSubmitCustomInput}
            >
              <span className="text-white text-sm">↑</span>
            </div>
          </div>
        </div>

        {/* 继续按钮 */}
        <div className="px-5 mt-2">
          <div
            className="bg-ink rounded-full py-4 flex items-center justify-center hover-lift cursor-pointer"
            onClick={handleNext}
          >
            <span className="text-white text-base">
              {step === 0 ? '继续' : step === 1 ? '继续' : '生成方案'}
            </span>
          </div>
        </div>

        <div className="h-24" />
      </div>
    </div>
  )
}
