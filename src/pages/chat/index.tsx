import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'

import { useLifestyleStore } from '@/lib/store/lifestyle-store'
import { CustomTabBar } from '@/components/tab-bar'
import { BilingualTitle } from '@/components/bilingual-title'
import { Input } from '@/components/ui/input'
import { Network } from '@/network'
import { errorMessages } from '@/lib/error-messages'

const DEFAULT_QUESTIONS = [
  {
    q: '你最希望这个空间帮你做到什么？',
    options: ['更容易进入专注状态', '回来之后真的能放松下来', '更像"我自己的地方"', '更适合朋友来坐一会儿', '更容易保持整洁和秩序', '更适合睡觉和恢复'],
  },
  {
    q: '那现在这个空间，最常发生什么？',
    options: ['我经常在这里学习，但很难进入状态', '我经常在这里刷手机/拖延', '我主要在这里休息，但总觉得不够放松', '东西越来越多，找不到放的地方', '光线不好，白天也要开灯', '空间太小，动线不舒服'],
  },
  {
    q: '为了不生成你做不到的方案，我再确认几个小条件。',
    options: ['一个人使用', '和室友共用', '0元', '100元以内', '300元以内', '300元以上', '可以打孔', '只能无痕', '都不方便'],
  },
]

type ChatStep = 0 | 1 | 2

export default function ChatPage() {
  const [step, setStep] = useState<ChatStep>(0)
  const [answers, setAnswers] = useState<string[][]>([[], [], []])
  const [customInput, setCustomInput] = useState('')
  const [agentFirstMsg, setAgentFirstMsg] = useState('')
  const [questions, setQuestions] = useState<Array<{ q: string; options: string[] }>>([])
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)

  const setStoreAspiration = useLifestyleStore((s) => s.setAspiration)
  const setStoreCurrentState = useLifestyleStore((s) => s.setCurrentState)
  const setStoreSoftConstraints = useLifestyleStore((s) => s.setSoftConstraints)

  // 从 URL 获取 sessionId，调用后端获取 analyze 结果（description + questions）
  useEffect(() => {
    const tryFetch = (isRetry = false) => {
      const sessionId = Taro.getCurrentInstance().router?.params?.sessionId as string | undefined
      if (sessionId) {
        setLoadingAnalysis(true)
        Network.request({
          url: `/api/sessions/${sessionId}`,
          method: 'GET',
        }).then((res) => {
          const data = res.data?.data
          const memory = data?.shortTermMemory as string | undefined
          const qList = data?.questions as Array<{ q: string; options: string[] }> | undefined
          if (memory) {
            setAgentFirstMsg(memory)
          }
          if (qList && qList.length >= 3) {
            setQuestions(qList)
          } else {
            // LLM 没返回足够问题，用默认的
            setQuestions(DEFAULT_QUESTIONS)
          }
          setLoadingAnalysis(false)
        }).catch((err) => {
          console.error('获取 session 失败:', err)
          Taro.showToast({ title: errorMessages.sessionFailed, icon: 'none' })
          setLoadingAnalysis(false)
          setQuestions(DEFAULT_QUESTIONS)
        })
      } else if (!isRetry) {
        setTimeout(() => tryFetch(true), 50)
      } else {
        // 重试也失败，用默认问题
        setQuestions(DEFAULT_QUESTIONS)
      }
    }
    tryFetch()
  }, [])

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
      // 第3步：把选项分类为 sharing/budget/wall（简化处理）
      const step2Answers = answers[2]
      const sharing = step2Answers.find((a) => ['一个人使用', '和室友共用'].includes(a)) || ''
      const budget = step2Answers.find((a) => ['0元', '100元以内', '300元以内', '300元以上'].includes(a)) || ''
      const wall = step2Answers.find((a) => ['可以打孔', '只能无痕', '都不方便'].includes(a)) || ''
      setStoreSoftConstraints({ sharing, budget, wallModification: wall })
      Taro.navigateTo({ url: '/pages/generating/index?type=intervention&sceneId=scene-01' })
    }
  }

  const handleBack = () => {
    if (step === 1) setStep(0)
    else if (step === 2) setStep(1)
    else Taro.navigateBack()
  }

  return (
    <View className="min-h-full bg-background overflow-hidden" style={{ fontFamily: "'Noto Sans SC', sans-serif", maxWidth: '100vw' }}>
      {/* Header */}
      <View className="flex flex-row items-center px-5 pt-12 pb-4">
        <View
          onClick={handleBack}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
        >
          <Text className="text-ink text-sm">&lt;</Text>
        </View>
      </View>

      {/* 标题 */}
      <View className="px-5 mb-4">
        <BilingualTitle en="LIFESTYLE CHAT" zh="生活方式对话" size="lg" />
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 160px)' }}>
        {/* Agent 消息 */}
        <View className="px-5 mb-6">
          <View className="bg-card rounded p-4 mb-4">
            <Text className="block text-sm text-ink leading-relaxed">
              {loadingAnalysis
                ? '正在观察你的空间...'
                : agentFirstMsg || '我看到了一个温馨的空间。在我们继续之前，我想了解一下——'}
            </Text>
          </View>

          {/* 当前问题 */}
          <View className="bg-card rounded p-4 mb-4">
            <Text className="block text-sm text-ink leading-relaxed">
              {currentQuestion?.q || '请选择'}
            </Text>
          </View>
        </View>

        {/* 选项 */}
        <View className="px-5">
          {currentQuestion?.options.map((opt, i) => (
            <View
              key={i}
              className={`mb-3 rounded p-4 hover-lift ${
                answers[step].includes(opt) ? 'bg-[#f0d77a]' : 'bg-card'
              }`}
              style={{ borderWidth: '1.5px', borderColor: answers[step].includes(opt) ? '#d9a823' : '#b5ad9f' }}
              onClick={() => handleSelectOption(opt)}
            >
              <Text className="text-sm text-ink">{opt}</Text>
            </View>
          ))}
        </View>

        {/* 自定义输入框 */}
        <View className="px-5 mt-2 mb-4">
          <View
            className="flex flex-row items-center gap-2 rounded-lg p-1"
            style={{ backgroundColor: '#f5f5f5' }}
          >
            <View className="flex-1 px-3">
              <Input
                className="bg-transparent text-sm py-2"
                placeholder="或者直接告诉我..."
                value={customInput}
                onInput={(e) => setCustomInput(e.detail.value)}
                onConfirm={handleSubmitCustomInput}
              />
            </View>
            {/* 语音输入按钮 */}
            <View
              className="flex items-center justify-center rounded-full"
              style={{ width: '36px', height: '36px', backgroundColor: '#e8e4dc' }}
              onClick={() => {
                Taro.showToast({ title: '语音功能仅在小程序中可用', icon: 'none', duration: 1500 })
              }}
            >
              <Text className="text-[#7a736a] text-sm">🎤</Text>
            </View>
            {/* 发送按钮 */}
            <View
              className="flex items-center justify-center rounded-full"
              style={{
                width: '36px',
                height: '36px',
                backgroundColor: customInput.trim() ? '#1a1814' : '#ccc',
              }}
              onClick={handleSubmitCustomInput}
            >
              <Text className="text-white text-sm">↑</Text>
            </View>
          </View>
        </View>

        {/* 继续按钮 */}
        <View className="px-5 mt-2">
          <View
            className="bg-ink rounded-full py-4 flex items-center justify-center hover-lift"
            onClick={handleNext}
          >
            <Text className="text-white text-base">
              {step === 0 ? '继续' : step === 1 ? '继续' : '生成方案'}
            </Text>
          </View>
        </View>

        <View className="h-24" />
      </ScrollView>

      <CustomTabBar current="grow" />
    </View>
  )
}
