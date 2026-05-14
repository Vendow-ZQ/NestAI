import { useNavigate } from 'react-router-dom'

import { useUserStore } from '@/stores/user-store'
import { useInterventionStore } from '@/stores/intervention-store'
import { MOCK_FEED, MOCK_NEXT_ACTIONS } from '@/lib/mock/data'
import { Badge } from '@/components/ui/badge'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { BilingualTitle } from '@/components/BilingualTitle'

export default function GrowPage() {
  const navigate = useNavigate()
  const hasUploadedSpace = useUserStore((s) => s.hasUploadedSpace)
  const nextList = useInterventionStore((s) => s.nextList)

  const handleUpload = () => {
    navigate('/upload')
  }

  const handleFeedClick = (feedId: string) => {
    console.log('Feed clicked:', feedId)
  }

  return (
    <div className="min-h-full bg-background overflow-hidden" style={{ fontFamily: "'Noto Sans SC', sans-serif", maxWidth: '100vw' }}>
      {/* Header */}
      <div className="flex flex-row items-center px-4 pt-12 pb-4">
        <BilingualTitle en="NestAI" zh="栖巢" size="2xl" />
      </div>

      <div style={{ overflowY: 'auto', height: 'calc(100vh - 140px)' }}>
        <div className="px-4">
          {/* 上传区 */}
          <div
            className="rounded flex flex-col items-center justify-center mb-2 relative hover-lift"
            style={{
              borderWidth: '1.5px',
              borderStyle: 'dashed',
              borderColor: '#b5ad9f',
              aspectRatio: '4 / 3',
            }}
            onClick={handleUpload}
          >
            <span
              className="text-[#b5ad9f] leading-none"
              style={{ fontSize: '100px', opacity: 0.35, lineHeight: 1 }}
            >
              +
            </span>
            <span className="block text-sm text-ink text-center px-6 mt-2" style={{ fontWeight: 500 }}>
              空间书写你的生活
            </span>
            <span className="block text-xs text-[#b5ad9f] text-center mt-1" style={{ letterSpacing: '2px' }}>
              From Nest to Next
            </span>
          </div>

          {/* 已上传空间卡 */}
          {hasUploadedSpace && (
            <div className="mb-4 bg-card rounded p-4 hover-lift">
              <div className="flex flex-row items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#f0f0f0] flex items-center justify-center">
                  <span className="text-xs text-[#999]">空间</span>
                </div>
                <div className="flex-1">
                  <span className="block text-sm font-semibold text-ink">我的空间</span>
                  <span className="block text-xs text-[#999]">32号房 · 靠窗书桌</span>
                </div>
              </div>
            </div>
          )}

          {/* 我的 Next 横向滚动 */}
          {(nextList.length > 0 || MOCK_NEXT_ACTIONS.length > 0) && (
            <div className="mb-6">
              <span className="block text-sm text-[#999] mb-3">我的 Next</span>
              <div style={{ overflowX: 'auto', whiteSpace: 'nowrap', width: '100%' }}>
                <div className="flex flex-row gap-3" style={{ paddingRight: '16px' }}>
                  {(nextList.length > 0 ? nextList : MOCK_NEXT_ACTIONS.slice(0, 2)).map((item) => (
                    <div
                      key={item.id}
                      className="inline-block w-40 bg-card rounded p-3 flex-shrink-0 hover-lift"
                      style={{ whiteSpace: 'normal' }}
                      onClick={() => {
                        const sceneId = item.sceneId || 'scene-01'
                        navigate(`/result?sceneId=${sceneId}`)
                      }}
                    >
                      <PlaceholderImage label={item.title} className="w-full h-20 rounded mb-2" />
                      <span className="block text-xs font-semibold text-ink">{item.title}</span>
                      <span className="block text-xs text-[#999] mt-1">{item.firstStep}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 看看其他人在生长 */}
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-[#ddd] opacity-30" />
              <span className="text-sm text-[#999]">看看其他人在生长</span>
              <div className="flex-1 h-px bg-[#ddd] opacity-30" />
            </div>

            {MOCK_FEED.map((feed) => (
              <div
                key={feed.id}
                className="mb-3 bg-card rounded overflow-hidden hover-lift"
                onClick={() => handleFeedClick(feed.id)}
              >
                <div className="flex flex-row" style={{ minHeight: '110px' }}>
                  {/* 左半边：改造后大图 */}
                  <div className="flex-shrink-0 overflow-hidden" style={{ width: '45%' }}>
                    <PlaceholderImage label={feed.title} className="w-full h-full" />
                  </div>
                  {/* 右半边：文案 */}
                  <div className="flex-1 p-2 flex flex-col justify-between overflow-hidden">
                    <div>
                      <span className="block text-xs font-semibold text-ink mb-1 leading-tight">
                        {feed.title}
                      </span>
                      <span className="block text-xs text-[#7a736a] leading-relaxed">
                        {feed.description}
                      </span>
                    </div>
                    <div className="flex flex-row items-center gap-1 mt-2">
                      <span className="text-xs text-[#b5ad9f]">{feed.location}</span>
                    </div>
                    <div className="flex flex-row gap-1 flex-wrap mt-1">
                      {feed.lifestyleKeywords.map((kw) => (
                        <Badge key={kw} variant="secondary" className="text-xs py-0 px-1">
                          {kw}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 底部留白 */}
          <div className="h-20" />
        </div>
      </div>
    </div>
  )
}
