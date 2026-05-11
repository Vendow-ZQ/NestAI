import { Image } from '@tarojs/components'

// Nobi SVG 内联数据 — 手绘风线稿小狗，豆黄色项圈
// 不同姿态: lying(趴着), sniffing(嗅探), sleeping(打盹), avatar(小头像)

const NOBI_LYING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80" fill="none" stroke="#1a1814" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <!-- 身体 -->
  <ellipse cx="60" cy="50" rx="35" ry="18" fill="none"/>
  <!-- 头 -->
  <circle cx="30" cy="40" r="16" fill="none"/>
  <!-- 大鼻子 -->
  <ellipse cx="18" cy="38" rx="6" ry="5" fill="#1a1814"/>
  <!-- 眼睛 -->
  <circle cx="26" cy="34" r="2" fill="#1a1814"/>
  <!-- 耳朵 -->
  <path d="M38 28 C42 18 48 22 44 30"/>
  <!-- 尾巴 -->
  <path d="M95 45 C105 35 108 40 100 48"/>
  <!-- 豆黄项圈 -->
  <path d="M22 52 C28 56 36 56 42 52" stroke="#d9a823" stroke-width="3" fill="none"/>
  <!-- 前爪 -->
  <path d="M35 65 L35 72 M30 65 L30 72"/>
  <path d="M55 65 L55 72 M50 65 L50 72"/>
</svg>`

const NOBI_SNIFFING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90" fill="none" stroke="#1a1814" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <!-- 身体 -->
  <ellipse cx="55" cy="60" rx="30" ry="16" fill="none"/>
  <!-- 头(朝下嗅) -->
  <ellipse cx="25" cy="55" rx="14" ry="12" fill="none" transform="rotate(-20 25 55)"/>
  <!-- 大鼻子(朝下) -->
  <ellipse cx="14" cy="60" rx="5" ry="4" fill="#1a1814"/>
  <!-- 眼睛 -->
  <circle cx="22" cy="50" r="1.5" fill="#1a1814"/>
  <!-- 耳朵 -->
  <path d="M32 42 C36 32 42 36 38 44"/>
  <!-- 尾巴(翘起) -->
  <path d="M85 50 C95 35 98 42 88 52"/>
  <!-- 豆黄项圈 -->
  <path d="M20 64 C26 68 34 68 40 64" stroke="#d9a823" stroke-width="3" fill="none"/>
  <!-- 嗅探线 -->
  <path d="M10 64 C8 68 12 70 8 74" stroke="#b5ad9f" stroke-width="1" stroke-dasharray="2 2"/>
  <!-- 前爪 -->
  <path d="M32 73 L32 80 M38 73 L38 80"/>
  <path d="M60 73 L60 80 M66 73 L66 80"/>
</svg>`

const NOBI_SLEEPING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70" fill="none" stroke="#1a1814" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <!-- 身体(蜷缩) -->
  <ellipse cx="50" cy="48" rx="32" ry="14" fill="none"/>
  <!-- 头(趴着) -->
  <circle cx="25" cy="40" r="14" fill="none"/>
  <!-- 闭眼 -->
  <path d="M19 38 C21 36 23 38 21 40"/>
  <!-- 大鼻子 -->
  <ellipse cx="14" cy="38" rx="5" ry="4" fill="#1a1814"/>
  <!-- 耳耷拉 -->
  <path d="M35 30 C38 22 42 26 38 32"/>
  <!-- 尾巴(绕过来) -->
  <path d="M82 44 C88 38 92 42 86 48"/>
  <!-- 豆黄项圈 -->
  <path d="M18 50 C24 54 32 54 38 50" stroke="#d9a823" stroke-width="3" fill="none"/>
  <!-- Zzz -->
  <text x="40" y="28" font-family="Caveat, cursive" font-size="12" fill="#7a736a" stroke="none">z</text>
  <text x="48" y="22" font-family="Caveat, cursive" font-size="10" fill="#7a736a" stroke="none">z</text>
  <text x="54" y="18" font-family="Caveat, cursive" font-size="8" fill="#7a736a" stroke="none">z</text>
</svg>`

const NOBI_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" fill="none" stroke="#1a1814" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
  <!-- 大鼻子 -->
  <ellipse cx="8" cy="14" rx="5" ry="4.5" fill="#1a1814"/>
  <!-- 头轮廓 -->
  <circle cx="14" cy="14" r="11" fill="none"/>
  <!-- 眼睛 -->
  <circle cx="12" cy="10" r="1.5" fill="#1a1814"/>
  <!-- 耳朵 -->
  <path d="M22 6 C26 0 28 4 24 8"/>
  <!-- 豆黄项圈 -->
  <path d="M6 22 C10 25 18 25 22 22" stroke="#d9a823" stroke-width="2.5" fill="none"/>
</svg>`

const NOBI_SITTING_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 90" fill="none" stroke="#1a1814" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <!-- 身体 -->
  <ellipse cx="40" cy="55" rx="22" ry="20" fill="none"/>
  <!-- 头 -->
  <circle cx="40" cy="28" r="16" fill="none"/>
  <!-- 大鼻子 -->
  <ellipse cx="35" cy="30" rx="5" ry="4.5" fill="#1a1814"/>
  <!-- 眼睛 -->
  <circle cx="38" cy="24" r="2" fill="#1a1814"/>
  <!-- 耳朵 -->
  <path d="M50 16 C54 6 58 10 54 18"/>
  <!-- 豆黄项圈 -->
  <path d="M30 40 C36 44 44 44 50 40" stroke="#d9a823" stroke-width="3" fill="none"/>
  <!-- 前爪 -->
  <path d="M25 70 L22 78 M30 70 L27 78"/>
  <path d="M50 70 L53 78 M55 70 L58 78"/>
  <!-- 尾巴 -->
  <path d="M62 60 C70 55 72 60 66 65"/>
</svg>`

type NobiPose = 'lying' | 'sniffing' | 'sleeping' | 'avatar' | 'sitting'

const SVG_MAP: Record<NobiPose, string> = {
  lying: NOBI_LYING_SVG,
  sniffing: NOBI_SNIFFING_SVG,
  sleeping: NOBI_SLEEPING_SVG,
  avatar: NOBI_AVATAR_SVG,
  sitting: NOBI_SITTING_SVG,
}

interface NobiProps {
  pose?: NobiPose
  size?: number
  className?: string
}

export const NobiSVG = ({ pose = 'lying', size = 80, className = '' }: NobiProps) => {
  const svgString = SVG_MAP[pose]
  const encoded = `data:image/svg+xml,${encodeURIComponent(svgString)}`

  return (
    <Image
      src={encoded}
      className={`inline-block ${className}`}
      style={{ width: size, height: size * (pose === 'avatar' ? 1 : 0.75) }}
      mode="aspectFit"
    />
  )
}

export default NobiSVG
