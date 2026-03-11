import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Dashboard } from './components/layout/Dashboard'
import { StatusPage } from './pages/StatusPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/status" element={<StatusPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
