/**
 * Resize and compress images for LogMeal API (max 1MB, max 1000px per side)
 * @see https://docs.logmeal.com/docs/guides-essential-concepts-image-pre-processing
 */

const MAX_SIZE_BYTES = 1_048_576 // 1 MB
const MAX_SIDE_PX = 1000

export async function resizeForLogMeal(file: File): Promise<File> {
  const { img, url } = await loadImage(file)
  try {
    const scale = Math.min(1, MAX_SIDE_PX / Math.max(img.width, img.height))
    let w = Math.round(img.width * scale)
    let h = Math.round(img.height * scale)

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas not supported')

    let quality = 0.9
    let blob: Blob | null = null

    for (let i = 0; i < 20; i++) {
      canvas.width = w
      canvas.height = h
      ctx.drawImage(img, 0, 0, w, h)

      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', quality)
      })

      if (blob && blob.size < MAX_SIZE_BYTES) break

      quality -= 0.1
      if (quality < 0.3) {
        w = Math.max(100, Math.round(w * 0.85))
        h = Math.max(100, Math.round(h * 0.85))
        quality = 0.85
      }
    }

    if (!blob) throw new Error('Failed to compress image')

    const name = file.name.replace(/\.[^.]+$/, '.jpg')
    return new File([blob], name, { type: 'image/jpeg' })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(file: File): Promise<{ img: HTMLImageElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}
