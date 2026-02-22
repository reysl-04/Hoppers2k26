import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getProfilesByIds } from '../lib/profiles'

interface Post {
  id: string
  user: {
    name: string
    avatar: string
    username: string
  }
  image: string
  caption: string
  likes: number
  comments: number
  timestamp: string
  tags: string[]
}

interface DbPost {
  id: string
  user_id: string
  image_url: string
  description: string
  hashtags: string | null
  created_at: string
  likes: number | null
}

const fallbackAvatar = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'

const formatTimeAgo = (iso: string) => {
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  return `${days}d`
}

export function Posts() {
  const { user: currentUser } = useAuth()
  const [posts, setPosts] = useState<(Post & { user_id: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [postToDelete, setPostToDelete] = useState<{ postId: string; userId: string } | null>(null)

  useEffect(() => {
    let isMounted = true

    const loadPosts = async () => {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('id, user_id, image_url, description, hashtags, created_at, likes')
        .order('created_at', { ascending: false })

      if (!isMounted) return

      if (fetchError) {
        setError(fetchError.message)
        setPosts([])
        setLoading(false)
        return
      }

      const postsData = data as DbPost[]
      const userIds = [...new Set(postsData.map((p) => p.user_id))]
      const profiles = await getProfilesByIds(userIds)

      const mapped = postsData.map((post) => {
        const profile = profiles[post.user_id]
        const name = profile?.full_name?.trim() || `User ${post.user_id.slice(0, 8)}`
        const avatar = profile?.avatar_url || fallbackAvatar
        const username = name.replace(/\s+/g, '').toLowerCase() || post.user_id.slice(0, 8)
        const tags = post.hashtags
          ? post.hashtags
              .split(' ')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : []

        return {
          id: post.id,
          user_id: post.user_id,
          user: {
            name,
            avatar,
            username,
          },
          image: post.image_url,
          caption: post.description,
          likes: post.likes ?? 0,
          comments: 0,
          timestamp: formatTimeAgo(post.created_at),
          tags,
        }
      })

      setPosts(mapped)
      setLoading(false)
    }

    loadPosts()

    return () => {
      isMounted = false
    }
  }, [])

  const handleDeleteClick = (postId: string, userId: string) => {
    if (!currentUser || currentUser.id !== userId) {
      setError('You can only delete your own posts')
      return
    }
    setPostToDelete({ postId, userId })
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!postToDelete) return

    const { postId } = postToDelete
    setDeletingId(postId)
    setShowDeleteConfirm(false)
    try {
      const { error: deleteError } = await supabase.from('posts').delete().eq('id', postId)

      if (deleteError) throw deleteError

      // Remove from UI
      setPosts(posts.filter((p) => p.id !== postId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post')
    } finally {
      setDeletingId(null)
      setPostToDelete(null)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false)
    setPostToDelete(null)
  }

  return (
    <div className="max-w-md mx-auto pb-6 px-3">
      {loading && (
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm">
          Loading posts...
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
      {!loading && !error && posts.length === 0 && (
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 text-sm">
          No posts yet. Be the first to share!
        </div>
      )}
      {/* Posts feed */}
      <div className="space-y-6">
        {posts.map((post, index) => (
          <div key={post.id} className={`bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 ${index === 0 ? 'mt-4' : ''}`}>
            {/* Post header */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <img
                  src={post.user.avatar}
                  alt={post.user.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm">{post.user.name}</h3>
                  <p className="text-zinc-500 text-xs">{post.timestamp}</p>
                </div>
              </div>
              {currentUser?.id === post.user_id && (
                <button
                  type="button"
                  onClick={() => handleDeleteClick(post.id, post.user_id)}
                  className="p-2 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                  aria-label="Delete post"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>

            {/* Post image */}
            <div className="aspect-square">
              <img
                src={post.image}
                alt="Post"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Post actions */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <button className="text-zinc-400 hover:text-red-400 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                  <button className="text-zinc-400 hover:text-zinc-300 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                  <button className="text-zinc-400 hover:text-zinc-300 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <button className="text-zinc-400 hover:text-zinc-300 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>

              {/* Likes and caption */}
              <div className="space-y-2">
                <p className="font-semibold text-zinc-100 text-sm">{post.likes} likes</p>
                <p className="text-sm">
                  <span className="font-semibold text-zinc-100">{post.user.username}</span>
                  <span className="text-zinc-300 ml-2">{post.caption}</span>
                </p>
                {post.comments > 0 && (
                  <button className="text-zinc-500 text-sm hover:text-zinc-400">
                    View all {post.comments} comments
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Delete Post?</h3>
            <p className="text-zinc-400 text-sm mb-6">This action cannot be undone. Are you sure you want to delete this post?</p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingId === postToDelete?.postId}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingId === postToDelete?.postId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}