'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import LogoUpload from '@/components/shared/LogoUpload'
import BusinessHoursEditor from '@/components/shared/BusinessHoursEditor'
import { DEFAULT_BUSINESS_HOURS } from '@/lib/constants'
import type { BusinessHours } from '@/lib/constants'

const businessSchema = z.object({
  name: z.string().min(3, 'Mínimo 3 caracteres').max(100),
  category_id: z.string().uuid('Selecciona una categoría'),
  description: z.string().min(20, 'Mínimo 20 caracteres').max(500),
  address: z.string().min(10, 'Dirección muy corta, sé más específico'),
  phone: z.string().regex(/^\d{10}$/, 'Debe tener exactamente 10 dígitos'),
  whatsapp: z.string().regex(/^\d{10}$/, 'Debe tener 10 dígitos').optional().or(z.literal('')),
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

const STEPS = [
  { id: 1, label: 'Tu negocio', icon: '🏪' },
  { id: 2, label: 'Contacto', icon: '📍' },
  { id: 3, label: 'Tu perfil', icon: '✨' },
  { id: 4, label: 'Tu plan', icon: '🎯' },
]

const STEP_SCHEMAS: Record<number, z.ZodSchema> = {
  1: businessSchema.pick({ name: true, category_id: true }),
  2: businessSchema.pick({ address: true, phone: true }),
  3: businessSchema.pick({ description: true }),
}

const SUBSCRIPTION_PLANS = [
  {
    id: 'gratis',
    name: 'Plan Gratis',
    price: 'Gratis',
    dailyPrice: '',
    period: '',
    description: 'Empieza gratis y date a conocer',
    features: ['Aparece en el buscador', 'WhatsApp y teléfono clickeable', 'Mapa con tu ubicación', 'Horarios de atención', 'Hasta 3 fotos'],
    notIncluded: ['Portada personalizada', 'Catálogo de productos'],
    icon: '🆓',
    isFree: true,
    popular: false,
    accent: '#6b7280',
  },
  {
    id: 'emprendedor',
    name: 'Emprendedor',
    price: '$60',
    dailyPrice: 'Solo $2/día',
    period: 'MXN/mes',
    description: 'Tu negocio se ve profesional',
    features: ['Todo lo del plan Gratis', 'Portada personalizada', 'Redes sociales visibles', 'Hasta 8 fotos en galería', 'Mejor posición en búsquedas'],
    notIncluded: ['Catálogo de productos', 'Recibir pedidos'],
    icon: '🚀',
    isFree: false,
    popular: true,
    accent: '#3b82f6',
  },
  {
    id: 'pro',
    name: 'Plan Pro',
    price: '$120',
    dailyPrice: 'Solo $4/día',
    period: 'MXN/mes',
    description: 'Vende con catálogo y pedidos en línea',
    features: ['Todo lo del plan Emprendedor', 'Catálogo de productos ilimitado', 'Recibir pedidos en línea', 'Pagos por transferencia y tarjeta', 'Hasta 15 fotos'],
    notIncluded: ['Posición destacada premium'],
    icon: '🛍️',
    isFree: false,
    popular: false,
    accent: '#10b981',
  },
  {
    id: 'avanzado',
    name: 'Plan Avanzado',
    price: '$180',
    dailyPrice: 'Solo $6/día',
    period: 'MXN/mes',
    description: 'Máxima visibilidad y control total',
    features: ['Todo lo del plan Pro', 'Aparecer primero en búsquedas', 'Insignia de negocio verificado', 'Estadísticas avanzadas', 'Soporte prioritario', 'Hasta 20 fotos'],
    notIncluded: [],
    icon: '⭐',
    isFree: false,
    popular: false,
    accent: '#8b5cf6',
  },
]

const STORAGE_KEY = 'somoslagos_register_draft'

export default function RegisterBusinessForm({ categories, isAdmin = false }: RegisterBusinessFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState(1)
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

  // Restore draft
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const { data, hours } = JSON.parse(raw)
      if (data) setFormData(prev => ({ ...prev, ...data }))
      if (hours) setBusinessHours(hours)
    } catch {}
  }, [])

  // Persist draft
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ data: formData, hours: businessHours }))
    } catch {}
  }, [formData, businessHours])

  const set = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value } as BusinessFormData))
    setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validateStep = (s: number): boolean => {
    const schema = STEP_SCHEMAS[s]
    if (!schema) return true
    try {
      schema.parse(formData)
      setErrors({})
      return true
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errs: Record<string, string> = {}
        err.errors.forEach(e => { errs[e.path[0] as string] = e.message })
        setErrors(errs)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      return false
    }
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => s + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleBack = () => {
    setErrors({})
    setStep(s => s - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const isFreePlan = formData.subscription_tier === 'gratis'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
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
      if (!response.ok) throw new Error(data.error || 'Error al registrar el negocio')

      try { localStorage.removeItem(STORAGE_KEY) } catch {}

      if (isFreePlan || adminFreeActivation) {
        router.push('/dashboard')
      } else {
        router.push('/dashboard/pago')
      }
      router.refresh()
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errs: Record<string, string> = {}
        err.errors.forEach(e => { errs[e.path[0] as string] = e.message })
        setErrors(errs)
      } else if (err instanceof Error) {
        setErrors({ _form: err.message })
      } else {
        setErrors({ _form: 'Error al registrar el negocio' })
      }
    } finally {
      setLoading(false)
    }
  }

  // Helpers
  const fieldError = (field: string) =>
    errors[field] ? <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1"><span>⚠</span>{errors[field]}</p> : null

  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none focus:ring-0 focus:border-[#FF6B35] transition-colors ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
    }`

  const nextBtn = (label = 'Continuar →') => (
    <button
      type="button"
      onClick={handleNext}
      className="w-full text-white py-4 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98]"
      style={{ background: 'linear-gradient(135deg,var(--coral),#e85520)', boxShadow: '0 4px 14px rgba(255,107,53,0.3)' }}
    >
      {label}
    </button>
  )

  const backBtn = () => (
    <button
      type="button"
      onClick={handleBack}
      className="px-6 py-4 rounded-xl font-semibold text-sm border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
    >
      ← Atrás
    </button>
  )

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.10)' }}>

      {/* ── Stepper ── */}
      <div className="px-6 py-5" style={{ background: 'var(--cream)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex items-center max-w-xs mx-auto">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: step > s.id ? 'var(--coral)' : step === s.id ? 'var(--coral)' : '#e5e7eb',
                    color: step >= s.id ? '#fff' : '#9ca3af',
                    boxShadow: step === s.id ? '0 0 0 4px rgba(255,107,53,0.15)' : 'none',
                  }}
                >
                  {step > s.id ? '✓' : s.id}
                </div>
                <span className={`text-xs font-medium ${step === s.id ? 'text-[#FF6B35]' : 'text-gray-400'} hidden sm:block`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className="h-0.5 flex-1 mx-2 mb-3 sm:mb-4 transition-all duration-300"
                  style={{ background: step > s.id ? 'var(--coral)' : '#e5e7eb' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 sm:p-8">
        {errors._form && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-start gap-2">
            <span>⚠</span> {errors._form}
          </div>
        )}

        {/* ────────────────────────────────────
            STEP 1 · Tu negocio
        ──────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <span className="text-5xl">🏪</span>
              <h2 className="text-2xl font-bold mt-3" style={{ color: 'var(--ink)' }}>¿Cómo se llama tu negocio?</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Solo lo básico para empezar</p>
            </div>

            {/* Logo */}
            <div className="flex justify-center py-2">
              <LogoUpload
                currentLogo={formData.logo_url || null}
                onUpload={url => set('logo_url', url)}
                onRemove={() => set('logo_url', '')}
                size="lg"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>
                Nombre del negocio <span style={{ color: 'var(--coral)' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => set('name', e.target.value)}
                className={inputClass('name')}
                placeholder="Ej: Tacos El Güero, Boutique Lupita..."
              />
              {fieldError('name')}
            </div>

            {/* Category visual grid */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>
                Categoría <span style={{ color: 'var(--coral)' }}>*</span>
              </label>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto pr-0.5"
                style={{ maxHeight: '260px' }}
              >
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => set('category_id', cat.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all flex items-center gap-2.5 ${
                      formData.category_id === cat.id
                        ? 'border-[#FF6B35] bg-[rgba(255,107,53,0.06)]'
                        : 'border-gray-100 hover:border-gray-300 bg-gray-50 hover:bg-white'
                    }`}
                  >
                    <span className="text-xl flex-shrink-0">{cat.icon || '🏢'}</span>
                    <span className={`text-xs font-medium leading-tight ${formData.category_id === cat.id ? 'text-[#FF6B35]' : 'text-gray-700'}`}>
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
              {fieldError('category_id')}
            </div>

            {/* Business type */}
            <div>
              <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>
                ¿Qué ofreces? <span style={{ color: 'var(--coral)' }}>*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'productos', label: 'Productos', icon: '📦' },
                  { value: 'servicios', label: 'Servicios', icon: '🔧' },
                  { value: 'ambos', label: 'Ambos', icon: '🛍️' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => set('business_type', opt.value)}
                    className={`p-4 border-2 rounded-xl text-center transition-all ${
                      formData.business_type === opt.value
                        ? 'border-[#FF6B35] bg-[rgba(255,107,53,0.05)]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{opt.icon}</span>
                    <span className={`text-xs font-semibold ${formData.business_type === opt.value ? 'text-[#FF6B35]' : 'text-gray-600'}`}>
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {nextBtn()}
          </div>
        )}

        {/* ────────────────────────────────────
            STEP 2 · Contacto y ubicación
        ──────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <span className="text-5xl">📍</span>
              <h2 className="text-2xl font-bold mt-3" style={{ color: 'var(--ink)' }}>¿Dónde encontrarte?</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Para que tus clientes lleguen hasta ti</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>
                Dirección completa <span style={{ color: 'var(--coral)' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={e => set('address', e.target.value)}
                className={inputClass('address')}
                placeholder="Calle Constitución 123, Col. Centro"
              />
              {fieldError('address')}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>
                  Teléfono <span style={{ color: 'var(--coral)' }}>*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => set('phone', e.target.value.replace(/\D/g, ''))}
                  className={inputClass('phone')}
                  placeholder="4741234567"
                  maxLength={10}
                />
                {fieldError('phone')}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>
                  WhatsApp{' '}
                  <span className="font-normal" style={{ color: 'var(--muted)' }}>(opcional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={e => set('whatsapp', e.target.value.replace(/\D/g, ''))}
                  className={inputClass('whatsapp')}
                  placeholder="4741234567"
                  maxLength={10}
                />
                {fieldError('whatsapp')}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>
                Email del negocio{' '}
                <span className="font-normal" style={{ color: 'var(--muted)' }}>(opcional)</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => set('email', e.target.value)}
                className={inputClass('email')}
                placeholder="negocio@ejemplo.com"
              />
              {fieldError('email')}
            </div>

            <div className="flex gap-3">
              {backBtn()}
              <div className="flex-1">{nextBtn()}</div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────
            STEP 3 · Descripción y horarios
        ──────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <span className="text-5xl">✨</span>
              <h2 className="text-2xl font-bold mt-3" style={{ color: 'var(--ink)' }}>Cuéntanos de tu negocio</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Esta info aparece en tu perfil público</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  Descripción <span style={{ color: 'var(--coral)' }}>*</span>
                </label>
                <span
                  className={`text-xs font-medium tabular-nums transition-colors ${
                    formData.description.length >= 20 ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {formData.description.length}/500
                </span>
              </div>
              <textarea
                value={formData.description}
                onChange={e => set('description', e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm focus:outline-none focus:border-[#FF6B35] transition-colors resize-none leading-relaxed ${
                  errors.description ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder="Describe qué vendes, qué te hace único, qué servicios ofreces y por qué elegirte..."
                rows={5}
                maxLength={500}
              />
              {fieldError('description')}
              {!errors.description && formData.description.length < 20 && formData.description.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">Faltan {20 - formData.description.length} caracteres para continuar</p>
              )}
            </div>

            <BusinessHoursEditor value={businessHours} onChange={setBusinessHours} />

            <div className="flex gap-3">
              {backBtn()}
              <div className="flex-1">{nextBtn()}</div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────
            STEP 4 · Plan
        ──────────────────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="text-center mb-2">
              <span className="text-5xl">🎯</span>
              <h2 className="text-2xl font-bold mt-3" style={{ color: 'var(--ink)' }}>Elige tu plan</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Puedes empezar gratis y crecer a tu ritmo</p>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {SUBSCRIPTION_PLANS.map(plan => {
                const selected = formData.subscription_tier === plan.id
                return (
                  <div
                    key={plan.id}
                    onClick={() => set('subscription_tier', plan.id)}
                    className={`relative p-5 border-2 rounded-2xl cursor-pointer transition-all ${
                      selected ? 'shadow-lg' : 'hover:shadow-md'
                    }`}
                    style={{
                      borderColor: selected ? 'var(--coral)' : '#e5e7eb',
                      background: selected ? 'rgba(255,107,53,0.03)' : '#fff',
                    }}
                  >
                    {plan.popular && !selected && (
                      <div className="absolute -top-3 left-4">
                        <span className="bg-green-500 text-white px-3 py-0.5 rounded-full text-xs font-bold">MÁS POPULAR</span>
                      </div>
                    )}
                    {plan.isFree && !selected && (
                      <div className="absolute -top-3 left-4">
                        <span className="text-white px-3 py-0.5 rounded-full text-xs font-bold" style={{ background: 'var(--coral)' }}>GRATIS</span>
                      </div>
                    )}
                    {selected && (
                      <div className="absolute -top-3 left-4">
                        <span className="text-white px-3 py-0.5 rounded-full text-xs font-bold" style={{ background: 'var(--coral)' }}>✓ SELECCIONADO</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{plan.icon}</span>
                        <div>
                          <h3 className="font-bold text-sm" style={{ color: 'var(--ink)' }}>{plan.name}</h3>
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>{plan.description}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-lg" style={{ color: 'var(--coral)' }}>{plan.price}</p>
                        {plan.period && <p className="text-xs" style={{ color: 'var(--muted)' }}>{plan.period}</p>}
                      </div>
                    </div>

                    {plan.dailyPrice && (
                      <p className="text-xs font-semibold mb-2.5" style={{ color: 'var(--gold)' }}>{plan.dailyPrice} — menos que un café</p>
                    )}

                    <ul className="space-y-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-green-500 font-bold mt-0.5 flex-shrink-0">✓</span>
                          <span style={{ color: 'var(--ink)' }}>{f}</span>
                        </li>
                      ))}
                      {plan.notIncluded.map((f, i) => (
                        <li key={`no-${i}`} className="flex items-start gap-2 text-xs opacity-35">
                          <span className="font-bold mt-0.5 flex-shrink-0">✗</span>
                          <span className="line-through">{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>

            {isAdmin && (
              <label className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={adminFreeActivation}
                  onChange={e => setAdminFreeActivation(e.target.checked)}
                  className="w-4 h-4 accent-amber-600"
                />
                <span className="text-sm text-amber-900 font-medium">Activación admin (gratis, sin pago)</span>
              </label>
            )}

            {!isFreePlan && !adminFreeActivation ? (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm text-blue-900">
                  <strong>💡 Nota:</strong> Después de registrar, recibirás las instrucciones de pago.
                  Tu negocio se activa al confirmar el pago.
                </p>
              </div>
            ) : (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-sm text-green-900">
                  <strong>✨ ¡Genial!</strong> Tu negocio se activa inmediatamente, sin costo.
                  Puedes subir de plan en cualquier momento desde tu panel.
                </p>
              </div>
            )}

            <div className="flex gap-3">
              {backBtn()}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 text-white py-4 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,var(--coral),#e85520)', boxShadow: '0 4px 14px rgba(255,107,53,0.3)' }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" />
                    Registrando...
                  </span>
                ) : isFreePlan || adminFreeActivation ? (
                  '¡Registrar mi negocio GRATIS!'
                ) : (
                  'Registrar mi negocio →'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
