/**
 * Client-side image optimization using Canvas API.
 * Resizes and compresses images before uploading to Supabase Storage.
 */

interface OptimizeOptions {
  /** Max width in pixels */
  maxWidth: number
  /** Max height in pixels */
  maxHeight: number
  /** JPEG quality 0-1 (default 0.85) */
  quality?: number
}

/** Preset configurations for different upload types */
export const IMAGE_PRESETS = {
  logo: { maxWidth: 400, maxHeight: 400, quality: 0.85 },
  cover: { maxWidth: 1920, maxHeight: 640, quality: 0.85 },
  product: { maxWidth: 800, maxHeight: 800, quality: 0.85 },
  gallery: { maxWidth: 1200, maxHeight: 1200, quality: 0.85 },
  banner: { maxWidth: 1200, maxHeight: 600, quality: 0.85 },
  marketplace: { maxWidth: 1024, maxHeight: 1024, quality: 0.85 },
} as const

/**
 * Optimizes an image file: resizes to fit within maxWidth/maxHeight
 * while maintaining aspect ratio, then compresses as JPEG.
 * Returns a new File object ready for upload.
 */
export async function optimizeImage(
  file: File,
  options: OptimizeOptions
): Promise<File> {
  const { maxWidth, maxHeight, quality = 0.85 } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img

      // Only resize if image exceeds max dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('No se pudo crear el contexto de canvas'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Error al comprimir la imagen'))
            return
          }

          // Create a new File with .jpg extension
          const optimizedFile = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '.jpg'),
            { type: 'image/jpeg' }
          )
          resolve(optimizedFile)
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('Error al cargar la imagen'))

    // Read file as data URL to load into Image
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Error al leer el archivo'))
    reader.readAsDataURL(file)
  })
}
