import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'

import { useSpaceStore } from '@/lib/store/space-store'
import { useUserStore } from '@/lib/store/user-store'

export default function UploadPage() {
  const [activeTab, setActiveTab] = useState<string>('photo')
  const [description, setDescription] = useState('')
  const addImage = useSpaceStore((s) => s.addUploadedImage)
  const setUploaded = useUserStore((s) => s.setHasUploadedSpace)

  const handleTakePhoto = () => {
    addImage('mock-dorm-photo-1.jpg')
    setUploaded(true)
    Taro.navigateTo({ url: '/pages/generating/index?type=space' })
  }

  const handleChooseImage = () => {
    addImage('mock-dorm-photo-2.jpg')
    addImage('mock-dorm-photo-3.jpg')
    setUploaded(true)
    Taro.navigateTo({ url: '/pages/generating/index?type=space' })
  }

  const handleSubmitDescription = () => {
    if (description.trim()) {
      setUploaded(true)
      Taro.navigateTo({ url: '/pages/chat/index' })
    }
  }

  const handleBack = () => {
    Taro.navigateBack()
  }

  const tabList = [
    { key: 'photo', label: '拍照' },
    { key: 'upload', label: '上传图片' },
    { key: 'text', label: '文字描述' },
  ]

  return (
    <View className="min-h-full bg-background" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
      {/* Header */}
      <View className="flex flex-row items-center px-5 pt-12 pb-4">
        <View onClick={handleBack} className="mr-3">
          <Text className="text-ink text-sm">← 返回</Text>
        </View>
        <Text className="text-lg text-ink font-semibold">上传你的空间</Text>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 100px)' }}>
        {/* Tab 切换 */}
        <View className="flex flex-row gap-2 px-5 mb-6">
          {tabList.map((tab) => (
            <View
              key={tab.key}
              className={`flex-1 py-2 rounded flex items-center justify-center ${
                activeTab === tab.key ? 'bg-ink' : 'bg-card'
              }`}
              style={{ borderWidth: '1.5px', borderColor: activeTab === tab.key ? 'transparent' : '#b5ad9f' }}
              onClick={() => setActiveTab(tab.key)}
            >
              <Text className={`text-sm ${activeTab === tab.key ? 'text-white' : 'text-[#999]'}`}>
                {tab.label}
              </Text>
            </View>
          ))}
        </View>

        {/* 主区域 */}
        <View className="px-5">
          {activeTab === 'photo' && (
            <View className="flex flex-col items-center">
              <View
                className="w-full h-48 rounded flex flex-col items-center justify-center mb-4"
                style={{ borderWidth: '1.5px', borderStyle: 'dashed', borderColor: '#b5ad9f' }}
                onClick={handleTakePhoto}
              >
                <Text className="block text-lg text-ink mb-2">📷 拍一张</Text>
                <Text className="block text-sm text-[#999] text-center">
                  建议拍 3-5 张：整体、桌面、床、窗、地
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'upload' && (
            <View className="flex flex-col items-center">
              <View
                className="w-full h-48 rounded flex flex-col items-center justify-center mb-4"
                style={{ borderWidth: '1.5px', borderStyle: 'dashed', borderColor: '#b5ad9f' }}
                onClick={handleChooseImage}
              >
                <Text className="block text-lg text-ink mb-2">🖼️ 选择图片</Text>
                <Text className="block text-sm text-[#999] text-center">
                  从相册选择 1-5 张空间照片
                </Text>
              </View>
            </View>
          )}

          {activeTab === 'text' && (
            <View>
              <View className="bg-card rounded p-4 mb-4">
                <textarea
                  className="w-full bg-transparent text-sm text-ink"
                  style={{ minHeight: '120px', outline: 'none', border: 'none', resize: 'none' }}
                  placeholder="比如：8平米单人宿舍，书桌靠窗，床在角落，墙上有个洞，地面上电线很多..."
                  value={description}
                  onInput={(e) => setDescription((e as unknown as { detail: { value: string } }).detail.value)}
                />
              </View>
              <Text className="block text-xs text-[#999] mb-4">
                不用写得很详细，说说你看到什么就行。
              </Text>
            </View>
          )}
        </View>

        {/* 底部主按钮 */}
        <View className="px-5 mt-6">
          {activeTab === 'text' ? (
            <View
              className={`rounded-full py-4 flex items-center justify-center ${
                description.trim() ? 'bg-ink' : 'bg-[#b5ad9f]'
              }`}
              onClick={handleSubmitDescription}
            >
              <Text className="text-white text-lg">开始分析</Text>
            </View>
          ) : (
            <View
              className="bg-ink rounded-full py-4 flex items-center justify-center"
              onClick={handleTakePhoto}
            >
              <Text className="text-white text-lg">开始分析</Text>
            </View>
          )}
        </View>

        <View className="h-10" />
      </ScrollView>
    </View>
  )
}
