import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  getAnalysesByDate,
  getAnalysesByMonth,
  type FoodAnalysis,
} from '../lib/analyses'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const ACHIEVEMENTS = [
  { id: '1', title: 'First Bite', description: 'Log your first meal', icon: '🍽️', progress: 0, target: 1 },
  { id: '2', title: 'Week Warrior', description: 'Track 7 days in a row', icon: '🔥', progress: 0, target: 7 },
  { id: '3', title: 'Calorie Champion', description: 'Stay within limit 5 days', icon: '🏆', progress: 0, target: 5 },
  { id: '4', title: 'Zero Waste Hero', description: 'Reduce waste 10 times', icon: '🌱', progress: 0, target: 10 },
]

export function History() {
  const { user } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [analysesByDate, setAnalysesByDate] = useState<Record<string, number>>({})
  const [selectedAnalyses, setSelectedAnalyses] = useState<FoodAnalysis[]>([])
  const [loading, setLoading] = useState(false)

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

  const handleDateClick = (dateKey: string) => {
    setSelectedDate(dateKey)
  }

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
          <div className="mt-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
            <h3 className="font-medium text-zinc-300 mb-3">{selectedDate}</h3>
            {loading ? (
              <p className="text-sm text-zinc-500">Loading...</p>
            ) : selectedAnalyses.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No uploads on this day. Tap Upload to log your first meal!
              </p>
            ) : (
              <div className="space-y-4">
                {selectedAnalyses.map((a) => (
                  <div
                    key={a.id}
                    className="rounded-xl overflow-hidden bg-zinc-800 border border-zinc-700"
                  >
                    <div className="flex gap-3 p-3">
                      <img
                        src={a.image_url}
                        alt="Food"
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-zinc-200">
                          {a.type === 'before_after' ? 'Before/After' : 'Calorie'} analysis
                        </p>
                        <p className="text-lg font-bold text-emerald-400">
                          {Math.round(a.calories)} cal
                        </p>
                        {a.type === 'before_after' && (
                          <div className="mt-1 flex gap-2 text-xs">
                            <span className="text-emerald-400">
                              Consumed: {Math.round(a.calories_consumed ?? 0)}
                            </span>
                            <span className="text-red-400">
                              Waste: {Math.round(a.food_waste_calories ?? 0)} cal
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {a.type === 'before_after' && a.image_url_after && (
                      <div className="px-3 pb-3 flex gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-zinc-500 mb-1">Before</p>
                          <img
                            src={a.image_url}
                            alt="Before"
                            className="w-full aspect-video object-cover rounded-lg"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-zinc-500 mb-1">After</p>
                          <img
                            src={a.image_url_after}
                            alt="After"
                            className="w-full aspect-video object-cover rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-semibold text-zinc-300 mb-3">Achievements</h2>
        <div className="space-y-3">
          {ACHIEVEMENTS.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800"
            >
              <span className="text-2xl opacity-60">{a.icon}</span>
              <div className="flex-1">
                <h3 className="font-medium text-zinc-200">{a.title}</h3>
                <p className="text-sm text-zinc-500">{a.description}</p>
                <div className="mt-2 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (a.progress / a.target) * 100)}%` }}
                  />
                </div>
              </div>
              <span className="text-sm text-zinc-500">
                {a.progress}/{a.target}
              </span>
            </div>
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
