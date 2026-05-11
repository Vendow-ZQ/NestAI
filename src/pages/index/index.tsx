import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { useUserStore } from '@/lib/store/user-store'
import { useInterventionStore } from '@/lib/store/intervention-store'
import { MOCK_FEED, MOCK_NEXT_ACTIONS } from '@/lib/mock/data'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PlaceholderImage } from '@/components/placeholder-image'

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
    <View className="min-h-full bg-background" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
      {/* Header */}
      <View className="flex flex-row items-center justify-between px-5 pt-12 pb-4">
        <View className="flex flex-row items-center gap-2">
          <Text className="text-2xl text-ink font-semibold">NestAI</Text>
        </View>
        <View className="w-8 h-8 rounded-full bg-[#f0f0f0] flex items-center justify-center">
          <Text className="text-xs text-[#999]">我</Text>
        </View>
      </View>

      <ScrollView scrollY className="px-5" style={{ height: 'calc(100vh - 140px)' }}>
        {/* 上传区 / 已上传空间卡 */}
        {!hasUploadedSpace ? (
          <View
            className="rounded p-6 flex flex-col items-center justify-center mb-6"
            style={{ borderWidth: '1.5px', borderStyle: 'dashed', borderColor: '#b5ad9f' }}
            onClick={handleUpload}
          >
            <Text className="block text-lg text-ink mb-1">上传你的空间</Text>
            <Text className="block text-sm text-[#999] mb-4">或描述一下</Text>
          </View>
        ) : (
          <Card className="mb-6 bg-card">
            <CardContent className="p-5">
              <View className="flex flex-row items-center gap-3">
                <View className="w-12 h-12 rounded bg-[#f0f0f0] flex items-center justify-center">
                  <Text className="text-xs text-[#999]">空间</Text>
                </View>
                <View className="flex-1">
                  <Text className="block text-sm font-semibold text-ink">我的空间</Text>
                  <Text className="block text-xs text-[#999]">32号房 · 靠窗书桌</Text>
                </View>
              </View>
            </CardContent>
          </Card>
        )}

        {/* 我的 Next 横向滚动 */}
        {(nextList.length > 0 || MOCK_NEXT_ACTIONS.length > 0) && (
          <View className="mb-6">
            <Text className="block text-sm text-[#999] mb-3">我的 Next</Text>
            <ScrollView scrollX className="flex flex-row gap-3" style={{ whiteSpace: 'nowrap' }}>
              {(nextList.length > 0 ? nextList : MOCK_NEXT_ACTIONS.slice(0, 2)).map((item) => (
                <View
                  key={item.id}
                  className="inline-block w-40 bg-card rounded p-3 flex-shrink-0"
                  onClick={() => {
                    const sceneId = item.sceneId || 'scene-01'
                    Taro.navigateTo({ url: `/pages/result/index?sceneId=${sceneId}` })
                  }}
                >
                  <PlaceholderImage label={item.title} className="w-full h-20 rounded mb-2" />
                  <Text className="block text-xs font-semibold text-ink">{item.title}</Text>
                  <Text className="block text-xs text-[#999] mt-1">{item.firstStep}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 看看其他人在生长 */}
        <View className="mb-4">
          <View className="flex items-center gap-3 mb-4">
            <View className="flex-1 h-px bg-[#ddd] opacity-30" />
            <Text className="text-sm text-[#999]">看看其他人在生长</Text>
            <View className="flex-1 h-px bg-[#ddd] opacity-30" />
          </View>

          {MOCK_FEED.map((feed) => (
            <Card key={feed.id} className="mb-4 bg-card" onClick={() => handleFeedClick(feed.id)}>
              <CardContent className="p-4">
                <View className="flex flex-row gap-3">
                  <View className="flex-1">
                    <Text className="block text-sm text-ink-soft leading-relaxed mb-2">
                      &ldquo;{feed.letterExcerpt}&rdquo;
                    </Text>
                    <View className="flex flex-row items-center gap-2 mb-2">
                      <Text className="text-xs text-[#999]">{feed.anonymousTag}</Text>
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
                    <PlaceholderImage label="改造前" className="w-20 h-14 rounded" />
                    <PlaceholderImage label="改造后" className="w-20 h-14 rounded" />
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
