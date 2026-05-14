import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useUserStore } from '@/stores/user-store'
import { useSpaceStore } from '@/stores/space-store'
import { BilingualTitle } from '@/components/BilingualTitle'
import { errorMessages } from '@/lib/error-messages'

export default function UploadPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const setUploaded = useUserStore((s) => s.setHasUploadedSpace)
  const uploadedImages = useSpaceStore((s) => s.uploadedImages)
  const addImage = useSpaceStore((s) => s.addUploadedImage)
  const [uploading, setUploading] = useState(false)
  // 直接保存 File 对象，避免重复 fetch blob URL
  const [files, setFiles] = useState<File[]>([])

  const handleChooseImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (!selectedFiles) return
    const remaining = 9 - uploadedImages.length
    const newFiles = Array.from(selectedFiles).slice(0, remaining)

    newFiles.forEach((file) => {
      const url = URL.createObjectURL(file)
      addImage(url)
    })
    setFiles(prev => [...prev, ...newFiles])

    // 清空 input 以便重复选择同一文件
    e.target.value = ''
  }

  const handleStart = async () => {
    if (uploadedImages.length === 0 || files.length === 0) return
    setUploading(true)
    setUploaded(true)

    try {
      // 1. 上传图片到后端（直接使用保存的 File 对象）
      const formData = new FormData()
      files.forEach((file) => {
        formData.append('images', file, file.name)
      })

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()
      const imageUrl = uploadData.data.urls[0]

      // 2. 创建 space
      const spaceRes = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: [imageUrl],
        }),
      })
      const spaceData = await spaceRes.json()
      const spaceId = spaceData.data.id

      // 3. 创建 session
      const sessionRes = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spaceId }),
      })
      const sessionData = await sessionRes.json()
      const sessionId = sessionData.data.id

      // 4. 跳转到生成中页面
      navigate(`/generating?type=space&sessionId=${sessionId}`)
    } catch (err) {
      console.error('上传失败:', err)
      alert(errorMessages.sessionFailed)
      setUploading(false)
    }
  }

  return (
    <div className="min-h-full bg-background overflow-hidden" style={{ fontFamily: "'Noto Sans SC', sans-serif", maxWidth: '100vw' }}>
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex flex-row items-center px-5 pt-12 pb-4">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
          style={{ border: '1.5px solid #b5ad9f' }}
          onClick={() => navigate(-1)}
        >
          <span className="text-[#b5ad9f] text-sm">&lt;</span>
        </div>
      </div>

      {/* 页面标题 */}
      <div className="px-5 mb-4">
        <BilingualTitle en="UPLOAD YOUR SPACE" zh="上传你的空间" size="lg" align="center" />
      </div>

      <div className="px-5 flex-1">
        {uploadedImages.length === 0 ? (
          /* 空状态：大虚线框 */
          <div
            className="rounded flex flex-col items-center justify-center relative overflow-hidden hover-lift"
            style={{
              borderWidth: '1.5px',
              borderStyle: 'dashed',
              borderColor: '#b5ad9f',
              aspectRatio: '4 / 3',
            }}
            onClick={handleChooseImage}
          >
            <span
              className="block text-[#b5ad9f] font-light select-none"
              style={{ fontSize: '120px', lineHeight: 1, opacity: 0.35 }}
            >
              +
            </span>
            <span className="block text-base text-ink mt-2">认识你的空间</span>
            <span className="block text-xs text-[#999] mt-1">建议拍 3-5 张：整体、桌面、床、窗、地</span>
          </div>
        ) : (
          <>
            {/* 上方：4:3 大图预览（显示最后一张） */}
            <div
              className="rounded overflow-hidden mb-4 hover-lift"
              style={{ aspectRatio: '4 / 3' }}
            >
              <img
                src={uploadedImages[uploadedImages.length - 1]}
                alt="预览"
                className="w-full h-full object-cover"
              />
            </div>

            {/* 下方：1:1 缩略图 + 虚线加号 */}
            <div className="flex flex-row flex-wrap gap-2">
              {uploadedImages.map((img, i) => (
                <div
                  key={i}
                  className="rounded overflow-hidden hover-lift relative"
                  style={{ width: '18%', aspectRatio: '1 / 1' }}
                >
                  <img
                    src={img}
                    alt={`图片 ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* 编号角标 */}
                  <div
                    className="absolute top-1 left-1 bg-ink rounded-full flex items-center justify-center"
                    style={{ width: '16px', height: '16px' }}
                  >
                    <span className="text-white" style={{ fontSize: '9px' }}>{i + 1}</span>
                  </div>
                </div>
              ))}
              {/* 虚线加号框 */}
              {uploadedImages.length < 9 && (
                <div
                  className="rounded flex items-center justify-center hover-lift cursor-pointer"
                  style={{
                    width: '18%',
                    aspectRatio: '1 / 1',
                    borderWidth: '1.5px',
                    borderStyle: 'dashed',
                    borderColor: '#b5ad9f',
                  }}
                  onClick={handleChooseImage}
                >
                  <span
                    className="text-[#b5ad9f] select-none"
                    style={{ fontSize: '32px', lineHeight: 1, opacity: 0.35 }}
                  >
                    +
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 底部固定按钮 */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: '#ffffff',
          zIndex: 100,
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
