import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { AgentMessage, UserMessage } from '@/components/agent'
import { MOCK_LIFESTYLE_OPTIONS } from '@/lib/mock/data'
import { useLifestyleStore } from '@/lib/store/lifestyle-store'
import { useSpaceStore } from '@/lib/store/space-store'

type ChatStep = 'aspiration' | 'currentState' | 'constraints' | 'done'

export default function ChatPage() {
  const [step, setStep] = useState<ChatStep>('aspiration')
  const [selectedAspiration, setSelectedAspiration] = useState<string[]>([])
  const [selectedCurrent, setSelectedCurrent] = useState<string[]>([])
  const [constraintStep, setConstraintStep] = useState(0)
  const [constraints, setConstraints] = useState({ sharing: '', budget: '', wallModification: '' })

  const detectedObjects = useSpaceStore((s) => s.spaceProfile?.detectedObjects ?? [])

  const objectDesc = detectedObjects.length > 0
    ? detectedObjects.map((o) => `一张${o.name}（${o.position}，${o.condition}）`).join('、')
    : '一张床、一张桌子，靠窗有一盆植物'

  const handleSelectAspiration = (option: string) => {
    const newSelection = selectedAspiration.includes(option)
      ? selectedAspiration.filter((s) => s !== option)
      : [...selectedAspiration, option]
    setSelectedAspiration(newSelection)
  }

  const handleAspirationNext = () => {
    if (selectedAspiration.length > 0) {
      useLifestyleStore.getState().setAspiration(selectedAspiration)
      setStep('currentState')
    }
  }

  const handleSelectCurrent = (option: string) => {
    const newSelection = selectedCurrent.includes(option)
      ? selectedCurrent.filter((s) => s !== option)
      : [...selectedCurrent, option]
    setSelectedCurrent(newSelection)
  }

  const handleCurrentNext = () => {
    if (selectedCurrent.length > 0) {
      useLifestyleStore.getState().setCurrentState(selectedCurrent)
      setStep('constraints')
    }
  }

  const handleConstraintSelect = (value: string) => {
    const keys = ['sharing', 'budget', 'wallModification'] as const
    const key = keys[constraintStep]
    const newConstraints = { ...constraints, [key]: value }
    setConstraints(newConstraints)

    if (constraintStep < 2) {
      setConstraintStep(constraintStep + 1)
    } else {
      useLifestyleStore.getState().setSoftConstraints(newConstraints)
      setStep('done')
      // 跳到方案生成
      Taro.navigateTo({ url: '/pages/generating/index?type=intervention' })
    }
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  const constraintQuestions = [
    { question: '这个空间主要是你一个人使用，还是和别人共用？', options: MOCK_LIFESTYLE_OPTIONS.sharing },
    { question: '你能接受的投入大概是？', options: MOCK_LIFESTYLE_OPTIONS.budget },
    { question: '墙面能不能贴东西？', options: MOCK_LIFESTYLE_OPTIONS.wallModification },
  ]

  return (
    <View className="min-h-full bg-background">
      {/* Header */}
      <View className="flex flex-row items-center px-5 pt-12 pb-4">
        <View onClick={handleBack} className="mr-3">
          <Text className="text-ink font-ui text-sm">← 返回</Text>
        </View>
        <Text className="font-handwritten text-lg text-ink">Lifestyle Chat</Text>
      </View>

      <ScrollView scrollY className="px-5" style={{ height: 'calc(100vh - 100px)' }}>
        {/* Agent 初始观察 */}
        <AgentMessage>
          我看到了{objectDesc}。在我们继续之前，我想了解一下——
        </AgentMessage>

        {/* 层1: 向往生活 */}
        <AgentMessage>
          你最希望这个空间帮你做到什么？
        </AgentMessage>

        <View className="mb-4">
          {MOCK_LIFESTYLE_OPTIONS.aspiration.map((option) => (
            <View
              key={option}
              className={`mb-2 p-3 rounded border ${
                selectedAspiration.includes(option)
                  ? 'border-bean bg-accent'
                  : 'border-ink-faint bg-card'
              }`}
              style={{ borderWidth: '1.5px' }}
              onClick={() => handleSelectAspiration(option)}
            >
              <Text
                className={`text-sm font-ui ${
                  selectedAspiration.includes(option) ? 'text-ink' : 'text-ink-soft'
                }`}
              >
                {option}
              </Text>
            </View>
          ))}
        </View>

        {selectedAspiration.length > 0 && step === 'aspiration' && (
          <View className="mb-6">
            <View
              className="bg-ink rounded-full py-3 px-6 flex items-center justify-center"
              onClick={handleAspirationNext}
            >
              <Text className="text-paper font-ui text-sm">继续</Text>
            </View>
          </View>
        )}

        {/* 层2: 当前状态 */}
        {step !== 'aspiration' && (
          <>
            {selectedAspiration.map((a) => (
              <UserMessage key={a}>{a}</UserMessage>
            ))}
            <AgentMessage>
              那现在这个空间，最常发生什么？
            </AgentMessage>
            <View className="mb-4">
              {MOCK_LIFESTYLE_OPTIONS.currentState.map((option) => (
                <View
                  key={option}
                  className={`mb-2 p-3 rounded border ${
                    selectedCurrent.includes(option)
                      ? 'border-bean bg-accent'
                      : 'border-ink-faint bg-card'
                  }`}
                  style={{ borderWidth: '1.5px' }}
                  onClick={() => handleSelectCurrent(option)}
                >
                  <Text
                    className={`text-sm font-ui ${
                      selectedCurrent.includes(option) ? 'text-ink' : 'text-ink-soft'
                    }`}
                  >
                    {option}
                  </Text>
                </View>
              ))}
            </View>
            {selectedCurrent.length > 0 && step === 'currentState' && (
              <View className="mb-6">
                <View
                  className="bg-ink rounded-full py-3 px-6 flex items-center justify-center"
                  onClick={handleCurrentNext}
                >
                  <Text className="text-paper font-ui text-sm">继续</Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* 层3: 必要条件 */}
        {step === 'constraints' && (
          <>
            {selectedCurrent.map((c) => (
              <UserMessage key={c}>{c}</UserMessage>
            ))}
            <AgentMessage>
              为了不生成你做不到的方案，我再确认几个小条件。
            </AgentMessage>
            <AgentMessage>
              {constraintQuestions[constraintStep].question}
            </AgentMessage>
            <View className="mb-6">
              {constraintQuestions[constraintStep].options.map((option) => (
                <View
                  key={option}
                  className="mb-2 p-3 rounded border border-ink-faint bg-card"
                  style={{ borderWidth: '1.5px' }}
                  onClick={() => handleConstraintSelect(option)}
                >
                  <Text className="text-sm font-ui text-ink-soft">{option}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View className="h-20" />
      </ScrollView>
    </View>
  )
}
