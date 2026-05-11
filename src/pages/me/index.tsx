import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { NobiSVG } from '@/components/nobi'
import { Card, CardContent } from '@/components/ui/card'
import { MOCK_LETTERS, MOCK_INTERVENTIONS } from '@/lib/mock/data'


export default function MePage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <View className="min-h-full bg-background">
      {/* Header */}
      <View className="px-5 pt-12 pb-4">
        <Text className="block font-handwritten text-2xl text-ink">Me</Text>
      </View>

      <ScrollView scrollY style={{ height: 'calc(100vh - 100px)' }}>
        {/* 用户信息卡 */}
        <View className="px-5 mb-4">
          <Card className="bg-card">
            <CardContent className="p-5 flex flex-row items-center gap-4">
              <View className="w-14 h-14 rounded-full bg-paper flex items-center justify-center">
                <NobiSVG pose="avatar" size={40} />
              </View>
              <View>
                <Text className="block text-base font-semibold text-ink font-ui">你的栖巢</Text>
                <Text className="block text-sm text-ink-mute font-ui">清华深研院 7+1</Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* 我的空间 */}
        <View className="px-5 mb-2">
          <View
            className="flex flex-row items-center justify-between py-3 border-b border-ink-faint"
            style={{ borderBottomWidth: '1.5px', borderBottomColor: '#b5ad9f' }}
            onClick={() => toggleSection('space')}
          >
            <Text className="text-sm font-semibold text-ink font-ui">我的空间</Text>
            <Text className="text-sm text-ink-mute font-ui">{expandedSection === 'space' ? '−' : '+'}</Text>
          </View>
          {expandedSection === 'space' && (
            <View className="py-3">
              <Text className="block text-sm text-ink-soft font-ui">清华深研院 7+1 / 32号房</Text>
              <Text className="block text-sm text-ink-mute font-ui mt-1">入住 3 个月</Text>
            </View>
          )}
        </View>

        {/* 我的信件 */}
        <View className="px-5 mb-2">
          <View
            className="flex flex-row items-center justify-between py-3 border-b border-ink-faint"
            style={{ borderBottomWidth: '1.5px', borderBottomColor: '#b5ad9f' }}
            onClick={() => toggleSection('letters')}
          >
            <Text className="text-sm font-semibold text-ink font-ui">我的信件</Text>
            <View className="flex flex-row items-center gap-2">
              <Text className="text-sm text-ink-mute font-ui">{MOCK_LETTERS.length}</Text>
              <Text className="text-sm text-ink-mute font-ui">{expandedSection === 'letters' ? '−' : '+'}</Text>
            </View>
          </View>
          {expandedSection === 'letters' && (
            <View className="py-2">
              {MOCK_LETTERS.map((letter) => (
                <View
                  key={letter.id}
                  className="py-2 border-b border-ink-faint last:border-b-0"
                  onClick={() => Taro.navigateTo({ url: `/pages/letter/index?id=${letter.id}` })}
                >
                  <Text className="block text-sm text-ink font-serif italic">{letter.lifestyleDirection}</Text>
                  <Text className="block text-xs text-ink-mute font-ui mt-1">{letter.date}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 历史干预 */}
        <View className="px-5 mb-2">
          <View
            className="flex flex-row items-center justify-between py-3 border-b border-ink-faint"
            style={{ borderBottomWidth: '1.5px', borderBottomColor: '#b5ad9f' }}
            onClick={() => toggleSection('history')}
          >
            <Text className="text-sm font-semibold text-ink font-ui">历史干预</Text>
            <View className="flex flex-row items-center gap-2">
              <Text className="text-sm text-ink-mute font-ui">{MOCK_INTERVENTIONS.length}</Text>
              <Text className="text-sm text-ink-mute font-ui">{expandedSection === 'history' ? '−' : '+'}</Text>
            </View>
          </View>
          {expandedSection === 'history' && (
            <View className="py-2">
              {MOCK_INTERVENTIONS.slice(0, 5).map((intervention) => (
                <View key={intervention.id} className="py-2 border-b border-ink-faint last:border-b-0">
                  <Text className="block text-sm text-ink font-ui">{intervention.level}</Text>
                  <Text className="block text-xs text-ink-mute font-ui mt-1">{intervention.sceneId}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 改造前后对比 */}
        <View className="px-5 mb-2">
          <View
            className="flex flex-row items-center justify-between py-3 border-b border-ink-faint"
            style={{ borderBottomWidth: '1.5px', borderBottomColor: '#b5ad9f' }}
            onClick={() => toggleSection('timeline')}
          >
            <Text className="text-sm font-semibold text-ink font-ui">改造前后对比</Text>
            <Text className="text-sm text-ink-mute font-ui">{expandedSection === 'timeline' ? '−' : '+'}</Text>
          </View>
          {expandedSection === 'timeline' && (
            <View className="py-3 flex flex-col items-center">
              <Text className="block text-sm text-ink-mute font-ui text-center">空间生长时间轴</Text>
              <Text className="block text-xs text-ink-faint font-ui mt-1 text-center">完成更多改造后这里会生长出时间线</Text>
            </View>
          )}
        </View>

        {/* 设置与隐私 */}
        <View className="px-5 mb-2">
          <View
            className="flex flex-row items-center justify-between py-3 border-b border-ink-faint"
            style={{ borderBottomWidth: '1.5px', borderBottomColor: '#b5ad9f' }}
            onClick={() => toggleSection('settings')}
          >
            <Text className="text-sm font-semibold text-ink font-ui">设置与隐私</Text>
            <Text className="text-sm text-ink-mute font-ui">{expandedSection === 'settings' ? '−' : '+'}</Text>
          </View>
          {expandedSection === 'settings' && (
            <View className="py-3">
              <Text className="block text-sm text-ink-soft font-ui">数据导出</Text>
              <Text className="block text-sm text-ink-soft font-ui mt-2">清空 Memory</Text>
              <Text className="block text-sm text-ink-soft font-ui mt-2">隐私偏好</Text>
            </View>
          )}
        </View>

        <View className="h-20" />
      </ScrollView>
    </View>
  )
}
