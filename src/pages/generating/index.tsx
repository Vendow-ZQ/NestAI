import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'

import { CustomTabBar } from '@/components/tab-bar'

export default function GeneratingPage() {
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const params = Taro.getCurrentInstance().router?.params
  const type = params?.type || 'space'
  const sceneId = params?.sceneId || 'scene-01'

  const spaceSteps = [
    '看见这个空间...',
    '识别物件与布局...',
    '注意可干预点...',
  ]

  const interventionSteps = [
    '理解你想靠近的生活...',
    '在养料库里找参考...',
    '把方案翻译成今晚就能做的事...',
  ]

  const letterSteps = [
    '看见你做了什么...',
    '想想这次变化说出了什么...',
    '写一封信...',
  ]

  const steps = type === 'intervention'
    ? interventionSteps
    : type === 'letter'
    ? letterSteps
    : spaceSteps

  const duration = type === 'intervention' ? 4000 : type === 'letter' ? 5000 : 3000

  const getTargetUrl = () => {
    if (type === 'intervention') {
      return `/pages/result/index?sceneId=${sceneId}`
    }
    if (type === 'letter') {
      return '/pages/letter/index'
    }
    return '/pages/chat/index'
  }

  useEffect(() => {
    const stepInterval = duration / steps.length
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) return prev + 1
        return prev
      })
    }, stepInterval)

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100
        return prev + 2
      })
    }, duration / 50)

    const targetUrl = getTargetUrl()
    const finishTimer = setTimeout(() => {
      Taro.redirectTo({ url: targetUrl })
    }, duration + 500)

    return () => {
      clearInterval(timer)
      clearInterval(progressTimer)
      clearTimeout(finishTimer)
    }
  }, [])

  return (
    <View className="min-h-full bg-background flex flex-col items-center justify-center" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
      {/* 进度条 */}
      <View className="w-3/4 h-1 bg-card rounded-full mb-12 overflow-hidden">
        <View className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: '#d9a823', transition: 'width 0.3s ease-out' }} />
      </View>

      {/* 步骤文字 */}
      <View className="flex flex-col items-center gap-4">
        {steps.map((step, i) => (
          <Text
            key={i}
            className="block text-base"
            style={{
              color: i <= currentStep ? '#1a1814' : '#b5ad9f',
              transition: 'color 0.5s ease-out',
            }}
          >
            {step}
          </Text>
        ))}
      </View>

      {/* 底部导航栏 */}
      <CustomTabBar current="grow" />
    </View>
  )
}
