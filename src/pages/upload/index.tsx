import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { useUserStore } from '@/lib/store/user-store'
import { useSpaceStore } from '@/lib/store/space-store'
import { CustomTabBar } from '@/components/tab-bar'
import { BilingualTitle } from '@/components/bilingual-title'
import { PlaceholderImage } from '@/components/placeholder-image'

export default function UploadPage() {
  const setUploaded = useUserStore((s) => s.setHasUploadedSpace)
  const setImages = useSpaceStore((s) => s.setUploadedImages)
  const uploadedImages = useSpaceStore((s) => s.uploadedImages)

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 5,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        setImages(res.tempFilePaths)
      },
    })
  }

  const handleStart = () => {
    setUploaded(true)
    Taro.navigateTo({
      url: '/pages/generating/index?type=space&sceneId=scene-01',
    })
  }

  return (
    <View className="min-h-full bg-background overflow-hidden" style={{ fontFamily: "'Noto Sans SC', sans-serif", maxWidth: '100vw' }}>
      {/* Header */}
      <View className="flex flex-row items-center px-5 pt-12 pb-4">
        <View
          className="w-9 h-9 rounded-full flex items-center justify-center"
          style={{ border: '1.5px solid #b5ad9f' }}
          onClick={() => Taro.navigateBack()}
        >
          <Text className="text-[#b5ad9f] text-sm">&lt;</Text>
        </View>
      </View>

      {/* 页面标题 */}
      <View className="px-5 mb-4">
        <BilingualTitle en="UPLOAD YOUR SPACE" zh="上传你的空间" size="lg" align="center" />
      </View>

      {/* 拍照/上传区 */}
      <View className="px-5 flex-1">
        {uploadedImages.length === 0 ? (
          /* 空状态：大虚线框 */
          <View
            className="rounded flex flex-col items-center justify-center mb-4 relative overflow-hidden hover-lift"
            style={{
              borderWidth: '1.5px',
              borderStyle: 'dashed',
              borderColor: '#b5ad9f',
              aspectRatio: '4 / 3',
            }}
            onClick={handleChooseImage}
          >
            <Text
              className="block text-[#b5ad9f] font-light select-none"
              style={{ fontSize: '120px', lineHeight: 1, opacity: 0.35 }}
            >
              +
            </Text>
            <Text className="block text-base text-ink mt-2">认识你的空间</Text>
            <Text className="block text-xs text-[#999] mt-1">建议拍 3-5 张：整体、桌面、床、窗、地</Text>
          </View>
        ) : (
          /* 已有图片：横向排列 编号缩略图 + 虚线加号框 */
          <View className="flex flex-row flex-wrap gap-2 mb-4">
            {uploadedImages.map((_img, i) => (
              <View
                key={i}
                className="rounded overflow-hidden hover-lift relative"
                style={{ width: '30%', aspectRatio: '4 / 3' }}
              >
                <PlaceholderImage label="" className="w-full h-full" />
                {/* 编号角标 */}
                <View
                  className="absolute top-1 left-1 bg-ink text-background rounded-full flex items-center justify-center"
                  style={{ width: '18px', height: '18px' }}
                >
                  <Text className="text-white" style={{ fontSize: '10px' }}>{i + 1}</Text>
                </View>
              </View>
            ))}
            {/* 虚线加号框 */}
            <View
              className="rounded flex items-center justify-center hover-lift"
              style={{
                width: '30%',
                aspectRatio: '4 / 3',
                borderWidth: '1.5px',
                borderStyle: 'dashed',
                borderColor: '#b5ad9f',
              }}
              onClick={handleChooseImage}
            >
              <Text
                className="text-[#b5ad9f] select-none"
                style={{ fontSize: '40px', lineHeight: 1, opacity: 0.35 }}
              >
                +
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 底部固定按钮 */}
      <View
        style={{
          position: 'fixed',
          bottom: 60,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: '#ffffff',
          zIndex: 100,
        }}
      >
        <View
          className="btn-tonight"
          style={{ opacity: uploadedImages.length > 0 ? 1 : 0.4 }}
          onClick={uploadedImages.length > 0 ? handleStart : undefined}
        >
          <Text className="block text-background text-lg">开始分析</Text>
          <Text className="block btn-tonight-text">Analyze</Text>
        </View>
      </View>

      <CustomTabBar current="grow" />
    </View>
  )
}
