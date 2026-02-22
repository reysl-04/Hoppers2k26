import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  analyzeFoodImage,
  type LogMealNutritionResponse,
  type LogMealNutrient,
} from '../lib/logmeal'
import { analyzeFoodWithGemini, type GeminiFoodAnalysis } from '../lib/gemini'
import { saveCalorieAnalysis, saveBeforeAfterAnalysis } from '../lib/analyses'
import { useAuth } from '../contexts/AuthContext'

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

type AnalyzerMode = 'calorie' | 'before-after' | null

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
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<AnalyzerMode>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileBefore, setFileBefore] = useState<File | null>(null)
  const [fileAfter, setFileAfter] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewBefore, setPreviewBefore] = useState<string | null>(null)
  const [previewAfter, setPreviewAfter] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    data: LogMealNutritionResponse
    exp: number
    gemini?: GeminiFoodAnalysis
  } | null>(null)
  const [resultBeforeAfter, setResultBeforeAfter] = useState<{
    before: LogMealNutritionResponse
    after: LogMealNutritionResponse
    exp: number
    geminiBefore?: GeminiFoodAnalysis
    geminiAfter?: GeminiFoodAnalysis
  } | null>(null)
  const [showMeme, setShowMeme] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileBeforeRef = useRef<HTMLInputElement>(null)
  const fileAfterRef = useRef<HTMLInputElement>(null)

  const resetToModeSelection = () => {
    setMode(null)
    setFile(null)
    setFileBefore(null)
    setFileAfter(null)
    setPreview(null)
    setPreviewBefore(null)
    setPreviewAfter(null)
    setResult(null)
    setResultBeforeAfter(null)
    setError(null)
    setShowMeme(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError(null)
  }

  const handleFileBeforeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFileBefore(f)
    setPreviewBefore(URL.createObjectURL(f))
    setResultBeforeAfter(null)
    setError(null)
  }

  const handleFileAfterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFileAfter(f)
    setPreviewAfter(URL.createObjectURL(f))
    setResultBeforeAfter(null)
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
      let geminiResult: GeminiFoodAnalysis | undefined
      if (import.meta.env.VITE_GEMINI_API_KEY) {
        try {
          geminiResult = await analyzeFoodWithGemini(file)
        } catch {
          // Gemini optional - ignore errors
        }
      }
      setResult({
        data,
        exp: XP_PER_ANALYSIS,
        gemini: geminiResult,
      })
      if (user?.id) {
        try {
          const foodItems = getFoodItemsFromResponse(data)
          await saveCalorieAnalysis({
            userId: user.id,
            imageFile: file,
            calories: data.nutritional_info?.calories ?? 0,
            nutritionalData: data.nutritional_info
              ? {
                  totalNutrients: data.nutritional_info.totalNutrients,
                  detectedItems: foodItems,
                }
              : undefined,
            expEarned: XP_PER_ANALYSIS,
          })
        } catch (saveErr) {
          setError(saveErr instanceof Error ? saveErr.message : 'Analysis saved but failed to store. Check Supabase setup.')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAnalyzeBeforeAfter = async () => {
    if (!fileBefore || !fileAfter) return

    const apiKey = import.meta.env.VITE_LOGMEAL_API_KEY
    if (!apiKey) {
      setError('LogMeal API key not configured. Add VITE_LOGMEAL_API_KEY to your .env file.')
      return
    }

    setAnalyzing(true)
    setResultBeforeAfter(null)
    setError(null)

    try {
      const [before, after] = await Promise.all([
        analyzeFoodImage(fileBefore),
        analyzeFoodImage(fileAfter),
      ])
      const caloriesBefore = before.nutritional_info?.calories ?? 0
      const caloriesAfter = after.nutritional_info?.calories ?? 0
      const caloriesConsumed = Math.max(0, caloriesBefore - caloriesAfter)
      let geminiBefore: GeminiFoodAnalysis | undefined
      let geminiAfter: GeminiFoodAnalysis | undefined
      if (import.meta.env.VITE_GEMINI_API_KEY) {
        try {
          ;[geminiBefore, geminiAfter] = await Promise.all([
            analyzeFoodWithGemini(fileBefore),
            analyzeFoodWithGemini(fileAfter),
          ])
        } catch {
          // Gemini optional
        }
      }
      setResultBeforeAfter({
        before,
        after,
        exp: XP_PER_ANALYSIS * 2,
        geminiBefore,
        geminiAfter,
      })
      if (user?.id) {
        try {
          const foodItems = getFoodItemsFromResponse(before)
          await saveBeforeAfterAnalysis({
            userId: user.id,
            imageFileBefore: fileBefore,
            imageFileAfter: fileAfter,
            caloriesBefore,
            caloriesAfter,
            caloriesConsumed,
            foodWasteCalories: caloriesAfter,
            nutritionalData: before.nutritional_info
              ? {
                  totalNutrients: before.nutritional_info.totalNutrients,
                  detectedItems: foodItems,
                }
              : undefined,
            expEarned: XP_PER_ANALYSIS * 2,
          })
        } catch (saveErr) {
          setError(saveErr instanceof Error ? saveErr.message : 'Analysis saved but failed to store. Check Supabase setup.')
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze images')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleMeme = () => {
    setShowMeme(true)
  }

  const handlePostOnline = () => {
    if (!preview) {
      setError('Please upload an image first')
      return
    }
    navigate('/share-post', { state: { imagePreview: preview } })
  }

  const foodItems = result ? getFoodItemsFromResponse(result.data) : []
  const totalCalories = result?.data.nutritional_info?.calories ?? 0
  const macros = result ? getMacrosFromNutrition(result.data.nutritional_info?.totalNutrients) : []

  const caloriesBefore = resultBeforeAfter?.before.nutritional_info?.calories ?? 0
  const caloriesAfter = resultBeforeAfter?.after.nutritional_info?.calories ?? 0
  const caloriesConsumed = Math.max(0, caloriesBefore - caloriesAfter)
  const foodWasteCalories = caloriesAfter

  // Mode selection screen
  if (mode === null) {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold text-zinc-100 mb-6">Upload & Analyze</h1>

        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMode('calorie')}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-colors touch-manipulation text-left"
          >
            <div className="w-14 h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-zinc-100">Calorie Analyzer</h2>
              <p className="text-sm text-zinc-500 mt-1">1 image • Calories & macros</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setMode('before-after')}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 transition-colors touch-manipulation text-left"
          >
            <div className="w-14 h-14 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-zinc-100">Before / After Analyzer</h2>
              <p className="text-sm text-zinc-500 mt-1">2 images • Consumed & waste</p>
            </div>
          </button>
        </div>

        <div className="mt-8 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
          <h3 className="font-semibold text-zinc-300 mb-2">How it works</h3>
          <ol className="text-sm text-zinc-500 space-y-2 list-decimal list-inside">
            <li>Choose your analyzer type above</li>
            <li>Upload photo(s) of your food</li>
            <li>LogMeal AI analyzes calories and nutrients</li>
            <li>Earn XP for every analysis</li>
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

  // Calorie Analyzer (single image)
  if (mode === 'calorie') {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={resetToModeSelection}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-zinc-100">Calorie Analyzer</h1>
        </div>

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
                <span className="font-medium">Tap to upload food</span>
                <span className="text-sm">Take a photo or choose from gallery</span>
              </button>
            )}
          </div>

          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
              <p className="text-red-400 text-sm">{error}</p>
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
                {result.gemini?.calories != null && (
                  <p className="mt-1 text-sm text-zinc-500">
                    Gemini estimate: {Math.round(result.gemini.calories)} cal
                    {result.gemini.caption && ` · ${result.gemini.caption}`}
                  </p>
                )}
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

              <button
                type="button"
                onClick={handlePostOnline}
                className="w-full py-3 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 font-medium hover:bg-emerald-600/30 touch-manipulation"
              >
                Post online
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

        <Link
          to="/history"
          className="mt-6 block text-center text-emerald-400 text-sm hover:underline"
        >
          View your history →
        </Link>
      </div>
    )
  }

  // Before/After Analyzer (two images)
  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={resetToModeSelection}
          className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-zinc-100">Before / After Analyzer</h1>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-4 text-center">
            <input
              ref={fileBeforeRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileBeforeChange}
              className="hidden"
            />
            <p className="text-sm font-medium text-zinc-400 mb-2">Before</p>
            {previewBefore ? (
              <div className="space-y-2">
                <img
                  src={previewBefore}
                  alt="Before"
                  className="w-full aspect-square object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => fileBeforeRef.current?.click()}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileBeforeRef.current?.click()}
                className="w-full aspect-square flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-zinc-400 rounded-xl border-2 border-dashed border-zinc-600 touch-manipulation"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs">Add</span>
              </button>
            )}
          </div>

          <div className="rounded-2xl border-2 border-dashed border-zinc-700 bg-zinc-900/50 p-4 text-center">
            <input
              ref={fileAfterRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileAfterChange}
              className="hidden"
            />
            <p className="text-sm font-medium text-zinc-400 mb-2">After</p>
            {previewAfter ? (
              <div className="space-y-2">
                <img
                  src={previewAfter}
                  alt="After"
                  className="w-full aspect-square object-cover rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => fileAfterRef.current?.click()}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileAfterRef.current?.click()}
                className="w-full aspect-square flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-zinc-400 rounded-xl border-2 border-dashed border-zinc-600 touch-manipulation"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs">Add</span>
              </button>
            )}
          </div>
        </div>

        {(fileBefore || fileAfter) && (
          <button
            type="button"
            onClick={handleAnalyzeBeforeAfter}
            disabled={!fileBefore || !fileAfter || analyzing}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
          >
            {analyzing ? 'Analyzing both images...' : 'Analyze Before & After'}
          </button>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {resultBeforeAfter && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-sm text-zinc-400">Calories consumed</p>
                <p className="text-2xl font-bold text-emerald-400">{Math.round(caloriesConsumed)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-zinc-400">Food waste</p>
                <p className="text-2xl font-bold text-red-400">{Math.round(foodWasteCalories)} cal</p>
              </div>
            </div>

            {(resultBeforeAfter.geminiBefore || resultBeforeAfter.geminiAfter) && (
              <div className="space-y-2">
                {resultBeforeAfter.geminiBefore && (
                  <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
                    <p className="text-xs text-zinc-500">Gemini AI (before)</p>
                    <p className="text-sm text-zinc-300">
                      {resultBeforeAfter.geminiBefore.caption}
                      {resultBeforeAfter.geminiBefore.calories != null &&
                        ` · ${Math.round(resultBeforeAfter.geminiBefore.calories)} cal`}
                    </p>
                  </div>
                )}
                {resultBeforeAfter.geminiAfter && (
                  <div className="p-3 rounded-xl bg-zinc-800/50 border border-zinc-700">
                    <p className="text-xs text-zinc-500">Gemini AI (after / waste)</p>
                    <p className="text-sm text-zinc-300">
                      {resultBeforeAfter.geminiAfter.caption}
                      {resultBeforeAfter.geminiAfter.calories != null &&
                        ` · ${Math.round(resultBeforeAfter.geminiAfter.calories)} cal`}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <h3 className="font-medium text-zinc-300 mb-2">Breakdown</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Before (total on plate)</span>
                  <span className="text-zinc-300">{Math.round(caloriesBefore)} cal</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">After (leftovers)</span>
                  <span className="text-zinc-300">{Math.round(caloriesAfter)} cal</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-zinc-700">
                  <span className="text-emerald-400 font-medium">You consumed</span>
                  <span className="text-emerald-400 font-bold">{Math.round(caloriesConsumed)} cal</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <span className="text-emerald-400">+{resultBeforeAfter.exp} XP</span>
            </div>

            {(getMacrosFromNutrition(resultBeforeAfter.before.nutritional_info?.totalNutrients).length > 0 ||
              getMacrosFromNutrition(resultBeforeAfter.after.nutritional_info?.totalNutrients).length > 0) && (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                <h3 className="font-medium text-zinc-300 mb-3">Macronutrients (before eating)</h3>
                <div className="grid grid-cols-2 gap-2">
                  {getMacrosFromNutrition(resultBeforeAfter.before.nutritional_info?.totalNutrients).map((m) => (
                    <div key={m.label} className="flex justify-between text-sm">
                      <span className="text-zinc-500">{m.label}</span>
                      <span className="text-zinc-300 font-medium">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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
