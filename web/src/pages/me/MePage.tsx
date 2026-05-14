import { useNavigate } from 'react-router-dom'

import { useUserStore } from '@/stores/user-store'
import { useMemoryStore } from '@/stores/memory-store'
import { useInterventionStore } from '@/stores/intervention-store'
import { MOCK_LETTERS } from '@/lib/mock/data'
import { BilingualTitle } from '@/components/BilingualTitle'

export default function MePage() {
  const navigate = useNavigate()
  const hasUploadedSpace = useUserStore((s) => s.hasUploadedSpace)
  const letters = useMemoryStore((s) => s.letters)
  const interventionHistory = useInterventionStore((s) => s.nextList)
  const displayLetters = letters.length > 0 ? letters : MOCK_LETTERS

  return (
    <div className="min-h-full bg-background overflow-hidden" style={{ fontFamily: "'Noto Sans SC', sans-serif", maxWidth: '100vw' }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <BilingualTitle en="ME" zh="我的" size="2xl" />
      </div>

      <div style={{ overflowY: 'auto', height: 'calc(100vh - 120px)' }}>
        {/* 用户头像 */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-full bg-[#f0f0f0] flex items-center justify-center mb-2">
            <span className="text-2xl text-[#999]">我</span>
          </div>
          <span className="block text-sm text-ink">你的栖巢</span>
        </div>

        {/* 我的空间 */}
        <div className="px-5 mb-6">
          <div className="bg-card rounded p-4 hover-lift" style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}>
            <span className="block text-sm text-[#999] mb-2">我的空间</span>
            {hasUploadedSpace ? (
              <div>
                <span className="block text-base text-ink font-semibold">清华深研院 7+1 / 32号房</span>
                <span className="block text-sm text-[#7a736a] mt-1">入住 3 个月</span>
              </div>
            ) : (
              <span className="block text-sm text-[#7a736a]">还没有上传空间</span>
            )}
          </div>
        </div>

        {/* 我的信件 */}
        <div className="px-5 mb-6">
          <span className="block text-sm text-[#999] mb-3">我的信件 ({displayLetters.length})</span>
          {displayLetters.slice(0, 3).map((letter) => (
            <div
              key={letter.id}
              className="bg-card rounded p-4 mb-2 hover-lift cursor-pointer"
              style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
              onClick={() => navigate(`/letter?id=${letter.id}`)}
            >
              <span className="block text-sm text-ink font-semibold">{letter.title}</span>
              <span className="block text-xs text-[#999] mt-1">{letter.date}</span>
            </div>
          ))}
        </div>

        {/* 历史干预 */}
        <div className="px-5 mb-6">
          <span className="block text-sm text-[#999] mb-3">历史干预 ({interventionHistory.length})</span>
          {interventionHistory.length > 0 ? (
            interventionHistory.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="bg-card rounded p-3 mb-2 flex flex-row items-center hover-lift"
                style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
              >
                <div className="w-10 h-10 rounded bg-[#f0f0f0] flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-[#999]">干预</span>
                </div>
                <div className="flex-1 ml-3">
                  <span className="block text-sm text-ink">{item.title}</span>
                  <span className="block text-xs text-[#999]">{item.costRange}</span>
                </div>
              </div>
            ))
          ) : (
            <span className="block text-sm text-[#7a736a]">还没有干预记录</span>
          )}
        </div>

        {/* 设置与隐私 */}
        <div className="px-5 mb-6">
          <div
            className="bg-card rounded p-4 hover-lift"
            style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
          >
            <span className="block text-sm text-ink">设置与隐私</span>
            <span className="block text-xs text-[#999] mt-1">清空 Memory · 导出数据 · 隐私偏好</span>
          </div>
        </div>

        <div className="h-20" />
      </div>
    </div>
  )
}