import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { BilingualTitle } from '@/components/BilingualTitle'
import { apiUrl, normalizeLevel } from '@/lib/api'
import { errorMessages } from '@/lib/error-messages'
import { useShareStore } from '@/stores/share-store'

export default function SharePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const setFeedback = useShareStore((s) => s.setFeedback)
  const sessionId = searchParams.get('sessionId')
  const level = normalizeLevel(searchParams.get('level'))

  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [userFeeling, setUserFeeling] = useState('')
  const [unfinishedText, setUnfinishedText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  const handleChooseImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    const nextFiles = Array.from(selectedFiles).slice(0, 3)
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setFiles(nextFiles)
    setPreviewUrls(nextFiles.map((file) => URL.createObjectURL(file)))
    e.target.value = ''
  }

  const uploadAfterImages = async () => {
    if (files.length === 0) return []

    const formData = new FormData()
    files.forEach((file) => {
      formData.append('images', file, file.name)
    })

    const res = await fetch(apiUrl('/api/upload/'), {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      throw new Error(`Upload feedback images failed: ${res.status}`)
    }

    const payload = await res.json()
    return payload.data.urls as string[]
  }

  const handleGenerate = async () => {
    if (!sessionId) {
      navigate('/generating?type=letter', { replace: true })
      return
    }

    setSubmitting(true)
    try {
      const afterImages = await uploadAfterImages()
      const unfinishedSteps = unfinishedText.trim() ? [unfinishedText.trim()] : []
      const completionStatus = unfinishedSteps.length > 0
        ? `部分做到，未完成：${unfinishedSteps[0]}`
        : '已经做了一些改变'

      setFeedback({
        sessionId,
        level,
        afterImages,
        userFeeling: userFeeling.trim() || '我做完后想记录一下这次空间变化。',
        completionStatus,
        unfinishedSteps,
      })

      navigate(`/generating?type=letter&sessionId=${sessionId}&level=${level}`, { replace: true })
    } catch (err) {
      console.error('提交变化失败:', err)
      alert(errorMessages.uploadFailed)
      setSubmitting(false)
    }
  }

  return (
    <div className="nest-page-shell min-h-full overflow-hidden" style={{ maxWidth: '100vw' }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="nest-page-content flex flex-row items-center px-5 pt-12 pb-2">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer nest-glass-card"
          aria-label="Back"
        >
          <span className="text-ink text-sm">&lt;</span>
        </button>
      </div>

      <div className="nest-page-content px-5 mb-4">
        <BilingualTitle en="SHARE CHANGES" zh="看看变化了" size="lg" />
      </div>

      <div className="nest-page-content" style={{ overflowY: 'auto', height: 'calc(var(--app-height) - 140px)' }}>
        <div className="px-5 grid gap-5">
          <section>
            <span className="nest-section-label">Step 1</span>
            <div className="nest-glass-card rounded-[22px] overflow-hidden">
              <button
                type="button"
                className="nest-media-stage w-full flex items-center justify-center"
                style={{ aspectRatio: '4 / 3' }}
                onClick={handleChooseImage}
              >
                {previewUrls.length > 0 ? (
                  <img src={previewUrls[0]} alt="变化后的空间" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl text-[#8e8e93]" style={{ opacity: 0.55 }}>+</span>
                )}
              </button>
              <div className="p-4 text-center">
                <span className="block text-[17px] font-semibold text-ink">拍一张现在的样子</span>
                <span className="block text-sm text-[#6e6e73] mt-1">让 Nobi 看见空间真的变了哪里。</span>
              </div>
            </div>

            {previewUrls.length > 1 && (
              <div className="flex gap-2 mt-2">
                {previewUrls.slice(1).map((url) => (
                  <img key={url} src={url} alt="变化后的空间补充" className="w-16 h-16 rounded-[14px] object-cover" />
                ))}
              </div>
            )}
          </section>

          <section>
            <span className="nest-section-label">Step 2 · optional</span>
            <textarea
              className="nest-glass-card w-full rounded-[22px] p-4 text-sm text-ink outline-none resize-none"
              style={{ minHeight: '104px' }}
              placeholder="做完之后，你坐进去的感觉怎么样?"
              value={userFeeling}
              onChange={(e) => setUserFeeling(e.target.value)}
            />
          </section>

          <section>
            <span className="nest-section-label">Step 3 · optional</span>
            <textarea
              className="nest-glass-card w-full rounded-[22px] p-4 text-sm text-ink outline-none resize-none"
              style={{ minHeight: '92px' }}
              placeholder="哪一步没做到? 可以直接写下来。"
              value={unfinishedText}
              onChange={(e) => setUnfinishedText(e.target.value)}
            />
          </section>

          <button
            type="button"
            className="ios-primary-button w-full rounded-full py-4 flex items-center justify-center cursor-pointer disabled:opacity-60"
            onClick={handleGenerate}
            disabled={submitting}
          >
            <span className="text-white text-lg font-semibold">{submitting ? '正在保存变化...' : '生成一封信'}</span>
          </button>
        </div>

        <div className="h-24" />
      </div>
    </div>
  )
}
