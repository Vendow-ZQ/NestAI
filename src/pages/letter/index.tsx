import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { NobiSVG } from '@/components/nobi'
import { HandLine } from '@/components/hand-drawn'
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
    <View className="min-h-full bg-background">
      {/* Header */}
      <View className="flex flex-row items-center px-5 pt-12 pb-4">
        <View onClick={handleBack} className="mr-3">
          <Text className="text-ink font-ui text-sm">← 返回</Text>
        </View>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 80px)' }}>
        {/* 改造前后小图对比 */}
        <View className="flex flex-row gap-2 px-5 mb-6">
          <View className="flex-1">
            <Image
              src={letter.beforeImage}
              className="w-full h-24 rounded"
              mode="aspectFill"
            />
            <Text className="block text-xs text-ink-mute font-ui text-center mt-1">之前</Text>
          </View>
          <View className="flex-1">
            <Image
              src={letter.afterImage}
              className="w-full h-24 rounded"
              mode="aspectFill"
            />
            <Text className="block text-xs text-ink-mute font-ui text-center mt-1">之后</Text>
          </View>
        </View>

        {/* 信件主体 */}
        <View className="px-5">
          <HandLine />

          <Text className="block font-serif italic text-base text-ink mt-6 mb-4 leading-relaxed">
            亲爱的你，
          </Text>

          {letter.content.map((paragraph, i) => (
            <Text
              key={i}
              className="block font-serif italic text-base text-ink-soft mb-4 leading-relaxed"
            >
              {paragraph}
            </Text>
          ))}

          <HandLine />

          {/* Nobi 署名 */}
          <View className="flex flex-row items-center justify-end gap-2 my-6">
            <Text className="font-handwritten text-lg text-ink">—— Nobi</Text>
            <NobiSVG pose="avatar" size={28} />
          </View>

          <HandLine />

          {/* 下一步可以试试 */}
          <View className="mt-6 mb-4">
            <Text className="block font-handwritten text-sm text-ink-mute mb-3">下一步可以试试</Text>
            {MOCK_NEXT_ACTIONS.slice(0, 1).map((item) => (
              <Card key={item.id} className="bg-card">
                <CardContent className="p-4 flex flex-row items-center gap-3">
                  <Image
                    src={item.previewImage}
                    className="w-16 h-12 rounded"
                    mode="aspectFill"
                  />
                  <View className="flex-1">
                    <Text className="block text-sm font-semibold text-ink font-ui">{item.title}</Text>
                    <Text className="block text-xs text-ink-mute font-ui mt-1">{item.firstStep}</Text>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>

          {/* 分享按钮 */}
          <View
            className="bg-card rounded-full py-3 flex flex-row items-center justify-center gap-2 mb-8 border border-ink-faint"
            style={{ borderWidth: '1.5px' }}
            onClick={handleShare}
          >
            <Text className="text-sm text-ink font-ui">📤 分享给朋友</Text>
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>
    </View>
  )
}
