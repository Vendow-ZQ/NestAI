import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { MOCK_LETTERS, MOCK_NEXT_ACTIONS } from '@/lib/mock/data'
import { CustomTabBar } from '@/components/tab-bar'

export default function LetterPage() {
  const letter = MOCK_LETTERS[0]

  const handleShare = () => {
    Taro.showToast({ title: '分享功能开发中', icon: 'none' })
  }

  const handleNextClick = (action: typeof MOCK_NEXT_ACTIONS[0]) => {
    const sceneId = action.sceneId || 'scene-01'
    const level = action.level || 'low'
    Taro.navigateTo({ url: `/pages/result/index?sceneId=${sceneId}&level=${level}` })
  }

  return (
    <View className="min-h-full bg-background" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
      {/* Header */}
      <View className="flex flex-row items-center px-5 pt-12 pb-4">
        <View onClick={() => Taro.navigateBack()} className="mr-3">
          <Text className="text-ink text-sm">← 返回</Text>
        </View>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 80px)' }}>
        {/* 改造前后小图对比 */}
        <View className="flex flex-row gap-3 px-5 mb-6">
          <View className="flex-1 rounded overflow-hidden" style={{ height: '80px' }}>
            <View className="w-full h-full bg-card flex items-center justify-center">
              <Text className="text-xs text-[#999]">改造前</Text>
            </View>
          </View>
          <View className="flex-1 rounded overflow-hidden" style={{ height: '80px' }}>
            <View className="w-full h-full bg-card flex items-center justify-center">
              <Text className="text-xs text-[#999]">改造后</Text>
            </View>
          </View>
        </View>

        {/* 信件正文 */}
        <View className="px-5">
          <Text className="block text-xl text-ink mb-6">亲爱的你，</Text>

          {letter.content.filter((p) => p.length > 0).map((paragraph, i) => (
            <Text key={i} className="block text-base text-ink leading-loose mb-4">
              {paragraph}
            </Text>
          ))}

          <View className="mt-6 mb-8 flex flex-row items-center gap-2">
            <Text className="block text-base text-ink">—— Nobi</Text>
          </View>
        </View>

        {/* 分隔线 */}
        <View className="h-px bg-[#ddd] opacity-30 mx-5 mb-6" />

        {/* 下一步可以试试 */}
        <View className="px-5 mb-4">
          <Text className="block text-base text-[#999] mb-3">下一步可以试试</Text>
          {MOCK_NEXT_ACTIONS.slice(0, 1).map((action) => (
            <View
              key={action.id}
              className="bg-card rounded p-4 flex flex-row items-center gap-3"
              onClick={() => handleNextClick(action)}
            >
              <View className="w-12 h-12 rounded bg-card flex items-center justify-center">
                <Text className="text-xs text-[#999]">{action.spaceName}</Text>
              </View>
              <View className="flex-1">
                <Text className="block text-sm text-ink font-semibold">{action.title}</Text>
                <Text className="block text-xs text-[#999] mt-1">{action.firstStep}</Text>
              </View>
              <Text className="text-[#999] text-sm">→</Text>
            </View>
          ))}
        </View>

        {/* 分享按钮 */}
        <View className="px-5 mt-2">
          <View
            className="rounded-full py-3 flex items-center justify-center"
            style={{ borderWidth: '1.5px', borderColor: '#1a1814' }}
            onClick={handleShare}
          >
            <Text className="text-ink text-base">分享给朋友</Text>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>

      {/* 底部导航栏 */}
      <CustomTabBar current="grow" />
    </View>
  )
}
