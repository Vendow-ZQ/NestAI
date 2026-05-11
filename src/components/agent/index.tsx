import { View, Text } from '@tarojs/components'
import { NobiSVG } from '@/components/nobi'
import { ReactNode } from 'react'

interface AgentMessageProps {
  children: ReactNode
  showAvatar?: boolean
}

export const AgentMessage = ({ children, showAvatar = true }: AgentMessageProps) => {
  return (
    <View className="flex flex-row gap-3 mb-4">
      {showAvatar && (
        <View className="flex-shrink-0 mt-1">
          <NobiSVG pose="avatar" size={28} />
        </View>
      )}
      <View className="flex-1 bg-card rounded px-4 py-3" style={{ borderTopLeftRadius: 0 }}>
        <Text className="block text-foreground text-sm leading-relaxed font-serif">
          {children}
        </Text>
      </View>
    </View>
  )
}

interface UserMessageProps {
  children: string
}

export const UserMessage = ({ children }: UserMessageProps) => {
  return (
    <View className="flex flex-row justify-end mb-4">
      <View className="max-w-[80%] bg-accent rounded px-4 py-3" style={{ borderTopRightRadius: 0 }}>
        <Text className="block text-foreground text-sm leading-relaxed">
          {children}
        </Text>
      </View>
    </View>
  )
}
