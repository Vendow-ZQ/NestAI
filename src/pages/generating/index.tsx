import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'

import { useUserStore } from '@/lib/store/user-store'
import { useSpaceStore } from '@/lib/store/space-store'
import { CustomTabBar } from '@/components/tab-bar'
import { BilingualTitle } from '@/components/bilingual-title'
import { Network } from '@/network'
import { errorMessages } from '@/lib/error-messages'

export default function GeneratingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const setHasUploadedSpace = useUserStore((s) => s.setHasUploadedSpace)
  const setSpaceProfile = useSpaceStore((s) => s.setSpaceProfile)

  const params = Taro.getCurrentInstance().router?.params
  const type = params?.type || 'space'
  const sceneId = params?.sceneId || 'scene-01'
  const sessionId = params?.sessionId

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

  const titleMap = {
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
      // 保持进度条动画
      const timer = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= steps.length - 1) return prev
          return prev + 1
        })
      }, stepDuration)

      // 真调用 analyze
      Network.request({
        url: `/api/sessions/${sessionId}/analyze`,
        method: 'POST',
        timeout: 60000,
      }).then(() => {
        clearInterval(timer)
        Taro.redirectTo({ url: `/pages/chat/index?sessionId=${sessionId}` })
      }).catch((err) => {
        clearInterval(timer)
        console.error('analyze 失败:', err)
        Taro.showToast({ title: errorMessages.analyzeFailed, icon: 'none' })
      })

      return () => clearInterval(timer)
    }

    // 原有逻辑: intervention / letter / 无 sessionId 的 space
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(timer)
          setTimeout(() => {
            if (type === 'space') {
              Taro.redirectTo({ url: `/pages/chat/index?sceneId=${sceneId}` })
            } else if (type === 'intervention') {
              Taro.redirectTo({ url: `/pages/result/index?sceneId=${sceneId}` })
            } else {
              Taro.redirectTo({ url: '/pages/letter/index' })
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
    <View className="min-h-full bg-background overflow-hidden flex flex-col items-center justify-center" style={{ fontFamily: "'Noto Sans SC', sans-serif", maxWidth: '100vw' }}>
      {/* 标题 */}
      <View className="mb-8">
        <BilingualTitle en={currentTitle.en} zh={currentTitle.zh} size="lg" />
      </View>

      {/* 进度条 */}
      <View className="w-48 h-1 bg-[#f0f0f0] rounded-full mb-10 overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{ width: `${progress}%`, backgroundColor: '#d9a823', transition: 'width 0.5s ease-out' }}
        />
      </View>

      {/* 步骤文字 */}
      <View className="flex flex-col items-center gap-6">
        {steps.map((step, i) => (
          <View key={i} className="flex flex-col items-center" style={{ opacity: i <= currentStep ? 1 : 0.3, transition: 'opacity 0.5s ease-out' }}>
            <Text className="block text-base text-ink">{step.zh}</Text>
            <Text className="block text-xs text-[#999] mt-1" style={{ fontFamily: "'Arial Black', sans-serif" }}>{step.en}</Text>
          </View>
        ))}
      </View>

      <CustomTabBar current="grow" />
    </View>
  )
}
