import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { CustomTabBar } from '@/components/CustomTabBar'
import GrowPage from '@/pages/index/GrowPage'
import LoginPage from '@/pages/login/LoginPage'
import UploadPage from '@/pages/upload/UploadPage'
import ChatPage from '@/pages/chat/ChatPage'
import GeneratingPage from '@/pages/generating/GeneratingPage'
import ResultPage from '@/pages/result/ResultPage'
import NextPage from '@/pages/next/NextPage'
import SharePage from '@/pages/share/SharePage'
import LetterPage from '@/pages/letter/LetterPage'
import MePage from '@/pages/me/MePage'
import { useUserStore } from '@/stores/user-store'
import { LanguageToggle } from '@/components/LanguageToggle'

function RequireUser({ children }: { children: JSX.Element }) {
  const currentUser = useUserStore((s) => s.currentUser)
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }
  return children
}

function AppShell() {
  const location = useLocation()
  const currentUser = useUserStore((s) => s.currentUser)
  const onLoginPage = location.pathname === '/login'

  return (
    <div className="app-device">
      <div className={`relative min-h-screen bg-background app-page ${onLoginPage ? '' : 'pb-[74px]'}`}>
        <Routes>
          <Route path="/" element={<Navigate to={currentUser ? '/grow' : '/login'} replace />} />
          <Route path="/login" element={currentUser ? <Navigate to="/grow" replace /> : <LoginPage />} />
          <Route path="/grow" element={<RequireUser><GrowPage /></RequireUser>} />
          <Route path="/next" element={<RequireUser><NextPage /></RequireUser>} />
          <Route path="/me" element={<RequireUser><MePage /></RequireUser>} />
          <Route path="/upload" element={<RequireUser><UploadPage /></RequireUser>} />
          <Route path="/chat" element={<RequireUser><ChatPage /></RequireUser>} />
          <Route path="/generating" element={<RequireUser><GeneratingPage /></RequireUser>} />
          <Route path="/result" element={<RequireUser><ResultPage /></RequireUser>} />
          <Route path="/share" element={<RequireUser><SharePage /></RequireUser>} />
          <Route path="/letter" element={<RequireUser><LetterPage /></RequireUser>} />
        </Routes>
      </div>
      <LanguageToggle />
      {!onLoginPage && <CustomTabBar />}
    </div>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App
