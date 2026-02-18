'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ImageUploadProps {
  onUploadComplete: (url: string) => void
  currentImage?: string
}

export default function ImageUpload({ onUploadComplete, currentImage }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(currentImage || '')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona una imagen válida')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB')
      return
    }

    try {
      setUploading(true)
      const supabase = createClient()

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('business-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-images')
        .getPublicUrl(filePath)

      setPreview(publicUrl)
      onUploadComplete(publicUrl)
    } catch (err) {
      console.error('Error uploading image:', err)
      setError('Error al subir la imagen. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Imagen del Producto
      </label>

      {preview && (
        <div className="mb-4">
          <img
            src={preview}
            alt="Preview"
            className="w-full max-w-xs h-48 object-cover rounded-lg"
          />
        </div>
      )}

      <div className="flex items-center gap-4">
        <label className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span className="text-sm font-medium">
            {uploading ? 'Subiendo...' : preview ? 'Cambiar imagen' : 'Subir imagen'}
          </span>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>

        {preview && (
          <button
            type="button"
            onClick={() => {
              setPreview('')
              onUploadComplete('')
            }}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Eliminar
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-2">{error}</p>
      )}

      <p className="text-xs text-gray-500 mt-2">
        PNG, JPG o WEBP (máx. 5MB)
      </p>
    </div>
  )
}
