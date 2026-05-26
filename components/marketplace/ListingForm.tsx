'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  MARKETPLACE_CONDITIONS,
  MARKETPLACE_PRICE_TYPES,
  MARKETPLACE_PHOTO_LIMIT,
  MARKETPLACE_FEATURED_PRICE,
  BANNED_WORDS,
} from '@/lib/constants'
import { optimizeImage, IMAGE_PRESETS } from '@/lib/image-utils'
import type { MarketplaceCategory, MarketplaceListing } from '@/types/database.types'

interface ListingFormProps {
  categories: MarketplaceCategory[]
  listing?: MarketplaceListing | null
  userWhatsapp?: string | null
  photoLimit?: number
}

function normalizeText(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function clientModerate(title: string, description: string): string | null {
  const combined = normalizeText(`${title} ${description}`)
  const words = combined.split(/\s+/)
  for (const banned of BANNED_WORDS) {
    const norm = normalizeText(banned)
    if (words.some(w => w === norm || w.includes(norm))) {
      return `Tu publicación contiene una palabra no permitida: "${banned}"`
    }
  }
  return null
}

export default function ListingForm({ categories, listing, userWhatsapp, photoLimit }: ListingFormProps) {
  const maxPhotos = photoLimit ?? MARKETPLACE_PHOTO_LIMIT
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditing = !!listing

  const [title, setTitle] = useState(listing?.title || '')
  const [description, setDescription] = useState(listing?.description || '')
  const [price, setPrice] = useState(listing?.price?.toString() || '')
  const [priceType, setPriceType] = useState(listing?.price_type || 'fijo')
  const [condition, setCondition] = useState(listing?.condition || 'usado')
  const [categoryId, setCategoryId] = useState(listing?.category_id || '')
  const [location, setLocation] = useState(listing?.location || '')
  const [whatsapp, setWhatsapp] = useState(listing?.whatsapp || userWhatsapp || '')
  const [images, setImages] = useState<string[]>(listing?.images || [])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remaining = maxPhotos - images.length
    if (remaining <= 0) {
      setError(`Máximo ${maxPhotos} fotos`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remaining)
    setUploading(true)
    setError('')

    try {
      for (const file of filesToUpload) {
        const optimized = await optimizeImage(file, IMAGE_PRESETS.marketplace)
        const formData = new FormData()
        formData.append('file', optimized)

        const res = await fetch('/api/marketplace/upload', {
          method: 'POST',
          body: formData,
        })

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Error al subir imagen')
        }

        const { url } = await res.json()
        setImages(prev => [...prev, url])
      }
    } catch (err: any) {
      setError(err.message || 'Error al subir imagen')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Client-side moderation
    const moderationError = clientModerate(title, description)
    if (moderationError) {
      setError(moderationError)
      return
    }

    if (title.trim().length < 5) {
      setError('El título debe tener al menos 5 caracteres')
      return
    }

    if (description.trim().length < 10) {
      setError('La descripción debe tener al menos 10 caracteres')
      return
    }

    if (!whatsapp || whatsapp.trim().length < 10) {
      setError('Ingresa un número de WhatsApp válido')
      return
    }

    const priceNum = priceType === 'gratis' ? 0 : parseFloat(price || '0')
    if (priceType !== 'gratis' && priceType !== 'intercambio' && priceNum <= 0) {
      setError('Ingresa un precio válido')
      return
    }

    setSaving(true)

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        price_type: priceType,
        condition,
        category_id: categoryId || null,
        images,
        location: location.trim() || null,
        whatsapp: whatsapp.trim(),
      }

      const url = isEditing ? `/api/marketplace/${listing!.id}` : '/api/marketplace'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al guardar')
        return
      }

      router.push('/marketplace/mis-articulos')
      router.refresh()
    } catch {
      setError('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {/* Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800 font-medium mb-1">Artículos prohibidos</p>
        <p className="text-xs text-amber-700">
          No se permiten armas, drogas, contenido para adultos, productos falsificados, documentos falsos ni productos robados.
          Las publicaciones que incumplan serán eliminadas.
        </p>
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-semibold text-[#1F2937] mb-2">
          Fotos ({images.length}/{maxPhotos})
        </label>
        <div className="grid grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div key={idx} className="aspect-square relative rounded-xl overflow-hidden border border-gray-200 group">
              <Image src={img} alt={`Foto ${idx + 1}`} fill sizes="120px" className="object-cover" />
              <button
                type="button"
                onClick={() => removeImage(idx)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Eliminar foto"
              >
                x
              </button>
              {idx === 0 && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                  Principal
                </div>
              )}
            </div>
          ))}
          {images.length < maxPhotos && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="aspect-square border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <span className="text-xs">Subiendo...</span>
              ) : (
                <>
                  <svg className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs">Agregar</span>
                </>
              )}
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />
        {maxPhotos < MARKETPLACE_PHOTO_LIMIT && (
          <p className="text-xs text-gray-400 mt-2">
            Sube hasta {maxPhotos} fotos. Con Destacado (${MARKETPLACE_FEATURED_PRICE}) sube hasta {MARKETPLACE_PHOTO_LIMIT}.
          </p>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-semibold text-[#1F2937] mb-1">Título *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="¿Qué estás vendiendo?"
          maxLength={100}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(255,107,53,0.3)] focus:border-[#FF6B35] transition-all"
        />
        <p className="text-xs text-gray-400 mt-1">{title.length}/100</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-[#1F2937] mb-1">Descripción *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe el artículo, su estado, marcas, medidas, etc."
          maxLength={1000}
          rows={4}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(255,107,53,0.3)] focus:border-[#FF6B35] transition-all resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{description.length}/1000</p>
      </div>

      {/* Price + Type */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-[#1F2937] mb-1">Tipo de precio</label>
          <select
            value={priceType}
            onChange={(e) => setPriceType(e.target.value as any)}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(255,107,53,0.3)] focus:border-[#FF6B35] transition-all"
          >
            {Object.entries(MARKETPLACE_PRICE_TYPES).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1F2937] mb-1">Precio (MXN)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            min="0"
            step="0.01"
            disabled={priceType === 'gratis' || priceType === 'intercambio'}
            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(255,107,53,0.3)] focus:border-[#FF6B35] transition-all disabled:opacity-50"
          />
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="block text-sm font-semibold text-[#1F2937] mb-1">Condición</label>
        <div className="flex gap-3">
          {Object.entries(MARKETPLACE_CONDITIONS).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCondition(key as any)}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl border-2 transition-all ${
                condition === key
                  ? 'border-[#FF6B35] bg-[rgba(255,107,53,0.1)] text-[#FF6B35]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-semibold text-[#1F2937] mb-1">Categoría</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(255,107,53,0.3)] focus:border-[#FF6B35] transition-all"
        >
          <option value="">Seleccionar categoría</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
          ))}
        </select>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-semibold text-[#1F2937] mb-1">Ubicación / Colonia</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ej: Centro, Col. Lomas..."
          maxLength={200}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(255,107,53,0.3)] focus:border-[#FF6B35] transition-all"
        />
      </div>

      {/* WhatsApp */}
      <div>
        <label className="block text-sm font-semibold text-[#1F2937] mb-1">WhatsApp *</label>
        <input
          type="tel"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="Ej: 4741234567"
          maxLength={20}
          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[rgba(255,107,53,0.3)] focus:border-[#FF6B35] transition-all"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={saving || uploading}
        className="w-full py-3.5 text-white font-bold rounded-xl transition-all hover:shadow-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, var(--coral), #E2541F)' }}
      >
        {saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Publicar artículo'}
      </button>
    </form>
  )
}
