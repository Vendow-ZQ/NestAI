import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { useUserStore } from '@/lib/store/user-store'
import { useMemoryStore } from '@/lib/store/memory-store'
import { useInterventionStore } from '@/lib/store/intervention-store'
import { MOCK_LETTERS } from '@/lib/mock/data'
import { BilingualTitle } from '@/components/bilingual-title'

export default function MePage() {
  const hasUploadedSpace = useUserStore((s) => s.hasUploadedSpace)
  const letters = useMemoryStore((s) => s.letters)
  const interventionHistory = useInterventionStore((s) => s.nextList)
  const displayLetters = letters.length > 0 ? letters : MOCK_LETTERS

  return (
    <View className="min-h-full bg-background overflow-hidden" style={{ fontFamily: "'Noto Sans SC', sans-serif", maxWidth: '100vw' }}>
      {/* Header */}
      <View className="px-5 pt-12 pb-4">
        <BilingualTitle en="ME" zh="我的" size="2xl" />
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 120px)' }}>
        {/* 用户头像 */}
        <View className="flex flex-col items-center mb-6">
          <View className="w-16 h-16 rounded-full bg-[#f0f0f0] flex items-center justify-center mb-2">
            <Text className="text-2xl text-[#999]">我</Text>
          </View>
          <Text className="block text-sm text-ink">你的栖巢</Text>
        </View>

        {/* 我的空间 */}
        <View className="px-5 mb-6">
          <View className="bg-card rounded p-4 hover-lift" style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}>
            <Text className="block text-sm text-[#999] mb-2">我的空间</Text>
            {hasUploadedSpace ? (
              <View>
                <Text className="block text-base text-ink font-semibold">清华深研院 7+1 / 32号房</Text>
                <Text className="block text-sm text-[#7a736a] mt-1">入住 3 个月</Text>
              </View>
            ) : (
              <Text className="block text-sm text-[#7a736a]">还没有上传空间</Text>
            )}
          </View>
        </View>

        {/* 我的信件 */}
        <View className="px-5 mb-6">
          <Text className="block text-sm text-[#999] mb-3">我的信件 ({displayLetters.length})</Text>
          {displayLetters.slice(0, 3).map((letter) => (
            <View
              key={letter.id}
              className="bg-card rounded p-4 mb-2 hover-lift"
              style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
              onClick={() => Taro.navigateTo({ url: `/pages/letter/index?id=${letter.id}` })}
            >
              <Text className="block text-sm text-ink font-semibold">{letter.title}</Text>
              <Text className="block text-xs text-[#999] mt-1">{letter.date}</Text>
            </View>
          ))}
        </View>

        {/* 历史干预 */}
        <View className="px-5 mb-6">
          <Text className="block text-sm text-[#999] mb-3">历史干预 ({interventionHistory.length})</Text>
          {interventionHistory.length > 0 ? (
            interventionHistory.slice(0, 5).map((item) => (
              <View
                key={item.id}
                className="bg-card rounded p-3 mb-2 flex flex-row items-center hover-lift"
                style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
              >
                <View className="w-10 h-10 rounded bg-[#f0f0f0] flex items-center justify-center flex-shrink-0">
                  <Text className="text-xs text-[#999]">干预</Text>
                </View>
                <View className="flex-1 ml-3">
                  <Text className="block text-sm text-ink">{item.title}</Text>
                  <Text className="block text-xs text-[#999]">{item.costRange}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text className="block text-sm text-[#7a736a]">还没有干预记录</Text>
          )}
        </View>

        {/* 设置与隐私 */}
        <View className="px-5 mb-6">
          <View
            className="bg-card rounded p-4 hover-lift"
            style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
          >
            <Text className="block text-sm text-ink">设置与隐私</Text>
            <Text className="block text-xs text-[#999] mt-1">清空 Memory · 导出数据 · 隐私偏好</Text>
          </View>
        </View>

        <View className="h-20" />
      </ScrollView>
    </View>
  )
}
