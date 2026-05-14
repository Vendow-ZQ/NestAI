import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

const GrowPage = () => <div className="p-4">Grow 首页（待迁移）</div>
const NextPage = () => <div className="p-4">Next 收藏夹（待迁移）</div>
const MePage = () => <div className="p-4">Me 个人中心（待迁移）</div>

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/grow" replace />} />
        <Route path="/grow" element={<GrowPage />} />
        <Route path="/next" element={<NextPage />} />
        <Route path="/me" element={<MePage />} />
        <Route path="/upload" element={<div>上传空间（待迁移）</div>} />
        <Route path="/chat" element={<div>Lifestyle Chat（待迁移）</div>} />
        <Route path="/generating" element={<div>生成中（待迁移）</div>} />
        <Route path="/result" element={<div>方案页（待迁移）</div>} />
        <Route path="/share" element={<div>新变化分享（待迁移）</div>} />
        <Route path="/letter" element={<div>一封信（待迁移）</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
