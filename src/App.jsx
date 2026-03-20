import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './layout/Layout'
import HomePage from './pages/HomePage'
import TopicPage from './pages/TopicPage'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/topic/:topicId" element={<TopicPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
