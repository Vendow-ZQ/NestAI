interface PlaceholderImageProps {
  label?: string
  className?: string
  style?: React.CSSProperties
}

export const PlaceholderImage = ({ label = '空间图片', className = '', style }: PlaceholderImageProps) => {
  return (
    <div
      className={`flex items-center justify-center bg-[#f0f0f0] ${className}`}
      style={style}
    >
      <span className="block text-xs text-[#999]">{label}</span>
    </div>
  )
}

export default PlaceholderImage
