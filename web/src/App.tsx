import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { CustomTabBar } from '@/components/CustomTabBar'
import GrowPage from '@/pages/index/GrowPage'
import UploadPage from '@/pages/upload/UploadPage'
import ChatPage from '@/pages/chat/ChatPage'

const Layout = () => (
  <div className="relative min-h-screen bg-background">
    <Outlet />
    <CustomTabBar />
  </div>
)

const NextPage = () => <div className="p-4 pt-12">Next 收藏夹（待迁移）</div>
const MePage = () => <div className="p-4 pt-12">Me 个人中心（待迁移）</div>

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
        <Route path="/generating" element={<div className="p-4">生成中（待迁移）</div>} />
        <Route path="/result" element={<div className="p-4">方案页（待迁移）</div>} />
        <Route path="/share" element={<div className="p-4">新变化分享（待迁移）</div>} />
        <Route path="/letter" element={<div className="p-4">一封信（待迁移）</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
