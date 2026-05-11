import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'

import { PlaceholderImage } from '@/components/placeholder-image'
import { MOCK_INTERVENTIONS, MOCK_SCENES } from '@/lib/mock/data'
import { useInterventionStore } from '@/lib/store/intervention-store'
import { CustomTabBar } from '@/components/tab-bar'

type Level = 'free' | 'low' | 'advanced'

type ImageTab = 'axonometric' | 'render1' | 'render2'

const IMAGE_TABS: { key: ImageTab; label: string }[] = [
  { key: 'axonometric', label: '轴测图' },
  { key: 'render1', label: '效果图1' },
  { key: 'render2', label: '效果图2' },
]

export default function ResultPage() {
  const [selectedLevel, setSelectedLevel] = useState<Level>('low')
  const [addedToNext, setAddedToNext] = useState(false)
  const [activeImageTab, setActiveImageTab] = useState<ImageTab>('axonometric')
  const addToNext = useInterventionStore((s) => s.addToNext)

  const params = Taro.getCurrentInstance().router?.params
  const sceneId = params?.sceneId || 'scene-01'
  const levelParam = params?.level as Level | undefined
  const initialLevel = levelParam && ['free', 'low', 'advanced'].includes(levelParam) ? levelParam : 'low'

  const [activeLevel] = useState<Level>(initialLevel)

  const interventions = MOCK_INTERVENTIONS.filter((i) => i.sceneId === sceneId)
  const currentIntervention = interventions.find((i) => i.level === (addedToNext ? activeLevel : selectedLevel)) ?? interventions[1]
  const scene = MOCK_SCENES.find((s) => s.id === sceneId)
  const spaceName = scene?.name || '32号房'

  const displayLevel = addedToNext ? activeLevel : selectedLevel

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
      costRange: displayLevel === 'free' ? '0元' : displayLevel === 'low' ? '100元以内' : '300元以内',
      previewImage: currentIntervention.afterImage,
      completed: false,
      interventionId: currentIntervention.id,
      level: displayLevel,
      sceneId,
    })
    setAddedToNext(true)
    Taro.showToast({ title: '已加入 Next', icon: 'none' })
  }

  const handleGoNext = () => {
    Taro.switchTab({ url: '/pages/next/index' })
  }

  const handleShare = () => {
    Taro.navigateTo({ url: '/pages/share/index' })
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  const currentData = interventions.find((i) => i.level === displayLevel) ?? interventions[1]

  const imageLabelMap: Record<ImageTab, string> = {
    axonometric: `${spaceName} · 轴测图`,
    render1: `${spaceName} · 效果图1`,
    render2: `${spaceName} · 效果图2`,
  }

  return (
    <View className="min-h-full bg-background" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
      {/* Header */}
      <View className="flex flex-row items-center px-5 pt-12 pb-2">
        <View
          onClick={handleBack}
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
        >
          <Text className="text-ink text-sm">&lt;</Text>
        </View>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 80px)' }}>
        {/* 改造后主视觉 — 4:3 比例 */}
        <View className="px-5">
          <View className="w-full rounded overflow-hidden" style={{ aspectRatio: '4 / 3' }}>
            <PlaceholderImage label={imageLabelMap[activeImageTab]} className="w-full h-full" />
          </View>

          {/* 图片 Tab 切换: 轴测图 / 效果图1 / 效果图2 */}
          <View className="flex flex-row gap-2 mt-3">
            {IMAGE_TABS.map((tab) => (
              <View
                key={tab.key}
                className={`flex-1 py-2 rounded flex items-center justify-center ${
                  activeImageTab === tab.key ? 'bg-ink' : 'bg-card'
                }`}
                style={{ borderWidth: '1.5px', borderColor: activeImageTab === tab.key ? 'transparent' : '#b5ad9f' }}
                onClick={() => setActiveImageTab(tab.key)}
              >
                <Text className={`text-sm ${activeImageTab === tab.key ? 'text-white' : 'text-[#999]'}`}>
                  {tab.label}
                </Text>
              </View>
            ))}
          </View>

          {/* 变化标注 */}
          <View className="mt-4">
            {currentData.changes.map((change, i) => (
              <View key={i} className="flex flex-row items-start gap-2 mb-2">
                <View className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ borderWidth: '1.5px', borderColor: '#d9a823', backgroundColor: '#ffffff' }}>
                  <Text className="text-xs text-ink" style={{ fontSize: '10px' }}>{i + 1}</Text>
                </View>
                <Text className="flex-1 text-sm text-ink">{change}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 三档方案切换 */}
        <View className="flex flex-row gap-2 px-5 mt-5">
          {levels.map((level) => (
            <View
              key={level.key}
              className={`flex-1 py-2 rounded flex items-center justify-center ${
                displayLevel === level.key ? 'bg-ink' : 'bg-card'
              }`}
              style={{ borderWidth: '1.5px', borderColor: displayLevel === level.key ? 'transparent' : '#b5ad9f' }}
              onClick={() => { if (!addedToNext) setSelectedLevel(level.key) }}
            >
              <Text className={`text-sm ${displayLevel === level.key ? 'text-white' : 'text-[#999]'}`}>
                {level.label}
                {displayLevel === level.key ? ' ✓' : ''}
              </Text>
            </View>
          ))}
        </View>

        {/* Why 这样改 */}
        <View className="px-5 mt-6">
          <Text className="block text-base text-[#999] mb-2">Why 这样改</Text>
          <View className="bg-card rounded p-4">
            <Text className="block text-sm text-[#3a3530] leading-relaxed">
              {currentData.diagnosis}
            </Text>
          </View>
        </View>

        {/* How 怎么做 */}
        <View className="px-5 mt-6">
          <Text className="block text-base text-[#999] mb-2">How 怎么做</Text>
          <Text className="block text-sm text-[#3a3530] mb-3">最轻第一步:</Text>
          {currentData.firstSteps.map((s, i) => (
            <View key={i} className="flex flex-row items-start gap-2 mb-2">
              <View className="w-5 h-5 rounded flex items-center justify-center" style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}>
                <Text className="text-xs text-[#999]">{i + 1}</Text>
              </View>
              <Text className="flex-1 text-sm text-ink">{s}</Text>
            </View>
          ))}

          {currentData.recommendations.length > 0 && (
            <View className="mt-4">
              <View className="h-px bg-[#ddd] opacity-30 mb-3" />
              <Text className="block text-sm text-[#999] mb-2">推荐方向:</Text>
              {currentData.recommendations.map((rec, i) => {
                const name = typeof rec === 'string' ? rec : rec.name
                const price = typeof rec === 'string' ? '' : rec.price
                return (
                  <View key={i} className="flex flex-row items-start gap-2 mb-1">
                    <Text className="text-[#999] text-sm">-</Text>
                    <Text className="flex-1 text-sm text-[#3a3530]">
                      {name}{price ? <Text className="text-[#999]"> {price}</Text> : ''}
                    </Text>
                  </View>
                )
              })}
            </View>
          )}
        </View>

        {/* 主按钮区域 */}
        <View className="px-5 mt-6">
          {!addedToNext ? (
            <View
              className="rounded-full py-4 flex items-center justify-center"
              style={{ backgroundColor: '#1a1814', boxShadow: '4px 4px 0 #d9a823' }}
              onClick={handleTonightTry}
            >
              <Text className="text-white text-lg">今晚试试看</Text>
            </View>
          ) : (
            <View>
              <View
                className="rounded-full py-4 flex items-center justify-center mb-3"
                style={{ backgroundColor: '#1a1814' }}
                onClick={handleGoNext}
              >
                <Text className="text-white text-lg">去 Next 看看</Text>
              </View>
              <View
                className="rounded-full py-3 flex items-center justify-center"
                style={{ borderWidth: '1.5px', borderColor: '#1a1814' }}
                onClick={handleShare}
              >
                <Text className="text-ink text-base">我做了，看看变化</Text>
              </View>
            </View>
          )}
          <Text className="block text-center text-xs text-[#999] mt-1">Tonight, try.</Text>
        </View>

        <View className="h-20" />
      </ScrollView>

      {/* 底部导航栏 */}
      <CustomTabBar current="grow" />
    </View>
  )
}
