import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  analyzeFoodImage,
  type LogMealNutritionResponse,
  type LogMealNutrient,
} from '../lib/logmeal'

const XP_PER_ANALYSIS = 10

// Priority macronutrients to display (LogMeal nutrient codes)
const MACRO_KEYS = ['ENERC_KCAL', 'PROCNT', 'CHOCDF', 'FAT', 'FIBTG', 'SUGAR'] as const
const MACRO_LABELS: Record<string, string> = {
  ENERC_KCAL: 'Calories',
  PROCNT: 'Protein',
  CHOCDF: 'Carbs',
  FAT: 'Fat',
  FIBTG: 'Fiber',
  SUGAR: 'Sugar',
}

function formatNutrient(n: LogMealNutrient): string {
  const qty = Number.isInteger(n.quantity) ? n.quantity : n.quantity.toFixed(1)
  return `${qty} ${n.unit}`
}

function getMacrosFromNutrition(
  totalNutrients?: Record<string, LogMealNutrient>
): { label: string; value: string }[] {
  if (!totalNutrients) return []
  return MACRO_KEYS.filter((key) => totalNutrients[key]).map((key) => ({
    label: totalNutrients[key].label || MACRO_LABELS[key] || key,
    value: formatNutrient(totalNutrients[key]),
  }))
}

function getFoodItemsFromResponse(data: LogMealNutritionResponse): Array<{
  name: string
  calories: number
}> {
  const items: Array<{ name: string; calories: number }> = []

  if (data.nutritional_info_per_item?.length) {
    for (const item of data.nutritional_info_per_item) {
      const name =
        item.name ??
        (Array.isArray(data.foodName)
          ? (data.foodName[item.food_item_position - 1] as string) ?? `Item ${item.food_item_position}`
          : data.foodName)
      const calories = item.nutritional_info?.calories ?? 0
      items.push({ name: String(name), calories })
    }
  } else if (data.nutritional_info) {
    const names = Array.isArray(data.foodName) ? data.foodName : [data.foodName]
    const caloriesEach = data.nutritional_info.calories / Math.max(1, names.length)
    for (const name of names) {
      items.push({ name: String(name), calories: caloriesEach })
    }
  }

  return items
}

export function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    data: LogMealNutritionResponse
    exp: number
  } | null>(null)
  const [showMeme, setShowMeme] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!file) return

    const apiKey = import.meta.env.VITE_LOGMEAL_API_KEY
    if (!apiKey) {
      setError('LogMeal API key not configured. Add VITE_LOGMEAL_API_KEY to your .env file.')
      return
    }

    setAnalyzing(true)
    setResult(null)
    setError(null)

    try {
      const data = await analyzeFoodImage(file)
      setResult({
        data,
        exp: XP_PER_ANALYSIS,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleMeme = () => {
    setShowMeme(true)
  }

  const foodItems = result ? getFoodItemsFromResponse(result.data) : []
  const totalCalories = result?.data.nutritional_info?.calories ?? 0
  const macros = result ? getMacrosFromNutrition(result.data.nutritional_info?.totalNutrients) : []

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

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 text-sm">{error}</p>
            <p className="text-zinc-500 text-xs mt-1">
              If you see CORS errors, use a backend proxy to call the LogMeal API.
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Total calories</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {Math.round(totalCalories)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-emerald-400">
                <span>+{result.exp} XP</span>
              </div>
            </div>

            {macros.length > 0 && (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                <h3 className="font-medium text-zinc-300 mb-3">Macronutrients</h3>
                <div className="grid grid-cols-2 gap-2">
                  {macros.map((m) => (
                    <div key={m.label} className="flex justify-between text-sm">
                      <span className="text-zinc-500">{m.label}</span>
                      <span className="text-zinc-300 font-medium">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {foodItems.length > 0 && (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                <h3 className="font-medium text-zinc-300 mb-2">Detected items</h3>
                <ul className="space-y-1">
                  {foodItems.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-zinc-400">{item.name}</span>
                      <span className="text-zinc-300">{Math.round(item.calories)} cal</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

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
          <li>LogMeal AI analyzes calories and nutrients</li>
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
