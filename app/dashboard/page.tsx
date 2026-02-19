export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { formatDaysRemaining } from '@/lib/utils'
import BankDataAlert from '@/components/dashboard/BankDataAlert'
import UpgradeBanner from '@/components/dashboard/UpgradeBanner'

interface DashboardBusiness {
  id: string
  name: string
  slug: string
  logo_url: string | null
  description: string | null
  subscription_tier: string
  subscription_status: string
  subscription_expires_at: string | null
  is_active: boolean
  category: { name: string } | null
  bank_clabe: string | null
}

export default async function BusinessDashboard() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Obtener todos los negocios del dueño
  const { data: businesses } = await supabase
    .from('businesses')
    .select(`
      *,
      category:categories(name)
    `)
    .eq('owner_id', user.id) as { data: DashboardBusiness[] | null }

  // Obtener el negocio seleccionado de las cookies
  const cookieStore = await cookies()
  const selectedBusinessId = cookieStore.get('selected_business_id')?.value

  // Usar el negocio seleccionado o el primero
  const selectedBusiness = selectedBusinessId
    ? businesses?.find(b => b.id === selectedBusinessId) || businesses?.[0]
    : businesses?.[0]
  let stats = {
    totalProducts: 0,
    totalOrders: 0,
    todayOrders: 0,
    monthRevenue: 0,
  }

  if (selectedBusiness) {
    const [
      { count: productsCount },
      { count: ordersCount },
      { count: todayCount },
    ] = await Promise.all([
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', selectedBusiness.id),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', selectedBusiness.id),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', selectedBusiness.id)
        .gte('created_at', new Date().toISOString().split('T')[0]),
    ])

    stats = {
      totalProducts: productsCount || 0,
      totalOrders: ordersCount || 0,
      todayOrders: todayCount || 0,
      monthRevenue: 0,
    }
  }

  const planLabels: Record<string, string> = {
    basico: 'Básico',
    ventas: 'Ventas',
    delivery: 'Delivery',
    premium: 'Premium',
  }

  const planColors: Record<string, string> = {
    basico: 'bg-gray-100 text-gray-800',
    ventas: 'bg-green-100 text-green-800',
    delivery: 'bg-blue-100 text-blue-800',
    premium: 'bg-purple-100 text-purple-800',
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Bienvenido a tu panel de control</p>
      </div>

      {businesses && businesses.length > 0 ? (
        <>
          {/* Subscription Alert */}
          {(() => {
            const urgentBusinesses = businesses.filter(b => {
              const daysInfo = formatDaysRemaining(b.subscription_expires_at)
              return daysInfo.urgent
            })

            if (urgentBusinesses.length === 0) return null

            return (
              <div className="mb-6 space-y-3">
                {urgentBusinesses.map(business => {
                  const daysInfo = formatDaysRemaining(business.subscription_expires_at)
                  const isExpired = business.subscription_expires_at && new Date(business.subscription_expires_at) < new Date()

                  return (
                    <div
                      key={business.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        isExpired
                          ? 'bg-red-50 border-red-500'
                          : 'bg-yellow-50 border-yellow-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-semibold ${isExpired ? 'text-red-800' : 'text-yellow-800'}`}>
                            {isExpired ? '⚠️ Suscripción expirada' : '⏰ Suscripción por vencer'}
                          </p>
                          <p className={`text-sm ${isExpired ? 'text-red-700' : 'text-yellow-700'}`}>
                            <strong>{business.name}:</strong> {daysInfo.text}
                          </p>
                        </div>
                        <Link
                          href="/dashboard/pago"
                          className={`px-4 py-2 text-sm font-semibold rounded-lg ${
                            isExpired
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-yellow-600 hover:bg-yellow-700 text-white'
                          }`}
                        >
                          Renovar Ahora
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {/* Bank Data Alert for businesses with orders capability */}
          {(() => {
            const businessesNeedingBankData = businesses.filter(b =>
              ['ventas', 'delivery', 'premium'].includes(b.subscription_tier) && !b.bank_clabe
            )

            if (businessesNeedingBankData.length === 0) return null

            return (
              <div className="mb-6 space-y-3">
                {businessesNeedingBankData.map(business => (
                  <BankDataAlert
                    key={business.id}
                    businessId={business.id}
                    hasBankData={false}
                  />
                ))}
              </div>
            )
          })()}

          {/* Upgrade Banner - Show for non-premium plans */}
          {selectedBusiness && selectedBusiness.subscription_tier !== 'premium' && (
            <UpgradeBanner
              currentPlan={selectedBusiness.subscription_tier}
              businessName={selectedBusiness.name}
            />
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Productos</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalProducts}</p>
                </div>
                <div className="w-14 h-14 bg-blue-500 rounded-lg flex items-center justify-center text-2xl">
                  📦
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Pedidos Totales</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalOrders}</p>
                </div>
                <div className="w-14 h-14 bg-green-500 rounded-lg flex items-center justify-center text-2xl">
                  🛒
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Pedidos Hoy</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stats.todayOrders}</p>
                </div>
                <div className="w-14 h-14 bg-purple-500 rounded-lg flex items-center justify-center text-2xl">
                  📅
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Ingresos del Mes</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">${stats.monthRevenue}</p>
                </div>
                <div className="w-14 h-14 bg-yellow-500 rounded-lg flex items-center justify-center text-2xl">
                  💰
                </div>
              </div>
            </div>
          </div>

          {/* Mis Negocios */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Mis Negocios</h2>
              <Link
                href="/registrar-negocio"
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition-colors"
              >
                + Agregar Negocio
              </Link>
            </div>
            <div className="p-6 space-y-4">
              {businesses.map((business) => (
                <div
                  key={business.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {business.logo_url ? (
                      <Image
                        src={business.logo_url}
                        alt={business.name}
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">
                          {business.name[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{business.name}</h3>
                      <p className="text-sm text-gray-500">{business.category?.name || 'Sin categoría'}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                            planColors[business.subscription_tier]
                          }`}
                        >
                          {planLabels[business.subscription_tier]}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            business.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {business.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                        {(() => {
                          const daysInfo = formatDaysRemaining(business.subscription_expires_at)
                          return (
                            <span className={`text-xs font-medium ${daysInfo.color}`}>
                              {daysInfo.urgent && '⚠️ '}{daysInfo.text}
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Link
                      href={`/dashboard/mi-negocio?id=${business.id}`}
                      className="px-4 py-2 text-sm bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors text-center"
                    >
                      Ver Detalles
                    </Link>
                    <Link
                      href={`/negocios/${business.slug}`}
                      target="_blank"
                      className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors text-center"
                    >
                      Ver Perfil Público
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              href="/dashboard/productos"
              className="bg-primary hover:bg-primary-dark text-white rounded-xl p-6 transition-colors flex items-center justify-between group"
            >
              <div>
                <h3 className="text-lg font-semibold">Gestionar Productos</h3>
                <p className="text-sm opacity-90 mt-1">Agrega y edita productos</p>
              </div>
              <span className="text-3xl group-hover:scale-110 transition-transform">📦</span>
            </Link>

            <Link
              href="/dashboard/pedidos"
              className="bg-white border-2 border-gray-200 hover:border-primary rounded-xl p-6 transition-colors flex items-center justify-between group"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Ver Pedidos</h3>
                <p className="text-sm text-gray-600 mt-1">Gestiona tus ventas</p>
              </div>
              <span className="text-3xl group-hover:scale-110 transition-transform">🛒</span>
            </Link>

            <Link
              href="/dashboard/estadisticas"
              className="bg-white border-2 border-gray-200 hover:border-primary rounded-xl p-6 transition-colors flex items-center justify-between group"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Estadísticas</h3>
                <p className="text-sm text-gray-600 mt-1">Analiza tus ventas</p>
              </div>
              <span className="text-3xl group-hover:scale-110 transition-transform">📈</span>
            </Link>
          </div>
        </>
      ) : (
        /* No tiene negocios */
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">🏪</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No tienes negocios registrados</h2>
          <p className="text-gray-600 mb-6">
            Parece que aún no tienes un negocio asociado a tu cuenta. Contacta al administrador para que te asigne un negocio.
          </p>
          <a
            href="https://wa.me/4741234567"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
          >
            <span className="mr-2">📱</span>
            Contactar por WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}
