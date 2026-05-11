import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { PlaceholderImage } from '@/components/placeholder-image'
import { MOCK_LETTERS, MOCK_NEXT_ACTIONS } from '@/lib/mock/data'
import { Card, CardContent } from '@/components/ui/card'

export default function LetterPage() {
  const params = Taro.getCurrentInstance().router?.params
  const letterId = params?.id || 'letter-1'
  const letter = MOCK_LETTERS.find((l) => l.id === letterId) ?? MOCK_LETTERS[0]

  const handleBack = () => {
    Taro.navigateBack()
  }

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' })
  }

  return (
    <View className="min-h-full bg-background" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
      {/* Header */}
      <View className="flex flex-row items-center px-5 pt-12 pb-4">
        <View onClick={handleBack} className="mr-3">
          <Text className="text-ink text-sm">← 返回</Text>
        </View>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 80px)' }}>
        {/* 改造前后小图对比 */}
        <View className="flex flex-row gap-2 px-5 mb-6">
          <View className="flex-1">
            <PlaceholderImage label="改造前" className="w-full h-24 rounded" />
            <Text className="block text-xs text-[#999] text-center mt-1">之前</Text>
          </View>
          <View className="flex-1">
            <PlaceholderImage label="改造后" className="w-full h-24 rounded" />
            <Text className="block text-xs text-[#999] text-center mt-1">之后</Text>
          </View>
        </View>

        {/* 信件主体 */}
        <View className="px-5">
          <View className="h-px bg-[#ddd] opacity-30 mb-4" />

          <Text className="block text-base text-ink mt-4 mb-4 leading-relaxed">
            亲爱的你，
          </Text>

          {letter.content.map((paragraph, i) => (
            <Text
              key={i}
              className="block text-base text-[#3a3530] mb-4 leading-relaxed"
            >
              {paragraph}
            </Text>
          ))}

          <View className="h-px bg-[#ddd] opacity-30 my-4" />

          {/* Nobi 署名 */}
          <View className="flex flex-row items-center justify-end gap-2 my-4">
            <Text className="text-lg text-ink">—— Nobi</Text>
          </View>

          <View className="h-px bg-[#ddd] opacity-30 my-4" />

          {/* 下一步可以试试 */}
          <View className="mt-4 mb-4">
            <Text className="block text-sm text-[#999] mb-3">下一步可以试试</Text>
            {MOCK_NEXT_ACTIONS.slice(0, 1).map((item) => (
              <Card key={item.id} className="bg-card">
                <CardContent className="p-4 flex flex-row items-center gap-3">
                  <PlaceholderImage label={item.title} className="w-16 h-12 rounded" />
                  <View className="flex-1">
                    <Text className="block text-sm font-semibold text-ink">{item.title}</Text>
                    <Text className="block text-xs text-[#999] mt-1">{item.firstStep}</Text>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>

          {/* 分享按钮 */}
          <View
            className="bg-card rounded-full py-3 flex flex-row items-center justify-center gap-2 mb-8"
            style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
            onClick={handleShare}
          >
            <Text className="text-sm text-ink">📤 分享给朋友</Text>
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>
    </View>
  )
}
