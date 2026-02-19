export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/server'

interface BusinessInCategory {
  id: string
  name: string
  slug: string
  logo_url: string | null
  subscription_tier: string
  is_featured: boolean
  is_active: boolean
}

interface CategoryWithBusinesses {
  id: string
  name: string
  slug: string
  icon: string | null
  businesses: BusinessInCategory[]
}

export default async function AdminCategoriasPage() {
  const supabase = createServiceClient()

  // Get all categories with their businesses
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, icon')
    .is('parent_id', null)
    .order('display_order')

  // Get all businesses grouped by category
  const { data: allBusinesses } = await supabase
    .from('businesses')
    .select('id, name, slug, logo_url, subscription_tier, is_featured, is_active, category_id')
    .order('is_featured', { ascending: false })
    .order('subscription_tier', { ascending: false })

  // Group businesses by category
  const categoriesWithBusinesses: CategoryWithBusinesses[] = (categories || []).map(cat => ({
    ...cat,
    businesses: (allBusinesses || [])
      .filter(b => b.category_id === cat.id)
      .slice(0, 10) // Limit to 10 per category
  }))

  // Stats
  const premiumCount = (allBusinesses || []).filter(b => b.subscription_tier === 'premium').length
  const deliveryCount = (allBusinesses || []).filter(b => b.subscription_tier === 'delivery').length
  const ventasCount = (allBusinesses || []).filter(b => b.subscription_tier === 'ventas').length
  const basicoCount = (allBusinesses || []).filter(b => b.subscription_tier === 'basico').length

  const planColors: Record<string, string> = {
    premium: 'bg-purple-100 text-purple-800 border-purple-300',
    delivery: 'bg-blue-100 text-blue-800 border-blue-300',
    ventas: 'bg-green-100 text-green-800 border-green-300',
    basico: 'bg-gray-100 text-gray-800 border-gray-300',
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-600 mt-1">Negocios organizados por categoría</p>
        </div>
      </div>

      {/* Stats by Plan */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⭐</span>
            <div>
              <p className="text-3xl font-bold text-purple-700">{premiumCount}</p>
              <p className="text-sm text-purple-600">Premium ($450)</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🚀</span>
            <div>
              <p className="text-3xl font-bold text-blue-700">{deliveryCount}</p>
              <p className="text-sm text-blue-600">Delivery ($300)</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛍️</span>
            <div>
              <p className="text-3xl font-bold text-green-700">{ventasCount}</p>
              <p className="text-sm text-green-600">Ventas ($200)</p>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📋</span>
            <div>
              <p className="text-3xl font-bold text-gray-700">{basicoCount}</p>
              <p className="text-sm text-gray-600">Básico ($99)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Categories with Businesses */}
      <div className="space-y-8">
        {categoriesWithBusinesses.map((category) => (
          <div key={category.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
            {/* Category Header */}
            <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{category.icon || '📦'}</span>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                  <p className="text-sm text-gray-500">{category.businesses.length} negocios</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Count by plan in this category */}
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                  {category.businesses.filter(b => b.subscription_tier === 'premium').length} Premium
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                  {category.businesses.filter(b => b.subscription_tier === 'delivery').length} Delivery
                </span>
              </div>
            </div>

            {/* Businesses Grid */}
            {category.businesses.length > 0 ? (
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {category.businesses.map((business) => (
                    <Link
                      key={business.id}
                      href={`/admin/negocios/${business.id}`}
                      className={`p-3 rounded-lg border-2 transition-all hover:shadow-md ${
                        planColors[business.subscription_tier] || planColors.basico
                      } ${!business.is_active ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center gap-3">
                        {business.logo_url ? (
                          <Image
                            src={business.logo_url}
                            alt={business.name}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-white/50 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-lg">
                              {business.name[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{business.name}</p>
                          <div className="flex items-center gap-1">
                            <span className="text-xs capitalize">{business.subscription_tier}</span>
                            {business.is_featured && <span className="text-xs">⭐</span>}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No hay negocios en esta categoría</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty Categories Notice */}
      {categoriesWithBusinesses.filter(c => c.businesses.length === 0).length > 0 && (
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800">
            <strong>Nota:</strong> Hay {categoriesWithBusinesses.filter(c => c.businesses.length === 0).length} categorías sin negocios.
            Los negocios premium aparecerán destacados en cada categoría.
          </p>
        </div>
      )}
    </div>
  )
}
