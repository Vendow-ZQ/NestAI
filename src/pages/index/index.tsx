import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { NobiSVG } from '@/components/nobi'

import { useUserStore } from '@/lib/store/user-store'
import { useInterventionStore } from '@/lib/store/intervention-store'
import { MOCK_FEED, MOCK_NEXT_ACTIONS } from '@/lib/mock/data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function GrowPage() {
  const hasUploadedSpace = useUserStore((s) => s.hasUploadedSpace)
  const nextList = useInterventionStore((s) => s.nextList)

  const handleUpload = () => {
    Taro.navigateTo({ url: '/pages/upload/index' })
  }

  const handleFeedClick = (feedId: string) => {
    console.log('Feed clicked:', feedId)
  }

  return (
    <View className="min-h-full bg-background">
      {/* Header */}
      <View className="flex flex-row items-center justify-between px-5 pt-12 pb-4">
        <View className="flex flex-row items-center gap-2">
          <Text className="font-handwritten text-2xl text-ink">NestAI</Text>
          <NobiSVG pose="avatar" size={24} />
        </View>
        <View className="w-8 h-8 rounded-full bg-paper-deep flex items-center justify-center">
          <Text className="text-xs text-ink-mute font-ui">我</Text>
        </View>
      </View>

      <ScrollView scrollY className="px-5" style={{ height: 'calc(100vh - 140px)' }}>
        {/* 上传区 / 已上传空间卡 */}
        {!hasUploadedSpace ? (
          <View
            className="border-2 border-dashed border-ink-faint rounded p-6 flex flex-col items-center justify-center mb-6"
            style={{ borderWidth: '1.5px', borderStyle: 'dashed', borderColor: '#b5ad9f' }}
            onClick={handleUpload}
          >
            <Text className="block text-lg text-ink font-ui mb-1">上传你的空间</Text>
            <Text className="block text-sm text-ink-mute font-ui mb-4">或描述一下</Text>
            <View className="self-end">
              <NobiSVG pose="lying" size={60} />
            </View>
          </View>
        ) : (
          <Card className="mb-6 bg-card">
            <CardContent className="p-5">
              <View className="flex flex-row items-center gap-3">
                <View className="w-12 h-12 rounded bg-paper flex items-center justify-center">
                  <NobiSVG pose="sitting" size={40} />
                </View>
                <View className="flex-1">
                  <Text className="block text-sm font-semibold text-ink font-ui">我的空间</Text>
                  <Text className="block text-xs text-ink-mute font-ui">32号房 · 靠窗书桌</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* 我的 Next 横向滚动 */}
        {(nextList.length > 0 || MOCK_NEXT_ACTIONS.length > 0) && (
          <View className="mb-6">
            <Text className="block text-sm text-ink-mute font-handwritten mb-3">我的 Next</Text>
            <ScrollView scrollX className="flex flex-row gap-3" style={{ whiteSpace: 'nowrap' }}>
              {(nextList.length > 0 ? nextList : MOCK_NEXT_ACTIONS.slice(0, 2)).map((item) => (
                <View
                  key={item.id}
                  className="inline-block w-40 bg-card rounded p-3 flex-shrink-0"
                  onClick={() => Taro.switchTab({ url: '/pages/next/index' })}
                >
                  <Image
                    src={item.previewImage}
                    className="w-full h-20 rounded mb-2"
                    mode="aspectFill"
                  />
                  <Text className="block text-xs font-semibold text-ink font-ui">{item.title}</Text>
                  <Text className="block text-xs text-ink-mute font-ui mt-1">{item.firstStep}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 看看其他人在生长 */}
        <View className="mb-4">
          <View className="flex items-center gap-3 mb-4">
            <View className="flex-1 h-px bg-ink-faint opacity-30" />
            <Text className="font-handwritten text-sm text-ink-mute">看看其他人在生长</Text>
            <View className="flex-1 h-px bg-ink-faint opacity-30" />
          </View>

          {MOCK_FEED.map((feed) => (
            <Card key={feed.id} className="mb-4 bg-card" onClick={() => handleFeedClick(feed.id)}>
              <CardContent className="p-4">
                <View className="flex flex-row gap-3">
                  <View className="flex-1">
                    <Text className="block text-sm text-ink-soft font-serif italic leading-relaxed mb-2">
                      &ldquo;{feed.letterExcerpt}&rdquo;
                    </Text>
                    <View className="flex flex-row items-center gap-2 mb-2">
                      <Text className="text-xs text-ink-mute font-ui">{feed.anonymousTag}</Text>
                    </View>
                    <View className="flex flex-row gap-1 flex-wrap">
                      {feed.lifestyleKeywords.map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-xs">
                          {kw}
                        </Badge>
                      ))}
                    </View>
                  </View>
                  <View className="flex flex-col gap-1 w-20">
                    <Image src={feed.beforeImage} className="w-20 h-14 rounded" mode="aspectFill" />
                    <Image src={feed.afterImage} className="w-20 h-14 rounded" mode="aspectFill" />
                  </View>
                </View>
              </CardContent>
            </Card>
          ))}
        </View>

        {/* 底部留白 */}
        <View className="h-20" />
      </ScrollView>
    </View>
  )
}
