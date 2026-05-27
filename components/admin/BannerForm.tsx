'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { BANNER_PLACEMENTS, BANNER_PLACEMENT_LABELS } from '@/lib/constants'
import type { Banner } from '@/types/database.types'

interface BannerFormProps {
  banner: Banner | null
  onSaved: (banner: Banner) => void
  onCancel: () => void
}

export default function BannerForm({ banner, onSaved, onCancel }: BannerFormProps) {
  const [displayMode, setDisplayMode] = useState<'image_only' | 'image_text'>(
    banner?.display_mode || 'image_text'
  )
  const [title, setTitle] = useState(banner?.title || '')
  const [description, setDescription] = useState(banner?.description || '')
  const [imageUrl, setImageUrl] = useState(banner?.image_url || '')
  const [linkUrl, setLinkUrl] = useState(banner?.link_url || '')
  const [placement, setPlacement] = useState(banner?.placement || 'home_top')
  const [isActive, setIsActive] = useState(banner?.is_active ?? true)
  const [startDate, setStartDate] = useState(
    banner?.start_date ? banner.start_date.slice(0, 10) : new Date().toISOString().slice(0, 10)
  )
  const [endDate, setEndDate] = useState(
    banner?.end_date ? banner.end_date.slice(0, 10) : ''
  )
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imagenes')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar 5MB')
      return
    }

    setUploading(true)
    setPreviewUrl(URL.createObjectURL(file))

    try {
      const supabase = createClient()
      const ext = file.name.split('.').pop()
      const fileName = `banners/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('business-images')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('business-images')
        .getPublicUrl(fileName)

      setImageUrl(publicUrl)
      toast.success('Imagen subida')
    } catch (err: any) {
      toast.error('Error al subir imagen: ' + err.message)
      setPreviewUrl('')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !imageUrl) {
      toast.error('Titulo e imagen son requeridos')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        description: displayMode === 'image_text' ? (description.trim() || null) : null,
        display_mode: displayMode,
        image_url: imageUrl,
        link_url: linkUrl.trim() || null,
        placement,
        is_active: isActive,
        start_date: new Date(startDate).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
      }

      const url = banner ? `/api/admin/banners/${banner.id}` : '/api/admin/banners'
      const method = banner ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al guardar')
      }

      const saved = await res.json()
      toast.success(banner ? 'Banner actualizado' : 'Banner creado')
      onSaved(saved)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const displayImage = previewUrl || imageUrl

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Display Mode Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de banner</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDisplayMode('image_only')}
            className={`relative p-3 rounded-xl border-2 transition-all text-left ${
              displayMode === 'image_only'
                ? 'border-[#FF6B35] bg-[rgba(255,107,53,0.05)] ring-1 ring-[rgba(255,107,53,0.2)]'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {displayMode === 'image_only' && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-[#FF6B35] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="w-full h-8 bg-gray-200 rounded mb-2"></div>
            <p className="text-xs font-semibold text-[#1F2937]">Solo Imagen</p>
            <p className="text-[10px] text-gray-400">Imagen completa como anuncio</p>
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode('image_text')}
            className={`relative p-3 rounded-xl border-2 transition-all text-left ${
              displayMode === 'image_text'
                ? 'border-[#FF6B35] bg-[rgba(255,107,53,0.05)] ring-1 ring-[rgba(255,107,53,0.2)]'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {displayMode === 'image_text' && (
              <div className="absolute top-2 right-2 w-5 h-5 bg-[#FF6B35] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            <div className="flex gap-1.5 mb-2">
              <div className="w-8 h-8 bg-gray-200 rounded flex-shrink-0"></div>
              <div className="flex-1 space-y-1">
                <div className="h-2.5 bg-gray-200 rounded w-full"></div>
                <div className="h-2 bg-gray-100 rounded w-3/4"></div>
              </div>
            </div>
            <p className="text-xs font-semibold text-[#1F2937]">Imagen + Texto</p>
            <p className="text-[10px] text-gray-400">Foto con titulo y descripcion</p>
          </button>
        </div>
      </div>

      {/* Resolution Guide */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
        <p className="text-xs font-semibold text-blue-700 mb-1">Resolucion recomendada</p>
        {displayMode === 'image_only' ? (
          <div className="text-xs text-blue-600 space-y-0.5">
            <p><strong>1200 x 300 px</strong> (horizontal, 4:1) para escritorio</p>
            <p><strong>800 x 200 px</strong> minimo para que se vea bien en celular</p>
            <p className="text-blue-400">Formatos: JPG, PNG o WebP. Max 5MB.</p>
          </div>
        ) : (
          <div className="text-xs text-blue-600 space-y-0.5">
            <p><strong>600 x 600 px</strong> o <strong>600 x 400 px</strong> (cuadrada o 3:2)</p>
            <p>La imagen se muestra al lado del texto en escritorio</p>
            <p className="text-blue-400">Formatos: JPG, PNG o WebP. Max 5MB.</p>
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {displayMode === 'image_only' ? 'Titulo (solo admin, no se muestra)' : 'Titulo del anuncio'}
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value.slice(0, 60))}
          maxLength={60}
          placeholder={displayMode === 'image_only' ? 'Ej: Banner Devogatec Marzo' : 'Ej: Devogatec - Desarrollo Web'}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(255,107,53,0.3)] text-sm"
          required
        />
        <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/60</p>
      </div>

      {/* Description - only for image_text mode */}
      {displayMode === 'image_text' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripcion</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value.slice(0, 120))}
            maxLength={120}
            placeholder="Ej: Creamos tu pagina web, app o tienda en linea. Cotiza gratis."
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(255,107,53,0.3)] text-sm resize-none"
          />
          <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/120</p>
        </div>
      )}

      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Imagen</label>
        {displayImage && (
          <div className={`relative rounded-lg overflow-hidden mb-2 bg-gray-100 ${
            displayMode === 'image_only' ? 'w-full h-24' : 'w-32 h-32'
          }`}>
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <Image src={displayImage} alt="Banner" fill sizes="400px" className="object-cover" />
            )}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[rgba(255,107,53,0.1)] file:text-[#FF6B35] hover:file:bg-[rgba(255,107,53,0.2)]"
        />
        {uploading && <p className="text-xs text-gray-400 mt-1">Subiendo imagen...</p>}
      </div>

      {/* Link URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">URL de destino (opcional)</label>
        <input
          type="url"
          value={linkUrl}
          onChange={e => setLinkUrl(e.target.value)}
          placeholder="https://ejemplo.com"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(255,107,53,0.3)] text-sm"
        />
      </div>

      {/* Placement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ubicacion</label>
        <select
          value={placement}
          onChange={e => setPlacement(e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(255,107,53,0.3)] text-sm"
        >
          {BANNER_PLACEMENTS.map(p => (
            <option key={p} value={p}>{BANNER_PLACEMENT_LABELS[p]}</option>
          ))}
        </select>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha inicio</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(255,107,53,0.3)] text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha fin (opcional)</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(255,107,53,0.3)] text-sm"
          />
        </div>
      </div>

      {/* Active Toggle */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isActive}
          onChange={e => setIsActive(e.target.checked)}
          className="w-4 h-4 text-[#FF6B35] rounded border-gray-300 focus:ring-[#FF6B35]"
        />
        <span className="text-sm text-gray-700">Banner activo</span>
      </label>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || uploading}
          className="flex-1 px-4 py-2.5 bg-[#FF6B35] text-white rounded-lg hover:bg-[#E2541F] transition-colors font-medium text-sm disabled:opacity-50"
        >
          {saving ? 'Guardando...' : banner ? 'Guardar Cambios' : 'Crear Banner'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm text-gray-600"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
