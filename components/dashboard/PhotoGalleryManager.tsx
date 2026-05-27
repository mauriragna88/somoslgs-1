'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { optimizeImage, IMAGE_PRESETS } from '@/lib/image-utils'
import type { BusinessPhoto } from '@/lib/supabase/database.types'

interface PhotoGalleryManagerProps {
  businessId: string
  initialPhotos: BusinessPhoto[]
  photoLimit: number
  subscriptionTier: string
}

interface UploadingPhoto {
  id: string
  preview: string
  file: File
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB (before optimization)

export default function PhotoGalleryManager({
  businessId,
  initialPhotos,
  photoLimit,
  subscriptionTier,
}: PhotoGalleryManagerProps) {
  const [photos, setPhotos] = useState<BusinessPhoto[]>(initialPhotos)
  const [uploading, setUploading] = useState<UploadingPhoto[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentCount = photos.length + uploading.length
  const canAddMore = currentCount < photoLimit

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    setSuccess(null)
    const files = e.target.files
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)

    // Check total limit
    if (photos.length + uploading.length + fileArray.length > photoLimit) {
      setError(`Solo puedes agregar ${photoLimit - photos.length - uploading.length} foto(s) mas (limite del plan ${subscriptionTier})`)
      if (inputRef.current) inputRef.current.value = ''
      return
    }

    // Validate each file
    for (const file of fileArray) {
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten imagenes')
        if (inputRef.current) inputRef.current.value = ''
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" excede el limite de 15MB`)
        if (inputRef.current) inputRef.current.value = ''
        return
      }
    }

    // Create previews and start uploading
    const newUploading: UploadingPhoto[] = fileArray.map((file) => ({
      id: `upload-${Date.now()}-${Math.random().toString(36).substring(2)}`,
      preview: URL.createObjectURL(file),
      file,
    }))

    setUploading((prev) => [...prev, ...newUploading])
    if (inputRef.current) inputRef.current.value = ''

    // Upload each file
    for (const item of newUploading) {
      await uploadPhoto(item)
    }
  }

  const uploadPhoto = async (item: UploadingPhoto) => {
    try {
      // Optimize image before uploading
      const optimized = await optimizeImage(item.file, IMAGE_PRESETS.gallery)

      const supabase = createClient()

      // Generate unique path
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.jpg`
      const storagePath = `gallery/${businessId}/${fileName}`

      // Upload optimized file to storage
      const { error: uploadError } = await supabase.storage
        .from('business-images')
        .upload(storagePath, optimized, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('business-images')
        .getPublicUrl(storagePath)

      // Save record via API
      const response = await fetch(`/api/businesses/${businessId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: publicUrl,
          storage_path: storagePath,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al guardar la foto')
      }

      const { photo } = await response.json()

      // Replace uploading item with saved photo
      setPhotos((prev) => [...prev, photo])
      setSuccess('Foto guardada correctamente')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al subir la imagen')
    } finally {
      // Remove from uploading list & revoke blob URL
      setUploading((prev) => {
        const filtered = prev.filter((u) => u.id !== item.id)
        URL.revokeObjectURL(item.preview)
        return filtered
      })
    }
  }

  const handleDelete = async (photo: BusinessPhoto) => {
    if (deletingId) return
    setError(null)
    setSuccess(null)
    setDeletingId(photo.id)

    try {
      const response = await fetch(`/api/businesses/${businessId}/photos/${photo.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al eliminar')
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photo.id))
      setSuccess('Foto eliminada')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la foto')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-700">Galeria de Fotos</h4>
          <p className="text-xs text-gray-500">
            Muestra fotos de tu establecimiento a tus clientes
          </p>
        </div>
        <span className={`text-sm font-medium ${
          currentCount >= photoLimit ? 'text-red-600' : 'text-gray-500'
        }`}>
          {photos.length}/{photoLimit} fotos
        </span>
      </div>

      {error && (
        <div className="p-2 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {success && (
        <div className="p-2 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {/* Existing photos */}
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
          >
            <img
              src={photo.image_url}
              alt=""
              className="w-full h-full object-cover"
            />
            {/* Delete button - small corner button on mobile, full overlay on desktop hover */}
            <button
              type="button"
              onClick={() => handleDelete(photo)}
              disabled={deletingId === photo.id}
              className="absolute top-1 right-1 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 disabled:opacity-50 shadow-md md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
              title="Eliminar foto"
            >
              {deletingId === photo.id ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        ))}

        {/* Uploading photos (blob previews) */}
        {uploading.map((item) => (
          <div
            key={item.id}
            className="relative aspect-square rounded-lg overflow-hidden bg-gray-100"
          >
            <img
              src={item.preview}
              alt=""
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ))}

        {/* Add button */}
        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading.length > 0}
            className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-[#FF6B35] hover:bg-[rgba(255,107,53,0.05)] transition-colors flex flex-col items-center justify-center text-gray-400 hover:text-[#FF6B35] disabled:opacity-50"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-xs mt-1">Agregar</span>
          </button>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFilesSelect}
        className="hidden"
      />

      <p className="text-xs text-gray-400">
        Se optimizan automaticamente. Plan {subscriptionTier}: hasta {photoLimit} fotos.
      </p>
    </div>
  )
}
