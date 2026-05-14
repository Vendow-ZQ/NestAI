import { useNavigate, useLocation } from 'react-router-dom'
import { Sprout, Compass, User } from 'lucide-react'

const tabs = [
  { key: 'grow' as const, label: 'Grow', icon: Sprout, path: '/grow' },
  { key: 'next' as const, label: 'Next', icon: Compass, path: '/next' },
  { key: 'me' as const, label: 'Me', icon: User, path: '/me' },
]

export function CustomTabBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const currentPath = location.pathname
  const current = tabs.find(t => t.path === currentPath)?.key || 'grow'

  const handleTab = (path: string) => {
    navigate(path)
  }

  return (
    <div
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
          <div
            key={tab.key}
            className="flex flex-col items-center justify-center cursor-pointer"
            style={{ flex: 1, height: '50px' }}
            onClick={() => handleTab(tab.path)}
          >
            <IconComp size={20} color={color} />
            <span
              className="block mt-1"
              style={{ fontSize: '10px', color, fontFamily: "'Noto Sans SC', sans-serif" }}
            >
              {tab.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}
