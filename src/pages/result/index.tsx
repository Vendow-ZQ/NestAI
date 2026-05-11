import { View, Text, Image, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { NobiSVG } from '@/components/nobi'
import { TonightButton, HandLine } from '@/components/hand-drawn'
import { MOCK_INTERVENTIONS } from '@/lib/mock/data'
import { useInterventionStore } from '@/lib/store/intervention-store'

type Level = 'free' | 'low' | 'advanced'

export default function ResultPage() {
  const [selectedLevel, setSelectedLevel] = useState<Level>('low')
  const addToNext = useInterventionStore((s) => s.addToNext)

  // Mock: 使用 scene-01 的干预方案
  const interventions = MOCK_INTERVENTIONS.filter((i) => i.sceneId === 'scene-01')
  const currentIntervention = interventions.find((i) => i.level === selectedLevel) ?? interventions[1]

  const levels: { key: Level; label: string }[] = [
    { key: 'free', label: '0元' },
    { key: 'low', label: '低成本' },
    { key: 'advanced', label: '进阶' },
  ]

  const handleTonightTry = () => {
    addToNext({
      id: `next-${Date.now()}`,
      title: '你的书桌',
      spaceName: '32号房 · 靠窗书桌',
      lifestyleGoal: '为更专注的学习状态',
      firstStep: currentIntervention.firstSteps[0],
      estimatedTime: '约3分钟',
      costRange: selectedLevel === 'free' ? '0元' : selectedLevel === 'low' ? '100元以内' : '300元以内',
      previewImage: currentIntervention.afterImage,
      completed: false,
    })
    Taro.showToast({ title: '已加入 Next', icon: 'none' })
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className="min-h-full bg-background">
      {/* Header */}
      <View className="flex flex-row items-center px-5 pt-12 pb-2">
        <View onClick={handleBack} className="mr-3">
          <Text className="text-ink font-ui text-sm">← 返回</Text>
        </View>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 80px)' }}>
        {/* 改造后主视觉 — >60% 屏幕 */}
        <View className="relative" style={{ height: '55vh' }}>
          <Image
            src={currentIntervention.afterImage}
            className="w-full h-full"
            mode="aspectFill"
          />
          {/* Nobi 在效果图角落 */}
          <View className="absolute bottom-3 right-3">
            <NobiSVG pose="sitting" size={40} />
          </View>
          {/* 变化标注 */}
          {currentIntervention.annotations.map((ann, i) => (
            <View
              key={i}
              className="absolute flex flex-row items-center gap-1"
              style={{ left: `${ann.x}%`, top: `${ann.y}%` }}
            >
              <View className="w-4 h-4 rounded-full border-2 border-bean flex items-center justify-center bg-paper">
                <Text className="text-xs text-ink font-ui">{i + 1}</Text>
              </View>
              <View className="bg-paper rounded px-1 py-0">
                <Text className="text-xs text-ink font-handwritten">{ann.label}</Text>
              </View>
            </View>
          ))}
          {/* 改造前缩略图 */}
          <View className="absolute bottom-3 left-3 w-16 h-12 rounded overflow-hidden border-2 border-paper">
            <Image
              src={currentIntervention.beforeImage}
              className="w-full h-full"
              mode="aspectFill"
            />
            <View className="absolute bottom-0 left-0 right-0 bg-iron py-0">
              <Text className="text-center text-xs text-paper font-ui">之前</Text>
            </View>
          </View>
        </View>

        {/* 三档方案切换 */}
        <View className="flex flex-row gap-2 px-5 mt-4">
          {levels.map((level) => (
            <View
              key={level.key}
              className={`flex-1 py-2 rounded flex items-center justify-center ${
                selectedLevel === level.key
                  ? 'bg-ink'
                  : 'bg-card border border-ink-faint'
              }`}
              style={{ borderWidth: '1.5px' }}
              onClick={() => setSelectedLevel(level.key)}
            >
              <Text
                className={`text-sm font-ui ${
                  selectedLevel === level.key ? 'text-paper' : 'text-ink-mute'
                }`}
              >
                {level.label}
                {selectedLevel === level.key ? ' ✓' : ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Why 这样改 — Agent 诊断 */}
        <View className="px-5 mt-6">
          <Text className="block font-handwritten text-base text-ink-mute mb-2">Why 这样改</Text>
          <View className="bg-card rounded p-4">
            <Text className="block text-sm text-ink-soft font-serif italic leading-relaxed">
              {currentIntervention.diagnosis}
            </Text>
          </View>
        </View>

        {/* How 怎么做 — 最轻第一步 */}
        <View className="px-5 mt-6">
          <Text className="block font-handwritten text-base text-ink-mute mb-2">How 怎么做</Text>
          <Text className="block text-sm text-ink-soft font-ui mb-3">最轻第一步:</Text>
          {currentIntervention.firstSteps.map((s, i) => (
            <View key={i} className="flex flex-row items-start gap-2 mb-2">
              <View className="w-5 h-5 rounded border-2 border-ink-faint flex items-center justify-center mt-0">
                <Text className="text-xs text-ink-mute font-ui">{i + 1}</Text>
              </View>
              <Text className="flex-1 text-sm text-ink font-serif">{s}</Text>
            </View>
          ))}

          {/* 推荐方向 */}
          {currentIntervention.recommendations.length > 0 && (
            <View className="mt-4">
              <HandLine />
              <Text className="block text-sm text-ink-mute font-ui mb-2">推荐方向:</Text>
              {currentIntervention.recommendations.map((rec, i) => (
                <View key={i} className="flex flex-row items-start gap-2 mb-1">
                  <Text className="text-ink-mute font-ui text-sm">-</Text>
                  <Text className="flex-1 text-sm text-ink-soft font-serif">{rec}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 主按钮: 今晚试试看 */}
        <View className="px-5 mt-6">
          <TonightButton onClick={handleTonightTry} />
        </View>

        <View className="h-10" />
      </ScrollView>
    </View>
  )
}
