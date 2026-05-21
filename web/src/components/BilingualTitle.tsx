interface BilingualTitleProps {
  en: string
  zh: string
  size?: 'sm' | 'lg' | 'xl' | '2xl'
  align?: 'center' | 'left'
}

const sizeMap = {
  sm: { en: 'text-xs', zh: 'text-sm' },
  lg: { en: 'text-sm', zh: 'text-2xl' },
  xl: { en: 'text-sm', zh: 'text-3xl' },
  '2xl': { en: 'text-sm', zh: 'text-4xl' },
}

export function BilingualTitle({ en, zh, size = 'xl', align = 'center' }: BilingualTitleProps) {
  return (
    <div className={`flex flex-col ${align === 'left' ? 'items-start' : 'items-center'}`}>
      <span
        className={`block ${sizeMap[size].zh} text-ink font-semibold`}
        style={{ letterSpacing: 0, lineHeight: 1.08 }}
      >
        {zh}
      </span>
      <span
        className={`block ${sizeMap[size].en} text-[#6e6e73] font-medium mt-1`}
        style={{ letterSpacing: 0, lineHeight: 1.15 }}
      >
        {en}
      </span>
    </div>
  )
}
