import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'

import { useLifestyleStore } from '@/lib/store/lifestyle-store'
import { MOCK_SCENES } from '@/lib/mock/data'
import { CustomTabBar } from '@/components/tab-bar'
import { BilingualTitle } from '@/components/bilingual-title'

const ASPIRATION_OPTIONS = [
  { id: 'focus', label: '更容易进入专注状态' },
  { id: 'relax', label: '回来之后真的能放松下来' },
  { id: 'identity', label: '更像"我自己的地方"' },
  { id: 'social', label: '更适合朋友来坐一会儿' },
  { id: 'order', label: '更容易保持整洁和秩序' },
  { id: 'sleep', label: '更适合睡觉和恢复' },
]

const PAIN_OPTIONS = [
  { id: 'cant-focus', label: '我经常在这里学习，但很难进入状态' },
  { id: 'procrastinate', label: '我经常在这里刷手机/拖延' },
  { id: 'not-relax', label: '我主要在这里休息，但总觉得不够放松' },
  { id: 'cluttered', label: '东西越来越多，找不到放的地方' },
  { id: 'dark', label: '光线不好，白天也要开灯' },
  { id: 'crowded', label: '空间太小，动线不舒服' },
]

const SHARING_OPTIONS = ['一个人使用', '和室友共用']
const BUDGET_OPTIONS = ['0元', '100元以内', '300元以内', '300元以上']
const WALL_OPTIONS = ['可以打孔', '只能无痕', '都不方便']

type ChatStep = 'aspiration' | 'pain' | 'constraints'

export default function ChatPage() {
  const [step, setStep] = useState<ChatStep>('aspiration')
  const [aspiration, setAspiration] = useState<string[]>([])
  const [pain, setPain] = useState<string[]>([])
  const [sharing, setSharing] = useState('')
  const [budget, setBudget] = useState('')
  const [wall, setWall] = useState('')

  const setStoreAspiration = useLifestyleStore((s) => s.setAspiration)
  const setStoreCurrentState = useLifestyleStore((s) => s.setCurrentState)
  const setStoreSoftConstraints = useLifestyleStore((s) => s.setSoftConstraints)

  const scene = MOCK_SCENES[0]
  const objectDesc = scene.description

  const handleSelectAspiration = (id: string) => {
    setAspiration((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    )
  }

  const handleSelectPain = (id: string) => {
    setPain((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const handleNext = () => {
    if (step === 'aspiration') {
      setStoreAspiration(aspiration)
      setStep('pain')
    } else if (step === 'pain') {
      setStoreCurrentState(pain)
      setStep('constraints')
    } else {
      setStoreSoftConstraints({ sharing, budget, wallModification: wall })
      Taro.navigateTo({ url: '/pages/generating/index?type=intervention&sceneId=scene-01' })
    }
  }

  const handleBack = () => {
    if (step === 'pain') setStep('aspiration')
    else if (step === 'constraints') setStep('pain')
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
              我看到了{objectDesc}。在我们继续之前，我想了解一下——
            </Text>
          </View>

          {step === 'aspiration' && (
            <View className="bg-card rounded p-4 mb-4">
              <Text className="block text-sm text-ink leading-relaxed">
                你最希望这个空间帮你做到什么？
              </Text>
            </View>
          )}

          {step === 'pain' && (
            <View className="bg-card rounded p-4 mb-4">
              <Text className="block text-sm text-ink leading-relaxed">
                那现在这个空间，最常发生什么？
              </Text>
            </View>
          )}

          {step === 'constraints' && (
            <View className="bg-card rounded p-4 mb-4">
              <Text className="block text-sm text-ink leading-relaxed">
                为了不生成你做不到的方案，我再确认几个小条件。
              </Text>
            </View>
          )}
        </View>

        {/* 选项 */}
        <View className="px-5">
          {step === 'aspiration' && ASPIRATION_OPTIONS.map((opt) => (
            <View
              key={opt.id}
              className={`mb-3 rounded p-4 hover-lift ${
                aspiration.includes(opt.id) ? 'bg-[#f0d77a]' : 'bg-card'
              }`}
              style={{ borderWidth: '1.5px', borderColor: aspiration.includes(opt.id) ? '#d9a823' : '#b5ad9f' }}
              onClick={() => handleSelectAspiration(opt.id)}
            >
              <Text className="text-sm text-ink">{opt.label}</Text>
            </View>
          ))}

          {step === 'pain' && PAIN_OPTIONS.map((opt) => (
            <View
              key={opt.id}
              className={`mb-3 rounded p-4 hover-lift ${
                pain.includes(opt.id) ? 'bg-[#f0d77a]' : 'bg-card'
              }`}
              style={{ borderWidth: '1.5px', borderColor: pain.includes(opt.id) ? '#d9a823' : '#b5ad9f' }}
              onClick={() => handleSelectPain(opt.id)}
            >
              <Text className="text-sm text-ink">{opt.label}</Text>
            </View>
          ))}

          {step === 'constraints' && (
            <View>
              <Text className="block text-sm text-[#999] mb-2">空间使用:</Text>
              <View className="flex flex-row flex-wrap gap-2 mb-4">
                {SHARING_OPTIONS.map((opt) => (
                  <View
                    key={opt}
                    className={`rounded-full px-4 py-2 hover-lift ${sharing === opt ? 'bg-ink' : 'bg-card'}`}
                    style={{ borderWidth: '1.5px', borderColor: sharing === opt ? 'transparent' : '#b5ad9f' }}
                    onClick={() => setSharing(opt)}
                  >
                    <Text className={`text-sm ${sharing === opt ? 'text-white' : 'text-[#999]'}`}>{opt}</Text>
                  </View>
                ))}
              </View>

              <Text className="block text-sm text-[#999] mb-2">预算:</Text>
              <View className="flex flex-row flex-wrap gap-2 mb-4">
                {BUDGET_OPTIONS.map((opt) => (
                  <View
                    key={opt}
                    className={`rounded-full px-4 py-2 hover-lift ${budget === opt ? 'bg-ink' : 'bg-card'}`}
                    style={{ borderWidth: '1.5px', borderColor: budget === opt ? 'transparent' : '#b5ad9f' }}
                    onClick={() => setBudget(opt)}
                  >
                    <Text className={`text-sm ${budget === opt ? 'text-white' : 'text-[#999]'}`}>{opt}</Text>
                  </View>
                ))}
              </View>

              <Text className="block text-sm text-[#999] mb-2">墙面:</Text>
              <View className="flex flex-row flex-wrap gap-2 mb-4">
                {WALL_OPTIONS.map((opt) => (
                  <View
                    key={opt}
                    className={`rounded-full px-4 py-2 hover-lift ${wall === opt ? 'bg-ink' : 'bg-card'}`}
                    style={{ borderWidth: '1.5px', borderColor: wall === opt ? 'transparent' : '#b5ad9f' }}
                    onClick={() => setWall(opt)}
                  >
                    <Text className={`text-sm ${wall === opt ? 'text-white' : 'text-[#999]'}`}>{opt}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* 继续按钮 */}
        <View className="px-5 mt-4">
          <View
            className="bg-ink rounded-full py-4 flex items-center justify-center hover-lift"
            onClick={handleNext}
          >
            <Text className="text-white text-base">
              {step === 'aspiration' ? '继续' : step === 'pain' ? '继续' : '生成方案'}
            </Text>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>

      <CustomTabBar current="grow" />
    </View>
  )
}
