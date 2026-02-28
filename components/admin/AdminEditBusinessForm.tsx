'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import LogoUpload from '@/components/shared/LogoUpload'
import CoverUpload from '@/components/shared/CoverUpload'
import PhotoGalleryManager from '@/components/dashboard/PhotoGalleryManager'
import BusinessHoursEditor from '@/components/shared/BusinessHoursEditor'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/constants'
import type { BusinessHours } from '@/lib/constants'
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
  cover_url: string | null
  website: string | null
  facebook_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  latitude: number | null
  longitude: number | null
  is_active: boolean
  is_featured: boolean
  owner_id: string | null
  owner?: { id: string; full_name: string; email: string; phone: string | null } | null
  business_hours: BusinessHours | null
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
    cover_url: business.cover_url || '',
    website: business.website || '',
    facebook_url: business.facebook_url || '',
    instagram_url: business.instagram_url || '',
    tiktok_url: business.tiktok_url || '',
    latitude: business.latitude,
    longitude: business.longitude,
    is_active: business.is_active,
    is_featured: business.is_featured,
  })

  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    business.business_hours || DEFAULT_BUSINESS_HOURS
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/admin/businesses/${business.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, business_hours: businessHours }),
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
          saveEndpoint={`/api/admin/businesses/${business.id}`}
          onUpload={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
          onRemove={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
          size="lg"
        />
      </div>

      {/* Cover Upload */}
      <div className="pb-4 border-b border-gray-200">
        <CoverUpload
          currentCover={formData.cover_url || null}
          saveEndpoint={`/api/admin/businesses/${business.id}`}
          onUpload={(url) => setFormData(prev => ({ ...prev, cover_url: url }))}
          onRemove={() => setFormData(prev => ({ ...prev, cover_url: '' }))}
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
          onChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))}
        />
      </div>

      {/* Horarios de Atención */}
      <BusinessHoursEditor value={businessHours} onChange={setBusinessHours} />

      {/* Website y Redes Sociales */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Website y Redes Sociales
        </h4>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                Sitio Web
              </span>
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.tunegocio.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </span>
            </label>
            <input
              type="url"
              value={formData.facebook_url}
              onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
              placeholder="https://www.facebook.com/tunegocio"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4 text-[#E4405F]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z"/>
                </svg>
                Instagram
              </span>
            </label>
            <input
              type="url"
              value={formData.instagram_url}
              onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
              placeholder="https://www.instagram.com/tunegocio"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <span className="inline-flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
                TikTok
              </span>
            </label>
            <input
              type="url"
              value={formData.tiktok_url}
              onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
              placeholder="https://www.tiktok.com/@tunegocio"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
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
