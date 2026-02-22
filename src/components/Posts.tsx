import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { getProfilesByIds } from '../lib/profiles'
import {
  toggleLike,
  toggleSave,
  getLikedPostIds,
  getSavedPostIds,
  getComments,
  addComment,
  updatePost,
  type CommentWithAuthor,
} from '../lib/posts'

interface Post {
  id: string
  user: { name: string; avatar: string; username: string }
  image: string
  imageAfter?: string
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
  image_url_after?: string
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
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editCaption, setEditCaption] = useState('')
  const [commentsOpenId, setCommentsOpenId] = useState<string | null>(null)
  const [comments, setComments] = useState<Record<string, CommentWithAuthor[]>>({})
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const menuRef = useRef<HTMLDivElement>(null)

  const loadPosts = async () => {
    setLoading(true)
    setError(null)
    const { data, error: fetchError } = await supabase
      .from('posts')
      .select('id, user_id, image_url, image_url_after, description, hashtags, created_at, likes')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setPosts([])
      setLoading(false)
      return
    }

    const postsData = (data ?? []) as DbPost[]
    const userIds = [...new Set(postsData.flatMap((p) => [p.user_id]))]
    const profiles = await getProfilesByIds(userIds)

    const mapped = postsData.map((post) => {
      const profile = profiles[post.user_id]
      const name = profile?.full_name?.trim() || `User ${post.user_id.slice(0, 8)}`
      const avatar = profile?.avatar_url || fallbackAvatar
      const username = name.replace(/\s+/g, '').toLowerCase() || post.user_id.slice(0, 8)
      const tags = post.hashtags
        ? post.hashtags.split(' ').map((tag) => tag.trim()).filter(Boolean)
        : []

      return {
        id: post.id,
        user_id: post.user_id,
        user: { name, avatar, username },
        image: post.image_url,
        imageAfter: post.image_url_after ?? undefined,
        caption: post.description ?? '',
        likes: post.likes ?? 0,
        comments: 0,
        timestamp: formatTimeAgo(post.created_at),
        tags,
      }
    })

    setPosts(mapped)
    setLoading(false)
  }

  useEffect(() => {
    let isMounted = true
    loadPosts().then(() => {
      if (!isMounted || !currentUser?.id) return
      Promise.all([getLikedPostIds(currentUser.id), getSavedPostIds(currentUser.id)]).then(
        ([liked, saved]) => {
          if (isMounted) {
            setLikedIds(liked)
            setSavedIds(saved)
          }
        }
      )
    })
    return () => { isMounted = false }
  }, [currentUser?.id])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!commentsOpenId) return
    getComments(commentsOpenId).then((c) => {
      const ids = [...new Set(c.map((x) => x.user_id))]
      return getProfilesByIds(ids).then((profiles) =>
        getComments(commentsOpenId!, profiles).then((full) => {
          setComments((prev) => ({ ...prev, [commentsOpenId!]: full }))
        })
      )
    })
  }, [commentsOpenId])

  const handleLike = async (postId: string) => {
    if (!currentUser) return
    const isLiked = likedIds.has(postId)
    const newCount = await toggleLike(postId, currentUser.id, isLiked)
    setLikedIds((prev) => {
      const next = new Set(prev)
      if (isLiked) next.delete(postId)
      else next.add(postId)
      return next
    })
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, likes: newCount } : p)))
  }

  const handleSave = async (postId: string) => {
    if (!currentUser) return
    const isSaved = savedIds.has(postId)
    const nowSaved = await toggleSave(postId, currentUser.id, isSaved)
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (nowSaved) next.add(postId)
      else next.delete(postId)
      return next
    })
  }

  const handleDeleteClick = (postId: string, userId: string) => {
    setMenuOpenId(null)
    if (!currentUser || currentUser.id !== userId) {
      setError('You can only delete your own posts')
      return
    }
    setPostToDelete({ postId, userId })
    setShowDeleteConfirm(true)
  }

  const handleEditClick = (post: Post & { user_id: string }) => {
    setMenuOpenId(null)
    setEditingPostId(post.id)
    setEditCaption(post.caption)
  }

  const handleEditSave = async () => {
    if (!editingPostId || !currentUser) return
    const post = posts.find((p) => p.id === editingPostId)
    if (!post || post.user_id !== currentUser.id) return
    try {
      await updatePost(editingPostId, currentUser.id, { description: editCaption })
      setPosts((prev) => prev.map((p) => (p.id === editingPostId ? { ...p, caption: editCaption } : p)))
      setEditingPostId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    }
  }

  const handleConfirmDelete = async () => {
    if (!postToDelete) return
    const { postId } = postToDelete
    setDeletingId(postId)
    setShowDeleteConfirm(false)
    try {
      const { error: deleteError } = await supabase.from('posts').delete().eq('id', postId)
      if (deleteError) throw deleteError
      setPosts((prev) => prev.filter((p) => p.id !== postId))
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

  const handleAddComment = async (postId: string) => {
    const text = commentText[postId]?.trim()
    if (!text || !currentUser) return
    try {
      await addComment(postId, currentUser.id, text)
      setCommentText((prev) => ({ ...prev, [postId]: '' }))
      const post = posts.find((p) => p.id === postId)
      if (post) {
        const profiles = await getProfilesByIds([currentUser.id])
        const list = await getComments(postId, profiles)
        setComments((prev) => ({ ...prev, [postId]: list }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment')
    }
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
      <div className="space-y-6">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className={`bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 ${index === 0 ? 'mt-4' : ''}`}
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <img src={post.user.avatar} alt={post.user.name} className="w-8 h-8 rounded-full" />
                <div>
                  <h3 className="font-semibold text-zinc-100 text-sm">{post.user.name}</h3>
                  <p className="text-zinc-500 text-xs">{post.timestamp}</p>
                </div>
              </div>
              <div className="relative" ref={currentUser?.id === post.user_id ? menuRef : undefined}>
                {currentUser?.id === post.user_id ? (
                  <button
                    type="button"
                    onClick={() => setMenuOpenId(menuOpenId === post.id ? null : post.id)}
                    className="p-2 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="6" r="1.5" />
                      <circle cx="12" cy="12" r="1.5" />
                      <circle cx="12" cy="18" r="1.5" />
                    </svg>
                  </button>
                ) : null}
                {menuOpenId === post.id && (
                  <div className="absolute right-0 top-full mt-1 py-1 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl z-10 min-w-[120px]">
                    <button
                      type="button"
                      onClick={() => handleEditClick(post)}
                      className="w-full px-4 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-700"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteClick(post.id, post.user_id)}
                      className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-zinc-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="aspect-square flex">
              {post.imageAfter ? (
                <div className="flex-1 grid grid-cols-2">
                  <img src={post.image} alt="Before" className="w-full h-full object-cover" />
                  <img src={post.imageAfter} alt="After" className="w-full h-full object-cover" />
                </div>
              ) : (
                <img src={post.image} alt="Post" className="w-full h-full object-cover" />
              )}
            </div>

            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => handleLike(post.id)}
                    className={`transition-colors ${likedIds.has(post.id) ? 'text-red-400' : 'text-zinc-400 hover:text-red-400'}`}
                  >
                    <svg
                      className="w-6 h-6"
                      fill={likedIds.has(post.id) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommentsOpenId(commentsOpenId === post.id ? null : post.id)}
                    className="text-zinc-400 hover:text-zinc-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                  </button>
                </div>
                {currentUser && (
                  <button
                    type="button"
                    onClick={() => handleSave(post.id)}
                    className={savedIds.has(post.id) ? 'text-amber-400' : 'text-zinc-400 hover:text-amber-400'}
                  >
                    <svg
                      className="w-6 h-6"
                      fill={savedIds.has(post.id) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-zinc-100 text-sm">{post.likes} likes</p>
                {editingPostId === post.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleEditSave}
                        className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-sm"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPostId(null)}
                        className="px-3 py-1 rounded-lg bg-zinc-700 text-zinc-300 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm">
                    <span className="font-semibold text-zinc-100">{post.user.username}</span>
                    <span className="text-zinc-300 ml-2">{post.caption}</span>
                  </p>
                )}

                {commentsOpenId === post.id && (
                  <div className="pt-3 border-t border-zinc-700 space-y-2">
                    {(comments[post.id] ?? []).map((c) => (
                      <div key={c.id} className="flex gap-2">
                        <img src={c.author_avatar} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
                        <div>
                          <p className="text-sm">
                            <span className="font-semibold text-zinc-200">{c.author_name}</span>
                            <span className="text-zinc-400 ml-2">{c.text}</span>
                          </p>
                        </div>
                      </div>
                    ))}
                    {currentUser && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a comment..."
                          value={commentText[post.id] ?? ''}
                          onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                          className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-100 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(post.id)}
                          className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm"
                        >
                          Post
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-6 max-w-sm mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-zinc-100 mb-2">Delete Post?</h3>
            <p className="text-zinc-400 text-sm mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deletingId === postToDelete?.postId}
                className="flex-1 px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium disabled:opacity-50"
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
