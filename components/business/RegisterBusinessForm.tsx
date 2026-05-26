'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import LogoUpload from '@/components/shared/LogoUpload'
import BusinessHoursEditor from '@/components/shared/BusinessHoursEditor'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/constants'
import type { BusinessHours } from '@/lib/constants'

const businessSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  category_id: z.string().uuid('Selecciona una categoría'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  address: z.string().min(10, 'La dirección debe ser completa'),
  phone: z.string().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos'),
  whatsapp: z.string().regex(/^\d{10}$/, 'El WhatsApp debe tener 10 dígitos').optional().or(z.literal('')),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  subscription_tier: z.enum(['gratis', 'emprendedor', 'pro', 'avanzado']),
  logo_url: z.string().url().optional().or(z.literal('')),
  business_type: z.enum(['productos', 'servicios', 'ambos']).default('productos'),
})

type BusinessFormData = z.infer<typeof businessSchema>

interface RegisterBusinessFormProps {
  categories: Array<{ id: string; name: string; icon?: string }>
  isAdmin?: boolean
}

const SUBSCRIPTION_PLANS = [
  {
    id: 'gratis',
    name: 'Plan Gratis',
    price: '$0',
    dailyPrice: '',
    period: '',
    description: 'Empieza gratis y date a conocer',
    features: [
      'Aparece en el buscador',
      'WhatsApp y telefono clickeable',
      'Mapa con tu ubicacion',
      'Horarios de atencion',
      'Hasta 3 fotos',
    ],
    notIncluded: [
      'Portada personalizada',
      'Redes sociales',
      'Catalogo de productos',
    ],
    icon: '🆓',
    color: 'from-gray-500 to-gray-600',
    popular: false,
    isFree: true,
  },
  {
    id: 'emprendedor',
    name: 'Plan Emprendedor',
    price: '$60',
    dailyPrice: 'Solo $2 al dia',
    period: 'MXN/mes',
    description: 'Tu negocio se ve profesional',
    features: [
      'Todo del Plan Gratis',
      'Portada personalizada',
      'Redes sociales visibles',
      'Hasta 8 fotos en galeria',
      'Mejor posicion en busquedas',
    ],
    notIncluded: [
      'Catalogo de productos',
      'Recibir pedidos',
    ],
    icon: '🚀',
    color: 'from-blue-500 to-blue-600',
    popular: true,
    isFree: false,
  },
  {
    id: 'pro',
    name: 'Plan Pro',
    price: '$120',
    dailyPrice: 'Solo $4 al dia',
    period: 'MXN/mes',
    description: 'Vende con catalogo y pedidos',
    features: [
      'Todo del Plan Emprendedor',
      'Catalogo de productos ilimitado',
      'Recibir pedidos en linea',
      'Pagos por transferencia y tarjeta',
      'Hasta 15 fotos de tu negocio',
    ],
    notIncluded: [
      'Posicion destacada',
      'Estadisticas avanzadas',
    ],
    icon: '🛍️',
    color: 'from-green-500 to-green-600',
    popular: false,
    isFree: false,
  },
  {
    id: 'avanzado',
    name: 'Plan Avanzado',
    price: '$180',
    dailyPrice: 'Solo $6 al dia',
    period: 'MXN/mes',
    description: 'Maxima visibilidad y control',
    features: [
      'Todo del Plan Pro',
      'Aparecer primero en busquedas',
      'Insignia de negocio verificado',
      'Estadisticas avanzadas de visitas',
      'Soporte prioritario',
      'Hasta 20 fotos de tu negocio',
    ],
    notIncluded: [],
    icon: '⭐',
    color: 'from-purple-500 to-pink-600',
    popular: false,
    isFree: false,
  },
]

export default function RegisterBusinessForm({ categories, isAdmin = false }: RegisterBusinessFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: Info, 2: Plan
  const [adminFreeActivation, setAdminFreeActivation] = useState(false)

  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    category_id: '',
    description: '',
    address: '',
    phone: '',
    whatsapp: '',
    email: '',
    subscription_tier: 'gratis',
    logo_url: '',
    business_type: 'productos',
  })

  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS)

  const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === formData.subscription_tier)
  const isFreePlan = selectedPlan?.isFree ?? true

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate
      const validatedData = businessSchema.parse(formData)

      const response = await fetch('/api/business/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validatedData,
          business_type: formData.business_type,
          business_hours: businessHours,
          ...(adminFreeActivation && { admin_free_activation: true }),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar el negocio')
      }

      // Redirect: free plan or admin free goes to dashboard, paid plans to payment
      if (isFreePlan || adminFreeActivation) {
        router.push('/dashboard')
      } else {
        router.push('/dashboard/pago')
      }
      router.refresh()
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Error al registrar el negocio')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    // Validate step 1 fields
    try {
      const step1Schema = businessSchema.pick({
        name: true,
        category_id: true,
        description: true,
        address: true,
        phone: true,
      })
      step1Schema.parse(formData)
      setError('')
      setStep(2)
      // Scroll to top when advancing
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      if (err instanceof z.ZodError) {
        // Show all errors joined
        const errorMessages = err.errors.map(e => e.message).join('. ')
        setError(errorMessages)
        // Scroll to error
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Progress Steps */}
      <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
        <div className="flex items-center justify-center gap-4">
          <div className={`flex items-center gap-2 ${step === 1 ? 'font-semibold' : 'text-gray-400'}`} style={step === 1 ? { color: 'var(--coral)' } : undefined}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 1 ? 'text-white' : 'bg-gray-300'}`} style={step === 1 ? { background: 'var(--coral)' } : undefined}>
              1
            </div>
            <span>Información</span>
          </div>
          <div className="w-12 h-1 bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${step === 2 ? 'font-semibold' : 'text-gray-400'}`} style={step === 2 ? { color: 'var(--coral)' } : undefined}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 2 ? 'text-white' : 'bg-gray-300'}`} style={step === 2 ? { background: 'var(--coral)' } : undefined}>
              2
            </div>
            <span>Plan</span>
          </div>
        </div>
      </div>

      <div className="p-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {step === 1 ? (
          /* Step 1: Business Information */
          <div className="space-y-6">
            {/* Logo Upload */}
            <div className="bg-gray-50 rounded-xl p-6">
              <LogoUpload
                currentLogo={formData.logo_url || null}
                onUpload={(url) => setFormData({ ...formData, logo_url: url })}
                onRemove={() => setFormData({ ...formData, logo_url: '' })}
                size="lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Negocio *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                placeholder="Ej: Tacos El Güero"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría *
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                required
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción de tu negocio *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                placeholder="Describe tu negocio, qué vendes, qué te hace único..."
                rows={4}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 20 caracteres. Esta descripción aparecerá en tu perfil público.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección completa *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                placeholder="Calle, número, colonia"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  placeholder="4741234567"
                  maxLength={10}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp (opcional)
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  placeholder="4741234567"
                  maxLength={10}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email del negocio (opcional)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                placeholder="negocio@ejemplo.com"
              />
            </div>

            {/* Tipo de negocio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tipo de negocio *
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'productos' as const, label: 'Vendo productos', icon: '📦' },
                  { value: 'servicios' as const, label: 'Ofrezco servicios', icon: '🔧' },
                  { value: 'ambos' as const, label: 'Ambos', icon: '📦🔧' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, business_type: option.value })}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${
                      formData.business_type === option.value
                        ? 'border-[#FF6B35] bg-[rgba(255,107,53,0.05)] text-[#FF6B35]'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{option.icon}</span>
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Horarios de Atención */}
            <BusinessHoursEditor value={businessHours} onChange={setBusinessHours} />

            <button
              type="button"
              onClick={handleNext}
              className="w-full text-white py-4 rounded-lg font-semibold transition-colors" style={{ background: 'var(--coral)' }}
            >
              Continuar →
            </button>
          </div>
        ) : (
          /* Step 2: Plan Selection */
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Elige tu Plan
              </h2>
              <p className="text-gray-600">
                Puedes empezar gratis y actualizar cuando quieras
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setFormData({ ...formData, subscription_tier: plan.id as any })}
                  className={`relative p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                    formData.subscription_tier === plan.id
                      ? 'border-[#FF6B35] bg-[rgba(255,107,53,0.05)] shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                        MÁS POPULAR
                      </span>
                    </div>
                  )}

                  {plan.isFree && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="text-white px-4 py-1 rounded-full text-xs font-bold" style={{ background: 'linear-gradient(135deg, var(--coral), #E2541F)' }}>
                        GRATIS
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-4">
                    <span className="text-5xl mb-3 block">{plan.icon}</span>
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                    <div className="mb-2">
                      {plan.isFree ? (
                        <span className="text-3xl font-bold" style={{ color: 'var(--coral)' }}>Gratis</span>
                      ) : (
                        <>
                          <span className="text-3xl font-bold" style={{ color: 'var(--coral)' }}>{plan.price}</span>
                          <span className="text-gray-600 text-sm ml-1">{plan.period}</span>
                        </>
                      )}
                    </div>
                    {plan.dailyPrice && (
                      <p className="text-xs font-semibold mt-1" style={{ color: 'var(--gold-deep)' }}>{plan.dailyPrice} — menos que un cafe</p>
                    )}
                  </div>

                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-green-600 font-bold">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                    {plan.notIncluded && plan.notIncluded.map((feature, idx) => (
                      <li key={`not-${idx}`} className="flex items-start gap-2 text-sm opacity-50">
                        <span className="text-gray-400">✗</span>
                        <span className="text-gray-500 line-through">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {formData.subscription_tier === plan.id && (
                    <div className="text-center">
                      <span className="inline-block text-white px-4 py-2 rounded-lg font-semibold" style={{ background: 'var(--coral)' }}>
                        ✓ Plan Seleccionado
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {isAdmin && (
              <label className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adminFreeActivation}
                  onChange={(e) => setAdminFreeActivation(e.target.checked)}
                  className="w-4 h-4 accent-amber-600"
                />
                <span className="text-sm text-amber-900 font-medium">
                  Activación admin (gratis, sin pago)
                </span>
              </label>
            )}

            {!isFreePlan && !adminFreeActivation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900">
                  <strong>💡 Nota:</strong> Después de registrar tu negocio, recibirás las instrucciones de pago
                  y tu negocio quedará activo una vez confirmado el pago.
                </p>
              </div>
            )}

            {isFreePlan && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-green-900">
                  <strong>✨ ¡Genial!</strong> Tu negocio se activará inmediatamente sin costo.
                  Puedes actualizar tu plan en cualquier momento desde tu panel.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold"
              >
                ← Atrás
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed" style={{ background: 'var(--coral)' }}
              >
                {loading ? 'Registrando...' : isFreePlan ? 'Registrar mi Negocio Gratis' : 'Registrar mi Negocio'}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
