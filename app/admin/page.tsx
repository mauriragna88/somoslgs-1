import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import { formatDaysRemaining } from '@/lib/utils'
import ExpiringBusinessActions from '@/components/admin/ExpiringBusinessActions'

export default async function AdminDashboard() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Calculate date thresholds
  const now = new Date()
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Obtener estadísticas
  const [
    { count: totalBusinesses },
    { count: totalUsers },
    { count: totalOrders },
    { data: recentBusinesses },
    { data: expiringBusinesses },
    { data: expiredBusinesses },
  ] = await Promise.all([
    supabase.from('businesses').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase
      .from('businesses')
      .select('id, name, created_at, subscription_tier, is_active')
      .order('created_at', { ascending: false })
      .limit(5),
    // Expiring soon (within 7 days)
    supabase
      .from('businesses')
      .select(`
        id, name, phone, whatsapp, subscription_tier, subscription_expires_at,
        owner:profiles!businesses_owner_id_fkey(full_name, phone)
      `)
      .gte('subscription_expires_at', now.toISOString())
      .lte('subscription_expires_at', sevenDaysFromNow.toISOString())
      .eq('subscription_status', 'active')
      .order('subscription_expires_at', { ascending: true })
      .limit(10),
    // Already expired
    supabase
      .from('businesses')
      .select(`
        id, name, phone, whatsapp, subscription_tier, subscription_expires_at,
        owner:profiles!businesses_owner_id_fkey(full_name, phone)
      `)
      .lt('subscription_expires_at', now.toISOString())
      .eq('subscription_status', 'active')
      .order('subscription_expires_at', { ascending: false })
      .limit(10),
  ])

  const stats = [
    {
      label: 'Total Negocios',
      value: totalBusinesses || 0,
      icon: '🏪',
      color: 'bg-blue-500',
    },
    {
      label: 'Total Usuarios',
      value: totalUsers || 0,
      icon: '👥',
      color: 'bg-green-500',
    },
    {
      label: 'Total Pedidos',
      value: totalOrders || 0,
      icon: '📦',
      color: 'bg-purple-500',
    },
    {
      label: 'Por Vencer (7d)',
      value: expiringBusinesses?.length || 0,
      icon: '⚠️',
      color: 'bg-yellow-500',
    },
  ]

  // Normalize business data
  const normalizeOwner = (owner: any) => {
    if (Array.isArray(owner)) return owner[0] || null
    return owner
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Bienvenido al panel de administración</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`w-14 h-14 ${stat.color} rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Section */}
      {((expiredBusinesses && expiredBusinesses.length > 0) || (expiringBusinesses && expiringBusinesses.length > 0)) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Expired Businesses */}
          {expiredBusinesses && expiredBusinesses.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-red-100 border-b border-red-200">
                <h2 className="font-bold text-red-800 flex items-center gap-2">
                  <span>❌</span> Suscripciones Vencidas ({expiredBusinesses.length})
                </h2>
              </div>
              <div className="divide-y divide-red-100">
                {expiredBusinesses.map((business: any) => {
                  const owner = normalizeOwner(business.owner)
                  const daysInfo = formatDaysRemaining(business.subscription_expires_at)
                  return (
                    <div key={business.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{business.name}</p>
                        <p className="text-sm text-gray-600">{owner?.full_name || 'Sin dueño'}</p>
                        <p className={`text-xs ${daysInfo.color}`}>{daysInfo.text}</p>
                      </div>
                      <ExpiringBusinessActions
                        businessId={business.id}
                        businessName={business.name}
                        phone={business.whatsapp || business.phone || owner?.phone}
                        ownerName={owner?.full_name}
                        daysRemaining={null}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Expiring Soon */}
          {expiringBusinesses && expiringBusinesses.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-yellow-100 border-b border-yellow-200">
                <h2 className="font-bold text-yellow-800 flex items-center gap-2">
                  <span>⚠️</span> Por Vencer en 7 días ({expiringBusinesses.length})
                </h2>
              </div>
              <div className="divide-y divide-yellow-100">
                {expiringBusinesses.map((business: any) => {
                  const owner = normalizeOwner(business.owner)
                  const daysInfo = formatDaysRemaining(business.subscription_expires_at)
                  const daysRemaining = business.subscription_expires_at
                    ? Math.ceil((new Date(business.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : null
                  return (
                    <div key={business.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{business.name}</p>
                        <p className="text-sm text-gray-600">{owner?.full_name || 'Sin dueño'}</p>
                        <p className={`text-xs ${daysInfo.color}`}>{daysInfo.text}</p>
                      </div>
                      <ExpiringBusinessActions
                        businessId={business.id}
                        businessName={business.name}
                        phone={business.whatsapp || business.phone || owner?.phone}
                        ownerName={owner?.full_name}
                        daysRemaining={daysRemaining}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Businesses */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Negocios Recientes</h2>
          <Link href="/admin/negocios" className="text-primary hover:underline text-sm">
            Ver todos →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha de Registro
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentBusinesses && recentBusinesses.length > 0 ? (
                recentBusinesses.map((business) => (
                  <tr key={business.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{business.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                        {business.subscription_tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          business.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {business.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(business.created_at).toLocaleDateString('es-MX')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No hay negocios registrados aún
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/admin/negocios/nuevo"
          className="bg-primary hover:bg-primary-dark text-white rounded-xl p-6 transition-colors flex items-center justify-between group"
        >
          <div>
            <h3 className="text-lg font-semibold">Agregar Negocio</h3>
            <p className="text-sm opacity-90 mt-1">Registrar un nuevo negocio</p>
          </div>
          <span className="text-3xl group-hover:scale-110 transition-transform">+</span>
        </Link>

        <Link
          href="/admin/negocios"
          className="bg-white border-2 border-gray-200 hover:border-primary rounded-xl p-6 transition-colors flex items-center justify-between group"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Ver Negocios</h3>
            <p className="text-sm text-gray-600 mt-1">Gestionar todos los negocios</p>
          </div>
          <span className="text-3xl group-hover:scale-110 transition-transform">🏪</span>
        </Link>

        <Link
          href="/admin/usuarios"
          className="bg-white border-2 border-gray-200 hover:border-primary rounded-xl p-6 transition-colors flex items-center justify-between group"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Usuarios</h3>
            <p className="text-sm text-gray-600 mt-1">Gestionar usuarios del sistema</p>
          </div>
          <span className="text-3xl group-hover:scale-110 transition-transform">👥</span>
        </Link>
      </div>
    </div>
  )
}
