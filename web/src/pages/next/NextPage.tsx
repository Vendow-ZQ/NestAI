import { useNavigate } from 'react-router-dom'

import { useInterventionStore } from '@/stores/intervention-store'
import { MOCK_NEXT_ACTIONS } from '@/lib/mock/data'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { BilingualTitle } from '@/components/BilingualTitle'

export default function NextPage() {
  const navigate = useNavigate()
  const nextList = useInterventionStore((s) => s.nextList)
  const displayList = nextList.length > 0 ? nextList : MOCK_NEXT_ACTIONS

  return (
    <div className="min-h-full bg-background overflow-hidden" style={{ fontFamily: "'Noto Sans SC', sans-serif", maxWidth: '100vw' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <BilingualTitle en="NEXT" zh="你准备试试看的" size="2xl" />
      </div>

      <div style={{ overflowY: 'auto', height: 'calc(100vh - 120px)' }}>
        {displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="block text-base text-[#999]">还没有收藏的动作</span>
            <span className="block text-sm text-[#b5ad9f] mt-2">去 Grow 看看有什么可以试试</span>
          </div>
        ) : (
          displayList.map((item) => (
            <div
              key={item.id}
              className="mx-5 mb-4 bg-card rounded overflow-hidden hover-lift"
              style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
            >
              {/* 预览图 */}
              <div className="w-full" style={{ aspectRatio: '4 / 3' }}>
                <PlaceholderImage label={item.title} className="w-full h-full" />
              </div>

              {/* 内容 */}
              <div className="p-4">
                <span className="block text-base font-semibold text-ink">{item.title}</span>
                <span className="block text-sm text-[#7a736a] mt-1">{item.lifestyleGoal}</span>

                <div className="mt-3">
                  <span className="block text-sm text-[#999]">最轻第一步:</span>
                  <span className="block text-sm text-ink mt-1">{item.firstStep}</span>
                </div>

                <div className="flex flex-row items-center gap-4 mt-3">
                  <span className="text-xs text-[#999]">{item.estimatedTime}</span>
                  <span className="text-xs text-[#999]">{item.costRange}</span>
                </div>

                {/* 按钮区 */}
                <div className="flex flex-row gap-3 mt-4">
                  <div
                    className="flex-1 rounded-full py-3 flex items-center justify-center hover-lift cursor-pointer"
                    style={{ backgroundColor: '#1a1814', boxShadow: '4px 4px 0 #d9a823' }}
                    onClick={() => {
                      const sceneId = item.sceneId || 'scene-01'
                      navigate(`/result?sceneId=${sceneId}`)
                    }}
                  >
                    <span className="text-white text-sm">Let&apos;s do it!</span>
                  </div>
                  <div
                    className="flex-1 rounded-full py-3 flex items-center justify-center hover-lift cursor-pointer"
                    style={{ borderWidth: '1.5px', borderColor: '#1a1814' }}
                    onClick={() => {
                      navigate('/share')
                    }}
                  >
                    <span className="text-ink text-sm">我做了</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        <div className="h-20" />
      </div>
    </div>
  )
}