export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { formatCurrency, formatDaysRemaining } from '@/lib/utils'
import BusinessDetailActions from '@/components/admin/BusinessDetailActions'
import BusinessQR from '@/components/dashboard/BusinessQR'
import nextDynamic from 'next/dynamic'

const AdminViewsCharts = nextDynamic(() => import('@/components/admin/AdminViewsCharts'), {
  loading: () => <div className="h-96 bg-gray-50 rounded-xl animate-pulse" />,
  ssr: false,
})

interface PageProps {
  params: { id: string }
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
  const supabase = createServiceClient()

  // Get business with all details
  const { data: business, error } = await supabase
    .from('businesses')
    .select(`
      *,
      category:categories(id, name, icon),
      owner:profiles!businesses_owner_id_fkey(id, full_name, email, phone)
    `)
    .eq('id', params.id)
    .single()

  if (error || !business) {
    notFound()
  }

  // Get products count and list
  const { data: products, count: productsCount } = await supabase
    .from('products')
    .select('id, name, price, is_available', { count: 'exact' })
    .eq('business_id', params.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get orders with stats
  const { data: orders, count: ordersCount } = await supabase
    .from('orders')
    .select('id, order_number, total, status, payment_method, payment_status, created_at', { count: 'exact' })
    .eq('business_id', params.id)
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
      .eq('business_id', params.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('business_views')
      .select('id', { count: 'exact', head: true })
      .eq('business_id', params.id)
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/negocios"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ← Volver
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
            <p className="text-gray-600">{business.category?.name || 'Sin categoría'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/negocios/${business.id}/editar`}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg transition-colors"
          >
            Editar
          </Link>
          <Link
            href={`/negocios/${business.slug}`}
            target="_blank"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Ver Perfil Público →
          </Link>
          <BusinessDetailActions business={business} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start gap-6">
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={business.name}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-xl object-cover"
                />
              ) : (
                <div className="w-24 h-24 bg-primary rounded-xl flex items-center justify-center">
                  <span className="text-4xl text-white font-bold">
                    {business.name[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${currentPlanInfo.color}`}>
                    Plan {currentPlanInfo.label}
                  </span>
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                    business.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {business.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                  {business.is_featured && (
                    <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      ⭐ Destacado
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-4">{business.description || 'Sin descripción'}</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Teléfono:</span>
                    <span className="ml-2 font-medium">{business.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">WhatsApp:</span>
                    <span className="ml-2 font-medium">{business.whatsapp || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <span className="ml-2 font-medium">{business.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Dirección:</span>
                    <span className="ml-2 font-medium">{business.address}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📦</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{productsCount || 0}</p>
                  <p className="text-xs text-gray-500">Productos</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🛒</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{ordersCount || 0}</p>
                  <p className="text-xs text-gray-500">Pedidos Total</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">⏳</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-yellow-600">{pendingOrders}</p>
                  <p className="text-xs text-gray-500">Pendientes</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">💰</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
                  <p className="text-xs text-gray-500">Ingresos Total</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">👁</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-teal-600">{totalViews}</p>
                  <p className="text-xs text-gray-500">Visitas</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Últimos Pedidos</h3>
              <span className="text-sm text-gray-500">Este mes: {formatCurrency(thisMonthRevenue)}</span>
            </div>
            {typedOrders.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {typedOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">#{order.order_number}</p>
                      <p className="text-sm text-gray-500">
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
                      <span className="font-bold text-gray-900">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <span className="text-4xl block mb-2">📭</span>
                <p>No hay pedidos aún</p>
              </div>
            )}
          </div>

          {/* Products Preview */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Productos ({productsCount || 0})</h3>
            </div>
            {(products as ProductData[] || []).length > 0 ? (
              <div className="divide-y divide-gray-100">
                {(products as ProductData[]).map((product) => (
                  <div key={product.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <span className={`text-xs ${product.is_available ? 'text-green-600' : 'text-red-600'}`}>
                        {product.is_available ? 'Disponible' : 'No disponible'}
                      </span>
                    </div>
                    <span className="font-bold text-primary">{formatCurrency(product.price)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
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
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Suscripción</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Plan Actual</span>
                <span className={`px-3 py-1 text-sm font-bold rounded-full ${currentPlanInfo.color}`}>
                  {currentPlanInfo.label} - ${currentPlanInfo.price}/mes
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Estado</span>
                <span className={`font-semibold ${
                  business.subscription_status === 'active' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {business.subscription_status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Días Restantes</span>
                <span className={`font-semibold ${daysInfo.color}`}>
                  {daysInfo.text}
                </span>
              </div>

              {business.subscription_expires_at && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Vence</span>
                  <span className="text-gray-900">
                    {new Date(business.subscription_expires_at).toLocaleDateString('es-MX', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Registrado el</p>
                <p className="font-medium">
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
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Dueño del Negocio</h3>

            {business.owner ? (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-500">Nombre</p>
                  <p className="font-medium">{business.owner.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{business.owner.email}</p>
                </div>
                {business.owner.phone && (
                  <div>
                    <p className="text-sm text-gray-500">Teléfono</p>
                    <p className="font-medium">{business.owner.phone}</p>
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
                <p className="text-sm text-gray-500">
                  Este negocio no tiene un dueño vinculado. Puedes asignar uno desde la tabla de negocios o al editar.
                </p>
                <Link
                  href={`/admin/negocios/${business.id}/editar`}
                  className="inline-flex items-center px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
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
            <div className="bg-gradient-to-br from-primary to-primary-dark rounded-xl shadow-sm p-6 text-white">
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
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Resumen Rápido</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Pedidos completados</span>
                <span className="font-bold text-green-600">{completedOrders.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Pedidos este mes</span>
                <span className="font-bold">{thisMonthOrders.length}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Ticket promedio</span>
                <span className="font-bold">
                  {completedOrders.length > 0
                    ? formatCurrency(totalRevenue / completedOrders.length)
                    : '$0'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Productos activos</span>
                <span className="font-bold">
                  {(products as ProductData[] || []).filter(p => p.is_available).length}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-600">Visitas este mes</span>
                <span className="font-bold text-teal-600">{viewsThisMonth || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
