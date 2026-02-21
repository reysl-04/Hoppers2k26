import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInWithApple } = useAuth()
  const navigate = useNavigate()

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error: err } = isSignUp
      ? await signUpWithEmail(email, password)
      : await signInWithEmail(email, password)
    setLoading(false)
    if (err) {
      // Provide more user-friendly error messages
      let friendlyMessage = err.message
      if (err.message.includes('rate limit')) {
        friendlyMessage = 'Too many sign-up attempts. Please wait a few minutes before trying again, or try signing in instead.'
      } else if (err.message.includes('email rate limit exceeded')) {
        friendlyMessage = 'Email sending limit reached. Please wait a few minutes before trying again.'
      } else if (err.message.includes('Email not confirmed')) {
        friendlyMessage = 'Please check your email and click the confirmation link before signing in.'
      } else if (err.message.includes('Invalid login credentials')) {
        friendlyMessage = 'Invalid email or password. Please check your credentials and try again.'
      }
      setError(friendlyMessage)
      return
    }
    navigate('/')
  }

  const handleGoogle = async () => {
    setError(null)
    const { error: err } = await signInWithGoogle()
    if (err) setError(err.message)
  }

  const handleApple = async () => {
    setError(null)
    const { error: err } = await signInWithApple()
    if (err) setError(err.message)
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-8 bg-zinc-950">
      <img
        src="/ZeroCrumbWhite.png"
        alt="ZeroCrust"
        className="h-12 w-auto mb-8"
      />
      <h1 className="text-2xl font-bold text-center mb-2">Welcome to ZeroCrust</h1>
      <p className="text-zinc-400 text-center text-sm mb-8 max-w-xs">
        Track food, reduce waste, and build sustainable habits.
      </p>

      <form onSubmit={handleEmailAuth} className="w-full max-w-sm space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 active:scale-[0.98] transition-all disabled:opacity-50 touch-manipulation"
        >
          {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setIsSignUp(!isSignUp)}
        className="mt-4 text-sm text-zinc-400 hover:text-zinc-300"
      >
        {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
      </button>

      <div className="w-full max-w-sm mt-8">
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-700" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-zinc-950 text-zinc-500">or continue with</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 font-medium hover:bg-zinc-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 touch-manipulation"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google
          </button>
          <button
            type="button"
            onClick={handleApple}
            className="w-full py-3 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-100 font-medium hover:bg-zinc-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 touch-manipulation"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            Apple
          </button>
        </div>
      </div>
    </div>
  )
}
