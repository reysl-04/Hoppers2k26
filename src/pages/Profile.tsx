import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export function Profile() {
  const { user, updateUser } = useAuth()
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name ?? '')
  const [description, setDescription] = useState(user?.user_metadata?.description ?? '')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Update local state when user data changes
  useEffect(() => {
    setDisplayName(user?.user_metadata?.full_name ?? '')
    setDescription(user?.user_metadata?.description ?? '')
    setAvatarPreview(user?.user_metadata?.avatar_url ?? null)
  }, [user])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null

    const fileExt = avatarFile.name.split('.').pop()
    const fileName = `${user.id}_${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, avatarFile)

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      return null
    }

    const { data } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const handleSave = async () => {
    setLoading(true)
    
    let avatarUrl = user?.user_metadata?.avatar_url ?? null
    
    // Upload new avatar if selected
    if (avatarFile) {
      avatarUrl = await uploadAvatar()
      if (!avatarUrl) {
        setLoading(false)
        console.error('Failed to upload avatar')
        return
      }
    }

    const { error } = await updateUser({
      full_name: displayName,
      description: description,
      avatar_url: avatarUrl || undefined
    })
    setLoading(false)
    
    if (error) {
      console.error('Error updating profile:', error)
      return
    }
    
    setAvatarFile(null) // Clear the file after successful upload
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex flex-col items-center mb-8">
        <div 
          className="w-24 h-24 rounded-full bg-emerald-600/30 flex items-center justify-center mb-4 ring-4 ring-emerald-500/20 cursor-pointer relative overflow-hidden"
          onClick={() => fileInputRef.current?.click()}
        >
          {avatarPreview ? (
            <img 
              src={avatarPreview} 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl font-bold text-emerald-400">
              {user?.email?.[0]?.toUpperCase() ?? '?'}
            </span>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
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
          disabled={loading}
          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 active:scale-[0.98] transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : saved ? 'Saved!' : 'Update Profile'}
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
