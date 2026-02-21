import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { Profile } from './pages/Profile'
import { History } from './pages/History'
import { Upload } from './pages/Upload'

function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-zinc-950 p-6">
        <img src="/ZeroCrumbWhite.png" alt="ZeroCrust" className="h-10 w-auto opacity-80" />
        <p className="text-zinc-400 animate-pulse">Loading...</p>
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/history" element={<History />} />
        <Route path="/upload" element={<Upload />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
