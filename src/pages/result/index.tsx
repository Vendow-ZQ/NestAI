import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'

import { PlaceholderImage } from '@/components/placeholder-image'
import { MOCK_INTERVENTIONS, MOCK_SCENES } from '@/lib/mock/data'
import { useInterventionStore } from '@/lib/store/intervention-store'
import { CustomTabBar } from '@/components/tab-bar'

type Level = 'free' | 'low' | 'advanced'

export default function ResultPage() {
  const [selectedLevel, setSelectedLevel] = useState<Level>('low')
  const addToNext = useInterventionStore((s) => s.addToNext)

  // 从页面参数获取 sceneId，默认 scene-01
  const params = Taro.getCurrentInstance().router?.params
  const sceneId = params?.sceneId || 'scene-01'

  const interventions = MOCK_INTERVENTIONS.filter((i) => i.sceneId === sceneId)
  const currentIntervention = interventions.find((i) => i.level === selectedLevel) ?? interventions[1]
  const scene = MOCK_SCENES.find((s) => s.id === sceneId)
  const spaceName = scene?.name || '32号房'

  const levels: { key: Level; label: string }[] = [
    { key: 'free', label: '0元' },
    { key: 'low', label: '低成本' },
    { key: 'advanced', label: '进阶' },
  ]

  const handleTonightTry = () => {
    addToNext({
      id: `next-${Date.now()}`,
      title: spaceName,
      spaceName,
      lifestyleGoal: '为更专注的学习状态',
      firstStep: currentIntervention.firstSteps[0],
      estimatedTime: '约3分钟',
      costRange: selectedLevel === 'free' ? '0元' : selectedLevel === 'low' ? '100元以内' : '300元以内',
      previewImage: currentIntervention.afterImage,
      completed: false,
      interventionId: currentIntervention.id,
      level: selectedLevel,
      sceneId,
    })
    Taro.showToast({ title: '已加入 Next', icon: 'none' })
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className="min-h-full bg-background" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
      {/* Header */}
      <View className="flex flex-row items-center px-5 pt-12 pb-2">
        <View onClick={handleBack} className="mr-3">
          <Text className="text-ink text-sm">← 返回</Text>
        </View>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 80px)' }}>
        {/* 改造后主视觉 */}
        <View className="relative" style={{ height: '55vh' }}>
          <PlaceholderImage label="改造后效果" className="w-full h-full" />
          {/* 变化标注列表 */}
          <View className="absolute bottom-3 left-3 right-3">
            {currentIntervention.changes.map((change, i) => (
              <View key={i} className="flex flex-row items-start gap-2 mb-1">
                <View className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ borderWidth: '1.5px', borderColor: '#d9a823', backgroundColor: '#ffffff' }}>
                  <Text className="text-xs text-ink" style={{ fontSize: '10px' }}>{i + 1}</Text>
                </View>
                <View className="bg-white rounded px-2 py-1">
                  <Text className="text-xs text-ink">{change}</Text>
                </View>
              </View>
            ))}
          </View>
          {/* 改造前缩略图 */}
          <View className="absolute top-3 right-3 w-16 h-12 rounded overflow-hidden" style={{ borderWidth: '2px', borderColor: '#ffffff' }}>
            <PlaceholderImage label="改造前" className="w-full h-full" />
          </View>
        </View>

        {/* 三档方案切换 */}
        <View className="flex flex-row gap-2 px-5 mt-4">
          {levels.map((level) => (
            <View
              key={level.key}
              className={`flex-1 py-2 rounded flex items-center justify-center ${
                selectedLevel === level.key ? 'bg-ink' : 'bg-card'
              }`}
              style={{ borderWidth: '1.5px', borderColor: selectedLevel === level.key ? 'transparent' : '#b5ad9f' }}
              onClick={() => setSelectedLevel(level.key)}
            >
              <Text className={`text-sm ${selectedLevel === level.key ? 'text-white' : 'text-[#999]'}`}>
                {level.label}
                {selectedLevel === level.key ? ' ✓' : ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Why 这样改 */}
        <View className="px-5 mt-6">
          <Text className="block text-base text-[#999] mb-2">Why 这样改</Text>
          <View className="bg-card rounded p-4">
            <Text className="block text-sm text-[#3a3530] leading-relaxed">
              {currentIntervention.diagnosis}
            </Text>
          </View>
        </View>

        {/* How 怎么做 */}
        <View className="px-5 mt-6">
          <Text className="block text-base text-[#999] mb-2">How 怎么做</Text>
          <Text className="block text-sm text-[#3a3530] mb-3">最轻第一步:</Text>
          {currentIntervention.firstSteps.map((s, i) => (
            <View key={i} className="flex flex-row items-start gap-2 mb-2">
              <View className="w-5 h-5 rounded flex items-center justify-center" style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}>
                <Text className="text-xs text-[#999]">{i + 1}</Text>
              </View>
              <Text className="flex-1 text-sm text-ink">{s}</Text>
            </View>
          ))}

          {currentIntervention.recommendations.length > 0 && (
            <View className="mt-4">
              <View className="h-px bg-[#ddd] opacity-30 mb-3" />
              <Text className="block text-sm text-[#999] mb-2">推荐方向:</Text>
              {currentIntervention.recommendations.map((rec, i) => (
                <View key={i} className="flex flex-row items-start gap-2 mb-1">
                  <Text className="text-[#999] text-sm">-</Text>
                  <Text className="flex-1 text-sm text-[#3a3530]">{rec}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 主按钮: 今晚试试看 */}
        <View className="px-5 mt-6">
          <View
            className="rounded-full py-4 flex items-center justify-center"
            style={{ backgroundColor: '#1a1814', boxShadow: '4px 4px 0 #d9a823' }}
            onClick={handleTonightTry}
          >
            <Text className="text-white text-lg">今晚试试看</Text>
          </View>
          <Text className="block text-center text-xs text-[#999] mt-1">Tonight, try.</Text>
        </View>

        <View className="h-20" />
      </ScrollView>

      {/* 底部导航栏 */}
      <CustomTabBar current="grow" />
    </View>
  )
}
