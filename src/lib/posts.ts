import { supabase } from './supabase'

export async function toggleLike(postId: string, userId: string, isLiked: boolean): Promise<number> {
  if (isLiked) {
    await supabase.from('post_likes').delete().eq('post_id', postId).eq('user_id', userId)
  } else {
    await supabase.from('post_likes').insert({ post_id: postId, user_id: userId })
  }
  // posts.likes is kept in sync by DB trigger sync_post_likes_count
  const { count } = await supabase.from('post_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId)
  return count ?? 0
}

export async function toggleSave(postId: string, userId: string, isSaved: boolean): Promise<boolean> {
  if (isSaved) {
    await supabase.from('post_saves').delete().eq('post_id', postId).eq('user_id', userId)
    return false
  } else {
    await supabase.from('post_saves').insert({ post_id: postId, user_id: userId })
    return true
  }
}

export async function getLikedPostIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from('post_likes').select('post_id').eq('user_id', userId)
  return new Set((data ?? []).map((r) => r.post_id))
}

export async function getSavedPostIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from('post_saves').select('post_id').eq('user_id', userId)
  return new Set((data ?? []).map((r) => r.post_id))
}

export interface CommentWithAuthor {
  id: string
  post_id: string
  user_id: string
  text: string
  created_at: string
  author_name: string
  author_avatar: string
}

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'

export async function getComments(
  postId: string,
  profiles?: Record<string, { full_name: string | null; avatar_url: string | null }>
): Promise<CommentWithAuthor[]> {
  const { data } = await supabase
    .from('post_comments')
    .select('id, post_id, user_id, text, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  const comments = (data ?? []) as Array<{ id: string; post_id: string; user_id: string; text: string; created_at: string }>
  const prof = profiles ?? {}
  return comments.map((c) => {
    const p = prof[c.user_id]
    return {
      ...c,
      author_name: p?.full_name?.trim() || `User ${c.user_id.slice(0, 8)}`,
      author_avatar: p?.avatar_url || FALLBACK_AVATAR,
    }
  })
}

export async function addComment(postId: string, userId: string, text: string): Promise<void> {
  const { error } = await supabase.from('post_comments').insert({ post_id: postId, user_id: userId, text: text.trim() })
  if (error) throw error
}

export async function updatePost(postId: string, userId: string, updates: { description?: string; hashtags?: string }): Promise<void> {
  const { error } = await supabase.from('posts').update(updates).eq('id', postId).eq('user_id', userId)
  if (error) throw error
}
