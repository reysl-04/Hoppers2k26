import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

interface SharePostState {
  imagePreview: string
  imagePreviewAfter?: string
}

export function SharePost() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const state = location.state as SharePostState | null
  const [description, setDescription] = useState('')
  const [hashtags, setHashtags] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!state?.imagePreview && !state?.imagePreviewAfter) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto text-center">
        <h1 className="text-2xl font-bold text-zinc-100 mb-4">Error</h1>
        <p className="text-zinc-400 mb-6">No image provided. Please upload an image first.</p>
        <button
          onClick={() => navigate('/upload')}
          className="px-6 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 touch-manipulation"
        >
          Go back to Upload
        </button>
      </div>
    )
  }

  const handlePost = async () => {
    if (!user) {
      setError('You must be logged in to post')
      return
    }

    if (!description.trim()) {
      setError('Please add a description')
      return
    }

    setIsPosting(true)
    setError(null)

    try {
      const mainPreview = state.imagePreview || state.imagePreviewAfter!
      const response = await fetch(mainPreview)
      const blob = await response.blob()
      const fileName = `${user.id}-${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage.from('posts').upload(fileName, blob)
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from('posts').getPublicUrl(fileName)
      let imageUrlAfter: string | undefined

      if (state.imagePreviewAfter && state.imagePreview && state.imagePreview !== state.imagePreviewAfter) {
        const resAfter = await fetch(state.imagePreviewAfter)
        const blobAfter = await resAfter.blob()
        const fileNameAfter = `${user.id}-${Date.now()}-after.jpg`
        const { error: uploadAfterError } = await supabase.storage.from('posts').upload(fileNameAfter, blobAfter)
        if (!uploadAfterError) {
          const { data: urlAfter } = supabase.storage.from('posts').getPublicUrl(fileNameAfter)
          imageUrlAfter = urlAfter.publicUrl
        }
      }

      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: publicUrlData.publicUrl,
        image_url_after: imageUrlAfter ?? null,
        description: description.trim(),
        hashtags: hashtags
          .split(' ')
          .filter((tag) => tag.startsWith('#') || tag.length > 0)
          .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
          .join(' '),
        created_at: new Date().toISOString(),
      })

      if (insertError) throw insertError

      // Navigate back and show success
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post')
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-24">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => navigate('/upload')}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-zinc-100">Share Post</h1>
      </div>

      <div className="space-y-6">
        {/* Image preview */}
        <div className="rounded-2xl border border-zinc-800 overflow-hidden">
          {state.imagePreviewAfter && state.imagePreview ? (
            <div className="grid grid-cols-2">
              <img src={state.imagePreview} alt="Before" className="w-full aspect-square object-cover" />
              <img src={state.imagePreviewAfter} alt="After" className="w-full aspect-square object-cover" />
            </div>
          ) : (
            <img src={state.imagePreview || state.imagePreviewAfter} alt="Post preview" className="w-full object-cover" />
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-zinc-300 mb-2">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description to your post..."
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 resize-none"
            rows={4}
          />
        </div>

        {/* Hashtags */}
        <div>
          <label htmlFor="hashtags" className="block text-sm font-medium text-zinc-300 mb-2">
            Hashtags (optional)
          </label>
          <input
            id="hashtags"
            type="text"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="Add hashtags separated by spaces e.g., #healthy #meal #lunch"
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Post button */}
        <button
          onClick={handlePost}
          disabled={isPosting || !description.trim()}
          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
        >
          {isPosting ? 'Posting...' : 'Post'}
        </button>

        {/* Cancel button */}
        <button
          onClick={() => navigate('/upload')}
          className="w-full py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-medium hover:bg-zinc-800 touch-manipulation"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
