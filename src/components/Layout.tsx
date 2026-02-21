import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/profile', label: 'Profile' },
  { to: '/history', label: 'History' },
  { to: '/upload', label: 'Upload' },
]

export function Layout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, signOut } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-dvh bg-zinc-950 text-zinc-100 flex flex-col">
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 py-3 bg-zinc-950/95 backdrop-blur border-b border-zinc-800 safe-area-inset-top">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/ZeroCrumbWhite.png"
            alt="ZeroCrust"
            className="h-8 w-auto"
          />
        </Link>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 -mr-2 rounded-lg hover:bg-zinc-800 touch-manipulation"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </header>

      <nav className={`fixed z-40 bg-zinc-900 shadow-xl transform transition-all duration-300 ease-out ${
        menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      } ${
        // Mobile: expand from top (full width)
        'top-[57px] left-0 right-0 h-auto border-b border-zinc-800'
      } ${
        // Desktop: slide from right (right side only)
        'md:top-[57px] md:left-auto md:right-0 md:h-[calc(100vh-57px)] md:w-64 md:border-l md:border-r-0'
      } ${
        menuOpen
          ? 'translate-y-0 md:translate-x-0'
          : '-translate-y-full md:translate-x-full'
      }`}>
        <div className="px-4 py-6 flex flex-col gap-1 max-h-[60vh] overflow-y-auto md:max-h-none md:py-8">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMenuOpen(false)}
              className={`px-4 py-3 rounded-lg font-medium transition-colors touch-manipulation ${
                location.pathname === to
                  ? 'bg-emerald-600/30 text-emerald-400'
                  : 'hover:bg-zinc-800 text-zinc-300'
              }`}
            >
              {label}
            </Link>
          ))}
          {user && (
            <button
              type="button"
              onClick={() => {
                signOut()
                setMenuOpen(false)
              }}
              className="px-4 py-3 rounded-lg font-medium text-left text-red-400 hover:bg-zinc-800 transition-colors touch-manipulation"
            >
              Sign Out
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 overflow-auto pb-safe">
        {children}
      </main>
    </div>
  )
}
