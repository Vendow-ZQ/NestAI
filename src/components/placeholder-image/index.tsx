import { View, Text } from '@tarojs/components'

interface PlaceholderImageProps {
  label?: string
  className?: string
  style?: React.CSSProperties
}

export const PlaceholderImage = ({ label = '空间图片', className = '', style }: PlaceholderImageProps) => {
  return (
    <View
      className={`flex items-center justify-center bg-[#f0f0f0] ${className}`}
      style={style}
    >
      <Text className="block text-xs text-[#999]">{label}</Text>
    </View>
  )
}

export default PlaceholderImage
