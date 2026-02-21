import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'

export function Profile() {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name ?? '')
  const [description, setDescription] = useState('')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-emerald-600/30 flex items-center justify-center mb-4 ring-4 ring-emerald-500/20">
          <span className="text-3xl font-bold text-emerald-400">
            {user?.email?.[0]?.toUpperCase() ?? '?'}
          </span>
        </div>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Display name"
          className="text-xl font-semibold text-center bg-transparent border-b border-zinc-700 focus:outline-none focus:border-emerald-500 text-zinc-100 placeholder-zinc-500 pb-1"
        />
        <p className="text-sm text-zinc-500 mt-1">{user?.email}</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">About you</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us about your sustainability goals..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 active:scale-[0.98] transition-all touch-manipulation"
        >
          {saved ? 'Saved!' : 'Update Profile'}
        </button>
      </div>

      <div className="mt-8">
        <h2 className="font-semibold text-zinc-300 mb-3">Quick Stats</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <p className="text-2xl font-bold text-emerald-400">0</p>
            <p className="text-sm text-zinc-500">Total XP</p>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <p className="text-2xl font-bold text-amber-400">0</p>
            <p className="text-sm text-zinc-500">Meals tracked</p>
          </div>
        </div>
      </div>

      <Link
        to="/history"
        className="mt-6 block p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="font-medium text-zinc-300">View History & Calendar</span>
          <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </div>
  )
}
