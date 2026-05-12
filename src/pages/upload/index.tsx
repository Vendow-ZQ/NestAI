import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { useUserStore } from '@/lib/store/user-store'
import { useSpaceStore } from '@/lib/store/space-store'
import { CustomTabBar } from '@/components/tab-bar'
import { BilingualTitle } from '@/components/bilingual-title'

export default function UploadPage() {
  const setUploaded = useUserStore((s) => s.setHasUploadedSpace)
  const uploadedImages = useSpaceStore((s) => s.uploadedImages)
  const addImage = useSpaceStore((s) => s.addUploadedImage)

  const handleChooseImage = () => {
    Taro.chooseImage({
      count: 9 - uploadedImages.length,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        res.tempFilePaths.forEach((path) => {
          addImage(path)
        })
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

      <View className="px-5 flex-1">
        {uploadedImages.length === 0 ? (
          /* 空状态：大虚线框 */
          <View
            className="rounded flex flex-col items-center justify-center relative overflow-hidden hover-lift"
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
          <>
            {/* 上方：4:3 大图预览（显示最后一张） */}
            <View
              className="rounded overflow-hidden mb-4 hover-lift"
              style={{ aspectRatio: '4 / 3' }}
            >
              <Image
                src={uploadedImages[uploadedImages.length - 1]}
                mode="aspectFill"
                style={{ width: '100%', height: '100%' }}
              />
            </View>

            {/* 下方：1:1 缩略图 + 虚线加号 */}
            <View className="flex flex-row flex-wrap gap-2">
              {uploadedImages.map((img, i) => (
                <View
                  key={i}
                  className="rounded overflow-hidden hover-lift relative"
                  style={{ width: '18%', aspectRatio: '1 / 1' }}
                >
                  <Image
                    src={img}
                    mode="aspectFill"
                    style={{ width: '100%', height: '100%' }}
                  />
                  {/* 编号角标 */}
                  <View
                    className="absolute top-1 left-1 bg-ink rounded-full flex items-center justify-center"
                    style={{ width: '16px', height: '16px' }}
                  >
                    <Text className="text-white" style={{ fontSize: '9px' }}>{i + 1}</Text>
                  </View>
                </View>
              ))}
              {/* 虚线加号框 */}
              {uploadedImages.length < 9 && (
                <View
                  className="rounded flex items-center justify-center hover-lift"
                  style={{
                    width: '18%',
                    aspectRatio: '1 / 1',
                    borderWidth: '1.5px',
                    borderStyle: 'dashed',
                    borderColor: '#b5ad9f',
                  }}
                  onClick={handleChooseImage}
                >
                  <Text
                    className="text-[#b5ad9f] select-none"
                    style={{ fontSize: '32px', lineHeight: 1, opacity: 0.35 }}
                  >
                    +
                  </Text>
                </View>
              )}
            </View>
          </>
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
