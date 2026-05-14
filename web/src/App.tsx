import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { CustomTabBar } from '@/components/CustomTabBar'
import GrowPage from '@/pages/index/GrowPage'
import UploadPage from '@/pages/upload/UploadPage'
import ChatPage from '@/pages/chat/ChatPage'
import GeneratingPage from '@/pages/generating/GeneratingPage'
import ResultPage from '@/pages/result/ResultPage'
import NextPage from '@/pages/next/NextPage'
import SharePage from '@/pages/share/SharePage'
import LetterPage from '@/pages/letter/LetterPage'
import MePage from '@/pages/me/MePage'

const Layout = () => (
  <div className="relative min-h-screen bg-background">
    <Outlet />
    <CustomTabBar />
  </div>
)

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/grow" replace />} />
          <Route path="/grow" element={<GrowPage />} />
          <Route path="/next" element={<NextPage />} />
          <Route path="/me" element={<MePage />} />
        </Route>
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/generating" element={<GeneratingPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/share" element={<SharePage />} />
        <Route path="/letter" element={<LetterPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
