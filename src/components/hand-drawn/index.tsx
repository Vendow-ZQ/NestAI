import { View, Text } from '@tarojs/components'

// 手绘下划线高亮
export const HandUnderline = ({ children }: { children: string }) => {
  return (
    <View className="inline-block relative">
      <Text className="text-ink font-serif">{children}</Text>
      <View className="absolute bottom-0 left-0 right-0 h-1 bg-bean opacity-60 rounded-full" />
    </View>
  )
}

// 手绘分隔线
export const HandLine = () => {
  return (
    <View className="my-4 flex items-center">
      <View className="flex-1 h-px bg-ink-faint opacity-30" />
    </View>
  )
}

// 手写注释
export const MarginNote = ({ children }: { children: string }) => {
  return (
    <View className="border-l-2 border-bean pl-3 py-1 my-2">
      <Text className="block text-sm text-ink-mute font-handwritten">{children}</Text>
    </View>
  )
}

// 豆黄高亮文字
export const BeanHighlight = ({ children }: { children: string }) => {
  return (
    <Text
      style={{
        backgroundImage: 'linear-gradient(180deg, transparent 55%, #f0d77a 55%, #f0d77a 88%, transparent 88%)',
        display: 'inline',
      }}
    >
      {children}
    </Text>
  )
}

// 今晚试试看 主按钮
interface TonightButtonProps {
  onClick?: () => void
  label?: string
  subLabel?: string
}

export const TonightButton = ({ onClick, label = "Let&apos;s do it!", subLabel = '' }: TonightButtonProps) => {
  return (
    <View className="flex justify-center mt-4 mb-4">
      <View
        className="bg-ink rounded-full py-4 px-8 flex flex-col items-center"
        style={{ boxShadow: '4px 4px 0 #d9a823', transform: 'rotate(-0.5deg)' }}
        onClick={onClick}
      >
        <Text className="text-paper font-handwritten text-xl leading-tight">{label}</Text>
        <Text className="text-bean font-handwritten text-xs mt-1">{subLabel}</Text>
      </View>
    </View>
  )
}
