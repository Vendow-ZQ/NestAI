import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'

type GeneratingType = 'space' | 'intervention' | 'letter'

const STEP_CONFIG: Record<GeneratingType, { steps: string[]; duration: number; nextUrl: string }> = {
  space: {
    steps: ['看见这个空间...', '识别物件与布局...', '注意可干预点...'],
    duration: 3000,
    nextUrl: '/pages/chat/index',
  },
  intervention: {
    steps: ['理解你想靠近的生活...', '在养料库里找参考...', '把方案翻译成今晚就能做的事...'],
    duration: 4500,
    nextUrl: '/pages/result/index',
  },
  letter: {
    steps: ['看见你做了什么...', '想想这次变化说出了什么...', '写一封信...'],
    duration: 5500,
    nextUrl: '/pages/letter/index',
  },
}

export default function GeneratingPage() {
  const params = Taro.getCurrentInstance().router?.params
  const type = (params?.type as GeneratingType) || 'space'
  const config = STEP_CONFIG[type]

  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const stepDuration = config.duration / config.steps.length

    const stepTimer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < config.steps.length - 1) return prev + 1
        clearInterval(stepTimer)
        return prev
      })
    }, stepDuration)

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer)
          return 100
        }
        return prev + 2
      })
    }, config.duration / 50)

    const navigateTimer = setTimeout(() => {
      Taro.redirectTo({ url: config.nextUrl })
    }, config.duration + 500)

    return () => {
      clearInterval(stepTimer)
      clearInterval(progressTimer)
      clearTimeout(navigateTimer)
    }
  }, [config])

  return (
    <View
      className="min-h-full flex flex-col items-center justify-center"
      style={{ backgroundColor: '#ffffff', fontFamily: "'Noto Sans SC', sans-serif" }}
    >
      {/* 进度条 */}
      <View className="w-48 h-1 bg-[#f0f0f0] rounded-full mb-12 overflow-hidden">
        <View
          className="h-full bg-ink rounded-full"
          style={{ width: `${progress}%`, transition: 'width 100ms linear' }}
        />
      </View>

      {/* 动画指示 */}
      <View className="mb-8 w-16 h-16 rounded-full bg-[#f5f5f5] flex items-center justify-center">
        <Text className="text-2xl">✨</Text>
      </View>

      {/* 步骤文字 */}
      <View className="flex flex-col items-center gap-4">
        {config.steps.map((step, i) => (
          <Text
            key={i}
            className={`block text-sm ${
              i <= currentStep ? 'text-ink' : 'text-[#b5ad9f]'
            }`}
            style={{ opacity: i <= currentStep ? 1 : 0.4 }}
          >
            {i <= currentStep ? step : '···'}
          </Text>
        ))}
      </View>
    </View>
  )
}
