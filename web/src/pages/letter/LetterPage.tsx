import { useNavigate } from 'react-router-dom'

import { useMemoryStore } from '@/stores/memory-store'
import { MOCK_LETTERS, MOCK_NEXT_ACTIONS } from '@/lib/mock/data'
import { PlaceholderImage } from '@/components/PlaceholderImage'
import { BilingualTitle } from '@/components/BilingualTitle'

export default function LetterPage() {
  const navigate = useNavigate()
  const letters = useMemoryStore((s) => s.letters)
  const displayLetter = letters.length > 0 ? letters[letters.length - 1] : MOCK_LETTERS[0]

  const handleBack = () => {
    navigate(-1)
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
      <div className="px-5 mb-4">
        <BilingualTitle en="A LETTER" zh="一封信" size="lg" />
      </div>

      <div style={{ overflowY: 'auto', height: 'calc(100vh - 160px)' }}>
        {/* 改造后效果图 — 横向滚动 */}
        <div className="px-5 mb-6">
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <div className="flex flex-row gap-3" style={{ paddingRight: '16px' }}>
              <div className="flex-shrink-0 rounded overflow-hidden hover-lift" style={{ width: '85vw', aspectRatio: '4 / 3' }}>
                <PlaceholderImage label="改造后" className="w-full h-full" />
              </div>
              <div className="flex-shrink-0 rounded overflow-hidden hover-lift" style={{ width: '85vw', aspectRatio: '4 / 3' }}>
                <PlaceholderImage label="改造前" className="w-full h-full" />
              </div>
            </div>
          </div>
          <span className="block text-xs text-[#b5ad9f] mt-2 text-center">← 左滑查看改造前</span>
        </div>

        {/* 信件正文 */}
        <div className="px-5">
          <span className="block text-base text-ink mb-6">亲爱的你,</span>

          {displayLetter.content.map((paragraph, i) => (
            <p key={i} className="block text-sm text-[#3a3530] leading-relaxed mb-3">
              {paragraph}
            </p>
          ))}

          {/* 署名 */}
          <div className="mt-6 mb-8">
            <span className="block text-sm text-ink">—— Nobi</span>
          </div>

          {/* 下一步可以试试 */}
          <div className="mb-6">
            <BilingualTitle en="NEXT STEP" zh="下一步可以试试" size="sm" />
            {MOCK_NEXT_ACTIONS.slice(0, 1).map((item) => (
              <div
                key={item.id}
                className="bg-card rounded p-4 mt-3 hover-lift cursor-pointer"
                style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
                onClick={() => {
                  const sceneId = item.sceneId || 'scene-01'
                  navigate(`/result?sceneId=${sceneId}`)
                }}
              >
                <span className="block text-sm text-ink font-semibold">{item.title}</span>
                <span className="block text-xs text-[#999] mt-1">{item.firstStep}</span>
              </div>
            ))}
          </div>

          {/* 分享按钮 */}
          <div className="mb-8 flex flex-col gap-3">
            <div
              className="rounded-full py-3 flex items-center justify-center hover-lift cursor-pointer"
              style={{ backgroundColor: '#1a1814' }}
            >
              <span className="text-[#f7f3ea] text-sm">分享 Share to Grow</span>
            </div>
            <div
              className="rounded-full py-3 flex items-center justify-center hover-lift cursor-pointer"
              style={{ borderWidth: '1.5px', borderColor: '#1a1814' }}
            >
              <span className="text-ink text-sm">转发 Share to Friends</span>
            </div>
          </div>
        </div>

        <div className="h-20" />
      </div>
    </div>
  )
}