'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { optimizeImage, IMAGE_PRESETS } from '@/lib/image-utils'

interface CoverUploadProps {
  currentCover?: string | null
  saveEndpoint?: string
  onUpload: (url: string) => void
  onRemove?: () => void
}

export default function CoverUpload({
  currentCover,
  saveEndpoint,
  onUpload,
  onRemove,
}: CoverUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentCover || null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onUploadRef = useRef(onUpload)
  useEffect(() => {
    onUploadRef.current = onUpload
  }, [onUpload])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida (JPG, PNG, GIF)')
      return
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('La imagen debe ser menor a 15MB')
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    try {
      setUploading(true)

      // Optimize image before uploading
      const optimized = await optimizeImage(file, IMAGE_PRESETS.cover)

      const supabase = createClient()

      const fileName = `cover-${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`
      const filePath = `covers/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('business-images')
        .upload(filePath, optimized, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('business-images')
        .getPublicUrl(filePath)

      onUploadRef.current(publicUrl)
      setPreview(publicUrl)

      if (saveEndpoint) {
        await fetch(saveEndpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cover_url: publicUrl }),
        })
      }
    } catch (err: any) {
      console.error('Error uploading cover:', err)
      setError('Error al subir la imagen. Intenta de nuevo.')
      setPreview(currentCover || null)
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleRemove = async () => {
    setPreview(null)
    onRemove?.()
    if (inputRef.current) inputRef.current.value = ''
    if (saveEndpoint) {
      await fetch(saveEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_url: '' }),
      })
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">Imagen de Portada</p>
      <div className="relative w-full aspect-[3/1] rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 group">
        {preview ? (
          <>
            <img
              src={preview}
              alt="Portada"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                title="Cambiar portada"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              {onRemove && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={uploading}
                  className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                  title="Eliminar portada"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          >
            {uploading ? (
              <div className="w-8 h-8 border-2 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm">Subir imagen de portada</span>
                <span className="text-xs text-gray-400 mt-1">Se optimiza automaticamente</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
      {uploading && <p className="text-sm" style={{ color: 'var(--coral)' }}>Subiendo imagen...</p>}
    </div>
  )
}
