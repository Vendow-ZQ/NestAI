import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { PlaceholderImage } from '@/components/placeholder-image'
import { useInterventionStore } from '@/lib/store/intervention-store'
import { Card, CardContent } from '@/components/ui/card'
import { MOCK_NEXT_ACTIONS } from '@/lib/mock/data'

export default function NextPage() {
  const nextList = useInterventionStore((s) => s.nextList)
  const completeAction = useInterventionStore((s) => s.completeAction)
  const displayList = nextList.length > 0 ? nextList : MOCK_NEXT_ACTIONS

  const handleComplete = (id: string) => {
    completeAction(id)
    Taro.navigateTo({ url: '/pages/share/index' })
  }

  return (
    <View className="min-h-full bg-background" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
      {/* Header */}
      <View className="px-5 pt-12 pb-4">
        <Text className="block text-xl text-ink font-semibold">Next 你准备试试看的</Text>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 100px)' }}>
        {displayList.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <Text className="block text-sm text-[#999] mt-4 text-center">
              还没有 Next{'\n'}去 Grow 页面开始你的空间改造吧
            </Text>
          </View>
        ) : (
          <View className="px-5">
            {displayList.map((item) => (
              <Card key={item.id} className="mb-4 bg-card">
                <CardContent className="p-4">
                  <PlaceholderImage label={item.title} className="w-full h-36 rounded mb-3" />
                  <Text className="block text-base font-semibold text-ink">{item.title}</Text>
                  <Text className="block text-sm text-[#3a3530] mt-1 mb-3">
                    {item.lifestyleGoal}
                  </Text>
                  <View className="bg-[#f5f5f5] rounded p-3 mb-3">
                    <Text className="block text-xs text-[#999] mb-1">最轻第一步:</Text>
                    <Text className="block text-sm text-ink">{item.firstStep}</Text>
                  </View>
                  <View className="flex flex-row items-center gap-3 mb-3">
                    <Text className="text-xs text-[#999]">约 {item.estimatedTime}</Text>
                    <Text className="text-xs text-[#999]">{item.costRange}</Text>
                  </View>
                  <View className="flex flex-row gap-2">
                    <View className="flex-1">
                      <View
                        className="rounded-full py-3 flex items-center justify-center"
                        style={{ backgroundColor: '#1a1814', boxShadow: '4px 4px 0 #d9a823' }}
                      >
                        <Text className="text-white text-sm">今晚试试看</Text>
                      </View>
                    </View>
                    <View
                      className="flex-1 bg-[#ede6d4] rounded-full py-3 px-4 flex items-center justify-center"
                      style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
                      onClick={() => handleComplete(item.id)}
                    >
                      <Text className="text-sm text-ink">我做了</Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </View>
  )
}
