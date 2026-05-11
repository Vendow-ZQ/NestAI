import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { useUserStore } from '@/lib/store/user-store'
import { useInterventionStore } from '@/lib/store/intervention-store'
import { MOCK_FEED, MOCK_NEXT_ACTIONS } from '@/lib/mock/data'
import { Badge } from '@/components/ui/badge'
import { PlaceholderImage } from '@/components/placeholder-image'
import { BilingualTitle } from '@/components/bilingual-title'

import axisBg from '@/assets/axis-bg.png'

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
    <View className="min-h-full bg-background overflow-hidden" style={{ fontFamily: "'Noto Sans SC', sans-serif", maxWidth: '100vw' }}>
      {/* Header */}
      <View className="flex flex-row items-center justify-between px-4 pt-12 pb-4">
        <BilingualTitle en="NestAI" zh="你的栖巢" size="2xl" />
        <View className="w-8 h-8 rounded-full bg-[#f0f0f0] flex items-center justify-center">
          <Text className="text-xs text-[#999]">我</Text>
        </View>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 140px)' }}>
        <View className="px-4">
        {/* 上传区 — 始终显示 */}
        <View
          className="rounded flex flex-col items-center justify-center mb-4 relative overflow-hidden hover-lift"
          style={{
            borderWidth: '1.5px',
            borderStyle: 'dashed',
            borderColor: '#b5ad9f',
            aspectRatio: '4 / 3',
          }}
          onClick={handleUpload}
        >
          {/* 轴测图背景 50%透明度 */}
          <Image
            src={axisBg}
            mode="aspectFill"
            className="absolute top-0 left-0 w-full h-full"
            style={{ opacity: 0.5 }}
          />
          {/* 文案覆盖层 */}
          <View className="relative z-10 flex flex-col items-center justify-center">
            <Text className="block text-base text-ink text-center px-6" style={{ fontWeight: 500 }}>
              用你的生活方式改变身边空间
            </Text>
          </View>
        </View>

        {/* 已上传空间卡 — 有空间时额外显示 */}
        {hasUploadedSpace && (
          <View className="mb-4 bg-card rounded p-4 hover-lift">
            <View className="flex flex-row items-center gap-3">
              <View className="w-10 h-10 rounded bg-[#f0f0f0] flex items-center justify-center">
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
            <ScrollView scrollX style={{ whiteSpace: 'nowrap', width: '100%' }}>
              <View className="flex flex-row gap-3" style={{ paddingRight: '16px' }}>
              {(nextList.length > 0 ? nextList : MOCK_NEXT_ACTIONS.slice(0, 2)).map((item) => (
                <View
                  key={item.id}
                  className="inline-block w-40 bg-card rounded p-3 flex-shrink-0 hover-lift"
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
              </View>
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
              className="mb-3 bg-card rounded overflow-hidden hover-lift"
              onClick={() => handleFeedClick(feed.id)}
            >
              <View className="flex flex-row" style={{ minHeight: '110px' }}>
                {/* 左半边：改造后大图 */}
                <View className="flex-shrink-0 overflow-hidden" style={{ width: '45%' }}>
                  <PlaceholderImage label={feed.title} className="w-full h-full" />
                </View>
                {/* 右半边：文案 */}
                <View className="flex-1 p-2 flex flex-col justify-between overflow-hidden">
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
        </View>
      </ScrollView>
    </View>
  )
}
