export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { formatDaysRemaining } from '@/lib/utils'
import BankDataAlert from '@/components/dashboard/BankDataAlert'
import UpgradeBanner from '@/components/dashboard/UpgradeBanner'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
import BusinessQR from '@/components/dashboard/BusinessQR'

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
  business_hours: any
}

export default async function BusinessDashboard() {
  const supabase = await createClient()

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
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const [
      { count: productsCount },
      { count: ordersCount },
      { count: todayCount },
      { data: monthOrders },
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
      supabase
        .from('orders')
        .select('total')
        .eq('business_id', selectedBusiness.id)
        .eq('payment_status', 'verified')
        .gte('created_at', firstDayOfMonth),
    ])

    const monthRevenue = (monthOrders || []).reduce(
      (sum: number, o: { total: number }) => sum + (o.total || 0),
      0,
    )

    stats = {
      totalProducts: productsCount || 0,
      totalOrders: ordersCount || 0,
      todayOrders: todayCount || 0,
      monthRevenue,
    }
  }

  const planLabels: Record<string, string> = {
    gratis: 'Gratis',
    pro: 'Pro',
    avanzado: 'Avanzado',
  }

  const planColors: Record<string, string> = {
    gratis: 'bg-gray-100 text-gray-800',
    pro: 'bg-green-100 text-green-800',
    avanzado: 'bg-purple-100 text-purple-800',
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ fontFamily: 'var(--display)', fontWeight: 700, color: 'var(--ink)' }}>Dashboard</h1>
        <p className="mt-1 text-sm sm:text-base" style={{ color: 'var(--muted)' }}>Bienvenido a tu panel de control</p>
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
              ['pro', 'avanzado'].includes(b.subscription_tier) && !b.bank_clabe
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
          {selectedBusiness && selectedBusiness.subscription_tier !== 'avanzado' && (
            <UpgradeBanner
              currentPlan={selectedBusiness.subscription_tier}
              businessName={selectedBusiness.name}
            />
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
            <div className="bg-white rounded-2xl p-4 sm:p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--muted)' }}>Productos</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>{stats.totalProducts}</p>
                </div>
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-500 rounded-lg flex items-center justify-center text-xl sm:text-2xl">
                  📦
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--muted)' }}>Pedidos</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>{stats.totalOrders}</p>
                </div>
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-green-500 rounded-lg flex items-center justify-center text-xl sm:text-2xl">
                  🛒
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--muted)' }}>Hoy</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>{stats.todayOrders}</p>
                </div>
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-purple-500 rounded-lg flex items-center justify-center text-xl sm:text-2xl">
                  📅
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium" style={{ color: 'var(--muted)' }}>Ingresos este mes</p>
                  <p className="text-2xl sm:text-3xl font-bold mt-1 sm:mt-2" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>
                    ${stats.monthRevenue.toLocaleString('es-MX')}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-yellow-500 rounded-lg flex items-center justify-center text-xl sm:text-2xl">
                  💰
                </div>
              </div>
            </div>
          </div>

          {/* Mis Negocios */}
          <div className="bg-white rounded-2xl overflow-hidden mb-8" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              <h2 className="text-xl font-bold" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>Mis Negocios</h2>
              <Link
                href="/registrar-negocio"
                className="px-4 py-2 text-white text-sm font-semibold rounded-full transition-colors"
                style={{ background: 'var(--coral)' }}
              >
                + Agregar Negocio
              </Link>
            </div>
            <div className="p-6 space-y-4">
              {businesses.map((business) => (
                <div
                  key={business.id}
                  className="p-4 rounded-xl transition-colors"
                  style={{ border: '1px solid rgba(0,0,0,0.07)' }}
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    {business.logo_url ? (
                      <Image
                        src={business.logo_url}
                        alt={business.name}
                        width={64}
                        height={64}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,var(--coral),var(--gold))' }}>
                        <span className="text-white text-xl sm:text-2xl font-bold">
                          {business.name[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-semibold truncate" style={{ color: 'var(--ink)' }}>{business.name}</h3>
                        <OpenClosedBadge businessHours={business.business_hours} />
                      </div>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>{business.category?.name || 'Sin categoría'}</p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full capitalize ${
                            planColors[business.subscription_tier]
                          }`}
                        >
                          {planLabels[business.subscription_tier]}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
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
                  <div className="flex gap-2 mt-3">
                    <Link
                      href={`/dashboard/mi-negocio?id=${business.id}`}
                      className="flex-1 px-3 py-2 text-sm text-white font-semibold rounded-xl transition-colors text-center"
                      style={{ background: 'var(--coral)' }}
                    >
                      Ver Detalles
                    </Link>
                    <Link
                      href={`/negocios/${business.slug}`}
                      target="_blank"
                      className="flex-1 px-3 py-2 text-sm font-semibold rounded-xl transition-colors text-center"
                      style={{ border: '1px solid rgba(0,0,0,0.12)', color: 'var(--ink-soft)' }}
                    >
                      Ver Público
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
              className="text-white rounded-2xl p-6 transition-all flex items-center justify-between group"
              style={{ background: 'linear-gradient(135deg,var(--coral),var(--coral-deep,#E2541F))' }}
            >
              <div>
                <h3 className="text-lg font-semibold">Gestionar Productos</h3>
                <p className="text-sm opacity-90 mt-1">Agrega y edita productos</p>
              </div>
              <span className="text-3xl group-hover:scale-110 transition-transform">📦</span>
            </Link>

            <Link
              href="/dashboard/pedidos"
              className="bg-white rounded-2xl p-6 transition-all flex items-center justify-between group"
              style={{ boxShadow: 'var(--shadow-card)', border: '2px solid transparent' }}
            >
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Ver Pedidos</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Gestiona tus ventas</p>
              </div>
              <span className="text-3xl group-hover:scale-110 transition-transform">🛒</span>
            </Link>

            <Link
              href="/dashboard/estadisticas"
              className="bg-white rounded-2xl p-6 transition-all flex items-center justify-between group"
              style={{ boxShadow: 'var(--shadow-card)', border: '2px solid transparent' }}
            >
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Estadísticas</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Analiza tus ventas</p>
              </div>
              <span className="text-3xl group-hover:scale-110 transition-transform">📈</span>
            </Link>
          </div>

          {/* QR Code */}
          {selectedBusiness && (
            <div className="mt-8">
              <BusinessQR
                businessName={selectedBusiness.name}
                businessSlug={selectedBusiness.slug}
              />
            </div>
          )}
        </>
      ) : (
        /* No tiene negocios */
        <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--cream)' }}>
            <span className="text-5xl">🏪</span>
          </div>
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>No tienes negocios registrados</h2>
          <p className="mb-6" style={{ color: 'var(--muted)' }}>
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
