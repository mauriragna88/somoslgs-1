'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import LogoUpload from '@/components/shared/LogoUpload'
import CoverUpload from '@/components/shared/CoverUpload'
import PhotoGalleryManager from '@/components/dashboard/PhotoGalleryManager'
import BusinessHoursEditor from '@/components/shared/BusinessHoursEditor'
import { DEFAULT_BUSINESS_HOURS, COVER_ENABLED_TIERS, SOCIAL_LINKS_TIERS, PRODUCTS_ENABLED_TIERS } from '@/lib/constants'
import type { BusinessHours } from '@/lib/constants'
import Link from 'next/link'

const MapPicker = dynamic(() => import('@/components/maps/MapPicker'), { ssr: false })
import type { BusinessPhoto } from '@/lib/supabase/database.types'

interface Business {
  id: string
  name: string
  description: string | null
  phone: string
  whatsapp: string | null
  email: string | null
  address: string
  latitude: number | null
  longitude: number | null
  category_id: string | null
  logo_url: string | null
  cover_url: string | null
  website: string | null
  facebook_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
  // Datos bancarios
  bank_name: string | null
  bank_account_holder: string | null
  bank_account_number: string | null
  bank_clabe: string | null
  // Tipo de negocio
  business_type: 'productos' | 'servicios' | 'ambos'
  // Configuración pagos con tarjeta
  payment_mode: 'platform' | 'direct' | null
  has_conekta_key: boolean
  has_mercadopago_key: boolean
  active_payment_gateways: string[]
  business_hours: BusinessHours | null
}

interface EditBusinessFormProps {
  business: Business
  categories: Array<{ id: string; name: string }>
  initialPhotos?: BusinessPhoto[]
  subscriptionTier?: string
  photoLimit?: number
}

export default function EditBusinessForm({ business, categories, initialPhotos, subscriptionTier, photoLimit }: EditBusinessFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const messageRef = useRef<HTMLDivElement>(null)

  // Scroll to message when it appears & auto-dismiss success after 4s
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
    latitude: business.latitude,
    longitude: business.longitude,
    category_id: business.category_id || '',
    logo_url: business.logo_url || '',
    cover_url: business.cover_url || '',
    website: business.website || '',
    facebook_url: business.facebook_url || '',
    instagram_url: business.instagram_url || '',
    tiktok_url: business.tiktok_url || '',
    // Tipo de negocio
    business_type: business.business_type || 'productos',
    // Datos bancarios
    bank_name: business.bank_name || '',
    bank_account_holder: business.bank_account_holder || '',
    bank_account_number: business.bank_account_number || '',
    bank_clabe: business.bank_clabe || '',
    // Pagos con tarjeta
    payment_mode: business.payment_mode || 'platform',
  })

  const [businessHours, setBusinessHours] = useState<BusinessHours>(
    business.business_hours || DEFAULT_BUSINESS_HOURS
  )

  const [conektaKey, setConektaKey] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [mercadoPagoKey, setMercadoPagoKey] = useState('')
  const [showMPKeyInput, setShowMPKeyInput] = useState(false)
  const [activeGateways, setActiveGateways] = useState<string[]>(business.active_payment_gateways || [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const submitData: Record<string, any> = { ...formData }
      submitData.active_payment_gateways = activeGateways
      submitData.business_hours = businessHours
      // Only send conekta key if user entered a new one
      if (conektaKey.trim()) {
        submitData.conekta_private_key = conektaKey.trim()
      }
      // If switching to platform, clear the business key
      if (formData.payment_mode === 'platform') {
        submitData.conekta_private_key = ''
      }
      // MercadoPago key
      if (mercadoPagoKey.trim()) {
        submitData.mercadopago_access_token = mercadoPagoKey.trim()
      }
      if (formData.payment_mode === 'platform') {
        submitData.mercadopago_access_token = ''
      }

      const response = await fetch(`/api/businesses/${business.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData),
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

  const tier = subscriptionTier || 'gratis'
  const canCover = COVER_ENABLED_TIERS.includes(tier)
  const canSocial = SOCIAL_LINKS_TIERS.includes(tier)
  const canPayments = PRODUCTS_ENABLED_TIERS.includes(tier)

  const LockedOverlay = ({ plan, dailyPrice, feature }: { plan: string; dailyPrice: string; feature: string }) => (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-[2px] rounded-lg">
      <div className="text-center px-4">
        <span className="text-3xl block mb-2">🔒</span>
        <p className="text-sm font-semibold text-gray-700">{feature}</p>
        <p className="text-xs text-gray-500 mt-1">Disponible desde el Plan <strong>{plan}</strong> por solo <span className="text-[#FF6B35] font-bold">{dailyPrice}</span></p>
        <Link href="/dashboard/suscripcion" className="inline-block mt-2 px-4 py-1.5 bg-[#FF6B35] hover:bg-[#E2541F] text-white text-xs font-semibold rounded-lg transition-colors">
          Ver planes
        </Link>
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {message && (
        <div
          ref={messageRef}
          className={`p-4 rounded-lg flex items-center gap-3 font-medium shadow-sm ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          {message.text}
        </div>
      )}

      {/* Logo Upload */}
      <div className="pb-4 border-b border-gray-200">
        <LogoUpload
          currentLogo={formData.logo_url || null}
          saveEndpoint={`/api/businesses/${business.id}`}
          onUpload={(url) => setFormData(prev => ({ ...prev, logo_url: url }))}
          onRemove={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
          size="lg"
        />
      </div>

      {/* Cover Upload */}
      <div className="pb-4 border-b border-gray-200 relative">
        {!canCover && <LockedOverlay plan="Emprendedor" dailyPrice="$2/dia" feature="Portada personalizada" />}
        <div className={!canCover ? 'opacity-40 pointer-events-none' : ''}>
          <CoverUpload
            currentCover={formData.cover_url || null}
            saveEndpoint={`/api/businesses/${business.id}`}
            onUpload={(url) => setFormData(prev => ({ ...prev, cover_url: url }))}
            onRemove={() => setFormData(prev => ({ ...prev, cover_url: '' }))}
          />
        </div>
      </div>

      {/* Photo Gallery */}
      {initialPhotos && photoLimit && subscriptionTier && (
        <div className="pb-4 border-b border-gray-200">
          <PhotoGalleryManager
            businessId={business.id}
            initialPhotos={initialPhotos}
            photoLimit={photoLimit}
            subscriptionTier={subscriptionTier}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre del Negocio
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
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
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
        />
      </div>

      {/* Tipo de negocio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de negocio
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'productos' as const, label: 'Productos', icon: '📦' },
            { value: 'servicios' as const, label: 'Servicios', icon: '🔧' },
            { value: 'ambos' as const, label: 'Ambos', icon: '📦🔧' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setFormData({ ...formData, business_type: option.value })}
              className={`p-3 border-2 rounded-xl text-center transition-all ${
                formData.business_type === option.value
                  ? 'border-[#FF6B35] bg-[rgba(255,107,53,0.05)] text-[#FF6B35]'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <span className="text-xl block mb-1">{option.icon}</span>
              <span className="text-xs font-medium">{option.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Teléfono
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp *
          </label>
          <input
            type="tel"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            required
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección
          </label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            required
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
      <div className="border-t border-gray-200 pt-6 mt-6 relative">
        {!canSocial && <LockedOverlay plan="Emprendedor" dailyPrice="$2/dia" feature="Redes sociales visibles" />}
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Website y Redes Sociales
        </h4>
        <p className="text-sm text-gray-500 mb-4">
          Agrega tu sitio web y perfiles de redes sociales para que tus clientes te encuentren.
        </p>
        <div className={!canSocial ? 'opacity-40 pointer-events-none' : ''}>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>
        </div>
        </div>
      </div>

      {/* Sección de Datos Bancarios */}
      <div className="border-t border-gray-200 pt-6 mt-6 relative">
        {!canPayments && <LockedOverlay plan="Pro" dailyPrice="$4/dia" feature="Datos bancarios para recibir pagos" />}
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Datos Bancarios para Recibir Pagos
        </h4>
        <p className="text-sm text-gray-500 mb-4">
          Estos datos se mostraran a tus clientes cuando elijan pagar por transferencia.
        </p>
        <div className={!canPayments ? 'opacity-40 pointer-events-none' : ''}>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banco
            </label>
            <input
              type="text"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              placeholder="Ej: BBVA, Santander, Banorte"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titular de la Cuenta
            </label>
            <input
              type="text"
              value={formData.bank_account_holder}
              onChange={(e) => setFormData({ ...formData, bank_account_holder: e.target.value })}
              placeholder="Nombre como aparece en el banco"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Cuenta/Tarjeta
            </label>
            <input
              type="text"
              value={formData.bank_account_number}
              onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
              placeholder="Número de cuenta o tarjeta"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CLABE Interbancaria
            </label>
            <input
              type="text"
              value={formData.bank_clabe}
              onChange={(e) => setFormData({ ...formData, bank_clabe: e.target.value.replace(/\D/g, '').slice(0, 18) })}
              placeholder="18 dígitos"
              maxLength={18}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF6B35]"
            />
            {formData.bank_clabe && formData.bank_clabe.length !== 18 && (
              <p className="text-xs text-red-500 mt-1">La CLABE debe tener 18 dígitos</p>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Sección de Pasarelas de Pago */}
      <div className="border-t border-gray-200 pt-6 mt-6 relative">
        {!canPayments && <LockedOverlay plan="Pro" dailyPrice="$4/dia" feature="Pasarelas de pago con tarjeta" />}
        <div className={!canPayments ? 'opacity-40 pointer-events-none' : ''}>
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          Pasarelas de Pago
        </h4>
        <p className="text-sm text-gray-500 mb-4">
          Selecciona las pasarelas de pago que quieres ofrecer a tus clientes.
        </p>

        <div className="flex gap-4 mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeGateways.includes('conekta')}
              onChange={(e) => {
                if (e.target.checked) {
                  setActiveGateways([...activeGateways, 'conekta'])
                } else {
                  setActiveGateways(activeGateways.filter(g => g !== 'conekta'))
                }
              }}
              className="w-4 h-4 text-[#FF6B35] rounded border-gray-300 focus:ring-[#FF6B35]"
            />
            <span className="text-sm font-medium text-gray-700">Conekta</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activeGateways.includes('mercadopago')}
              onChange={(e) => {
                if (e.target.checked) {
                  setActiveGateways([...activeGateways, 'mercadopago'])
                } else {
                  setActiveGateways(activeGateways.filter(g => g !== 'mercadopago'))
                }
              }}
              className="w-4 h-4 text-[#FF6B35] rounded border-gray-300 focus:ring-[#FF6B35]"
            />
            <span className="text-sm font-medium text-gray-700">Mercado Pago</span>
          </label>
        </div>

        <h5 className="text-md font-semibold text-gray-800 mb-2">
          Modo de Pago
        </h5>
        <p className="text-sm text-gray-500 mb-4">
          Elige como quieres recibir los pagos con tarjeta de tus clientes.
        </p>

        <div className="space-y-3">
          {/* Option 1: Platform managed */}
          <button
            type="button"
            onClick={() => {
              setFormData({ ...formData, payment_mode: 'platform' })
              setConektaKey('')
              setShowKeyInput(false)
            }}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              formData.payment_mode === 'platform'
                ? 'border-[#FF6B35] bg-[rgba(255,107,53,0.05)]'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center ${
                formData.payment_mode === 'platform' ? 'border-[#FF6B35]' : 'border-gray-300'
              }`}>
                {formData.payment_mode === 'platform' && (
                  <div className="w-3 h-3 rounded-full bg-[#FF6B35]" />
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900">SomosLagos gestiona mis pagos</p>
                <p className="text-sm text-gray-500 mt-1">
                  Recibe tus pagos en 24 horas. Comision del 1.5% por el servicio
                  (ademas de la comision de Conekta ~3%).
                </p>
                <div className="flex gap-3 mt-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Sin registro extra</span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Pago en 24hrs</span>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">1.5% comision</span>
                </div>
              </div>
            </div>
          </button>

          {/* Option 2: Direct / own account */}
          <button
            type="button"
            onClick={() => {
              setFormData({ ...formData, payment_mode: 'direct' })
              setShowKeyInput(!business.has_conekta_key)
            }}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              formData.payment_mode === 'direct'
                ? 'border-[#FF6B35] bg-[rgba(255,107,53,0.05)]'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center ${
                formData.payment_mode === 'direct' ? 'border-[#FF6B35]' : 'border-gray-300'
              }`}>
                {formData.payment_mode === 'direct' && (
                  <div className="w-3 h-3 rounded-full bg-[#FF6B35]" />
                )}
              </div>
              <div>
                <p className="font-bold text-gray-900">Usar mi propia cuenta de Conekta</p>
                <p className="text-sm text-gray-500 mt-1">
                  El dinero cae directo a tu cuenta. Sin comision de SomosLagos.
                  Necesitas crear tu cuenta en conekta.com.
                </p>
                <div className="flex gap-3 mt-2">
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">0% comision SomosLagos</span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Pago directo</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Conekta Key input for direct mode */}
        {formData.payment_mode === 'direct' && (
          <div className="mt-4 bg-purple-50 border border-purple-200 rounded-xl p-4">
            {business.has_conekta_key && !showKeyInput ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-800">API Key configurada</p>
                  <p className="text-xs text-purple-600 mt-1">Tu cuenta de Conekta esta conectada</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowKeyInput(true)}
                  className="text-sm text-purple-700 hover:text-purple-900 font-medium underline"
                >
                  Cambiar key
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-purple-800 mb-1">
                  API Key Privada de Conekta
                </label>
                <p className="text-xs text-purple-600 mb-3">
                  Encuéntrala en tu panel de Conekta → Desarrolladores → API Keys
                </p>
                <input
                  type="password"
                  value={conektaKey}
                  onChange={(e) => setConektaKey(e.target.value)}
                  placeholder="key_xxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {business.has_conekta_key && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowKeyInput(false)
                      setConektaKey('')
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800 mt-2"
                  >
                    Cancelar cambio
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Info about platform mode */}
        {formData.payment_mode === 'platform' && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              Con esta opcion, los pagos con tarjeta de tus clientes llegan a SomosLagos
              y te los transferimos en un maximo de 24 horas, menos el 1.5% de comision
              por el servicio.
            </p>
          </div>
        )}

        {/* MercadoPago Key input for direct mode */}
        {formData.payment_mode === 'direct' && activeGateways.includes('mercadopago') && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            {business.has_mercadopago_key && !showMPKeyInput ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">Access Token de MercadoPago configurado</p>
                  <p className="text-xs text-blue-600 mt-1">Tu cuenta de MercadoPago esta conectada</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMPKeyInput(true)}
                  className="text-sm text-blue-700 hover:text-blue-900 font-medium underline"
                >
                  Cambiar token
                </button>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-blue-800 mb-1">
                  Access Token de MercadoPago
                </label>
                <p className="text-xs text-blue-600 mb-3">
                  Encuentralo en tu panel de MercadoPago → Integraciones → Credenciales
                </p>
                <input
                  type="password"
                  value={mercadoPagoKey}
                  onChange={(e) => setMercadoPagoKey(e.target.value)}
                  placeholder="APP_USR-xxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {business.has_mercadopago_key && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMPKeyInput(false)
                      setMercadoPagoKey('')
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 mt-2"
                  >
                    Cancelar cambio
                  </button>
                )}
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      <div className="pt-4 flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-[#FF6B35] hover:bg-[#E2541F] text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
        {message && (
          <span className={`text-sm font-medium flex items-center gap-1.5 ${
            message.type === 'success' ? 'text-green-700' : 'text-red-700'
          }`}>
            {message.type === 'success' ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {message.text}
          </span>
        )}
      </div>
    </form>
  )
}
