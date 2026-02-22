import { supabase } from './supabase'
import type { UserStats } from './stats'

export interface AchievementDef {
  id: string
  category: string
  categoryIcon: string
  title: string
  icon: string
  condition: string
  reward: number
  getProgress: (stats: UserStats) => { current: number; target: number }
}

const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // ZERO CRUMB
  { id: 'zero_crumb_1', category: 'ZERO CRUMB!', categoryIcon: '🌱', title: 'Clean Plate Rookie', icon: '🥄', condition: '1 meal with 0g waste', reward: 50, getProgress: (s) => ({ current: s.zero_waste_meals_count, target: 1 }) },
  { id: 'zero_crumb_5', category: 'ZERO CRUMB!', categoryIcon: '🌱', title: 'No Crumbs Left', icon: '✨', condition: '5 zero-waste meals', reward: 150, getProgress: (s) => ({ current: s.zero_waste_meals_count, target: 5 }) },
  { id: 'zero_crumb_20', category: 'ZERO CRUMB!', categoryIcon: '🌱', title: 'Waste Warrior', icon: '⚔️', condition: '20 zero-waste meals', reward: 400, getProgress: (s) => ({ current: s.zero_waste_meals_count, target: 20 }) },
  { id: 'zero_crumb_50', category: 'ZERO CRUMB!', categoryIcon: '🌱', title: 'Planet Protector', icon: '🌍', condition: '50 zero-waste meals', reward: 900, getProgress: (s) => ({ current: s.zero_waste_meals_count, target: 50 }) },
  { id: 'zero_crumb_100', category: 'ZERO CRUMB!', categoryIcon: '🌱', title: 'Eco Legend', icon: '🌿', condition: '100 zero-waste meals', reward: 2000, getProgress: (s) => ({ current: s.zero_waste_meals_count, target: 100 }) },
  // CALORIE
  { id: 'calorie_5k', category: 'CALORIE', categoryIcon: '🔥', title: 'Calorie Counter', icon: '🔢', condition: '5000 kcal logged', reward: 200, getProgress: (s) => ({ current: Math.round(s.total_calories), target: 5000 }) },
  { id: 'calorie_25k', category: 'CALORIE', categoryIcon: '🔥', title: 'Nutrition Tracker Pro', icon: '📊', condition: '25,000 kcal logged', reward: 900, getProgress: (s) => ({ current: Math.round(s.total_calories), target: 25000 }) },
  // PROTEIN
  { id: 'protein_100', category: 'PROTEIN', categoryIcon: '🍗', title: 'Protein Starter', icon: '💪', condition: '100g total protein consumed', reward: 100, getProgress: (s) => ({ current: Math.round(s.total_protein), target: 100 }) },
  { id: 'protein_1k', category: 'PROTEIN', categoryIcon: '🍗', title: 'Muscle Builder', icon: '🏋️', condition: '1000g total protein consumed', reward: 500, getProgress: (s) => ({ current: Math.round(s.total_protein), target: 1000 }) },
  { id: 'protein_5k', category: 'PROTEIN', categoryIcon: '🍗', title: 'Iron Chef Physique', icon: '🔥', condition: '5000g total protein consumed', reward: 1500, getProgress: (s) => ({ current: Math.round(s.total_protein), target: 5000 }) },
  // SUGAR
  { id: 'sugar_5', category: 'SUGAR', categoryIcon: '🍬', title: 'Sweet Control', icon: '🍎', condition: '5 meals with less than 10g of sugar', reward: 150, getProgress: (s) => ({ current: s.low_sugar_meals_count, target: 5 }) },
  { id: 'sugar_25', category: 'SUGAR', categoryIcon: '🍬', title: 'Sugar Slayer', icon: '⚡', condition: '25 meals with less than 10g of sugar', reward: 600, getProgress: (s) => ({ current: s.low_sugar_meals_count, target: 25 }) },
  { id: 'sugar_75', category: 'SUGAR', categoryIcon: '🍬', title: 'Candy Crusher', icon: '🍭', condition: '75 meals with less than 10g of sugar', reward: 1500, getProgress: (s) => ({ current: s.low_sugar_meals_count, target: 75 }) },
  // FIBER
  { id: 'fiber_100', category: 'FIBER', categoryIcon: '🌾', title: 'Gut Guardian', icon: '🌾', condition: '100g total fiber consumed', reward: 250, getProgress: (s) => ({ current: Math.round(s.total_fiber), target: 100 }) },
  { id: 'fiber_500', category: 'FIBER', categoryIcon: '🌾', title: 'Digestive Master', icon: '🧘', condition: '500g total fiber consumed', reward: 1000, getProgress: (s) => ({ current: Math.round(s.total_fiber), target: 500 }) },
  // STREAK
  { id: 'streak_3', category: 'STREAK', categoryIcon: '📅', title: 'First Habit', icon: '📆', condition: 'Log meals 3 days in a row', reward: 100, getProgress: (s) => ({ current: s.daily_log_streak, target: 3 }) },
  { id: 'streak_14', category: 'STREAK', categoryIcon: '📅', title: 'Routine Builder', icon: '⏳', condition: '14-day logging streak', reward: 700, getProgress: (s) => ({ current: s.daily_log_streak, target: 14 }) },
  { id: 'streak_30', category: 'STREAK', categoryIcon: '📅', title: 'Discipline Machine', icon: '🤖', condition: '30-day logging streak', reward: 2000, getProgress: (s) => ({ current: s.daily_log_streak, target: 30 }) },
  // VARIETY
  { id: 'variety_10', category: 'VARIETY', categoryIcon: '🥗', title: 'Curious Eater', icon: '🥕', condition: '10 unique detected food items', reward: 200, getProgress: (s) => ({ current: s.unique_food_items_count, target: 10 }) },
  { id: 'variety_30', category: 'VARIETY', categoryIcon: '🥗', title: 'Culinary Explorer', icon: '🍣', condition: '30 unique detected food items', reward: 800, getProgress: (s) => ({ current: s.unique_food_items_count, target: 30 }) },
  { id: 'variety_75', category: 'VARIETY', categoryIcon: '🥗', title: 'World Taster', icon: '🌎', condition: '75 unique detected food items', reward: 2000, getProgress: (s) => ({ current: s.unique_food_items_count, target: 75 }) },
  // BALANCE
  { id: 'balance_3', category: 'BALANCE', categoryIcon: '⚖️', title: 'Balanced Bite', icon: '⚖️', condition: '3 meals with ≥20g protein, ≥5g fiber, ≤15g sugar, ≤10g waste', reward: 200, getProgress: (s) => ({ current: s.balanced_meals_count, target: 3 }) },
  { id: 'balance_20', category: 'BALANCE', categoryIcon: '⚖️', title: 'Nutrition Knight', icon: '🛡', condition: '20 balanced meals', reward: 900, getProgress: (s) => ({ current: s.balanced_meals_count, target: 20 }) },
  // LOGGING
  { id: 'log_1', category: 'LOGGING', categoryIcon: '📷', title: 'First Entry', icon: '📝', condition: 'Log 1 meal', reward: 30, getProgress: (s) => ({ current: s.total_meals_logged, target: 1 }) },
  { id: 'log_25', category: 'LOGGING', categoryIcon: '📷', title: 'Getting Serious', icon: '📷', condition: 'Log 25 meals', reward: 300, getProgress: (s) => ({ current: s.total_meals_logged, target: 25 }) },
  { id: 'log_100', category: 'LOGGING', categoryIcon: '📷', title: 'Data Devourer', icon: '📈', condition: 'Log 100 meals', reward: 1500, getProgress: (s) => ({ current: s.total_meals_logged, target: 100 }) },
  // LEGENDARY
  { id: 'legend_zero_month', category: 'LEGENDARY', categoryIcon: '🏆', title: 'Zero Waste Month', icon: '🏆', condition: '30 consecutive zero-waste meals', reward: 1200, getProgress: (s) => ({ current: s.zero_waste_streak, target: 30 }) },
  { id: 'legend_ultimate', category: 'LEGENDARY', categoryIcon: '🏆', title: 'Ultimate Sustainability Master', icon: '👑', condition: '100 zero-waste meals, 30-day streak, 5000g protein, 75 unique foods', reward: 5000, getProgress: (s) => ({
    current: Math.min(
      s.zero_waste_meals_count >= 100 ? 1 : 0,
      s.daily_log_streak >= 30 ? 1 : 0,
      s.total_protein >= 5000 ? 1 : 0,
      s.unique_food_items_count >= 75 ? 1 : 0
    ) === 1 ? 1 : 0,
    target: 1
  }) },
]

// Fix legendary ultimate progress - composite of 4 criteria
const legendUltimateIdx = ACHIEVEMENT_DEFS.findIndex((a) => a.id === 'legend_ultimate')
ACHIEVEMENT_DEFS[legendUltimateIdx] = {
  ...ACHIEVEMENT_DEFS[legendUltimateIdx],
  getProgress: (s) => {
    const c1 = s.zero_waste_meals_count >= 100 ? 1 : 0
    const c2 = s.daily_log_streak >= 30 ? 1 : 0
    const c3 = s.total_protein >= 5000 ? 1 : 0
    const c4 = s.unique_food_items_count >= 75 ? 1 : 0
    return { current: c1 + c2 + c3 + c4, target: 4 }
  },
}

export { ACHIEVEMENT_DEFS }

export function getAchievementsByCategory(): Map<string, AchievementDef[]> {
  const map = new Map<string, AchievementDef[]>()
  for (const a of ACHIEVEMENT_DEFS) {
    const list = map.get(a.category) ?? []
    list.push(a)
    map.set(a.category, list)
  }
  return map
}

export async function getUnlockedAchievementIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)
  if (error) return new Set()
  return new Set((data ?? []).map((r) => r.achievement_id))
}

export async function checkAndAwardAchievements(
  userId: string,
  stats: UserStats
): Promise<{ awarded: AchievementDef[]; totalXpFromNew: number }> {
  const unlocked = await getUnlockedAchievementIds(userId)
  const awarded: AchievementDef[] = []
  let totalXpFromNew = 0

  for (const def of ACHIEVEMENT_DEFS) {
    if (unlocked.has(def.id)) continue
    const { current, target } = def.getProgress(stats)
    if (current >= target) {
      const { error } = await supabase.from('user_achievements').insert({
        user_id: userId,
        achievement_id: def.id,
        xp_awarded: def.reward,
      })
      if (!error) {
        awarded.push(def)
        totalXpFromNew += def.reward
        unlocked.add(def.id)
      }
    }
  }

  if (totalXpFromNew > 0) {
    const { data: row } = await supabase.from('user_stats').select('total_xp').eq('user_id', userId).single()
    const currentXp = (row?.total_xp ?? 0) as number
    await supabase.from('user_stats').update({
      total_xp: currentXp + totalXpFromNew,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId)
  }

  return { awarded, totalXpFromNew }
}
