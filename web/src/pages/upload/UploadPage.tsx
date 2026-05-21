import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { BilingualTitle } from '@/components/BilingualTitle'
import { NobiMascot } from '@/components/NobiMascot'
import { errorMessages } from '@/lib/error-messages'
import { useSpaceStore } from '@/stores/space-store'
import { useUserStore } from '@/stores/user-store'

export default function UploadPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const setUploaded = useUserStore((s) => s.setHasUploadedSpace)
  const uploadedImages = useSpaceStore((s) => s.uploadedImages)
  const addImage = useSpaceStore((s) => s.addUploadedImage)
  const resetSpace = useSpaceStore((s) => s.reset)
  const [uploading, setUploading] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const fromGrow = (location.state as { transition?: string } | null)?.transition === 'feed-upload'

  useEffect(() => {
    resetSpace()
    setFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [resetSpace])

  const handleChooseImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return

    const remaining = 9 - uploadedImages.length
    const newFiles = Array.from(selectedFiles).slice(0, remaining)

    newFiles.forEach((file) => {
      addImage(URL.createObjectURL(file))
    })
    setFiles((prev) => [...prev, ...newFiles])
    e.target.value = ''
  }

  const handleStart = async () => {
    if (uploadedImages.length === 0 || files.length === 0) return
    setUploading(true)
    setUploaded(true)

    try {
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('images', file, file.name)
      })

      const uploadRes = await fetch('/api/upload/', {
        method: 'POST',
        body: formData,
      })
      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.status}`)
      }
      const uploadData = await uploadRes.json()
      const imageUrls = uploadData.data.urls as string[]

      const spaceRes = await fetch('/api/spaces/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: imageUrls }),
      })
      if (!spaceRes.ok) {
        throw new Error(`Create space failed: ${spaceRes.status}`)
      }
      const spaceData = await spaceRes.json()
      const spaceId = spaceData.data.id

      const sessionRes = await fetch('/api/sessions/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId, images: imageUrls }),
      })
      if (!sessionRes.ok) {
        throw new Error(`Create session failed: ${sessionRes.status}`)
      }
      const sessionData = await sessionRes.json()
      const sessionId = sessionData.data.id

      navigate(`/generating?type=space&sessionId=${sessionId}`)
    } catch (err) {
      console.error('上传失败:', err)
      alert(errorMessages.sessionFailed)
      setUploading(false)
    }
  }

  return (
    <div
      className={`upload-page-shell min-h-full bg-background overflow-hidden ${fromGrow ? 'from-grow' : ''}`}
      style={{ maxWidth: '100vw' }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex flex-row items-center px-5 pt-12 pb-4">
        <button
          type="button"
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
          style={{ border: '1px solid rgba(60, 60, 67, 0.18)' }}
          onClick={() => navigate(-1)}
          aria-label="Back"
        >
          <span className="text-ink text-sm">&lt;</span>
        </button>
      </div>

      <div className="px-5 mb-4">
        <BilingualTitle en="UPLOAD YOUR SPACE" zh="上传你的空间" size="lg" align="center" />
      </div>

      <div className="px-5 flex-1">
        <button
          type="button"
          className={`upload-space-card grow-upload-card rounded-[22px] overflow-hidden text-left hover-lift ${
            uploadedImages.length > 0 ? 'has-preview' : ''
          }`}
          onClick={handleChooseImage}
        >
          <NobiMascot className="nobi-on-upload-card" label="Nobi waits on the upload card" />
          <div className="feed-upload-stage flex items-center justify-center">
            {uploadedImages.length > 0 ? (
              <img
                src={uploadedImages[uploadedImages.length - 1]}
                alt="空间预览"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="feed-upload-plus leading-none">+</span>
            )}
          </div>
          <div className="p-4 relative z-10 text-center">
            <span className="block text-[17px] leading-snug font-semibold text-ink">
              {uploadedImages.length > 0 ? '继续补充空间细节' : '认识你的空间'}
            </span>
            <span className="block text-sm text-[#6e6e73] mt-2 leading-relaxed">
              {uploadedImages.length > 0 ? '可以继续添加整体、桌面、窗边或角落照片。' : '建议拍 3-5 张：整体、桌面、床、窗、地面。'}
            </span>
          </div>
        </button>

        {uploadedImages.length > 0 && (
          <div className="flex flex-row flex-wrap gap-2 mt-4">
            {uploadedImages.map((img, i) => (
              <div
                key={`${img}-${i}`}
                className="rounded overflow-hidden hover-lift relative"
                style={{ width: '18%', aspectRatio: '1 / 1' }}
              >
                <img src={img} alt={`图片 ${i + 1}`} className="w-full h-full object-cover" />
                <div
                  className="absolute top-1 left-1 bg-ink rounded-full flex items-center justify-center"
                  style={{ width: '16px', height: '16px' }}
                >
                  <span className="text-white" style={{ fontSize: '9px' }}>{i + 1}</span>
                </div>
              </div>
            ))}
            {uploadedImages.length < 9 && (
              <button
                type="button"
                className="rounded flex items-center justify-center hover-lift cursor-pointer"
                style={{
                  width: '18%',
                  aspectRatio: '1 / 1',
                  borderWidth: '1.5px',
                  borderStyle: 'dashed',
                  borderColor: 'rgba(60, 60, 67, 0.22)',
                }}
                onClick={handleChooseImage}
              >
                <span className="text-[#b5ad9f] select-none" style={{ fontSize: '32px', lineHeight: 1, opacity: 0.45 }}>
                  +
                </span>
              </button>
            )}
          </div>
        )}
      </div>

      <div
        className="app-fixed-bottom upload-action-bar"
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: 'rgba(255,255,255,0.86)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          zIndex: 998,
        }}
      >
        <button
          className="btn-tonight"
          style={{ opacity: uploadedImages.length > 0 && !uploading ? 1 : 0.4 }}
          onClick={uploadedImages.length > 0 && !uploading ? handleStart : undefined}
          disabled={uploadedImages.length === 0 || uploading}
        >
          <span className="block text-background text-lg">
            {uploading ? '正在上传...' : '开始分析'}
          </span>
          <span className="block btn-tonight-text">
            {uploading ? 'Uploading...' : 'Analyze'}
          </span>
        </button>
      </div>
    </div>
  )
}
