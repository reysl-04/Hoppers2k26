import { supabase } from './supabase'

const BUCKET = 'food-images'

export interface FoodAnalysis {
  id: string
  user_id: string
  created_at: string
  type: 'calorie' | 'before_after'
  image_url: string
  image_url_after: string | null
  calories: number
  calories_after: number | null
  calories_consumed: number | null
  food_waste_calories: number | null
  nutritional_data: Record<string, unknown> | null
  exp_earned: number
}

export interface SaveCalorieAnalysisParams {
  userId: string
  imageFile: File
  calories: number
  nutritionalData?: Record<string, unknown>
  expEarned?: number
}

export interface SaveBeforeAfterAnalysisParams {
  userId: string
  imageFileBefore: File
  imageFileAfter: File
  caloriesBefore: number
  caloriesAfter: number
  caloriesConsumed: number
  foodWasteCalories: number
  nutritionalData?: Record<string, unknown>
  expEarned?: number
}

async function uploadImage(userId: string, file: File, suffix: string): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${userId}/${crypto.randomUUID()}_${suffix}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    upsert: false,
  })

  if (error) throw new Error(`Failed to upload image: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}

export async function saveCalorieAnalysis(params: SaveCalorieAnalysisParams): Promise<FoodAnalysis> {
  const imageUrl = await uploadImage(params.userId, params.imageFile, 'main')

  const { data, error } = await supabase
    .from('food_analyses')
    .insert({
      user_id: params.userId,
      type: 'calorie',
      image_url: imageUrl,
      calories: params.calories,
      nutritional_data: params.nutritionalData ?? null,
      exp_earned: params.expEarned ?? 10,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to save: ${error.message}`)
  return data as FoodAnalysis
}

export async function saveBeforeAfterAnalysis(
  params: SaveBeforeAfterAnalysisParams
): Promise<FoodAnalysis> {
  const [imageUrl, imageUrlAfter] = await Promise.all([
    uploadImage(params.userId, params.imageFileBefore, 'before'),
    uploadImage(params.userId, params.imageFileAfter, 'after'),
  ])

  const { data, error } = await supabase
    .from('food_analyses')
    .insert({
      user_id: params.userId,
      type: 'before_after',
      image_url: imageUrl,
      image_url_after: imageUrlAfter,
      calories: params.caloriesBefore,
      calories_after: params.caloriesAfter,
      calories_consumed: params.caloriesConsumed,
      food_waste_calories: params.foodWasteCalories,
      nutritional_data: params.nutritionalData ?? null,
      exp_earned: params.expEarned ?? 20,
    })
    .select()
    .single()

  if (error) throw new Error(`Failed to save: ${error.message}`)
  return data as FoodAnalysis
}

export async function getAnalysesByDate(
  userId: string,
  dateStr: string
): Promise<FoodAnalysis[]> {
  const { data, error } = await supabase
    .from('food_analyses')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', `${dateStr}T00:00:00`)
    .lt('created_at', `${dateStr}T23:59:59.999`)
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch: ${error.message}`)
  return (data ?? []) as FoodAnalysis[]
}

export async function getAnalysesByMonth(
  userId: string,
  year: number,
  month: number
): Promise<Record<string, number>> {
  const start = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const endDate = new Date(year, month + 1, 0)
  const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`

  const { data, error } = await supabase
    .from('food_analyses')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', `${start}T00:00:00`)
    .lte('created_at', `${end}T23:59:59.999`)

  if (error) throw new Error(`Failed to fetch: ${error.message}`)

  const dates: Record<string, number> = {}
  for (const row of data ?? []) {
    const d = (row.created_at as string).slice(0, 10)
    dates[d] = (dates[d] ?? 0) + 1
  }
  return dates
}
