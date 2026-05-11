import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { useSpaceStore } from '@/lib/store/space-store'
import { useUserStore } from '@/lib/store/user-store'
import { CustomTabBar } from '@/components/tab-bar'

export default function UploadPage() {
  const addImage = useSpaceStore((s) => s.addUploadedImage)
  const setUploaded = useUserStore((s) => s.setHasUploadedSpace)

  const handleTakePhoto = () => {
    addImage('mock-dorm-photo-1.jpg')
    setUploaded(true)
    Taro.navigateTo({ url: '/pages/generating/index?type=space&sceneId=scene-01' })
  }

  const handleChooseImage = () => {
    addImage('mock-dorm-photo-2.jpg')
    addImage('mock-dorm-photo-3.jpg')
    setUploaded(true)
    Taro.navigateTo({ url: '/pages/generating/index?type=space&sceneId=scene-01' })
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  return (
    <View className="min-h-full bg-background flex flex-col" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
      {/* Header - 标题居中 */}
      <View className="flex flex-row items-center justify-center px-5 pt-12 pb-4 relative">
        <View
          onClick={handleBack}
          className="w-9 h-9 rounded-full flex items-center justify-center absolute left-5"
          style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
        >
          <Text className="text-ink text-sm">&lt;</Text>
        </View>
        <Text className="text-lg text-ink font-semibold">上传你的空间</Text>
      </View>

      {/* 主区域 - 占满剩余空间 */}
      <View className="flex-1 flex flex-col px-5">
        {/* 拍照框 4:3 */}
        <View
          className="w-full rounded flex flex-col items-center justify-center"
          style={{
            borderWidth: '1.5px',
            borderStyle: 'dashed',
            borderColor: '#b5ad9f',
            aspectRatio: '4 / 3',
          }}
          onClick={handleTakePhoto}
        >
          <Text className="block text-lg text-ink mb-2">认识你的空间</Text>
          <Text className="block text-sm text-[#999] text-center">
            建议拍 3-5 张：整体、桌面、床、窗、地
          </Text>
        </View>

        {/* 选择图片入口 */}
        <View className="mt-4">
          <View
            className="w-full rounded py-3 flex items-center justify-center"
            style={{ borderWidth: '1.5px', borderColor: '#b5ad9f' }}
            onClick={handleChooseImage}
          >
            <Text className="text-sm text-[#999]">从相册选择图片</Text>
          </View>
        </View>
      </View>

      {/* 底部开始分析按钮 - 固定底部 */}
      <View className="px-5 pb-20 pt-4">
        <View
          className="rounded-full py-4 flex items-center justify-center"
          style={{ backgroundColor: '#1a1814', boxShadow: '4px 4px 0 #d9a823' }}
          onClick={handleTakePhoto}
        >
          <Text className="text-white text-lg">开始分析</Text>
        </View>
        <Text className="block text-center text-xs text-[#999] mt-1">Tonight, try.</Text>
      </View>

      {/* 底部导航栏 */}
      <CustomTabBar current="grow" />
    </View>
  )
}
