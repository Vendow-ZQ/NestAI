import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'

import { Sprout, Compass, User } from 'lucide-react-taro'

interface TabBarProps {
  current: 'grow' | 'next' | 'me'
}

const tabs = [
  { key: 'grow' as const, label: 'Grow', icon: Sprout, url: '/pages/index/index' },
  { key: 'next' as const, label: 'Next', icon: Compass, url: '/pages/next/index' },
  { key: 'me' as const, label: 'Me', icon: User, url: '/pages/me/index' },
]

export function CustomTabBar({ current }: TabBarProps) {
  const handleTab = (url: string) => {
    Taro.switchTab({ url })
  }

  return (
    <View
      className="flex flex-row items-center justify-around"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '50px',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e5e5',
        zIndex: 999,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = current === tab.key
        const color = isActive ? '#d9a823' : '#7a736a'
        const IconComp = tab.icon
        return (
          <View
            key={tab.key}
            className="flex flex-col items-center justify-center"
            style={{ flex: 1, height: '50px' }}
            onClick={() => handleTab(tab.url)}
          >
            <IconComp size={20} color={color} />
            <Text
              className="block mt-1"
              style={{ fontSize: '10px', color, fontFamily: "'Noto Sans SC', sans-serif" }}
            >
              {tab.label}
            </Text>
          </View>
        )
      })}
    </View>
  )
}
