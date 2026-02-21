'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import LogoUpload from '@/components/shared/LogoUpload'
import PhotoGalleryManager from '@/components/dashboard/PhotoGalleryManager'
import type { BusinessPhoto } from '@/lib/supabase/database.types'

const MapPicker = dynamic(() => import('@/components/maps/MapPicker'), { ssr: false })

interface Business {
  id: string
  name: string
  description: string | null
  phone: string
  whatsapp: string | null
  email: string | null
  address: string
  neighborhood: string | null
  category_id: string | null
  logo_url: string | null
  latitude: number | null
  longitude: number | null
  is_active: boolean
  is_featured: boolean
  owner_id: string | null
  owner?: { id: string; full_name: string; email: string; phone: string | null } | null
}

interface AdminEditBusinessFormProps {
  business: Business
  categories: Array<{ id: string; name: string }>
  photos?: BusinessPhoto[]
  onAssignOwner?: () => void
}

export default function AdminEditBusinessForm({ business, categories, photos = [], onAssignOwner }: AdminEditBusinessFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const messageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (message) {
      messageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (message.type === 'success') {
        const timer = setTimeout(() => setMessage(null), 4000)
        return () => clearTimeout(timer)
      }
    }
  }, [message])

  const [formData, setFormData] = useState({
    name: business.name,
    description: business.description || '',
    phone: business.phone,
    whatsapp: business.whatsapp || '',
    email: business.email || '',
    address: business.address,
    neighborhood: business.neighborhood || '',
    category_id: business.category_id || '',
    logo_url: business.logo_url || '',
    latitude: business.latitude,
    longitude: business.longitude,
    is_active: business.is_active,
    is_featured: business.is_featured,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/businesses/${business.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al actualizar')
      }

      setMessage({ type: 'success', text: 'Negocio actualizado correctamente' })
      router.refresh()
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <div
          ref={messageRef}
          className={`p-4 rounded-lg flex items-center gap-3 font-medium shadow-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Owner Info (read-only) */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Dueño del Negocio</h3>
        {business.owner ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Nombre:</span>
              <span className="ml-2 font-medium">{business.owner.full_name}</span>
            </div>
            <div>
              <span className="text-gray-500">Email:</span>
              <span className="ml-2 font-medium">{business.owner.email}</span>
            </div>
            {business.owner.phone && (
              <div>
                <span className="text-gray-500">Tel:</span>
                <span className="ml-2 font-medium">{business.owner.phone}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 text-sm font-semibold rounded-full bg-amber-100 text-amber-800">
              Sin dueño
            </span>
            {onAssignOwner && (
              <button
                type="button"
                onClick={onAssignOwner}
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-medium rounded-lg transition-colors"
              >
                Asignar Dueño
              </button>
            )}
          </div>
        )}
      </div>

      {/* Admin-only toggles */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-3">Configuración Admin</h3>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div>
              <span className="font-medium text-gray-900">Negocio Activo</span>
              <p className="text-xs text-gray-500">Visible en el directorio público</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_featured}
              onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
              className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />
            <div>
              <span className="font-medium text-gray-900">Destacado</span>
              <p className="text-xs text-gray-500">Aparece primero en búsquedas</p>
            </div>
          </label>
        </div>
      </div>

      {/* Logo Upload */}
      <div className="pb-4 border-b border-gray-200">
        <LogoUpload
          currentLogo={formData.logo_url || null}
          onUpload={(url) => setFormData({ ...formData, logo_url: url })}
          onRemove={() => setFormData({ ...formData, logo_url: '' })}
          size="lg"
        />
      </div>

      {/* Photo Gallery */}
      <div className="pb-4 border-b border-gray-200">
        <PhotoGalleryManager
          businessId={business.id}
          initialPhotos={photos}
          photoLimit={25}
          subscriptionTier="admin"
        />
      </div>

      {/* Business fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Negocio *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Categoría
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Sin categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
            maxLength={10}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp
          </label>
          <input
            type="tel"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            maxLength={10}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección *
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Colonia/Barrio
          </label>
          <input
            type="text"
            value={formData.neighborhood}
            onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Map */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ubicación en Mapa
        </label>
        <MapPicker
          latitude={formData.latitude}
          longitude={formData.longitude}
          onChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
        />
      </div>

      <div className="pt-4 flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>
    </form>
  )
}
