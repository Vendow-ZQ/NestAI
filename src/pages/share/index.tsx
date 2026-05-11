import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'

import { Textarea } from '@/components/ui/textarea'
import { PlaceholderImage } from '@/components/placeholder-image'
import { CustomTabBar } from '@/components/tab-bar'

export default function SharePage() {
  const [feeling, setFeeling] = useState('')
  const [notDone, setNotDone] = useState<string[]>([])

  const notDoneOptions = [
    '桌面收纳没动',
    '没买台灯',
    '没调整布局',
    '没挂东西',
  ]

  const toggleNotDone = (opt: string) => {
    setNotDone((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    )
  }

  const handleGenerate = () => {
    Taro.navigateTo({ url: '/pages/generating/index?type=letter' })
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className="min-h-full bg-background" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
      {/* Header */}
      <View className="flex flex-row items-center px-5 pt-12 pb-4">
        <View onClick={handleBack} className="mr-3">
          <Text className="text-ink text-sm">← 返回</Text>
        </View>
        <Text className="text-lg text-ink font-semibold">看看变化了</Text>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 100px)' }}>
        {/* Step 1: 拍照 */}
        <View className="px-5 mb-6">
          <Text className="block text-base text-ink font-semibold mb-2">Step 1:</Text>
          <Text className="block text-sm text-[#999] mb-3">拍一张现在的样子</Text>
          <View
            className="w-full rounded flex items-center justify-center"
            style={{ borderWidth: '2px', borderColor: '#b5ad9f', borderStyle: 'dashed', height: '180px' }}
          >
            <PlaceholderImage label="点击拍照或上传" className="w-full h-full" />
          </View>
        </View>

        {/* Step 2: 感受 */}
        <View className="px-5 mb-6">
          <Text className="block text-base text-ink font-semibold mb-2">Step 2: (可选)</Text>
          <Text className="block text-sm text-[#999] mb-3">说说感受?</Text>
          <View className="mb-3">
            <Textarea
              className="w-full"
              placeholder="做完之后，你坐进去的感觉怎么样？"
              maxlength={200}
              value={feeling}
              onInput={(e) => setFeeling(e.detail.value)}
            />
          </View>
        </View>

        {/* Step 3: 哪步没做到 */}
        <View className="px-5 mb-6">
          <Text className="block text-base text-ink font-semibold mb-2">Step 3: (可选)</Text>
          <Text className="block text-sm text-[#999] mb-3">哪一步没做到?</Text>
          {notDoneOptions.map((opt) => (
            <View
              key={opt}
              className="flex flex-row items-center gap-2 mb-2"
              onClick={() => toggleNotDone(opt)}
            >
              <View
                className="w-5 h-5 rounded flex items-center justify-center"
                style={{ borderWidth: '1.5px', borderColor: notDone.includes(opt) ? '#d9a823' : '#b5ad9f', backgroundColor: notDone.includes(opt) ? '#d9a823' : 'transparent' }}
              >
                {notDone.includes(opt) && <Text className="text-white text-xs">✓</Text>}
              </View>
              <Text className="text-sm text-ink">{opt}</Text>
            </View>
          ))}
        </View>

        {/* 主按钮 */}
        <View className="px-5 mt-2">
          <View
            className="rounded-full py-4 flex items-center justify-center"
            style={{ backgroundColor: '#1a1814', boxShadow: '4px 4px 0 #d9a823' }}
            onClick={handleGenerate}
          >
            <Text className="text-white text-lg">生成一封信</Text>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>

      {/* 底部导航栏 */}
      <CustomTabBar current="grow" />
    </View>
  )
}
