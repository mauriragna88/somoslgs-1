'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'

interface Category {
  id: string
  name: string
  parent_id: string | null
}

interface CreateBusinessFormProps {
  categories: Category[]
}

export default function CreateBusinessForm({ categories }: CreateBusinessFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [skipOwner, setSkipOwner] = useState(false)

  const [formData, setFormData] = useState({
    // Datos del dueño
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    ownerPassword: '',

    // Datos del negocio
    businessName: '',
    categoryId: '',
    description: '',
    address: '',
    neighborhood: '',
    phone: '',
    whatsapp: '',
    email: '',

    // Suscripción
    subscriptionTier: 'basico' as 'basico' | 'ventas' | 'delivery' | 'premium',
    subscriptionDays: 30,
    isFree: false,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  // Total steps depends on skipOwner
  const totalSteps = skipOwner ? 2 : 3
  // Map logical step to content:
  // skipOwner: step 1 = negocio, step 2 = suscripción
  // !skipOwner: step 1 = dueño, step 2 = negocio, step 3 = suscripción
  const showOwnerStep = !skipOwner && step === 1
  const showBusinessStep = skipOwner ? step === 1 : step === 2
  const showSubscriptionStep = skipOwner ? step === 2 : step === 3

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validaciones
      if (!skipOwner && (!formData.ownerName || !formData.ownerEmail || !formData.ownerPassword)) {
        throw new Error('Complete los datos del dueño')
      }
      if (!formData.businessName || !formData.phone || !formData.whatsapp || !formData.address) {
        throw new Error('Complete los datos del negocio')
      }
      if (!/^\d{10}$/.test(formData.phone)) {
        throw new Error('El telefono del negocio debe tener 10 digitos')
      }
      if (!/^\d{10}$/.test(formData.whatsapp)) {
        throw new Error('El WhatsApp debe tener 10 digitos')
      }

      // Crear el negocio mediante API
      const response = await fetch('/api/admin/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: skipOwner ? null : {
            name: formData.ownerName,
            email: formData.ownerEmail,
            phone: formData.ownerPhone,
            password: formData.ownerPassword,
          },
          business: {
            name: formData.businessName,
            slug: slugify(formData.businessName),
            categoryId: formData.categoryId || null,
            description: formData.description,
            address: formData.address,
            neighborhood: formData.neighborhood,
            phone: formData.phone,
            whatsapp: formData.whatsapp,
            email: formData.email,
            subscriptionTier: formData.subscriptionTier,
            subscriptionDays: formData.subscriptionDays,
            isFree: formData.isFree,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el negocio')
      }

      // Éxito - redirigir
      router.push('/admin/negocios')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const mainCategories = categories.filter(c => !c.parent_id)

  const stepNumbers = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      {/* Skip Owner Toggle */}
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={skipOwner}
            onChange={(e) => {
              setSkipOwner(e.target.checked)
              setStep(1) // Reset to step 1 on toggle
            }}
            className="w-5 h-5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
          />
          <div>
            <span className="font-semibold text-gray-900">Crear sin dueño (asignar después)</span>
            <p className="text-sm text-gray-600">
              Crea el negocio sin cuenta de usuario. Podrás asignar un dueño desde el panel después.
            </p>
          </div>
        </label>
      </div>

      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-center">
        <div className="flex items-center space-x-4">
          {stepNumbers.map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
              {s < totalSteps && <div className={`w-16 h-1 ${step > s ? 'bg-primary' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Step: Datos del Dueño (only when !skipOwner && step 1) */}
      {showOwnerStep && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Paso 1: Datos del Dueño</h2>
            <p className="text-sm text-gray-600">Información de la persona responsable del negocio</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                name="ownerName"
                value={formData.ownerName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="ownerEmail"
                value={formData.ownerEmail}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono del Dueño
              </label>
              <input
                type="tel"
                name="ownerPhone"
                value={formData.ownerPhone}
                onChange={handleChange}
                maxLength={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="4741234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña Temporal *
              </label>
              <input
                type="password"
                name="ownerPassword"
                value={formData.ownerPassword}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500 mt-1">
                El dueño podrá cambiar esta contraseña después
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Step: Datos del Negocio */}
      {showBusinessStep && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {skipOwner ? 'Paso 1: Datos del Negocio' : 'Paso 2: Datos del Negocio'}
            </h2>
            <p className="text-sm text-gray-600">Información del negocio</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Negocio *
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Selecciona una categoría</option>
                {mainCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Breve descripción del negocio..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección *
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colonia/Barrio
              </label>
              <input
                type="text"
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Teléfono del Negocio *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                maxLength={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                placeholder="4741234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                WhatsApp *
              </label>
              <input
                type="tel"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                maxLength={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                placeholder="4741234567"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email del Negocio
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex justify-between">
            {!skipOwner && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                ← Anterior
              </button>
            )}
            <div className={skipOwner ? 'ml-auto' : ''}>
              <button
                type="button"
                onClick={() => setStep(skipOwner ? 2 : 3)}
                className="px-6 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
              >
                Siguiente →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step: Suscripción */}
      {showSubscriptionStep && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {skipOwner ? 'Paso 2: Plan de Suscripción' : 'Paso 3: Plan de Suscripción'}
            </h2>
            <p className="text-sm text-gray-600">Selecciona el plan para el negocio</p>
          </div>

          {/* Toggle cortesía */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFree}
                onChange={(e) =>
                  setFormData({ ...formData, isFree: e.target.checked })
                }
                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <div>
                <span className="font-semibold text-gray-900">Cortesia (sin cobro)</span>
                <p className="text-sm text-gray-600">
                  El negocio tendra el plan seleccionado sin fecha de vencimiento. Ideal para promociones o cortesias.
                </p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { value: 'basico', label: 'Basico', price: '$80/mes', features: ['Info basica', 'WhatsApp', 'Ubicacion'] },
              { value: 'ventas', label: 'Ventas', price: '$150/mes', features: ['Todo lo anterior', 'Productos', 'Transferencias'] },
              { value: 'delivery', label: 'Delivery', price: '$200/mes', features: ['Todo lo anterior', 'Pasarela', 'Motomandados'] },
              { value: 'premium', label: 'Premium', price: '$260/mes', features: ['Todo lo anterior', 'Destacado', 'Analytics'] },
            ].map((plan) => (
              <label
                key={plan.value}
                className={`relative flex flex-col p-6 border-2 rounded-xl cursor-pointer transition-all ${
                  formData.subscriptionTier === plan.value
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="subscriptionTier"
                  value={plan.value}
                  checked={formData.subscriptionTier === plan.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{plan.label}</h3>
                  {formData.subscriptionTier === plan.value && (
                    <span className="text-primary">✓</span>
                  )}
                </div>
                <p className={`text-sm font-medium mb-3 ${formData.isFree ? 'text-green-600 line-through' : 'text-primary'}`}>
                  {formData.isFree ? `${plan.price} → Gratis` : plan.price}
                </p>
                <ul className="space-y-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-center">
                      <span className="mr-2">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </label>
            ))}
          </div>

          {/* Selector de dias */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Duracion de la suscripcion
            </label>
            <div className="flex flex-wrap gap-2">
              {[10, 20, 30, 45, 60, 75, 90].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setFormData({ ...formData, subscriptionDays: days })}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                    formData.subscriptionDays === days
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {days} dias
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {formData.isFree
                ? `El negocio tendra ${formData.subscriptionDays} dias de cortesia`
                : `El negocio tendra ${formData.subscriptionDays} dias antes de que expire su suscripcion`}
            </p>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setStep(skipOwner ? 1 : 2)}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              ← Anterior
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Creando...' : 'Crear Negocio'}
            </button>
          </div>
        </div>
      )}
    </form>
  )
}
