import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { useMemoryStore } from '@/lib/store/memory-store'
import { MOCK_LETTERS } from '@/lib/mock/data'
import { CustomTabBar } from '@/components/tab-bar'
import { BilingualTitle } from '@/components/bilingual-title'

export default function SharePage() {
  const addLetter = useMemoryStore((s) => s.addLetter)

  const handleGenerate = () => {
    const letter = MOCK_LETTERS[0]
    addLetter(letter)
    Taro.navigateTo({ url: '/pages/generating/index?type=letter' })
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className="min-h-full bg-background overflow-hidden" style={{ fontFamily: "'Noto Sans SC', sans-serif", maxWidth: '100vw' }}>
      {/* Header */}
      <View className="flex flex-row items-center px-5 pt-12 pb-2">
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
        <BilingualTitle en="SHARE CHANGES" zh="看看变化了" size="lg" />
      </View>

      {/* Step 1: 拍照 */}
      <View className="px-5 mb-6">
        <Text className="block text-sm text-[#999] mb-2">Step 1:</Text>
        <Text className="block text-base text-ink mb-3">拍一张现在的样子</Text>
        <View
          className="w-full rounded flex items-center justify-center bg-[#f5f5f5] hover-lift"
          style={{ aspectRatio: '4 / 3', borderStyle: 'dashed', borderWidth: '2px', borderColor: '#b5ad9f' }}
        >
          <Text className="text-4xl text-[#b5ad9f]" style={{ opacity: 0.5 }}>+</Text>
        </View>
      </View>

      {/* Step 2: 感受 */}
      <View className="px-5 mb-6">
        <Text className="block text-sm text-[#999] mb-2">Step 2: (可选)</Text>
        <Text className="block text-base text-ink mb-3">说说感受?</Text>
        <View className="bg-card rounded p-3" style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}>
          <Text className="block text-sm text-[#999]">做完之后,你坐进去的感觉怎么样?</Text>
        </View>
      </View>

      {/* Step 3: 未完成步骤 */}
      <View className="px-5 mb-6">
        <Text className="block text-sm text-[#999] mb-2">Step 3: (可选)</Text>
        <Text className="block text-base text-ink mb-3">哪一步没做到?</Text>
        {['桌面收纳没动', '没买台灯', '海报没挂'].map((item, i) => (
          <View key={i} className="flex flex-row items-center gap-2 mb-2">
            <View className="w-5 h-5 rounded flex items-center justify-center" style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}>
              <Text className="text-xs text-[#999]">{i + 1}</Text>
            </View>
            <Text className="flex-1 text-sm text-ink">{item}</Text>
          </View>
        ))}
      </View>

      {/* 生成按钮 */}
      <View className="px-5 mt-4">
        <View
          className="rounded-full py-4 flex items-center justify-center hover-lift"
          style={{ backgroundColor: '#1a1814', boxShadow: '4px 4px 0 #d9a823' }}
          onClick={handleGenerate}
        >
          <View className="flex flex-col items-center">
            <Text className="text-white text-lg">生成一封信</Text>
          </View>
        </View>
      </View>

      <View className="h-24" />

      <CustomTabBar current="grow" />
    </View>
  )
}
