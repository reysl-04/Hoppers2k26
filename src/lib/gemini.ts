/**
 * Gemini API for food image analysis and caption generation
 * Add VITE_GEMINI_API_KEY to .env - get key at https://aistudio.google.com/apikey
 */

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

function getApiKey(): string | null {
  return import.meta.env.VITE_GEMINI_API_KEY ?? null
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1] ?? '')
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export interface GeminiFoodAnalysis {
  caption: string
  calories?: number
  items?: Array<{ name: string; calories: number }>
  macros?: Record<string, { value: number; unit: string }>
}

/**
 * Analyze a food image with Gemini - returns caption and nutrition estimate
 */
export async function analyzeFoodWithGemini(imageFile: File): Promise<GeminiFoodAnalysis> {
  const key = getApiKey()
  if (!key) throw new Error('VITE_GEMINI_API_KEY not set')

  const base64 = await fileToBase64(imageFile)
  const mimeType = imageFile.type || 'image/jpeg'

  const res = await fetch(`${GEMINI_API}?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType, data: base64 } },
          {
            text: `Analyze this food image. Respond in JSON only, no markdown:
{
  "caption": "Short 3-5 word description of the main food (e.g. Grilled chicken salad)",
  "calories": estimated total calories,
  "items": [{"name": "food item", "calories": number}],
  "macros": {"protein": {"value": number, "unit": "g"}, "carbs": {"value": number, "unit": "g"}, "fat": {"value": number, "unit": "g"}}
}`
          },
        ],
      }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
      },
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `Gemini API error: ${res.status}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No response from Gemini')

  return JSON.parse(text) as GeminiFoodAnalysis
}

/**
 * Generate a short caption for a food image (for calendar display)
 */
export async function getFoodImageCaption(imageUrl: string): Promise<string> {
  const key = getApiKey()
  if (!key) return ''

  try {
    const res = await fetch(imageUrl)
    const blob = await res.blob()
    const file = new File([blob], 'food.jpg', { type: blob.type })
    const analysis = await analyzeFoodWithGemini(file)
    return analysis.caption || ''
  } catch {
    return ''
  }
}
