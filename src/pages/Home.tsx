import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Home() {
  const { user } = useAuth()

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-zinc-100 mb-3">
          ZeroCrust
        </h1>
        <p className="text-zinc-400 text-lg leading-relaxed">
          Your personal companion for sustainable eating and health. Track what you eat, 
          reduce food waste, and see your impact on the planet—one meal at a time.
        </p>
      </div>

      <div className="space-y-4">
        <Link
          to="/profile"
          className="block p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-600/30 flex items-center justify-center">
              <span className="text-emerald-400 font-bold text-lg">
                {user?.email?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-zinc-100">Profile</h2>
              <p className="text-sm text-zinc-500">
                {user?.email ?? 'View your stats & settings'}
              </p>
            </div>
            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link
          to="/upload"
          className="block p-4 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 hover:border-emerald-500/60 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/30 flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-emerald-400">Upload & Analyze</h2>
              <p className="text-sm text-zinc-400">
                Snap food or waste, get AI insights & earn XP
              </p>
            </div>
            <svg className="w-5 h-5 text-emerald-500/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link
          to="/history"
          className="block p-4 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-zinc-100">History</h2>
              <p className="text-sm text-zinc-500">
                Calendar, progress & achievements
              </p>
            </div>
            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>
      </div>

      <div className="mt-10 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
        <h3 className="font-semibold text-zinc-300 mb-2">Sustainability & Health</h3>
        <p className="text-sm text-zinc-500 leading-relaxed">
          ZeroCrust helps you eat mindfully, stay within your calorie goals, and reduce food waste. 
          Every meal you track and every crumb you save makes a difference for our planet.
        </p>
      </div>
    </div>
  )
}
