'use client'

import Link from 'next/link'

interface UpgradeBannerProps {
  currentPlan: string
  businessName: string
}

const UPGRADE_MESSAGES = {
  gratis: {
    title: '¿Quieres vender en línea?',
    subtitle: 'Sube al Plan Pro',
    features: [
      'Catálogo de productos ilimitado',
      'Recibe pedidos en línea',
      'Pagos por transferencia y tarjeta',
      'Panel de gestión de ventas',
    ],
    price: '$100',
    targetPlan: 'pro',
    gradient: 'from-green-500 to-emerald-600',
    icon: '🛍️',
  },
  pro: {
    title: '¡Destaca tu negocio!',
    subtitle: 'Sube al Plan Avanzado',
    features: [
      'Aparece primero en búsquedas',
      'Insignia de negocio verificado',
      'Estadísticas avanzadas',
      'Soporte prioritario VIP',
    ],
    price: '$180',
    targetPlan: 'avanzado',
    gradient: 'from-purple-500 to-pink-600',
    icon: '⭐',
  },
}

export default function UpgradeBanner({ currentPlan, businessName }: UpgradeBannerProps) {
  const upgrade = UPGRADE_MESSAGES[currentPlan as keyof typeof UPGRADE_MESSAGES]

  // No mostrar banner si ya es avanzado
  if (!upgrade || currentPlan === 'avanzado') {
    return null
  }

  return (
    <div className={`bg-gradient-to-r ${upgrade.gradient} rounded-xl shadow-lg overflow-hidden mb-6`}>
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {/* Icon and Text */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{upgrade.icon}</span>
              <div>
                <p className="text-white/80 text-sm font-medium">{upgrade.title}</p>
                <h3 className="text-white text-2xl font-bold">{upgrade.subtitle}</h3>
              </div>
            </div>

            <p className="text-white/90 text-sm mb-4">
              <strong>{businessName}</strong> puede crecer con estas funciones:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {upgrade.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-white text-sm">
                  <span className="text-green-300">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Price and CTA */}
          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="text-center md:text-right">
              <p className="text-white/80 text-sm">Solo</p>
              <p className="text-white text-4xl font-bold">{upgrade.price}</p>
              <p className="text-white/80 text-sm">MXN/mes</p>
            </div>

            <Link
              href="/dashboard/suscripcion"
              className="inline-flex items-center px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 font-bold rounded-lg transition-colors shadow-lg"
            >
              Actualizar Ahora
              <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>

            <p className="text-white/60 text-xs text-center md:text-right">
              Cancela cuando quieras
            </p>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
    </div>
  )
}
