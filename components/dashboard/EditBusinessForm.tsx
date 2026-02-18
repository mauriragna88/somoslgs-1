'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import LogoUpload from '@/components/shared/LogoUpload'
import PhotoGalleryManager from '@/components/dashboard/PhotoGalleryManager'
import type { BusinessPhoto } from '@/lib/supabase/database.types'

interface Business {
  id: string
  name: string
  description: string | null
  phone: string
  whatsapp: string | null
  email: string | null
  address: string
  category_id: string | null
  logo_url: string | null
  // Datos bancarios
  bank_name: string | null
  bank_account_holder: string | null
  bank_account_number: string | null
  bank_clabe: string | null
  // Configuración pagos con tarjeta
  payment_mode: 'platform' | 'direct' | null
  has_conekta_key: boolean
  has_mercadopago_key: boolean
  active_payment_gateways: string[]
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
    category_id: business.category_id || '',
    logo_url: business.logo_url || '',
    // Datos bancarios
    bank_name: business.bank_name || '',
    bank_account_holder: business.bank_account_holder || '',
    bank_account_number: business.bank_account_number || '',
    bank_clabe: business.bank_clabe || '',
    // Pagos con tarjeta
    payment_mode: business.payment_mode || 'platform',
  })

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
          onUpload={(url) => setFormData({ ...formData, logo_url: url })}
          onRemove={() => setFormData({ ...formData, logo_url: '' })}
          size="lg"
        />
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
            Teléfono
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            required
          />
        </div>
      </div>

      {/* Sección de Datos Bancarios */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Datos Bancarios para Recibir Pagos
        </h4>
        <p className="text-sm text-gray-500 mb-4">
          Estos datos se mostrarán a tus clientes cuando elijan pagar por transferencia.
        </p>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {formData.bank_clabe && formData.bank_clabe.length !== 18 && (
              <p className="text-xs text-red-500 mt-1">La CLABE debe tener 18 dígitos</p>
            )}
          </div>
        </div>
      </div>

      {/* Sección de Pasarelas de Pago */}
      <div className="border-t border-gray-200 pt-6 mt-6">
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
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
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
              className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
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
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center ${
                formData.payment_mode === 'platform' ? 'border-primary' : 'border-gray-300'
              }`}>
                {formData.payment_mode === 'platform' && (
                  <div className="w-3 h-3 rounded-full bg-primary" />
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
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-5 h-5 rounded-full border-2 mt-0.5 flex-shrink-0 flex items-center justify-center ${
                formData.payment_mode === 'direct' ? 'border-primary' : 'border-gray-300'
              }`}>
                {formData.payment_mode === 'direct' && (
                  <div className="w-3 h-3 rounded-full bg-primary" />
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

      <div className="pt-4 flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50"
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
