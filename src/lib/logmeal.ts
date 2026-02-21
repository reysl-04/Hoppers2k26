/**
 * LogMeal Food Recognition API
 * Docs: https://docs.logmeal.com/docs/guides-getting-started-quickstart
 *
 * Add your API key to .env as VITE_LOGMEAL_API_KEY
 * Get your token from: https://logmeal.com (APIUser token)
 *
 * Note: If you get CORS errors when calling from the browser, you'll need
 * a backend proxy to forward requests to LogMeal.
 */

const LOGMEAL_BASE = 'https://api.logmeal.com'

function getApiKey(): string {
  const key = import.meta.env.VITE_LOGMEAL_API_KEY
  if (!key) {
    throw new Error('VITE_LOGMEAL_API_KEY is not set. Add it to your .env file.')
  }
  return key
}

export interface LogMealNutrient {
  label: string
  quantity: number
  unit: string
}

export interface LogMealNutritionalInfo {
  calories: number
  totalNutrients: Record<string, LogMealNutrient>
}

export interface LogMealFoodItem {
  food_item_position: number
  id: number
  name?: string
  hasNutritionalInfo: boolean
  nutritional_info?: {
    calories: number
    totalNutrients: Record<string, LogMealNutrient>
  }
}

export interface LogMealNutritionResponse {
  imageId: number
  foodName: string | string[]
  hasNutritionalInfo: boolean
  ids: number | number[] | null
  nutritional_info?: LogMealNutritionalInfo
  nutritional_info_per_item?: LogMealFoodItem[]
}

export interface LogMealSegmentationResult {
  imageId: number
  segmentation_results?: Array<{
    food_item_position: number
    recognition_results: Array<{
      id: number
      name: string
      prob: number
    }>
  }>
}

/**
 * Step 1: Upload image and get segmentation + dish recognition
 */
export async function segmentImage(imageFile: File): Promise<LogMealSegmentationResult> {
  const formData = new FormData()
  formData.append('image', imageFile)

  const res = await fetch(`${LOGMEAL_BASE}/v2/image/segmentation/complete`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `LogMeal API error: ${res.status}`)
  }

  return res.json()
}

/**
 * Step 2: Get nutritional information for the recognized image
 * Uses top predictions if dishes weren't explicitly confirmed
 */
export async function getNutritionalInfo(imageId: number): Promise<LogMealNutritionResponse> {
  const res = await fetch(`${LOGMEAL_BASE}/v2/nutrition/recipe/nutritionalInfo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({ imageId }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? `LogMeal API error: ${res.status}`)
  }

  return res.json()
}

/**
 * Full flow: segment image, then fetch nutrition
 */
export async function analyzeFoodImage(
  imageFile: File
): Promise<LogMealNutritionResponse> {
  const segmentation = await segmentImage(imageFile)
  return getNutritionalInfo(segmentation.imageId)
}
