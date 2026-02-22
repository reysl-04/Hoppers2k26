import { useState, useEffect, startTransition } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
import { Layout } from './components/Layout'
import { LoadingAnimation } from './components/LoadingAnimation'
import { WelcomeScene } from './components/WelcomeScene'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { Profile } from './pages/Profile'
import { History } from './pages/History'
import { Upload } from './pages/Upload'
import { SharePost } from './pages/SharePost'

function ProtectedRoute() {
  const { user, loading } = useAuth()
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (user && !loading) {
      // Always show welcome scene for authenticated users
      startTransition(() => {
        setShowWelcome(true)
      })
    }
  }, [user, loading])

  const handleWelcomeComplete = () => {
    setShowWelcome(false)
  }

  if (loading) {
    return <LoadingAnimation />
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <>
      {showWelcome && <WelcomeScene onComplete={handleWelcomeComplete} />}
      <Layout>
        <Outlet />
      </Layout>
    </>
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
        <Route path="/share-post" element={<SharePost />} />
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
