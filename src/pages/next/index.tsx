import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { useInterventionStore } from '@/lib/store/intervention-store'
import { MOCK_NEXT_ACTIONS } from '@/lib/mock/data'
import { PlaceholderImage } from '@/components/placeholder-image'
import { BilingualTitle } from '@/components/bilingual-title'

export default function NextPage() {
  const nextList = useInterventionStore((s) => s.nextList)
  const displayList = nextList.length > 0 ? nextList : MOCK_NEXT_ACTIONS

  return (
    <View className="min-h-full bg-background" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
      {/* Header */}
      <View className="px-5 pt-12 pb-4">
        <BilingualTitle en="NEXT" zh="你准备试试看的" size="2xl" />
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 120px)' }}>
        {displayList.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Text className="block text-base text-[#999]">还没有收藏的动作</Text>
            <Text className="block text-sm text-[#b5ad9f] mt-2">去 Grow 看看有什么可以试试</Text>
          </View>
        ) : (
          displayList.map((item) => (
            <View
              key={item.id}
              className="mx-5 mb-4 bg-card rounded overflow-hidden hover-lift"
              style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
            >
              {/* 预览图 */}
              <View className="w-full" style={{ aspectRatio: '4 / 3' }}>
                <PlaceholderImage label={item.title} className="w-full h-full" />
              </View>

              {/* 内容 */}
              <View className="p-4">
                <Text className="block text-base font-semibold text-ink">{item.title}</Text>
                <Text className="block text-sm text-[#7a736a] mt-1">{item.lifestyleGoal}</Text>

                <View className="mt-3">
                  <Text className="block text-sm text-[#999]">最轻第一步:</Text>
                  <Text className="block text-sm text-ink mt-1">{item.firstStep}</Text>
                </View>

                <View className="flex flex-row items-center gap-4 mt-3">
                  <Text className="text-xs text-[#999]">{item.estimatedTime}</Text>
                  <Text className="text-xs text-[#999]">{item.costRange}</Text>
                </View>

                {/* 按钮区 */}
                <View className="flex flex-row gap-3 mt-4">
                  <View
                    className="flex-1 rounded-full py-3 flex items-center justify-center hover-lift"
                    style={{ backgroundColor: '#1a1814', boxShadow: '4px 4px 0 #d9a823' }}
                    onClick={() => {
                      const sceneId = item.sceneId || 'scene-01'
                      Taro.navigateTo({ url: `/pages/result/index?sceneId=${sceneId}` })
                    }}
                  >
                    <Text className="text-white text-sm">今晚试试看</Text>
                  </View>
                  <View
                    className="flex-1 rounded-full py-3 flex items-center justify-center hover-lift"
                    style={{ borderWidth: '1.5px', borderColor: '#1a1814' }}
                    onClick={() => {
                      Taro.navigateTo({ url: '/pages/share/index' })
                    }}
                  >
                    <Text className="text-ink text-sm">我做了</Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}

        <View className="h-20" />
      </ScrollView>
    </View>
  )
}
