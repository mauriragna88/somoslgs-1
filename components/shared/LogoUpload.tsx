'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { optimizeImage, IMAGE_PRESETS } from '@/lib/image-utils'

interface LogoUploadProps {
  currentLogo?: string | null
  /** API endpoint to save logo_url immediately (e.g. /api/businesses/123) */
  saveEndpoint?: string
  onUpload: (url: string) => void
  onRemove?: () => void
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-20 h-20',
  md: 'w-32 h-32',
  lg: 'w-40 h-40',
}

export default function LogoUpload({
  currentLogo,
  saveEndpoint,
  onUpload,
  onRemove,
  size = 'md',
}: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentLogo || null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Keep latest callback in ref so async code always calls the current version
  const onUploadRef = useRef(onUpload)
  useEffect(() => {
    onUploadRef.current = onUpload
  }, [onUpload])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen valida (JPG, PNG, GIF)')
      return
    }

    // Validate file size (max 15MB before optimization)
    if (file.size > 15 * 1024 * 1024) {
      setError('La imagen debe ser menor a 15MB')
      return
    }

    // Show preview immediately
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to Supabase
    try {
      setUploading(true)

      // Optimize image before uploading
      const optimized = await optimizeImage(file, IMAGE_PRESETS.logo)

      const supabase = createClient()

      // Generate unique filename
      const fileName = `logo-${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`
      const filePath = `logos/${fileName}`

      // Upload optimized file
      const { error: uploadError } = await supabase.storage
        .from('business-images')
        .upload(filePath, optimized, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-images')
        .getPublicUrl(filePath)

      // Update parent state using ref (always latest callback)
      onUploadRef.current(publicUrl)
      setPreview(publicUrl)

      // If saveEndpoint is provided, save logo_url directly to DB
      // This ensures the logo persists even if the form isn't submitted
      if (saveEndpoint) {
        await fetch(saveEndpoint, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ logo_url: publicUrl }),
        })
      }
    } catch (err: any) {
      console.error('Error uploading logo:', err)
      setError('Error al subir la imagen. Intenta de nuevo.')
      setPreview(currentLogo || null)
    } finally {
      setUploading(false)
      // Reset input
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleRemove = async () => {
    setPreview(null)
    onRemove?.()
    if (inputRef.current) {
      inputRef.current.value = ''
    }
    // Also remove from DB immediately
    if (saveEndpoint) {
      await fetch(saveEndpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: '' }),
      })
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div
          className={`${sizeClasses[size]} rounded-xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center relative group`}
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Logo"
                className="w-full h-full object-cover"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                  title="Cambiar"
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
                    title="Eliminar"
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
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span className="text-xs">Subir logo</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-sm text-gray-500">
          <p className="font-medium text-gray-700">Logo del negocio</p>
          <p>JPG, PNG o GIF</p>
          <p>Se optimiza automaticamente</p>
        </div>
      </div>

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Uploading indicator */}
      {uploading && (
        <p className="text-sm text-primary">Subiendo imagen...</p>
      )}
    </div>
  )
}
