import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'
import BusinessesTable from '@/components/admin/BusinessesTable'

interface CategoryData {
  name: string
}

interface OwnerData {
  id: string
  full_name: string
  email: string
  phone: string | null
}

interface BusinessRow {
  id: string
  owner_id: string | null
  name: string
  phone: string
  whatsapp: string | null
  logo_url: string | null
  subscription_tier: string
  subscription_status: string
  subscription_expires_at: string | null
  is_courtesy: boolean
  is_active: boolean
  created_at: string
  category: CategoryData | CategoryData[] | null
  owner: OwnerData | OwnerData[] | null
}

interface BusinessForDisplay {
  id: string
  owner_id: string | null
  name: string
  phone: string
  whatsapp?: string
  logo_url: string | null
  subscription_tier: string
  subscription_status: string
  subscription_expires_at: string | null
  is_courtesy: boolean
  is_active: boolean
  created_at: string
  category: CategoryData | null
  owner: OwnerData | null
}

export default async function AdminBusinessesPage() {
  // Use service role client to bypass RLS and get all data
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  // Obtener todos los negocios con owner y categoría usando JOIN
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select(`
      id,
      owner_id,
      name,
      phone,
      whatsapp,
      logo_url,
      subscription_tier,
      subscription_status,
      subscription_expires_at,
      is_courtesy,
      is_active,
      created_at,
      category:categories(name),
      owner:profiles!businesses_owner_id_fkey(id, full_name, email, phone)
    `)
    .order('created_at', { ascending: false })

  // error is handled gracefully - empty results shown

  // Normalize the data (Supabase returns arrays for relations)
  const typedBusinesses: BusinessForDisplay[] = (businesses || []).map((b: BusinessRow) => ({
    ...b,
    whatsapp: b.whatsapp || undefined,
    category: Array.isArray(b.category) ? b.category[0] || null : b.category,
    owner: Array.isArray(b.owner) ? b.owner[0] || null : b.owner,
  }))

  // Get counts for quick stats
  const activeCount = typedBusinesses.filter(b => b.is_active).length
  const expiringCount = typedBusinesses.filter(b => {
    if (!b.subscription_expires_at) return false
    const days = Math.ceil((new Date(b.subscription_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days >= 0 && days <= 7
  }).length
  const expiredCount = typedBusinesses.filter(b => {
    if (!b.subscription_expires_at) return false
    return new Date(b.subscription_expires_at) < new Date()
  }).length
  const noOwnerCount = typedBusinesses.filter(b => !b.owner_id).length
  const courtesyCount = typedBusinesses.filter(b => b.is_courtesy).length
  const payingCount = typedBusinesses.filter(b => !b.is_courtesy).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Negocios</h1>
          <p className="text-gray-600 mt-1">Gestiona todos los negocios registrados</p>
        </div>
        <Link
          href="/admin/negocios/nuevo"
          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
        >
          + Agregar Negocio
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🏪</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{typedBusinesses.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{payingCount}</p>
              <p className="text-xs text-gray-500">De Pago</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🎁</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-teal-600">{courtesyCount}</p>
              <p className="text-xs text-gray-500">Cortesia</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">✅</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{activeCount}</p>
              <p className="text-xs text-gray-500">Activos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{expiringCount}</p>
              <p className="text-xs text-gray-500">Por Vencer</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">❌</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
              <p className="text-xs text-gray-500">Vencidos</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">👤</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{noOwnerCount}</p>
              <p className="text-xs text-gray-500">Sin Dueno</p>
            </div>
          </div>
        </div>
      </div>

      {/* Businesses Table with Actions */}
      <BusinessesTable businesses={typedBusinesses} />
    </div>
  )
}
