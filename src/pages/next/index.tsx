import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { NobiSVG } from '@/components/nobi'
import { TonightButton } from '@/components/hand-drawn'
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
    <View className="min-h-full bg-background">
      {/* Header */}
      <View className="px-5 pt-12 pb-4">
        <Text className="block font-handwritten text-xl text-ink">Next 你准备试试看的</Text>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 100px)' }}>
        {displayList.length === 0 ? (
          <View className="flex flex-col items-center justify-center py-20">
            <NobiSVG pose="sleeping" size={100} />
            <Text className="block text-sm text-ink-mute font-ui mt-4 text-center">
              还没有 Next{'\n'}去 Grow 页面开始你的空间改造吧
            </Text>
          </View>
        ) : (
          <View className="px-5">
            {displayList.map((item) => (
              <Card key={item.id} className="mb-4 bg-card">
                <CardContent className="p-4">
                  <Image
                    src={item.previewImage}
                    className="w-full h-36 rounded mb-3"
                    mode="aspectFill"
                  />
                  <Text className="block text-base font-semibold text-ink font-ui">{item.title}</Text>
                  <Text className="block text-sm text-ink-mute font-serif italic mt-1 mb-3">
                    {item.lifestyleGoal}
                  </Text>
                  <View className="bg-paper rounded p-3 mb-3">
                    <Text className="block text-xs text-ink-mute font-ui mb-1">最轻第一步:</Text>
                    <Text className="block text-sm text-ink font-serif">{item.firstStep}</Text>
                  </View>
                  <View className="flex flex-row items-center gap-3 mb-3">
                    <Text className="text-xs text-ink-mute font-ui">约 {item.estimatedTime}</Text>
                    <Text className="text-xs text-ink-mute font-ui">{item.costRange}</Text>
                  </View>
                  <View className="flex flex-row gap-2">
                    <View className="flex-1">
                      <TonightButton onClick={() => {}} />
                    </View>
                    <View
                      className="flex-1 bg-paper-deep rounded-full py-3 px-4 flex items-center justify-center"
                      style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
                      onClick={() => handleComplete(item.id)}
                    >
                      <Text className="text-sm text-ink font-ui">我做了</Text>
                    </View>
                  </View>
                </CardContent>
              </Card>
            ))}

            {/* Nobi 守着未完成卡片 */}
            <View className="flex justify-center py-6">
              <NobiSVG pose="sleeping" size={60} />
            </View>
          </View>
        )}

        <View className="h-20" />
      </ScrollView>
    </View>
  )
}
