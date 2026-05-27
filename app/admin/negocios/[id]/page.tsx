export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { formatCurrency, formatDaysRemaining } from '@/lib/utils'
import BusinessDetailActions from '@/components/admin/BusinessDetailActions'
import BusinessQR from '@/components/dashboard/BusinessQR'
import AdminViewsCharts from '@/components/admin/AdminViewsCharts'

interface PageProps {
  params: Promise<{ id: string }>
}

interface OrderData {
  id: string
  order_number: string
  total: number
  status: string
  payment_method: string
  payment_status: string
  created_at: string
}

interface ProductData {
  id: string
  name: string
  price: number
  is_available: boolean
}

export default async function BusinessDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createServiceClient()

  // Get business with all details
  const { data: business, error } = await supabase
    .from('businesses')
    .select(`
      *,
      category:categories(id, name, icon),
      owner:profiles!businesses_owner_id_fkey(id, full_name, email, phone)
    `)
    .eq('id', id)
    .single()

  if (error || !business) {
    notFound()
  }

  // Get products count and list
  const { data: products, count: productsCount } = await supabase
    .from('products')
    .select('id, name, price, is_available', { count: 'exact' })
    .eq('business_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get orders with stats
  const { data: orders, count: ordersCount } = await supabase
    .from('orders')
    .select('id, order_number, total, status, payment_method, payment_status, created_at', { count: 'exact' })
    .eq('business_id', id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get views data (last 30 days + this month count)
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [viewsLast30Result, viewsThisMonthResult] = await Promise.all([
    supabase
      .from('business_views')
      .select('created_at, ip_hash, referrer, user_agent')
      .eq('business_id', id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('business_views')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', id)
      .gte('created_at', firstOfMonth.toISOString()),
  ])

  const viewsLast30 = viewsLast30Result.data || []
  const viewsThisMonth = viewsThisMonthResult.count || 0
  const totalViews = business.total_views || 0

  // Views by day (last 30 days)
  const last30DaysArr = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })

  const viewsByDay = last30DaysArr.map(day => {
    const dayViews = viewsLast30.filter((v: any) => v.created_at.split('T')[0] === day)
    const uniqueIps = new Set(dayViews.map((v: any) => v.ip_hash))
    return { date: day, visitas: dayViews.length, unicos: uniqueIps.size }
  })

  // Top referrers
  const referrerCounts: Record<string, number> = {}
  viewsLast30.forEach((v: any) => {
    let source = 'Directo'
    if (v.referrer) {
      if (v.referrer.includes('/buscar')) source = 'Buscador'
      else if (v.referrer.includes('/categorias')) source = 'Categorias'
      else if (v.referrer.includes('somoslagos.com.mx')) source = 'Home / Otro'
      else if (v.referrer.includes('google')) source = 'Google'
      else if (v.referrer.includes('facebook')) source = 'Facebook'
      else if (v.referrer.includes('instagram')) source = 'Instagram'
      else source = 'Externo'
    }
    referrerCounts[source] = (referrerCounts[source] || 0) + 1
  })
  const topReferrers = Object.entries(referrerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }))

  // Devices (mobile vs desktop)
  let mobileCount = 0
  let desktopCount = 0
  viewsLast30.forEach((v: any) => {
    if (v.user_agent && /mobile|android|iphone|ipad/i.test(v.user_agent)) {
      mobileCount++
    } else {
      desktopCount++
    }
  })
  const devicesData = [
    { name: 'Movil', value: mobileCount },
    { name: 'Escritorio', value: desktopCount },
  ].filter(d => d.value > 0)

  // Calculate stats
  const typedOrders = (orders || []) as OrderData[]
  const completedOrders = typedOrders.filter(o => o.status === 'completed')
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0)
  const pendingOrders = typedOrders.filter(o => o.status === 'pending').length
  const thisMonthOrders = typedOrders.filter(o => {
    const orderDate = new Date(o.created_at)
    const now = new Date()
    return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()
  })
  const thisMonthRevenue = thisMonthOrders
    .filter(o => o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0)

  const daysInfo = formatDaysRemaining(business.subscription_expires_at)

  // Plan info for suggestions
  const planInfo: Record<string, {
    label: string
    color: string
    nextPlan: string | null
    suggestions: string[]
    price: number
  }> = {
    gratis: {
      label: 'Gratis',
      color: 'bg-gray-100 text-gray-800',
      nextPlan: 'pro',
      price: 0,
      suggestions: [
        'Sube al Plan Pro para agregar productos y recibir pedidos',
        'Podrías aumentar tus ventas 3x con un catálogo en línea',
        'Tus clientes podrían ordenar directo desde el directorio',
      ]
    },
    pro: {
      label: 'Pro',
      color: 'bg-green-100 text-green-800',
      nextPlan: 'avanzado',
      price: 150,
      suggestions: [
        'Sube al Plan Avanzado para aparecer primero en búsquedas',
        'Obtén estadísticas avanzadas de tu negocio',
        'Destaca sobre tu competencia con la insignia Avanzado',
      ]
    },
    avanzado: {
      label: 'Avanzado',
      color: 'bg-purple-100 text-purple-800',
      nextPlan: null,
      price: 260,
      suggestions: [
        '¡Ya tienes el mejor plan! Aprovecha todas las funciones',
        'Revisa tus estadísticas avanzadas regularmente',
        'Usa promociones y cupones para atraer más clientes',
      ]
    },
  }

  const currentPlanInfo = planInfo[business.subscription_tier] || planInfo.gratis

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-3">
          <Link
            href="/admin/negocios"
            className="p-2 rounded-xl transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            ← Volver
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl md:text-2xl font-bold truncate" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>{business.name}</h1>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>{business.category?.name || 'Sin categoría'}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/admin/negocios/${business.id}/editar`}
            className="px-3 py-1.5 text-sm font-medium rounded-xl transition-colors"
            style={{ background: 'rgba(255,107,53,0.08)', color: 'var(--coral)' }}
          >
            Editar
          </Link>
          <Link
            href={`/negocios/${business.slug}`}
            target="_blank"
            className="px-3 py-1.5 text-sm font-medium rounded-xl transition-colors"
            style={{ background: 'var(--cream)', color: 'var(--ink-soft)' }}
          >
            Ver Público
          </Link>
          <BusinessDetailActions business={business} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Card */}
          <div className="bg-white rounded-2xl p-4 md:p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={business.name}
                  width={96}
                  height={96}
                  className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,var(--coral),var(--gold))' }}>
                  <span className="text-2xl sm:text-4xl text-white font-bold">
                    {business.name[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${currentPlanInfo.color}`}>
                    Plan {currentPlanInfo.label}
                  </span>
                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                    business.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {business.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  {business.is_featured && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      ⭐ Destacado
                    </span>
                  )}
                </div>
                <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>{business.description || 'Sin descripción'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Tel:</span>
                    <span className="ml-1 font-medium" style={{ color: 'var(--ink-soft)' }}>{business.phone}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>WA:</span>
                    <span className="ml-1 font-medium" style={{ color: 'var(--ink-soft)' }}>{business.whatsapp || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Email:</span>
                    <span className="ml-1 font-medium break-all" style={{ color: 'var(--ink-soft)' }}>{business.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--muted)' }}>Dir:</span>
                    <span className="ml-1 font-medium" style={{ color: 'var(--ink-soft)' }}>{business.address}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📦</span>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--ink)', fontFamily: 'var(--display)' }}>{productsCount || 0}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Productos</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🛒</span>
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--ink)', fontFamily: 'var(--display)' }}>{ordersCount || 0}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Pedidos Total</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⏳</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600" style={{ fontFamily: 'var(--display)' }}>{pendingOrders}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Pendientes</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600" style={{ fontFamily: 'var(--display)' }}>{formatCurrency(totalRevenue)}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Ingresos Total</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">👁</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-teal-600" style={{ fontFamily: 'var(--display)' }}>{totalViews}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Visitas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-1" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <h3 className="font-bold" style={{ color: 'var(--ink)' }}>Últimos Pedidos</h3>
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Este mes: {formatCurrency(thisMonthRevenue)}</span>
            </div>
            {typedOrders.length > 0 ? (
              <div>
                {typedOrders.slice(0, 5).map((order, i) => (
                  <div key={order.id} className="p-3 sm:p-4 flex items-center justify-between gap-2" style={i > 0 ? { borderTop: '1px solid rgba(0,0,0,0.05)' } : {}}>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--ink)' }}>#{order.order_number}</p>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>
                        {new Date(order.created_at).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                      <span className="font-bold" style={{ color: 'var(--coral)' }}>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>
                <span className="text-4xl block mb-2">📭</span>
                <p>No hay pedidos aún</p>
              </div>
            )}
          </div>

          {/* Products Preview */}
          <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
            <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
              <h3 className="font-bold" style={{ color: 'var(--ink)' }}>Productos ({productsCount || 0})</h3>
            </div>
            {(products as ProductData[] || []).length > 0 ? (
              <div>
                {(products as ProductData[]).map((product, i) => (
                  <div key={product.id} className="p-4 flex items-center justify-between" style={i > 0 ? { borderTop: '1px solid rgba(0,0,0,0.05)' } : {}}>
                    <div>
                      <p className="font-medium" style={{ color: 'var(--ink)' }}>{product.name}</p>
                      <span className={`text-xs ${product.is_available ? 'text-green-600' : 'text-red-600'}`}>
                        {product.is_available ? 'Disponible' : 'No disponible'}
                      </span>
                    </div>
                    <span className="font-bold" style={{ color: 'var(--coral)' }}>{formatCurrency(product.price)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>
                <span className="text-4xl block mb-2">📦</span>
                <p>No hay productos</p>
                {business.subscription_tier === 'gratis' && (
                  <p className="text-sm mt-2">Necesita Plan Pro o superior</p>
                )}
              </div>
            )}
          </div>

          {/* Views Analytics Charts */}
          <AdminViewsCharts
            viewsByDay={viewsByDay}
            topReferrers={topReferrers}
            devicesData={devicesData}
            totalViews={totalViews}
            viewsThisMonth={viewsThisMonth}
            viewsLast30={viewsLast30.length}
          />
        </div>

        {/* Right Column - Subscription & Owner */}
        <div className="space-y-6">
          {/* Subscription Card */}
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--ink)' }}>Suscripción</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--muted)' }}>Plan Actual</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-full ${currentPlanInfo.color}`}>
                  {currentPlanInfo.label} - ${currentPlanInfo.price}/mes
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--muted)' }}>Estado</span>
                <span className={`font-semibold ${
                  business.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {business.subscription_status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span style={{ color: 'var(--muted)' }}>Días Restantes</span>
                <span className={`font-semibold ${daysInfo.color}`}>
                  {daysInfo.text}
                </span>
              </div>

              {business.subscription_expires_at && (
                <div className="flex items-center justify-between">
                  <span style={{ color: 'var(--muted)' }}>Vence</span>
                  <span style={{ color: 'var(--ink)' }}>
                    {new Date(business.subscription_expires_at).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}

              <div className="pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                <p className="text-sm mb-2" style={{ color: 'var(--muted)' }}>Registrado el</p>
                <p className="font-medium" style={{ color: 'var(--ink-soft)' }}>
                  {new Date(business.created_at).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Owner Card */}
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--ink)' }}>Dueño del Negocio</h3>

            {business.owner ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>Nombre</p>
                  <p className="font-medium" style={{ color: 'var(--ink-soft)' }}>{business.owner.full_name}</p>
                </div>
                <div>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>Email</p>
                  <p className="font-medium" style={{ color: 'var(--ink-soft)' }}>{business.owner.email}</p>
                </div>
                {business.owner.phone && (
                  <div>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Teléfono</p>
                    <p className="font-medium" style={{ color: 'var(--ink-soft)' }}>{business.owner.phone}</p>
                  </div>
                )}
                <div className="pt-3">
                  <a
                    href={`https://wa.me/52${business.whatsapp || business.owner.phone || business.phone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                  >
                    💬 Contactar por WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-amber-100 text-amber-800">
                  Sin dueño asignado
                </span>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  Este negocio no tiene un dueño vinculado. Puedes asignar uno desde la tabla de negocios o al editar.
                </p>
                <Link
                  href={`/admin/negocios/${business.id}/editar`}
                  className="inline-flex items-center px-4 py-2 text-white font-medium rounded-lg transition-colors"
                  style={{ background: 'var(--coral)' }}
                >
                  Asignar Dueño
                </Link>
              </div>
            )}
          </div>

          {/* QR Code */}
          <BusinessQR businessName={business.name} businessSlug={business.slug} />

          {/* Upgrade Suggestions */}
          {currentPlanInfo.nextPlan && (
            <div className="rounded-2xl p-6 text-white" style={{ background: 'linear-gradient(135deg,var(--coral),#E2541F)', boxShadow: 'var(--shadow-card)' }}>
              <h3 className="font-bold mb-2">💡 Sugerencias de Mejora</h3>
              <p className="text-white/80 text-sm mb-4">
                Este negocio podría beneficiarse del siguiente plan:
              </p>
              <ul className="space-y-2 mb-4">
                {currentPlanInfo.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-green-300">→</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-white/20 rounded-lg p-3 text-center">
                <p className="text-sm opacity-80">Siguiente plan recomendado</p>
                <p className="text-xl font-bold capitalize">{currentPlanInfo.nextPlan}</p>
              </div>
            </div>
          )}

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--ink)' }}>Resumen Rápido</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <span style={{ color: 'var(--muted)' }}>Pedidos completados</span>
                <span className="font-bold text-green-600">{completedOrders.length}</span>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <span style={{ color: 'var(--muted)' }}>Pedidos este mes</span>
                <span className="font-bold" style={{ color: 'var(--ink)' }}>{thisMonthOrders.length}</span>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <span style={{ color: 'var(--muted)' }}>Ticket promedio</span>
                <span className="font-bold" style={{ color: 'var(--ink)' }}>
                  {completedOrders.length > 0
                    ? formatCurrency(totalRevenue / completedOrders.length)
                    : '$0'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <span style={{ color: 'var(--muted)' }}>Productos activos</span>
                <span className="font-bold" style={{ color: 'var(--ink)' }}>
                  {(products as ProductData[] || []).filter(p => p.is_available).length}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span style={{ color: 'var(--muted)' }}>Visitas este mes</span>
                <span className="font-bold text-teal-600">{viewsThisMonth || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
