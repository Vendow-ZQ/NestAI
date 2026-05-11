import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'

import { TonightButton } from '@/components/hand-drawn'

export default function SharePage() {
  const [feeling, setFeeling] = useState('')
  const [selectedSkipped, setSelectedSkipped] = useState<string[]>([])

  const skipSteps = [
    '桌面收纳没动',
    '没买台灯',
    '海报还没挂',
    '充电线没整理',
  ]

  const toggleSkip = (step: string) => {
    setSelectedSkipped((prev) =>
      prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]
    )
  }

  const handleSubmit = () => {
    Taro.navigateTo({ url: '/pages/generating/index?type=letter' })
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className="min-h-full bg-background">
      {/* Header */}
      <View className="flex flex-row items-center px-5 pt-12 pb-4">
        <View onClick={handleBack} className="mr-3">
          <Text className="text-ink font-ui text-sm">← 返回</Text>
        </View>
        <Text className="font-handwritten text-lg text-ink">看看变化了</Text>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 100px)' }}>
        {/* Step 1: 拍一张现在的样子 */}
        <View className="px-5 mb-6">
          <Text className="block text-sm text-ink-mute font-ui mb-3">Step 1:</Text>
          <Text className="block text-base text-ink font-ui mb-4">拍一张现在的样子</Text>
          <View
            className="w-full h-48 border-2 border-dashed rounded flex flex-col items-center justify-center"
            style={{ borderColor: '#b5ad9f' }}
            onClick={() => {}}
          >
            <Text className="block text-2xl mb-2">📷</Text>
            <Text className="block text-sm text-ink-mute font-ui">点击拍照或上传</Text>
          </View>
        </View>

        {/* Step 2: 说说感受 */}
        <View className="px-5 mb-6">
          <Text className="block text-sm text-ink-mute font-ui mb-3">Step 2: (可选)</Text>
          <Text className="block text-base text-ink font-ui mb-4">说说感受?</Text>
          <View className="bg-card rounded p-4">
            <textarea
              className="w-full bg-transparent text-sm font-serif text-ink"
              style={{ minHeight: '80px', outline: 'none', border: 'none', resize: 'none' }}
              placeholder="做完之后，你坐进去的感觉怎么样？"
              value={feeling}
              onInput={(e) => setFeeling((e as unknown as { detail: { value: string } }).detail.value)}
            />
          </View>
        </View>

        {/* Step 3: 哪一步没做到 */}
        <View className="px-5 mb-6">
          <Text className="block text-sm text-ink-mute font-ui mb-3">Step 3: (可选)</Text>
          <Text className="block text-base text-ink font-ui mb-4">哪一步没做到?</Text>
          {skipSteps.map((step) => (
            <View
              key={step}
              className="flex flex-row items-center gap-3 mb-3"
              onClick={() => toggleSkip(step)}
            >
              <View
                className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selectedSkipped.includes(step) ? 'bg-ink border-ink' : 'border-ink-faint'
                }`}
              >
                {selectedSkipped.includes(step) && (
                  <Text className="text-xs text-paper font-ui">✓</Text>
                )}
              </View>
              <Text className="text-sm text-ink-soft font-serif">{step}</Text>
            </View>
          ))}
        </View>

        {/* 主按钮 */}
        <View className="px-5 mt-4">
          <View onClick={handleSubmit}>
            <TonightButton label="生成一封信" subLabel="Write a letter." />
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>
    </View>
  )
}
