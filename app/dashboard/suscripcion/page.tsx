export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'
import { formatDate, formatDaysRemaining } from '@/lib/utils'

interface Business {
  id: string
  name: string
  subscription_tier: string
  subscription_status: string | null
  subscription_expires_at: string | null
  is_active: boolean
  status: string
}

const planDetails: Record<string, { name: string; price: number; features: string[]; isFree?: boolean }> = {
  gratis: {
    name: 'Gratis',
    price: 0,
    isFree: true,
    features: [
      'Listado basico en el directorio',
      'Direccion y horarios visibles',
      'Logo de tu negocio',
    ],
  },
  emprendedor: {
    name: 'Emprendedor',
    price: 60,
    features: [
      'Todo del plan Gratis',
      'Boton de WhatsApp directo',
      'Mapa interactivo',
      'Redes sociales',
      'Hasta 8 fotos',
    ],
  },
  pro: {
    name: 'Pro',
    price: 120,
    features: [
      'Todo del plan Emprendedor',
      'Catalogo de productos ilimitado',
      'Recepcion de pedidos en linea',
      'Pagos por transferencia y tarjeta',
      'Hasta 15 fotos',
    ],
  },
  avanzado: {
    name: 'Avanzado',
    price: 180,
    features: [
      'Todo del plan Pro',
      'Posicion destacada en busquedas',
      'Insignia de negocio verificado',
      'Estadisticas avanzadas',
      'Soporte prioritario',
      'Hasta 20 fotos',
    ],
  },
}

export default async function SuscripcionPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()

  const { data: allBusinesses } = await supabase
    .from('businesses')
    .select('id, name, subscription_tier, subscription_status, subscription_expires_at, is_active, status')
    .eq('owner_id', user.id) as { data: Business[] | null }

  const cookieStore = await cookies()
  const selectedBusinessId = cookieStore.get('selected_business_id')?.value

  const business = selectedBusinessId
    ? allBusinesses?.find(b => b.id === selectedBusinessId) || allBusinesses?.[0]
    : allBusinesses?.[0]

  if (!business) {
    redirect('/dashboard')
  }

  const currentPlan = planDetails[business.subscription_tier] || planDetails.gratis
  const expiration = formatDaysRemaining(business.subscription_expires_at)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Suscripcion</h1>
        <p className="text-gray-600">
          Gestiona el plan de <span className="font-medium">{business.name}</span>
        </p>
      </div>

      {/* Current Plan Card */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-gray-900">
                Plan {currentPlan.name}
              </h2>
              {business.is_active ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                  Activo
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                  Inactivo
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-primary">
              {currentPlan.isFree ? 'Gratis' : `$${currentPlan.price}`}
              {!currentPlan.isFree && <span className="text-base font-normal text-gray-500">/mes</span>}
            </p>
          </div>

          {business.subscription_expires_at && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Vencimiento</p>
              <p className="font-medium text-gray-900">
                {formatDate(business.subscription_expires_at)}
              </p>
              <p className={`text-sm font-medium ${expiration.color}`}>
                {expiration.text}
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Tu plan incluye:</h3>
          <ul className="space-y-2">
            {currentPlan.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                <span className="text-green-500 flex-shrink-0">✓</span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {!business.is_active && (
          <Link
            href="/dashboard/pago"
            className="flex items-center gap-4 p-4 bg-primary hover:bg-primary-dark text-white rounded-xl transition-colors"
          >
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💳</span>
            </div>
            <div>
              <p className="font-bold">Activar Suscripcion</p>
              <p className="text-sm text-white/80">Completa el pago para activar</p>
            </div>
          </Link>
        )}

        {business.is_active && expiration.urgent && (
          <Link
            href="/dashboard/pago"
            className="flex items-center gap-4 p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
          >
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">🔄</span>
            </div>
            <div>
              <p className="font-bold">Renovar Suscripcion</p>
              <p className="text-sm text-white/80">{expiration.text}</p>
            </div>
          </Link>
        )}

        <Link
          href="/dashboard"
          className="flex items-center gap-4 p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <p className="font-bold text-gray-900">Ir al Dashboard</p>
            <p className="text-sm text-gray-500">Ver resumen de tu negocio</p>
          </div>
        </Link>
      </div>

      {/* All Plans */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Todos los Planes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(planDetails).map(([key, plan]) => {
            const isCurrent = key === business.subscription_tier
            return (
              <div
                key={key}
                className={`rounded-xl p-4 ${
                  isCurrent
                    ? 'bg-primary/5 border-2 border-primary'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {isCurrent && (
                  <span className="inline-block px-2 py-0.5 bg-primary text-white text-xs font-bold rounded mb-2">
                    ACTUAL
                  </span>
                )}
                <h3 className="font-bold text-gray-900">{plan.name}</h3>
                <p className="text-2xl font-bold text-primary mb-3">
                  {plan.isFree ? 'Gratis' : `$${plan.price}`}
                  {!plan.isFree && <span className="text-sm font-normal text-gray-500">/mes</span>}
                </p>
                <ul className="space-y-1">
                  {plan.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Para cambiar de plan, contactanos por WhatsApp o email
        </p>
      </div>
    </div>
  )
}
