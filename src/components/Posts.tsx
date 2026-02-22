import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

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
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

      const mapped = (data as DbPost[]).map((post) => {
        const username = post.user_id.slice(0, 8)
        const tags = post.hashtags
          ? post.hashtags
              .split(' ')
              .map((tag) => tag.trim())
              .filter(Boolean)
          : []

        return {
          id: post.id,
          user: {
            name: `User ${username}`,
            avatar: fallbackAvatar,
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

  return (
    <div className="max-w-md mx-auto pb-6">
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
        {posts.map((post) => (
          <div key={post.id} className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
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
              <button className="text-zinc-400 hover:text-zinc-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
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
    </div>
  )
}