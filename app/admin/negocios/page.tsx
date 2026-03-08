export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
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
  total_views: number
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
  total_views: number
  created_at: string
  category: CategoryData | null
  owner: OwnerData | null
}

export default async function AdminBusinessesPage() {
  // Use service role client to bypass RLS and get all data
  const supabase = createServiceClient()

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
      total_views,
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
  const totalViews = typedBusinesses.reduce((sum, b) => sum + (b.total_views || 0), 0)

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Negocios</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Gestiona todos los negocios registrados</p>
        </div>
        <Link
          href="/admin/negocios/nuevo"
          className="px-4 py-2.5 sm:px-6 sm:py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors text-center text-sm sm:text-base"
        >
          + Agregar Negocio
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 mb-6">
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

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <div>
              <p className="text-2xl font-bold text-indigo-600">{totalViews.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Vistas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Businesses Table with Actions */}
      <BusinessesTable businesses={typedBusinesses} />
    </div>
  )
}
