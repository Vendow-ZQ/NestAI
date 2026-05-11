import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { useMemoryStore } from '@/lib/store/memory-store'
import { MOCK_LETTERS, MOCK_NEXT_ACTIONS } from '@/lib/mock/data'
import { PlaceholderImage } from '@/components/placeholder-image'
import { CustomTabBar } from '@/components/tab-bar'
import { BilingualTitle } from '@/components/bilingual-title'

export default function LetterPage() {
  const letters = useMemoryStore((s) => s.letters)
  const displayLetter = letters.length > 0 ? letters[letters.length - 1] : MOCK_LETTERS[0]

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
        <BilingualTitle en="A LETTER" zh="一封信" size="lg" />
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 160px)' }}>
        {/* 改造前后小图对比 */}
        <View className="px-5 mb-6">
          <View className="flex flex-row gap-3">
            <View className="flex-1 rounded overflow-hidden hover-lift" style={{ aspectRatio: '4 / 3' }}>
              <PlaceholderImage label="改造前" className="w-full h-full" />
            </View>
            <View className="flex-1 rounded overflow-hidden hover-lift" style={{ aspectRatio: '4 / 3' }}>
              <PlaceholderImage label="改造后" className="w-full h-full" />
            </View>
          </View>
        </View>

        {/* 信件正文 */}
        <View className="px-5">
          <Text className="block text-base text-ink mb-6">亲爱的你,</Text>

          {displayLetter.content.map((paragraph, i) => (
            <Text key={i} className="block text-sm text-[#3a3530] leading-relaxed mb-3">
              {paragraph}
            </Text>
          ))}

          {/* 署名 */}
          <View className="mt-6 mb-8">
            <Text className="block text-sm text-ink">—— Nobi</Text>
          </View>

          {/* 下一步可以试试 */}
          <View className="mb-6">
            <BilingualTitle en="NEXT STEP" zh="下一步可以试试" size="sm" />
            {MOCK_NEXT_ACTIONS.slice(0, 1).map((item) => (
              <View
                key={item.id}
                className="bg-card rounded p-4 mt-3 hover-lift"
                style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
                onClick={() => {
                  const sceneId = item.sceneId || 'scene-01'
                  Taro.navigateTo({ url: `/pages/result/index?sceneId=${sceneId}` })
                }}
              >
                <Text className="block text-sm text-ink font-semibold">{item.title}</Text>
                <Text className="block text-xs text-[#999] mt-1">{item.firstStep}</Text>
              </View>
            ))}
          </View>

          {/* 分享按钮 */}
          <View className="mb-8">
            <View
              className="rounded-full py-3 flex items-center justify-center hover-lift"
              style={{ borderWidth: '1.5px', borderColor: '#1a1814' }}
            >
              <Text className="text-ink text-base">分享给朋友</Text>
            </View>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>

      <CustomTabBar current="grow" />
    </View>
  )
}
