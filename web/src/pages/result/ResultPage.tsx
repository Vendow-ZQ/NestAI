import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { PlaceholderImage } from '@/components/PlaceholderImage'
import { MOCK_INTERVENTIONS, MOCK_SCENES } from '@/lib/mock/data'
import { useInterventionStore } from '@/stores/intervention-store'
import { BilingualTitle } from '@/components/BilingualTitle'

type Level = 'free' | 'low' | 'advanced'

type ImageTab = 'axonometric' | 'render1' | 'render2'

const IMAGE_TABS: { key: ImageTab; label: string; en: string }[] = [
  { key: 'axonometric', label: '轴测图', en: 'AXONOMETRIC' },
  { key: 'render1', label: '效果图1', en: 'RENDER 1' },
  { key: 'render2', label: '效果图2', en: 'RENDER 2' },
]

export default function ResultPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [selectedLevel, setSelectedLevel] = useState<Level>('low')
  const [addedToNext, setAddedToNext] = useState(false)
  const [activeImageTab, setActiveImageTab] = useState<ImageTab>('axonometric')
  const addToNext = useInterventionStore((s) => s.addToNext)

  const sceneId = searchParams.get('sceneId') || 'scene-01'
  const levelParam = searchParams.get('level') as Level | null
  const initialLevel = levelParam && ['free', 'low', 'advanced'].includes(levelParam) ? levelParam : 'low'
  const [activeLevel] = useState<Level>(initialLevel)

  const interventions = MOCK_INTERVENTIONS.filter((i) => i.sceneId === sceneId)
  const scene = MOCK_SCENES.find((s) => s.id === sceneId)
  const spaceName = scene?.name || '32号房'

  const displayLevel = addedToNext ? activeLevel : selectedLevel
  const currentData = interventions.find((i) => i.level === displayLevel) ?? interventions[1]

  const levels: { key: Level; label: string; en: string }[] = [
    { key: 'free', label: '0元', en: 'FREE' },
    { key: 'low', label: '低成本', en: 'LOW COST' },
    { key: 'advanced', label: '进阶', en: 'ADVANCED' },
  ]

  const handleTonightTry = () => {
    addToNext({
      id: `next-${Date.now()}`,
      title: spaceName,
      spaceName,
      lifestyleGoal: '为更专注的学习状态',
      firstStep: currentData.firstSteps[0],
      estimatedTime: '约3分钟',
      costRange: displayLevel === 'free' ? '0元' : displayLevel === 'low' ? '100元以内' : '300元以内',
      previewImage: currentData.afterImage,
      completed: false,
      interventionId: currentData.id,
      level: displayLevel,
      sceneId,
    })
    setAddedToNext(true)
    alert('已加入 Next')
  }

  const handleGoNext = () => {
    navigate('/next')
  }

  const handleShare = () => {
    navigate('/share')
  }

  const handleBack = () => {
    navigate(-1)
  }

  const imageLabelMap: Record<ImageTab, string> = {
    axonometric: `${spaceName} · 轴测图`,
    render1: `${spaceName} · 效果图1`,
    render2: `${spaceName} · 效果图2`,
  }

  return (
    <div className="min-h-full bg-background overflow-hidden" style={{ fontFamily: "'Noto Sans SC', sans-serif", maxWidth: '100vw' }}>
      {/* Header */}
      <div className="flex flex-row items-center px-5 pt-12 pb-2">
        <div
          onClick={handleBack}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
          style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
        >
          <span className="text-ink text-sm">&lt;</span>
        </div>
      </div>

      {/* 标题 */}
      <div className="px-5 mb-3">
        <BilingualTitle en="INTERVENTION RESULT" zh="空间干预方案" size="lg" />
      </div>

      <div style={{ overflowY: 'auto', height: 'calc(100vh - 160px)' }}>
        {/* 改造后主视觉 */}
        <div className="px-5">
          <div className="w-full rounded overflow-hidden hover-lift" style={{ aspectRatio: '4 / 3' }}>
            <PlaceholderImage label={imageLabelMap[activeImageTab]} className="w-full h-full" />
          </div>

          {/* 图片 Tab 切换 */}
          <div className="flex flex-row gap-2 mt-3">
            {IMAGE_TABS.map((tab) => (
              <div
                key={tab.key}
                className={`flex-1 py-2 rounded flex items-center justify-center hover-lift cursor-pointer ${
                  activeImageTab === tab.key ? 'bg-ink' : 'bg-card'
                }`}
                style={{ borderWidth: '1.5px', borderColor: activeImageTab === tab.key ? 'transparent' : '#b5ad9f' }}
                onClick={() => setActiveImageTab(tab.key)}
              >
                <span className={`text-sm ${activeImageTab === tab.key ? 'text-white' : 'text-[#999]'}`}>
                  {tab.label}
                </span>
              </div>
            ))}
          </div>

          {/* 变化标注 */}
          <div className="mt-4">
            {currentData.changes.map((change, i) => (
              <div key={i} className="flex flex-row items-start gap-2 mb-2">
                <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-1" style={{ borderWidth: '1.5px', borderColor: '#d9a823', backgroundColor: '#ffffff' }}>
                  <span className="text-xs text-ink" style={{ fontSize: '10px' }}>{i + 1}</span>
                </div>
                <span className="flex-1 text-sm text-ink">{change}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 三档方案切换 */}
        <div className="flex flex-row gap-2 px-5 mt-5">
          {levels.map((level) => (
            <div
              key={level.key}
              className={`flex-1 py-2 rounded flex items-center justify-center hover-lift cursor-pointer ${
                displayLevel === level.key ? 'bg-ink' : 'bg-card'
              }`}
              style={{ borderWidth: '1.5px', borderColor: displayLevel === level.key ? 'transparent' : '#b5ad9f' }}
              onClick={() => { if (!addedToNext) setSelectedLevel(level.key) }}
            >
              <span className={`text-sm ${displayLevel === level.key ? 'text-white' : 'text-[#999]'}`}>
                {level.label}
              </span>
            </div>
          ))}
        </div>

        {/* Why 这样改 */}
        <div className="px-5 mt-6">
          <BilingualTitle en="WHY" zh="为什么这样改" size="sm" />
          <div className="bg-card rounded p-4 mt-2 hover-lift">
            <span className="block text-sm text-[#3a3530] leading-relaxed">
              {currentData.diagnosis}
            </span>
          </div>
        </div>

        {/* How 怎么做 */}
        <div className="px-5 mt-6">
          <BilingualTitle en="HOW" zh="怎么做" size="sm" />
          <span className="block text-sm text-[#3a3530] mb-3 mt-2">最轻第一步:</span>
          {currentData.firstSteps.map((s, i) => (
            <div key={i} className="flex flex-row items-start gap-2 mb-2">
              <div className="w-5 h-5 rounded flex items-center justify-center" style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}>
                <span className="text-xs text-[#999]">{i + 1}</span>
              </div>
              <span className="flex-1 text-sm text-ink">{s}</span>
            </div>
          ))}

          {currentData.recommendations.length > 0 && (
            <div className="mt-4">
              <div className="h-px bg-[#ddd] opacity-30 mb-3" />
              <span className="block text-sm text-[#999] mb-2">推荐方向:</span>
              {currentData.recommendations.map((rec, i) => {
                const name = typeof rec === 'string' ? rec : (rec as { name: string; price: string }).name
                const price = typeof rec === 'string' ? '' : (rec as { name: string; price: string }).price
                return (
                  <div key={i} className="flex flex-row items-start gap-2 mb-1">
                    <span className="text-[#999] text-sm">-</span>
                    <span className="flex-1 text-sm text-[#3a3530]">
                      {name}{price ? <span className="text-[#999]"> {price}</span> : ''}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 主按钮区域 */}
        <div className="px-5 mt-6">
          {!addedToNext ? (
            <div
              className="rounded-full py-4 flex items-center justify-center hover-lift cursor-pointer"
              style={{ backgroundColor: '#1a1814', boxShadow: '4px 4px 0 #d9a823' }}
              onClick={handleTonightTry}
            >
              <span className="text-white text-lg">Let&apos;s do it!</span>
            </div>
          ) : (
            <div>
              <div
                className="rounded-full py-4 flex items-center justify-center mb-3 hover-lift cursor-pointer"
                style={{ backgroundColor: '#1a1814' }}
                onClick={handleGoNext}
              >
                <span className="text-white text-lg">去 Next 看看</span>
              </div>
              <div
                className="rounded-full py-3 flex items-center justify-center hover-lift cursor-pointer"
                style={{ borderWidth: '1.5px', borderColor: '#1a1814' }}
                onClick={handleShare}
              >
                <span className="text-ink text-base">我做了，看看变化</span>
              </div>
            </div>
          )}
          <span className="block text-center text-xs text-[#999] mt-1">Tonight, try.</span>
        </div>

        <div className="h-20" />
      </div>
    </div>
  )
}
