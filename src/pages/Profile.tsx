import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { upsertProfile } from '../lib/profiles'
import { getUserStats, levelFromXp } from '../lib/stats'
import type { UserStats } from '../lib/stats'
import { PostDetailModal } from '../components/PostDetailModal'

interface Post {
  id: string
  image_url: string
  image_url_after?: string
  description: string
  created_at: string
  user_id?: string
}

type ProfileTab = 'posts' | 'saved'

export function Profile() {
  const { user, updateUser } = useAuth()
  const [displayName, setDisplayName] = useState(user?.user_metadata?.full_name ?? '')
  const [description, setDescription] = useState(user?.user_metadata?.description ?? '')
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.user_metadata?.avatar_url ?? null)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [userPosts, setUserPosts] = useState<Post[]>([])
  const [savedPosts, setSavedPosts] = useState<Post[]>([])
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [profileTab, setProfileTab] = useState<ProfileTab>('posts')
  const [modalPostId, setModalPostId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const meta = user?.user_metadata
    if (meta) {
      setDisplayName(meta.full_name ?? '')
      setDescription(meta.description ?? '')
      setAvatarPreview(meta.avatar_url ?? null)
    }
  }, [user?.user_metadata?.full_name, user?.user_metadata?.description, user?.user_metadata?.avatar_url])

  useEffect(() => {
    if (!user?.id) return
    getUserStats(user.id).then(setStats).catch(() => {})
    // Sync user_metadata to profiles so posts show correct name/avatar
    const meta = user.user_metadata
    if (meta?.full_name || meta?.avatar_url) {
      upsertProfile(user.id, {
        full_name: meta.full_name ?? undefined,
        avatar_url: meta.avatar_url ?? undefined,
      }).catch(() => {})
    }
    
    const loadPosts = async () => {
      setLoadingPosts(true)
      const [postsRes, savesRes] = await Promise.all([
        supabase.from('posts').select('id, image_url, image_url_after, description, created_at, user_id').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('post_saves').select('post_id').eq('user_id', user.id),
      ])
      if (!postsRes.error && postsRes.data) {
        setUserPosts(postsRes.data as Post[])
      }
      if (!savesRes.error && savesRes.data?.length) {
        const ids = savesRes.data.map((r) => r.post_id)
        const { data: saved } = await supabase.from('posts').select('id, image_url, image_url_after, description, created_at, user_id').in('id', ids).order('created_at', { ascending: false })
        setSavedPosts((saved ?? []) as Post[])
      } else {
        setSavedPosts([])
      }
      setLoadingPosts(false)
    }
    loadPosts()
  }, [user?.id])

  const { level, xpInLevel, xpNeededForNext } = stats
    ? levelFromXp(stats.total_xp)
    : { level: 1, xpInLevel: 0, xpNeededForNext: 100.5 }

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
    if (!error && user?.id) {
      try {
        await upsertProfile(user.id, {
          full_name: displayName || undefined,
          avatar_url: avatarUrl || undefined,
        })
      } catch {
        // Profile upsert failed - user_metadata still updated
      }
    }
    setLoading(false)

    if (error) {
      console.error('Error updating profile:', error)
      return
    }

    setAvatarFile(null)
    if (avatarUrl) setAvatarPreview(avatarUrl)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const formatDate = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
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
            <p className="text-2xl font-bold text-emerald-400">{stats?.total_xp ?? 0}</p>
            <p className="text-sm text-zinc-500">Total XP</p>
            <p className="text-xs text-zinc-600 mt-1">Level {level}</p>
            <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${xpNeededForNext > 0 ? (xpInLevel / xpNeededForNext) * 100 : 100}%` }}
              />
            </div>
          </div>
          <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <p className="text-2xl font-bold text-amber-400">{stats?.total_meals_logged ?? 0}</p>
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

      {/* Posts Section */}
      <div className="mt-8">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setProfileTab('posts')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${profileTab === 'posts' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
          >
            My Posts
          </button>
          <button
            type="button"
            onClick={() => setProfileTab('saved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${profileTab === 'saved' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}`}
          >
            Saved
          </button>
        </div>
        {loadingPosts ? (
          <div className="p-4 text-center text-zinc-400 text-sm">Loading...</div>
        ) : profileTab === 'posts' && userPosts.length === 0 ? (
          <div className="p-4 text-center text-zinc-400 text-sm">No posts yet. Start sharing!</div>
        ) : profileTab === 'saved' && savedPosts.length === 0 ? (
          <div className="p-4 text-center text-zinc-400 text-sm">No saved posts. Tap the bookmark on any post to save it.</div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {(profileTab === 'posts' ? userPosts : savedPosts).map((post) => (
              <button
                key={post.id}
                type="button"
                onClick={() => setModalPostId(post.id)}
                className="relative group aspect-square rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 block w-full text-left"
              >
                {post.image_url_after ? (
                  <div className="grid grid-cols-2 w-full h-full">
                    <img src={post.image_url} alt="Before" className="w-full h-full object-cover" />
                    <img src={post.image_url_after} alt="After" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-zinc-300 line-clamp-2">{post.description}</p>
                  <p className="text-xs text-zinc-500 mt-1">{formatDate(post.created_at)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {modalPostId && (
        <PostDetailModal
          postId={modalPostId}
          isOwnPost={
            userPosts.some((p) => p.id === modalPostId) ||
            (savedPosts.find((p) => p.id === modalPostId)?.user_id === user?.id)
          }
          onClose={() => setModalPostId(null)}
          onDelete={(id) => {
            setUserPosts((prev) => prev.filter((p) => p.id !== id))
            setSavedPosts((prev) => prev.filter((p) => p.id !== id))
            setModalPostId(null)
          }}
          onUpdate={(id, updates) => {
            if (updates.caption != null) {
              setUserPosts((prev) => prev.map((p) => (p.id === id ? { ...p, description: updates.caption! } : p)))
              setSavedPosts((prev) => prev.map((p) => (p.id === id ? { ...p, description: updates.caption! } : p)))
            }
          }}
        />
      )}

    </div>
  )
}
