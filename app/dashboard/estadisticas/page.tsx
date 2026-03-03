export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import nextDynamic from 'next/dynamic'

const StatsCharts = nextDynamic(() => import('@/components/dashboard/StatsCharts'), {
  loading: () => <div className="h-96 bg-gray-50 rounded-xl animate-pulse" />,
  ssr: false,
})

interface StatsBusiness {
  id: string
  name: string
  subscription_tier: string
}

interface OrderForStats {
  id: string
  total: number
  status: string
  payment_method: string
  created_at: string
}

interface OrderItemForStats {
  id: string
  product_name: string
  quantity: number
  subtotal: number
  order_id: string
}

interface ProductForStats {
  id: string
  name: string
  price: number
  is_available: boolean
}

export default async function EstadisticasPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const cookieStore = cookies()
  const selectedBusinessId = cookieStore.get('selected_business_id')?.value

  const supabase = createClient()

  // Get user's businesses
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name, subscription_tier')
    .eq('owner_id', user.id)
    .eq('is_active', true) as { data: StatsBusiness[] | null }

  if (!businesses || businesses.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No tienes negocios registrados.</p>
      </div>
    )
  }

  const currentBusinessId = selectedBusinessId && businesses.some(b => b.id === selectedBusinessId)
    ? selectedBusinessId
    : businesses[0].id

  const currentBusiness = businesses.find(b => b.id === currentBusinessId)!

  // Check if business has premium plan
  const hasPremiumStats = currentBusiness.subscription_tier === 'avanzado'

  if (!hasPremiumStats) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Estadísticas</h1>

        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">📊</span>
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Estadísticas Avanzadas
          </h2>
          <p className="text-white/90 mb-6 max-w-md mx-auto">
            Obtén insights detallados de tu negocio con gráficos profesionales,
            productos más vendidos, tendencias de ventas y mucho más.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 rounded-xl p-4">
              <span className="text-3xl block mb-2">📈</span>
              <p className="text-sm">Gráficos de Ventas</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <span className="text-3xl block mb-2">🏆</span>
              <p className="text-sm">Top Productos</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <span className="text-3xl block mb-2">💳</span>
              <p className="text-sm">Métodos de Pago</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <span className="text-3xl block mb-2">📅</span>
              <p className="text-sm">Tendencias</p>
            </div>
          </div>

          <div className="bg-white/20 rounded-xl p-4 mb-6">
            <p className="text-sm mb-2">Esta función está disponible en el</p>
            <p className="text-2xl font-bold">Plan Avanzado - $180/mes</p>
          </div>

          <Link
            href="/dashboard/suscripcion"
            className="inline-flex items-center px-8 py-4 bg-white text-purple-600 font-bold rounded-xl hover:bg-gray-100 transition-colors shadow-lg"
          >
            ⭐ Actualizar a Avanzado
          </Link>
        </div>
      </div>
    )
  }

  // Fetch views data
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 30)
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [viewsResult, viewsThisMonthResult, totalViewsResult] = await Promise.all([
    supabase
      .from('business_views')
      .select('created_at, ip_hash, referrer, user_agent')
      .eq('business_id', currentBusinessId)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true }),
    supabase
      .from('business_views')
      .select('ip_hash')
      .eq('business_id', currentBusinessId)
      .gte('created_at', firstOfMonth.toISOString()),
    supabase
      .from('businesses')
      .select('total_views')
      .eq('id', currentBusinessId)
      .single(),
  ])

  const viewsLast30 = viewsResult.data || []
  const viewsThisMonth = viewsThisMonthResult.data || []
  const totalViews = (totalViewsResult.data as any)?.total_views || 0
  const uniqueThisMonth = new Set(viewsThisMonth.map((v: any) => v.ip_hash)).size

  // Views by day (last 30 days)
  const last30DaysForViews = Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toISOString().split('T')[0]
  })

  const viewsByDay = last30DaysForViews.map(day => {
    const dayViews = viewsLast30.filter((v: any) => v.created_at.split('T')[0] === day)
    const uniqueIps = new Set(dayViews.map((v: any) => v.ip_hash))
    return {
      date: day,
      visitas: dayViews.length,
      unicos: uniqueIps.size,
    }
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

  // Fetch all data for premium users
  const [ordersResult, orderItemsResult, productsResult] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total, status, payment_method, created_at')
      .eq('business_id', currentBusinessId)
      .order('created_at', { ascending: false }),
    supabase
      .from('order_items')
      .select('id, product_name, quantity, subtotal, order_id')
      .in('order_id', (await supabase
        .from('orders')
        .select('id')
        .eq('business_id', currentBusinessId)).data?.map((o: any) => o.id) || []),
    supabase
      .from('products')
      .select('id, name, price, is_available')
      .eq('business_id', currentBusinessId)
  ])

  const orders = (ordersResult.data || []) as OrderForStats[]
  const orderItems = (orderItemsResult.data || []) as OrderItemForStats[]
  const products = (productsResult.data || []) as ProductForStats[]

  // Calculate stats
  const completedOrders = orders.filter(o => o.status === 'completed')
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0)
  const avgTicket = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0

  // Sales by day (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return date.toISOString().split('T')[0]
  })

  const salesByDay = last30Days.map(day => {
    const dayOrders = completedOrders.filter(o =>
      o.created_at.split('T')[0] === day
    )
    return {
      date: day,
      ventas: dayOrders.reduce((sum, o) => sum + o.total, 0),
      pedidos: dayOrders.length
    }
  })

  // Sales by month (last 6 months)
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - i))
    return {
      month: date.toLocaleString('es-MX', { month: 'short' }),
      year: date.getFullYear(),
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    }
  })

  const salesByMonth = last6Months.map(({ month, key }) => {
    const monthOrders = completedOrders.filter(o =>
      o.created_at.startsWith(key)
    )
    return {
      name: month,
      ventas: monthOrders.reduce((sum, o) => sum + o.total, 0),
      pedidos: monthOrders.length
    }
  })

  // Top products
  const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {}
  orderItems.forEach(item => {
    if (!productSales[item.product_name]) {
      productSales[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 }
    }
    productSales[item.product_name].quantity += item.quantity
    productSales[item.product_name].revenue += item.subtotal
  })
  const topProducts = Object.values(productSales)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  // Payment methods distribution
  const paymentMethods = orders.reduce((acc, order) => {
    const method = order.payment_method || 'otro'
    acc[method] = (acc[method] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const paymentMethodsData = Object.entries(paymentMethods).map(([name, value]) => ({
    name: name === 'cash' ? 'Efectivo' :
          name === 'transfer' ? 'Transferencia' :
          name === 'card' ? 'Tarjeta' : name,
    value
  }))

  // Order status distribution
  const orderStatuses = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const orderStatusData = Object.entries(orderStatuses).map(([name, value]) => ({
    name: name === 'completed' ? 'Completados' :
          name === 'pending' ? 'Pendientes' :
          name === 'cancelled' ? 'Cancelados' :
          name === 'preparing' ? 'Preparando' : name,
    value
  }))

  // This week vs last week
  const today = new Date()
  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(today.getDate() - today.getDay())
  const lastWeekStart = new Date(thisWeekStart)
  lastWeekStart.setDate(lastWeekStart.getDate() - 7)

  const thisWeekOrders = completedOrders.filter(o => new Date(o.created_at) >= thisWeekStart)
  const lastWeekOrders = completedOrders.filter(o => {
    const date = new Date(o.created_at)
    return date >= lastWeekStart && date < thisWeekStart
  })

  const thisWeekRevenue = thisWeekOrders.reduce((sum, o) => sum + o.total, 0)
  const lastWeekRevenue = lastWeekOrders.reduce((sum, o) => sum + o.total, 0)
  const revenueGrowth = lastWeekRevenue > 0
    ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue * 100).toFixed(1)
    : thisWeekRevenue > 0 ? '100' : '0'

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-bold rounded-full">
              ⭐ Avanzado
            </span>
          </div>
          <p className="text-gray-600">{currentBusiness.name}</p>
        </div>
      </div>

      {/* Views KPI Cards */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs sm:text-sm">Visitas Totales</span>
            <span className="text-xl sm:text-2xl">👁</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">desde el inicio</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs sm:text-sm">Visitas Este Mes</span>
            <span className="text-xl sm:text-2xl">📅</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{viewsThisMonth.length.toLocaleString()}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{uniqueThisMonth} visitantes unicos</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs sm:text-sm">Ultimos 30 Dias</span>
            <span className="text-xl sm:text-2xl">📊</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{viewsLast30.length.toLocaleString()}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{new Set(viewsLast30.map((v: any) => v.ip_hash)).size} unicos</p>
        </div>
      </div>

      {/* Sales KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs sm:text-sm">Ingresos</span>
            <span className="text-xl sm:text-2xl">💰</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{completedOrders.length} completados</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs sm:text-sm">Semana</span>
            <span className="text-xl sm:text-2xl">📈</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{formatCurrency(thisWeekRevenue)}</p>
          <p className={`text-xs sm:text-sm mt-1 ${Number(revenueGrowth) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Number(revenueGrowth) >= 0 ? '↑' : '↓'} {Math.abs(Number(revenueGrowth))}%
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs sm:text-sm">Promedio</span>
            <span className="text-xl sm:text-2xl">🎫</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{formatCurrency(avgTicket)}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">por pedido</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-500 text-xs sm:text-sm">Productos</span>
            <span className="text-xl sm:text-2xl">📦</span>
          </div>
          <p className="text-xl sm:text-3xl font-bold text-gray-900">{products.length}</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">{products.filter(p => p.is_available).length} disponibles</p>
        </div>
      </div>

      {/* Charts Component (Client) */}
      <StatsCharts
        salesByDay={salesByDay}
        salesByMonth={salesByMonth}
        topProducts={topProducts}
        paymentMethodsData={paymentMethodsData}
        orderStatusData={orderStatusData}
        viewsByDay={viewsByDay}
        topReferrers={topReferrers}
        devicesData={devicesData}
      />

      {/* Top Products */}
      <div className="mt-8 bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900">🏆 Productos Más Vendidos</h3>
        </div>
        {topProducts.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center gap-3 px-4 py-3">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-400' : 'bg-gray-300'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.quantity} unidades</p>
                </div>
                <span className="font-bold text-green-600 text-sm flex-shrink-0">{formatCurrency(product.revenue)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No hay datos de ventas aún</p>
          </div>
        )}
      </div>
    </div>
  )
}
