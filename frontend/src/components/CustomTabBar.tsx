import { useNavigate, useLocation } from 'react-router-dom'
import { Sprout, Compass, User } from 'lucide-react'
import { useI18n } from '@/lib/i18n'

const tabs = [
  { key: 'grow' as const, labelKey: 'tabGrow' as const, icon: Sprout, path: '/grow' },
  { key: 'next' as const, labelKey: 'tabNext' as const, icon: Compass, path: '/next' },
  { key: 'me' as const, labelKey: 'tabMe' as const, icon: User, path: '/me' },
]

export function CustomTabBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()

  const currentPath = location.pathname
  const current = tabs.find(t => t.path === currentPath)?.key

  const handleTab = (path: string) => {
    navigate(path)
  }

  return (
    <div
      className="app-fixed-bottom flex flex-row items-center justify-around"
      style={{
        height: '58px',
        backgroundColor: 'rgba(255, 255, 255, 0.82)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderTop: '1px solid rgba(60, 60, 67, 0.14)',
        zIndex: 999,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = current === tab.key
        const color = isActive ? '#007aff' : '#8e8e93'
        const IconComp = tab.icon
        return (
          <div
            key={tab.key}
            className="flex flex-col items-center justify-center cursor-pointer"
            style={{ flex: 1, height: '58px', transition: 'transform 160ms ease' }}
            onClick={() => handleTab(tab.path)}
          >
            <IconComp size={21} color={color} strokeWidth={isActive ? 2.5 : 2} />
            <span
              className="block mt-1"
              style={{ fontSize: '11px', color, fontWeight: isActive ? 600 : 500 }}
            >
              {t(tab.labelKey)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
