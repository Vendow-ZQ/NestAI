import { useNavigate } from 'react-router-dom'

import { useMemoryStore } from '@/stores/memory-store'
import { MOCK_LETTERS } from '@/lib/mock/data'
import { BilingualTitle } from '@/components/BilingualTitle'

export default function SharePage() {
  const navigate = useNavigate()
  const addLetter = useMemoryStore((s) => s.addLetter)

  const handleGenerate = () => {
    const letter = MOCK_LETTERS[0]
    addLetter(letter)
    navigate('/generating?type=letter', { replace: true })
  }

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
        <BilingualTitle en="SHARE CHANGES" zh="看看变化了" size="lg" />
      </div>

      {/* Step 1: 拍照 */}
      <div className="px-5 mb-6">
        <span className="block text-sm text-[#999] mb-2">Step 1:</span>
        <span className="block text-base text-ink mb-3">拍一张现在的样子</span>
        <div
          className="w-full rounded flex items-center justify-center bg-[#f5f5f5] hover-lift cursor-pointer"
          style={{ aspectRatio: '4 / 3', borderStyle: 'dashed', borderWidth: '2px', borderColor: '#b5ad9f' }}
        >
          <span className="text-4xl text-[#b5ad9f]" style={{ opacity: 0.5 }}>+</span>
        </div>
      </div>

      {/* Step 2: 感受 */}
      <div className="px-5 mb-6">
        <span className="block text-sm text-[#999] mb-2">Step 2: (可选)</span>
        <span className="block text-base text-ink mb-3">说说感受?</span>
        <div className="bg-card rounded p-3" style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}>
          <span className="block text-sm text-[#999]">做完之后,你坐进去的感觉怎么样?</span>
        </div>
      </div>

      {/* Step 3: 未完成步骤 */}
      <div className="px-5 mb-6">
        <span className="block text-sm text-[#999] mb-2">Step 3: (可选)</span>
        <span className="block text-base text-ink mb-3">哪一步没做到?</span>
        {['桌面收纳没动', '没买台灯', '海报没挂'].map((item, i) => (
          <div key={i} className="flex flex-row items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}>
              <span className="text-xs text-[#999]">{i + 1}</span>
            </div>
            <span className="flex-1 text-sm text-ink">{item}</span>
          </div>
        ))}
      </div>

      {/* 生成按钮 */}
      <div className="px-5 mt-4">
        <div
          className="rounded-full py-4 flex items-center justify-center hover-lift cursor-pointer"
          style={{ backgroundColor: '#1a1814', boxShadow: '4px 4px 0 #d9a823' }}
          onClick={handleGenerate}
        >
          <div className="flex flex-col items-center">
            <span className="text-white text-lg">生成一封信</span>
          </div>
        </div>
      </div>

      <div className="h-24" />
    </div>
  )
}