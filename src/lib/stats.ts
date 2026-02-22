import { supabase } from './supabase'
import type { NutritionalData } from './analyses'

/** XP needed for level N = 100 + 0.04*(N-1)³ + 0.8*(N-1)² + 2*(N-1) + 0.5 */
export function xpForLevel(level: number): number {
  const n = level - 1
  return 100 + 0.04 * n * n * n + 0.8 * n * n + 2 * n + 0.5
}

/** Cumulative XP needed to reach level N (sum of XP for levels 1..N) */
export function cumulativeXpForLevel(level: number): number {
  let total = 0
  for (let i = 1; i <= level; i++) {
    total += xpForLevel(i)
  }
  return total
}

/** Compute level and progress from total XP */
export function levelFromXp(totalXp: number): { level: number; xpInLevel: number; xpNeededForNext: number } {
  let level = 1
  let accumulated = 0
  while (accumulated + xpForLevel(level) <= totalXp) {
    accumulated += xpForLevel(level)
    level++
  }
  const xpInLevel = totalXp - accumulated
  const xpNeededForNext = xpForLevel(level)
  return { level, xpInLevel, xpNeededForNext }
}

export interface UserStats {
  user_id: string
  total_meals_logged: number
  zero_waste_meals_count: number
  low_sugar_meals_count: number
  unique_food_items: string[]
  unique_food_items_count: number
  total_waste_grams: number
  total_calories: number
  total_protein: number
  total_carbs: number
  total_fat: number
  total_fiber: number
  total_sugar: number
  daily_log_streak: number
  last_log_date: string | null
  zero_waste_streak: number
  balanced_meals_count: number
  total_xp: number
  updated_at: string
}

const DEFAULT_STATS: Omit<UserStats, 'user_id' | 'updated_at'> = {
  total_meals_logged: 0,
  zero_waste_meals_count: 0,
  low_sugar_meals_count: 0,
  unique_food_items: [],
  unique_food_items_count: 0,
  total_waste_grams: 0,
  total_calories: 0,
  total_protein: 0,
  total_carbs: 0,
  total_fat: 0,
  total_fiber: 0,
  total_sugar: 0,
  daily_log_streak: 0,
  last_log_date: null,
  zero_waste_streak: 0,
  balanced_meals_count: 0,
  total_xp: 0,
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const { data, error } = await supabase
    .from('user_stats')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw new Error(`Failed to fetch stats: ${error.message}`)
  }

  if (!data) {
    return {
      user_id: userId,
      ...DEFAULT_STATS,
      updated_at: new Date().toISOString(),
    }
  }

  const items = (data.unique_food_items as string[] | null) ?? []
  return {
    user_id: data.user_id,
    total_meals_logged: data.total_meals_logged ?? 0,
    zero_waste_meals_count: data.zero_waste_meals_count ?? 0,
    low_sugar_meals_count: data.low_sugar_meals_count ?? 0,
    unique_food_items: Array.isArray(items) ? items : [],
    unique_food_items_count: data.unique_food_items_count ?? 0,
    total_waste_grams: data.total_waste_grams ?? 0,
    total_calories: data.total_calories ?? 0,
    total_protein: data.total_protein ?? 0,
    total_carbs: data.total_carbs ?? 0,
    total_fat: data.total_fat ?? 0,
    total_fiber: data.total_fiber ?? 0,
    total_sugar: data.total_sugar ?? 0,
    daily_log_streak: data.daily_log_streak ?? 0,
    last_log_date: data.last_log_date ?? null,
    zero_waste_streak: data.zero_waste_streak ?? 0,
    balanced_meals_count: data.balanced_meals_count ?? 0,
    total_xp: data.total_xp ?? 0,
    updated_at: data.updated_at ?? new Date().toISOString(),
  }
}

export interface MealLogPayload {
  type: 'calorie' | 'before_after'
  calories: number
  caloriesConsumed?: number
  foodWasteCalories?: number
  nutritionalData?: NutritionalData | null
  expEarned: number
}

function getNutrient(n: NutritionalData | null | undefined, key: string): number {
  return n?.totalNutrients?.[key]?.quantity ?? 0
}

/** Balanced meal: ≥20g protein, ≥5g fiber, ≤15g sugar, ≤10g waste (use waste cal ≤20 as proxy for ~10g) */
function isBalancedMeal(payload: MealLogPayload): boolean {
  const nd = payload.nutritionalData ?? undefined
  const protein = getNutrient(nd, 'PROCNT')
  const fiber = getNutrient(nd, 'FIBTG')
  const sugar = getNutrient(nd, 'SUGAR')
  const wasteCal = payload.type === 'calorie' ? 0 : (payload.foodWasteCalories ?? 0)
  return protein >= 20 && fiber >= 5 && sugar <= 15 && wasteCal <= 20
}

/** Low sugar: <10g sugar */
function isLowSugarMeal(payload: MealLogPayload): boolean {
  return getNutrient(payload.nutritionalData ?? undefined, 'SUGAR') < 10
}

/** Zero waste: calorie analysis (no waste) or before_after with 0 waste */
function isZeroWasteMeal(payload: MealLogPayload): boolean {
  if (payload.type === 'calorie') return true
  return (payload.foodWasteCalories ?? 0) <= 0
}

export async function updateStatsOnMealLog(
  userId: string,
  payload: MealLogPayload
): Promise<UserStats> {
  const stats = await getUserStats(userId)
  const today = new Date().toISOString().slice(0, 10)
  const lastDate = stats.last_log_date

  // Daily streak
  let newStreak = stats.daily_log_streak
  if (!lastDate) {
    newStreak = 1
  } else {
    const last = new Date(lastDate)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - last.getTime()) / 86400000)
    if (diffDays === 0) {
      // same day, no change
    } else if (diffDays === 1) {
      newStreak = stats.daily_log_streak + 1
    } else {
      newStreak = 1
    }
  }

  // Zero waste streak
  const zeroWaste = isZeroWasteMeal(payload)
  const newZeroWasteStreak = zeroWaste ? stats.zero_waste_streak + 1 : 0

  // Unique food items
  const items = payload.nutritionalData?.detectedItems ?? []
  const names = items.map((i) => String(i.name).trim().toLowerCase()).filter(Boolean)
  const existing = new Set(stats.unique_food_items.map((s) => s.toLowerCase()))
  for (const n of names) {
    if (!existing.has(n)) {
      existing.add(n)
      stats.unique_food_items.push(n)
    }
  }
  const newUniqueCount = stats.unique_food_items.length

  // Totals from this meal (use calories consumed for before_after, else calories)
  const mealCal = payload.type === 'before_after' ? (payload.caloriesConsumed ?? payload.calories) : payload.calories
  const nt = (payload.nutritionalData ?? undefined)?.totalNutrients ?? {}
  const mealProtein = nt.PROCNT?.quantity ?? 0
  const mealCarbs = nt.CHOCDF?.quantity ?? 0
  const mealFat = nt.FAT?.quantity ?? 0
  const mealFiber = nt.FIBTG?.quantity ?? 0
  const mealSugar = nt.SUGAR?.quantity ?? 0

  const updates = {
    total_meals_logged: stats.total_meals_logged + 1,
    zero_waste_meals_count: stats.zero_waste_meals_count + (zeroWaste ? 1 : 0),
    low_sugar_meals_count: stats.low_sugar_meals_count + (isLowSugarMeal(payload) ? 1 : 0),
    unique_food_items: stats.unique_food_items,
    unique_food_items_count: newUniqueCount,
    total_calories: stats.total_calories + mealCal,
    total_protein: stats.total_protein + mealProtein,
    total_carbs: stats.total_carbs + mealCarbs,
    total_fat: stats.total_fat + mealFat,
    total_fiber: stats.total_fiber + mealFiber,
    total_sugar: stats.total_sugar + mealSugar,
    daily_log_streak: newStreak,
    last_log_date: today,
    zero_waste_streak: newZeroWasteStreak,
    balanced_meals_count: stats.balanced_meals_count + (isBalancedMeal(payload) ? 1 : 0),
    total_xp: stats.total_xp + payload.expEarned,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('user_stats').upsert(
    {
      user_id: userId,
      ...updates,
    },
    { onConflict: 'user_id' }
  )

  if (error) {
    throw new Error(`Failed to update stats: ${error.message}`)
  }

  return { ...stats, ...updates }
}
