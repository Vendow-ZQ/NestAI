interface PlaceholderImageProps {
  label?: string
  className?: string
  style?: React.CSSProperties
}

export const PlaceholderImage = ({ label = '空间图片', className = '', style }: PlaceholderImageProps) => {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      style={{
        background: 'linear-gradient(135deg, #f5f5f7 0%, #e9eef5 100%)',
        border: '1px solid rgba(60, 60, 67, 0.08)',
        ...style,
      }}
    >
      <span className="block text-xs text-[#8e8e93] font-medium">{label}</span>
    </div>
  )
}

export default PlaceholderImage
