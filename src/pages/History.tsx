import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  getAnalysesByDate,
  getAnalysesByMonth,
  type FoodAnalysis,
  type NutritionalData,
} from '../lib/analyses'
import { getFoodImageCaption } from '../lib/gemini'
import { getUserStats } from '../lib/stats'
import {
  getAchievementsByCategory,
  getUnlockedAchievementIds,
  type AchievementDef,
} from '../lib/achievements'
import type { UserStats } from '../lib/stats'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const MACRO_KEYS = ['ENERC_KCAL', 'PROCNT', 'CHOCDF', 'FAT', 'FIBTG', 'SUGAR'] as const
const MACRO_LABELS: Record<string, string> = {
  ENERC_KCAL: 'Calories',
  PROCNT: 'Protein',
  CHOCDF: 'Carbs',
  FAT: 'Fat',
  FIBTG: 'Fiber',
  SUGAR: 'Sugar',
}

function AnalysisDetail({ analysis }: { analysis: FoodAnalysis }) {
  const [expanded, setExpanded] = useState(false)
  const [caption, setCaption] = useState<string | null>(null)
  const nutritionalData = analysis.nutritional_data as NutritionalData | null
  const macros = nutritionalData?.totalNutrients
  const detectedItems = nutritionalData?.detectedItems ?? []

  useEffect(() => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) return
    getFoodImageCaption(analysis.image_url)
      .then(setCaption)
      .catch(() => setCaption(null))
  }, [analysis.image_url])

  const hasDetails = (macros && Object.keys(macros).length > 0) || detectedItems.length > 0

  return (
    <div className="rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700">
      {/* Header: Food image as title */}
      <div className="relative">
        <img
          src={analysis.image_url}
          alt="Food"
          className="w-full aspect-video object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="font-semibold text-white text-lg">
            {caption || (analysis.type === 'before_after' ? 'Before/After' : 'Calorie analysis')}
          </p>
          <p className="text-emerald-400 font-bold">{Math.round(analysis.calories)} cal</p>
        </div>
      </div>

      <div className="p-3">
        {analysis.type === 'before_after' && (
          <div className="flex gap-2 text-sm mb-2">
            <span className="text-emerald-400">
              Consumed: {Math.round(analysis.calories_consumed ?? 0)} cal
            </span>
            <span className="text-red-400">
              Waste: {Math.round(analysis.food_waste_calories ?? 0)} cal
            </span>
          </div>
        )}

        {hasDetails && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-emerald-400 text-sm font-medium hover:underline"
          >
            {expanded ? 'Hide details' : 'View details'}
            <svg
              className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {expanded && hasDetails && (
          <div className="mt-3 pt-3 border-t border-zinc-700 space-y-3">
            {detectedItems.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-zinc-500 uppercase mb-1">Detected items</h4>
                <ul className="space-y-1">
                  {detectedItems.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-zinc-300">{item.name}</span>
                      <span className="text-zinc-400">{Math.round(item.calories)} cal</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {macros && Object.keys(macros).length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-zinc-500 uppercase mb-1">Macronutrients</h4>
                <div className="grid grid-cols-2 gap-2">
                  {MACRO_KEYS.filter((k) => macros[k]).map((key) => {
                    const n = macros[key]
                    const label = n?.label || MACRO_LABELS[key] || key
                    const value =
                      n?.quantity != null
                        ? `${Number(n.quantity).toFixed(1)} ${n?.unit ?? ''}`.trim()
                        : '-'
                    return (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-zinc-500">{label}</span>
                        <span className="text-zinc-300">{value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {analysis.type === 'before_after' && analysis.image_url_after && (
        <div className="px-3 pb-3 flex gap-2">
          <div className="flex-1">
            <p className="text-xs text-zinc-500 mb-1">Before</p>
            <img
              src={analysis.image_url}
              alt="Before"
              className="w-full aspect-video object-cover rounded-lg"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs text-zinc-500 mb-1">After</p>
            <img
              src={analysis.image_url_after}
              alt="After"
              className="w-full aspect-video object-cover rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function AchievementCategoryCard({
  category,
  achievements,
  stats,
  unlocked,
  expanded,
  onToggle,
}: {
  category: string
  achievements: AchievementDef[]
  stats: UserStats
  unlocked: Set<string>
  expanded: boolean
  onToggle: () => void
}) {
  const first = achievements[0]
  const categoryIcon = first?.categoryIcon ?? '🏆'
  const inProgress = achievements.find((a) => !unlocked.has(a.id))
  const displayAchievement = inProgress ?? achievements[achievements.length - 1]
  const { current, target } = displayAchievement.getProgress(stats)
  const isComplete = unlocked.has(displayAchievement.id)
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wide">
              {categoryIcon} {category}
            </p>
            <h3 className="font-medium text-zinc-200 truncate">
              {displayAchievement.icon} {displayAchievement.title}
            </h3>
            <p className="text-sm text-zinc-500 mt-0.5">{displayAchievement.condition}</p>
            <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${isComplete ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="text-sm text-zinc-400 mt-1">
              {current}/{target}
              {isComplete && <span className="text-amber-400 ml-1">✓</span>}
            </p>
          </div>
          {achievements.length > 1 && (
            <button
              type="button"
              onClick={onToggle}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
              aria-label={expanded ? 'Collapse' : 'Expand'}
            >
              <svg
                className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          )}
        </div>
        {expanded && achievements.length > 1 && (
          <div className="mt-4 pt-4 border-t border-zinc-800 space-y-3">
            {achievements.map((a) => {
              const { current: c, target: t } = a.getProgress(stats)
              const done = unlocked.has(a.id)
              const p = t > 0 ? Math.min(100, (c / t) * 100) : 0
              return (
                <div key={a.id} className="flex items-center gap-3">
                  <span className="text-lg">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-300">{a.title}</p>
                    <p className="text-xs text-zinc-500">{a.condition} · {a.reward} XP</p>
                    <div className="mt-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${done ? 'bg-amber-500' : 'bg-emerald-500/70'}`}
                        style={{ width: `${p}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-zinc-400">
                    {c}/{t}
                    {done && <span className="text-amber-400"> ✓</span>}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function History() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [analysesByDate, setAnalysesByDate] = useState<Record<string, number>>({})
  const [selectedAnalyses, setSelectedAnalyses] = useState<FoodAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<UserStats | null>(null)
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)

  const prevMonth = () => setCurrentDate(new Date(year, month - 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1))

  const formatDateKey = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  useEffect(() => {
    if (!user?.id) return
    getAnalysesByMonth(user.id, year, month)
      .then(setAnalysesByDate)
      .catch(() => setAnalysesByDate({}))
  }, [user?.id, year, month])

  useEffect(() => {
    if (!user?.id || !selectedDate) {
      setSelectedAnalyses([])
      return
    }
    setLoading(true)
    getAnalysesByDate(user.id, selectedDate)
      .then(setSelectedAnalyses)
      .catch(() => setSelectedAnalyses([]))
      .finally(() => setLoading(false))
  }, [user?.id, selectedDate])

  useEffect(() => {
    if (!user?.id) return
    Promise.all([getUserStats(user.id), getUnlockedAchievementIds(user.id)])
      .then(([s, ids]) => {
        setStats(s)
        setUnlockedIds(ids)
      })
      .catch(() => {})
  }, [user?.id])

  const handleDateClick = (dateKey: string) => {
    setSelectedDate(dateKey)
  }

  const primaryImage = selectedAnalyses[0]?.image_url

  return (
    <div className="px-4 py-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">History</h1>

      <section className="mb-8">
        <h2 className="font-semibold text-zinc-300 mb-3">Monthly Progress</h2>
        <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="p-2 rounded-lg hover:bg-zinc-800 touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-semibold text-zinc-100">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="p-2 rounded-lg hover:bg-zinc-800 touch-manipulation"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500 mb-2">
            {DAYS.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => {
              const dateKey = formatDateKey(day)
              const isSelected = selectedDate === dateKey
              const hasData = (analysesByDate[dateKey] ?? 0) > 0
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(dateKey)}
                  className={`aspect-square rounded-lg text-sm font-medium touch-manipulation transition-colors relative ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : hasData
                        ? 'bg-emerald-500/30 text-emerald-400 hover:bg-emerald-500/50'
                        : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {day}
                  {hasData && !isSelected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {selectedDate && (
          <div className="mt-4 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
            {/* Day header with food image as title */}
            <div className="p-3 border-b border-zinc-800 flex items-center gap-3">
              {primaryImage ? (
                <img
                  src={primaryImage}
                  alt="Day"
                  className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">📅</span>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-zinc-100">{selectedDate}</h3>
                <p className="text-sm text-zinc-500">
                  {selectedAnalyses.length} {selectedAnalyses.length === 1 ? 'entry' : 'entries'}
                </p>
              </div>
            </div>

            <div className="p-3">
              {loading ? (
                <p className="text-sm text-zinc-500">Loading...</p>
              ) : selectedAnalyses.length === 0 ? (
                <p className="text-sm text-zinc-500">
                  No uploads on this day. Tap Upload to log your first meal!
                </p>
              ) : (
                <div className="space-y-4">
                  {selectedAnalyses.map((a) => (
                    <AnalysisDetail key={a.id} analysis={a} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-zinc-300 mb-3">Achievements</h2>
        <div className="space-y-3">
          {stats &&
            Array.from(getAchievementsByCategory().entries()).map(([category, achievements]) => (
              <AchievementCategoryCard
                key={category}
                category={category}
                achievements={achievements}
                stats={stats}
                unlocked={unlockedIds}
                expanded={expandedCategories.has(category)}
                onToggle={() =>
                  setExpandedCategories((prev) => {
                    const next = new Set(prev)
                    if (next.has(category)) next.delete(category)
                    else next.add(category)
                    return next
                  })
                }
              />
            ))}
        </div>
      </section>

      <div className="mt-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
        <h3 className="font-semibold text-emerald-400 mb-2">Stay within your limits!</h3>
        <p className="text-sm text-zinc-400">
          Every day you stay within your calorie goal, you earn bonus XP and get closer to
          unlocking achievements. Your body and the planet will thank you.
        </p>
      </div>
    </div>
  )
}
