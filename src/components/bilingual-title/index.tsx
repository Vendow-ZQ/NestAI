import { View, Text } from '@tarojs/components'

interface BilingualTitleProps {
  en: string
  zh: string
  size?: 'sm' | 'lg' | 'xl' | '2xl'
  align?: 'center' | 'left'
}

const sizeMap = {
  sm: { en: 'text-sm', zh: 'text-xs' },
  lg: { en: 'text-lg', zh: 'text-sm' },
  xl: { en: 'text-xl', zh: 'text-sm' },
  '2xl': { en: 'text-2xl', zh: 'text-base' },
}

export function BilingualTitle({ en, zh, size = 'xl', align = 'center' }: BilingualTitleProps) {
  return (
    <View className={`flex flex-col ${align === 'left' ? 'items-start' : 'items-center'}`}>
      <Text
        className={`block ${sizeMap[size].en} text-ink font-bold tracking-wide`}
        style={{ fontFamily: "'Arial Black', 'Arial Bold', Arial, sans-serif", letterSpacing: '0.05em' }}
      >
        {en}
      </Text>
      <Text
        className={`block ${sizeMap[size].zh} text-[#7a736a] mt-1`}
        style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
      >
        {zh}
      </Text>
    </View>
  )
}
