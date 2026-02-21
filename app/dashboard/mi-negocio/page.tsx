export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'
import { formatCurrency, formatDaysRemaining } from '@/lib/utils'
import { GALLERY_PHOTO_LIMITS, type SubscriptionTier } from '@/lib/constants'
import EditBusinessForm from '@/components/dashboard/EditBusinessForm'

interface Business {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  phone: string
  whatsapp: string | null
  email: string | null
  address: string
  subscription_tier: string
  subscription_expires_at: string | null
  is_active: boolean
  category_id: string | null
  category: { id: string; name: string; icon: string } | null
  business_type: 'productos' | 'servicios' | 'ambos'
  // Datos bancarios
  bank_name: string | null
  bank_account_holder: string | null
  bank_account_number: string | null
  bank_clabe: string | null
  // Pagos con tarjeta
  payment_mode: 'platform' | 'direct' | null
  conekta_private_key: string | null
  mercadopago_access_token: string | null
  active_payment_gateways: string[] | null
}

interface OrderStat {
  total: number
  status: string
  created_at: string
}

interface RecentOrder {
  id: string
  order_number: string
  total: number
  status: string
  created_at: string
}

export default async function MiNegocioPage({
  searchParams,
}: {
  searchParams: { id?: string }
}) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()

  // Get user's businesses
  const { data: businesses } = await supabase
    .from('businesses')
    .select(`
      *,
      category:categories(id, name, icon)
    `)
    .eq('owner_id', user.id) as { data: Business[] | null }

  if (!businesses || businesses.length === 0) {
    redirect('/dashboard')
  }

  // Determine which business to show
  const cookieStore = await cookies()
  const selectedBusinessId = searchParams.id || cookieStore.get('selected_business_id')?.value

  const business = selectedBusinessId
    ? businesses.find(b => b.id === selectedBusinessId) || businesses[0]
    : businesses[0]

  // Get stats for this business
  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)

  const { data: ordersData } = await supabase
    .from('orders')
    .select('total, status, created_at')
    .eq('business_id', business.id) as unknown as { data: OrderStat[] | null }

  const { data: recentOrders } = await supabase
    .from('orders')
    .select('id, order_number, total, status, created_at')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(5) as unknown as { data: RecentOrder[] | null }

  // Get gallery photos
  const { data: businessPhotos } = await supabase
    .from('business_photos')
    .select('*')
    .eq('business_id', business.id)
    .order('display_order', { ascending: true })

  const tier = business.subscription_tier as SubscriptionTier
  const photoLimit = GALLERY_PHOTO_LIMITS[tier] || 10

  // Calculate revenue stats
  const orders = ordersData || []
  const completedOrders = orders.filter(o => o.status === 'completed')
  const pendingOrders = orders.filter(o => o.status === 'pending')
  const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total || 0), 0)

  // Monthly revenue
  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)
  const monthlyRevenue = completedOrders
    .filter(o => new Date(o.created_at) >= thisMonth)
    .reduce((sum, o) => sum + (o.total || 0), 0)

  // Get categories for the form
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  const daysInfo = formatDaysRemaining(business.subscription_expires_at)

  const planFeatures: Record<string, string[]> = {
    basico: ['Listado en directorio', 'Perfil básico', 'Contacto WhatsApp'],
    ventas: ['Todo de Básico', 'Catálogo de productos', 'Pedidos online', 'Pago por transferencia'],
    delivery: ['Todo de Ventas', 'Pasarela de pago', 'WhatsApp automático', 'Motomandados'],
    premium: ['Todo de Delivery', 'Negocio destacado', 'Soporte prioritario', 'Estadísticas avanzadas'],
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Mi Negocio</h1>
          <p className="text-sm text-gray-600">Gestiona la información de {business.name}</p>
        </div>
        <Link
          href={`/negocios/${business.slug}`}
          target="_blank"
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors text-sm text-center"
        >
          Ver Perfil Público →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Business Info & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Card */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-start gap-4">
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
                <h2 className="text-xl font-bold text-gray-900">{business.name}</h2>
                <p className="text-gray-600 text-sm">{business.category?.name || 'Sin categoría'}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                    business.subscription_tier === 'premium' ? 'bg-purple-100 text-purple-800' :
                    business.subscription_tier === 'delivery' ? 'bg-blue-100 text-blue-800' :
                    business.subscription_tier === 'ventas' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    Plan {business.subscription_tier}
                  </span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    business.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {business.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className={`text-sm mt-2 ${daysInfo.color}`}>
                  {daysInfo.urgent && '⚠️ '}{daysInfo.text}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500">Productos</p>
              <p className="text-2xl font-bold text-gray-900">{productsCount || 0}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500">Pedidos Totales</p>
              <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500">Pendientes</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4">
              <p className="text-sm text-gray-500">Ingresos Mes</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(monthlyRevenue)}</p>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Últimos Pedidos</h3>
              <Link href="/dashboard/pedidos" className="text-primary text-sm hover:underline">
                Ver todos →
              </Link>
            </div>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
                  <div key={order.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">#{order.order_number}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString('es-MX')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatCurrency(order.total)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                No hay pedidos aún
              </div>
            )}
          </div>

          {/* Edit Form */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Editar Información</h3>
            <EditBusinessForm
              business={{
                ...business,
                latitude: (business as any).latitude ?? null,
                longitude: (business as any).longitude ?? null,
                has_conekta_key: !!business.conekta_private_key,
                has_mercadopago_key: !!business.mercadopago_access_token,
                active_payment_gateways: business.active_payment_gateways || [],
              }}
              categories={categories || []}
              initialPhotos={businessPhotos || []}
              subscriptionTier={business.subscription_tier}
              photoLimit={photoLimit}
            />
          </div>
        </div>

        {/* Right Column - Plan & Quick Actions */}
        <div className="space-y-6">
          {/* Plan Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Tu Plan: {business.subscription_tier}</h3>
            <ul className="space-y-2">
              {planFeatures[business.subscription_tier]?.map((feature, i) => (
                <li key={i} className="flex items-center text-sm text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            {business.subscription_tier !== 'premium' && (
              <Link
                href="/dashboard/pago"
                className="block mt-4 w-full py-2 bg-primary hover:bg-primary-dark text-white text-center font-medium rounded-lg transition-colors"
              >
                Mejorar Plan
              </Link>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Acciones Rápidas</h3>
            <div className="space-y-2">
              <Link
                href="/dashboard/productos/nuevo"
                className="block w-full py-2 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 text-center font-medium rounded-lg transition-colors"
              >
                + Agregar Producto
              </Link>
              <Link
                href="/dashboard/pedidos"
                className="block w-full py-2 px-4 bg-green-50 hover:bg-green-100 text-green-700 text-center font-medium rounded-lg transition-colors"
              >
                Ver Pedidos
              </Link>
              <Link
                href={`/negocios/${business.slug}`}
                target="_blank"
                className="block w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 text-center font-medium rounded-lg transition-colors"
              >
                Ver Perfil Público
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Información de Contacto</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">📞</span>
                <span>{business.phone || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">💬</span>
                <span>{business.whatsapp || 'Sin WhatsApp'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">📍</span>
                <span>{business.address || 'Sin dirección'}</span>
              </div>
              {business.email && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">✉️</span>
                  <span>{business.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
            <h3 className="font-medium opacity-90">Ingresos Totales</h3>
            <p className="text-3xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
            <p className="text-sm opacity-75 mt-1">{completedOrders.length} pedidos completados</p>
          </div>
        </div>
      </div>
    </div>
  )
}
