import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'

const XP_PER_ANALYSIS = 10

export function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<{
    calories: number
    items: { name: string; calories: number }[]
    exp: number
    memeUrl?: string
  } | null>(null)
  const [showMeme, setShowMeme] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
  }

  const handleAnalyze = async () => {
    if (!file) return
    setAnalyzing(true)
    setResult(null)
    await new Promise((r) => setTimeout(r, 1500))
    setAnalyzing(false)
    setResult({
      calories: 450,
      items: [
        { name: 'Grilled chicken breast', calories: 250 },
        { name: 'Mixed salad', calories: 120 },
        { name: 'Olive oil dressing', calories: 80 },
      ],
      exp: XP_PER_ANALYSIS,
    })
  }

  const handleMeme = () => {
    setShowMeme(true)
  }

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Upload & Analyze</h1>

      <div className="space-y-6">
        <div className="rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
          {preview ? (
            <div className="space-y-4">
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-64 object-contain rounded-xl mx-auto"
              />
              <div className="flex gap-2 justify-center flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-sm hover:bg-zinc-700 touch-manipulation"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 disabled:opacity-50 touch-manipulation"
                >
                  {analyzing ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-12 flex flex-col items-center gap-2 text-zinc-500 hover:text-zinc-400 transition-colors touch-manipulation"
            >
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Tap to upload food or waste</span>
              <span className="text-sm">Take a photo or choose from gallery</span>
            </button>
          )}
        </div>

        {result && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Total calories</span>
                <span className="text-2xl font-bold text-emerald-400">{result.calories}</span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-emerald-400">
                <span>+{result.exp} XP</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <h3 className="font-medium text-zinc-300 mb-2">Detected items</h3>
              <ul className="space-y-1">
                {result.items.map((item, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-zinc-400">{item.name}</span>
                    <span className="text-zinc-300">{item.calories} cal</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={handleMeme}
              className="w-full py-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 font-medium hover:bg-amber-500/30 touch-manipulation"
            >
              Turn into meme
            </button>

            {showMeme && (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                <p className="text-sm text-zinc-500 mb-2">Meme version (placeholder)</p>
                <div className="aspect-video bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500">
                  Meme generator coming soon
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
        <h3 className="font-semibold text-zinc-300 mb-2">How it works</h3>
        <ol className="text-sm text-zinc-500 space-y-2 list-decimal list-inside">
          <li>Upload a photo of your food or food waste</li>
          <li>AI analyzes calories and nutrients</li>
          <li>Earn XP for every analysis (Duolingo-style)</li>
          <li>Track your impact over time</li>
        </ol>
      </div>

      <Link
        to="/history"
        className="mt-6 block text-center text-emerald-400 text-sm hover:underline"
      >
        View your history →
      </Link>
    </div>
  )
}
