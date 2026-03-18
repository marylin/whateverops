import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Dashboard } from './components/layout/Dashboard'
import { StatusPage } from './pages/StatusPage'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-white">404</h1>
      <p className="text-gray-400">Page not found</p>
      <Link
        to="/"
        className="text-sm px-4 py-2 bg-[#1E1E2E] hover:bg-[#2A2A3E] text-gray-300 rounded-lg transition-colors border border-[#2A2A3E]"
      >
        Back to dashboard
      </Link>
    </div>
  )
}

function App() {
  return (
    <ErrorBoundary title="Application">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
