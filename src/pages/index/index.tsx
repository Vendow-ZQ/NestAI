import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { useUserStore } from '@/lib/store/user-store'
import { useInterventionStore } from '@/lib/store/intervention-store'
import { MOCK_FEED, MOCK_NEXT_ACTIONS } from '@/lib/mock/data'
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
            className="rounded flex flex-col items-center justify-center mb-6 relative overflow-hidden"
            style={{
              borderWidth: '1.5px',
              borderStyle: 'dashed',
              borderColor: '#b5ad9f',
              aspectRatio: '4 / 3',
            }}
            onClick={handleUpload}
          >
            {/* 半透明大加号 */}
            <Text
              className="block text-[#b5ad9f] font-light select-none"
              style={{ fontSize: '120px', lineHeight: 1, opacity: 0.35 }}
            >
              +
            </Text>
            <Text className="block text-base text-ink text-center mt-4 px-6">
              用你的生活方式改变身边空间
            </Text>
          </View>
        ) : (
          <View className="mb-6 bg-card rounded p-5">
            <View className="flex flex-row items-center gap-3">
              <View className="w-12 h-12 rounded bg-[#f0f0f0] flex items-center justify-center">
                <Text className="text-xs text-[#999]">空间</Text>
              </View>
              <View className="flex-1">
                <Text className="block text-sm font-semibold text-ink">我的空间</Text>
                <Text className="block text-xs text-[#999]">32号房 · 靠窗书桌</Text>
              </View>
            </View>
          </View>
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
            <View
              key={feed.id}
              className="mb-3 bg-card rounded overflow-hidden"
              onClick={() => handleFeedClick(feed.id)}
            >
              <View className="flex flex-row" style={{ minHeight: '120px' }}>
                {/* 左半边：改造后大图 */}
                <View className="w-1/2 flex-shrink-0">
                  <PlaceholderImage label={feed.title} className="w-full h-full rounded-l" />
                </View>
                {/* 右半边：文案 */}
                <View className="flex-1 p-3 flex flex-col justify-between">
                  <View>
                    <Text className="block text-xs font-semibold text-ink mb-1 leading-tight">
                      {feed.title}
                    </Text>
                    <Text className="block text-xs text-[#7a736a] leading-relaxed">
                      {feed.description}
                    </Text>
                  </View>
                  <View className="flex flex-row items-center gap-1 mt-2">
                    <Text className="text-xs text-[#b5ad9f]">{feed.location}</Text>
                  </View>
                  <View className="flex flex-row gap-1 flex-wrap mt-1">
                    {feed.lifestyleKeywords.map((kw) => (
                      <Badge key={kw} variant="secondary" className="text-xs py-0 px-1">
                        {kw}
                      </Badge>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* 底部留白 */}
        <View className="h-20" />
      </ScrollView>
    </View>
  )
}
