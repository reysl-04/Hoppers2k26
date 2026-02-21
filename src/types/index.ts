export interface UserProfile {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  description: string
  total_exp: number
  level: number
  daily_calorie_limit: number
  created_at: string
  updated_at: string
}

export interface FoodAnalysis {
  id: string
  user_id: string
  image_url: string
  food_items: FoodItem[]
  total_calories: number
  waste_detected: boolean
  exp_earned: number
  created_at: string
}

export interface FoodItem {
  name: string
  calories: number
  quantity: string
  nutrients?: Record<string, number>
}

export interface HistoryEntry {
  id: string
  user_id: string
  date: string
  analyses: FoodAnalysis[]
  total_calories: number
  within_limit: boolean
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked_at: string | null
  progress: number
  target: number
}
