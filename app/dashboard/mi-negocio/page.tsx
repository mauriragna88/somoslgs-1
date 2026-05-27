export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'
import { formatCurrency, formatDaysRemaining } from '@/lib/utils'
import { GALLERY_PHOTO_LIMITS, PRODUCTS_ENABLED_TIERS, type SubscriptionTier } from '@/lib/constants'
import EditBusinessForm from '@/components/dashboard/EditBusinessForm'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'

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
  business_hours: any
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
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

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
  const selectedBusinessId = id || cookieStore.get('selected_business_id')?.value

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

  const canProducts = PRODUCTS_ENABLED_TIERS.includes(business.subscription_tier)

  const planFeatures: Record<string, string[]> = {
    gratis: ['Aparece en el buscador', 'WhatsApp y telefono', 'Mapa con ubicacion', 'Hasta 3 fotos'],
    emprendedor: ['Todo de Gratis', 'Portada personalizada', 'Redes sociales', 'Hasta 8 fotos'],
    pro: ['Todo de Emprendedor', 'Catalogo de productos', 'Pedidos en linea', 'Pagos transferencia/tarjeta', 'Hasta 15 fotos'],
    avanzado: ['Todo de Pro', 'Destacado en busquedas', 'Badge verificado', 'Estadisticas avanzadas', 'Hasta 20 fotos'],
  }

  const nextPlan: Record<string, { name: string; price: string; daily: string }> = {
    gratis: { name: 'Emprendedor', price: '$60 MXN/mes', daily: '$2 MXN/día' },
    emprendedor: { name: 'Pro', price: '$120 MXN/mes', daily: '$4 MXN/día' },
    pro: { name: 'Avanzado', price: '$180 MXN/mes', daily: '$6 MXN/día' },
  }

  const upgrade = nextPlan[business.subscription_tier]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>Mi Negocio</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Gestiona la información de {business.name}</p>
        </div>
        <Link
          href={`/negocios/${business.slug}`}
          target="_blank"
          className="px-4 py-2 text-white font-medium rounded-xl transition-colors text-sm text-center"
          style={{ background: 'var(--coral)' }}
        >
          Ver Perfil Público →
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Business Info & Stats */}
        <div className="lg:col-span-2 space-y-6">
          {/* Business Card */}
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
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
                <div className="w-24 h-24 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,var(--coral),var(--gold))' }}>
                  <span className="text-4xl text-white font-bold">
                    {business.name[0].toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{business.name}</h2>
                  <OpenClosedBadge businessHours={business.business_hours} />
                </div>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{business.category?.name || 'Sin categoría'}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                    business.subscription_tier === 'avanzado' ? 'bg-purple-100 text-purple-800' :
                    business.subscription_tier === 'pro' ? 'bg-green-100 text-green-800' :
                    business.subscription_tier === 'emprendedor' ? 'bg-blue-100 text-blue-800' :
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

          {/* Stats - only show product/order stats for pro+ */}
          {canProducts ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Productos</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{productsCount || 0}</p>
              </div>
              <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Pedidos Totales</p>
                <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{orders.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</p>
              </div>
              <div className="bg-white rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>Ingresos Mes</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(monthlyRevenue)}</p>
              </div>
            </div>
          ) : (
            <div className="relative bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 opacity-40">
                <div><p className="text-sm" style={{ color: 'var(--muted)' }}>Productos</p><p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>--</p></div>
                <div><p className="text-sm" style={{ color: 'var(--muted)' }}>Pedidos</p><p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>--</p></div>
                <div><p className="text-sm" style={{ color: 'var(--muted)' }}>Pendientes</p><p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>--</p></div>
                <div><p className="text-sm" style={{ color: 'var(--muted)' }}>Ingresos</p><p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>--</p></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-2xl">
                <div className="text-center px-4">
                  <span className="text-3xl block mb-2">🔒</span>
                  <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Productos, pedidos e ingresos</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Disponible desde el Plan <strong>Pro</strong> por solo <span style={{ color: 'var(--coral)', fontWeight: 700 }}>$4 MXN/día</span></p>
                  <Link href="/dashboard/suscripcion" className="inline-block mt-2 px-4 py-1.5 text-white text-xs font-semibold rounded-xl transition-colors" style={{ background: 'var(--coral)' }}>
                    Ver planes
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Recent Orders - pro+ only */}
          {canProducts ? (
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <h3 className="font-bold" style={{ color: 'var(--ink)' }}>Últimos Pedidos</h3>
                <Link href="/dashboard/pedidos" className="text-sm hover:underline" style={{ color: 'var(--coral)' }}>
                  Ver todos →
                </Link>
              </div>
              {recentOrders && recentOrders.length > 0 ? (
                <div className="divide-y" style={{ borderColor: 'rgba(0,0,0,0.05)' }}>
                  {recentOrders.map((order) => (
                    <div key={order.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium" style={{ color: 'var(--ink)' }}>#{order.order_number}</p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                          {new Date(order.created_at).toLocaleDateString('es-MX')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: 'var(--coral)' }}>{formatCurrency(order.total)}</p>
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
                <div className="p-6 text-center" style={{ color: 'var(--muted)' }}>
                  No hay pedidos aún
                </div>
              )}
            </div>
          ) : null}

          {/* Edit Form */}
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--ink)' }}>Editar Información</h3>
            <EditBusinessForm
              business={{
                ...business,
                latitude: (business as any).latitude ?? null,
                longitude: (business as any).longitude ?? null,
                has_conekta_key: !!business.conekta_private_key,
                has_mercadopago_key: !!business.mercadopago_access_token,
                active_payment_gateways: business.active_payment_gateways || [],
                cover_url: (business as any).cover_url ?? null,
                website: (business as any).website ?? null,
                facebook_url: (business as any).facebook_url ?? null,
                instagram_url: (business as any).instagram_url ?? null,
                tiktok_url: (business as any).tiktok_url ?? null,
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
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h3 className="font-bold mb-4 capitalize" style={{ color: 'var(--ink)' }}>Tu Plan: {business.subscription_tier}</h3>
            <ul className="space-y-2">
              {planFeatures[business.subscription_tier]?.map((feature, i) => (
                <li key={i} className="flex items-center text-sm" style={{ color: 'var(--muted)' }}>
                  <span className="text-green-500 mr-2">✓</span>
                  {feature}
                </li>
              ))}
            </ul>
            {upgrade && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>Siguiente nivel:</p>
                <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>Plan {upgrade.name} — {upgrade.price}</p>
                <p className="text-xs font-semibold mb-3" style={{ color: 'var(--gold)' }}>Solo {upgrade.daily} — menos que un cafe</p>
                <Link
                  href="/dashboard/suscripcion"
                  className="block w-full py-2 text-white text-center font-medium rounded-xl transition-colors"
                  style={{ background: 'var(--coral)' }}
                >
                  Mejorar a {upgrade.name}
                </Link>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--ink)' }}>Acciones Rápidas</h3>
            <div className="space-y-2">
              {canProducts && (
                <>
                  <Link
                    href="/dashboard/productos/nuevo"
                    className="block w-full py-2 px-4 text-center font-medium rounded-xl transition-colors"
                    style={{ background: 'rgba(255,107,53,0.08)', color: 'var(--coral)' }}
                  >
                    + Agregar Producto
                  </Link>
                  <Link
                    href="/dashboard/pedidos"
                    className="block w-full py-2 px-4 text-center font-medium rounded-xl transition-colors bg-green-50 text-green-700"
                  >
                    Ver Pedidos
                  </Link>
                </>
              )}
              <Link
                href={`/negocios/${business.slug}`}
                target="_blank"
                className="block w-full py-2 px-4 text-center font-medium rounded-xl transition-colors"
                style={{ background: 'var(--cream)', color: 'var(--ink-soft)' }}
              >
                Ver Perfil Público
              </Link>
              <Link
                href="/dashboard/suscripcion"
                className="block w-full py-2 px-4 text-center font-medium rounded-xl transition-colors"
                style={{ background: 'rgba(245,185,66,0.12)', color: 'var(--gold-deep,#E09A1B)' }}
              >
                Mi Suscripcion
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--ink)' }}>Información de Contacto</h3>
            <div className="space-y-3 text-sm" style={{ color: 'var(--ink-soft)' }}>
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--muted)' }}>📞</span>
                <span>{business.phone || 'Sin teléfono'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--muted)' }}>💬</span>
                <span>{business.whatsapp || 'Sin WhatsApp'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: 'var(--muted)' }}>📍</span>
                <span>{business.address || 'Sin dirección'}</span>
              </div>
              {business.email && (
                <div className="flex items-center gap-2">
                  <span style={{ color: 'var(--muted)' }}>✉️</span>
                  <span>{business.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Total Revenue - pro+ only */}
          {canProducts && (
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-sm p-6 text-white">
              <h3 className="font-medium opacity-90">Ingresos Totales</h3>
              <p className="text-3xl font-bold mt-1">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm opacity-75 mt-1">{completedOrders.length} pedidos completados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

