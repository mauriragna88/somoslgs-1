import Link from 'next/link'
import { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import ListingCard from '@/components/marketplace/ListingCard'
import MarketplaceSidebar from '@/components/marketplace/MarketplaceSidebar'
import BannerDisplay from '@/components/ads/BannerDisplay'
import { MARKETPLACE_CONDITIONS } from '@/lib/constants'
import type { MarketplaceCategory, MarketplaceListing } from '@/types/database.types'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Marketplace - Compra y Vende en Lagos de Moreno',
  description: 'Compra y vende artículos nuevos y usados en Lagos de Moreno, Jalisco. Electrónica, muebles, ropa, vehículos y más. Publica gratis.',
  openGraph: {
    title: 'Marketplace - Compra y Vende | SomosLagos',
    description: 'Compra y vende artículos nuevos y usados en Lagos de Moreno.',
    url: 'https://www.somoslagos.com.mx/marketplace',
  },
}

interface SearchParams {
  q?: string
  category?: string
  condition?: string
  price_min?: string
  price_max?: string
  order?: string
}

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const query = searchParams.q || ''
  const categoryId = searchParams.category || ''
  const condition = searchParams.condition || ''
  const priceMin = searchParams.price_min || ''
  const priceMax = searchParams.price_max || ''
  const order = searchParams.order || ''

  const supabase = createServiceClient()

  // Get categories + counts in parallel
  const [{ data: categories }, { data: listingCategoryData }] = await Promise.all([
    supabase
      .from('marketplace_categories')
      .select('*')
      .order('display_order'),
    supabase
      .from('marketplace_listings')
      .select('category_id')
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString()),
  ])

  // Count per category
  const categoryCountMap = new Map<string, number>()
  ;(listingCategoryData || []).forEach((l: any) => {
    if (l.category_id) {
      categoryCountMap.set(l.category_id, (categoryCountMap.get(l.category_id) || 0) + 1)
    }
  })

  const categoriesWithCount = (categories || []).map((cat: MarketplaceCategory) => ({
    ...cat,
    count: categoryCountMap.get(cat.id) || 0,
  }))

  // Build listings query
  let listingsQuery = supabase
    .from('marketplace_listings')
    .select('*, category:marketplace_categories(*)')
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())

  if (categoryId) {
    listingsQuery = listingsQuery.eq('category_id', categoryId)
  }

  if (condition) {
    listingsQuery = listingsQuery.eq('condition', condition)
  }

  if (priceMin) {
    listingsQuery = listingsQuery.gte('price', parseFloat(priceMin))
  }

  if (priceMax) {
    listingsQuery = listingsQuery.lte('price', parseFloat(priceMax))
  }

  if (query) {
    const words = query.toLowerCase().split(/\s+/).filter((w: string) => w.length >= 2)
    if (words.length > 0) {
      const orConditions = words.map((word: string) =>
        `title.ilike.%${word}%,description.ilike.%${word}%`
      ).join(',')
      listingsQuery = listingsQuery.or(orConditions)
    }
  }

  // Ordering
  if (order === 'price_asc') {
    listingsQuery = listingsQuery.order('price', { ascending: true })
  } else if (order === 'price_desc') {
    listingsQuery = listingsQuery.order('price', { ascending: false })
  } else {
    listingsQuery = listingsQuery
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
  }

  const { data: listings } = await listingsQuery.limit(40)

  const currentParams: Record<string, string> = {}
  if (query) currentParams.q = query
  if (categoryId) currentParams.category = categoryId
  if (condition) currentParams.condition = condition
  if (priceMin) currentParams.price_min = priceMin
  if (priceMax) currentParams.price_max = priceMax
  if (order) currentParams.order = order

  return (
    <main className="min-h-screen bg-surface">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-secondary">Marketplace</h1>
              <p className="text-gray-500 text-sm mt-1">Compra y vende en Lagos de Moreno</p>
            </div>
            <Link
              href="/marketplace/publicar"
              className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-primary/20 text-sm"
            >
              + Publicar artículo
            </Link>
          </div>

          {/* Search + Filters */}
          <form method="GET" className="space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Buscar artículos..."
                  className="w-full px-4 py-3 bg-surface border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div className="w-full md:w-44">
                <select
                  name="condition"
                  defaultValue={condition}
                  className="w-full px-4 py-3 bg-surface border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option value="">Todas las condiciones</option>
                  {Object.entries(MARKETPLACE_CONDITIONS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="px-8 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-primary/20"
              >
                Buscar
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Hidden fields to preserve category */}
              {categoryId && <input type="hidden" name="category" value={categoryId} />}
              <div className="w-full sm:w-36">
                <input
                  type="number"
                  name="price_min"
                  defaultValue={priceMin}
                  placeholder="Precio mín."
                  min="0"
                  className="w-full px-4 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div className="w-full sm:w-36">
                <input
                  type="number"
                  name="price_max"
                  defaultValue={priceMax}
                  placeholder="Precio máx."
                  min="0"
                  className="w-full px-4 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
              </div>
              <div className="w-full sm:w-52">
                <select
                  name="order"
                  defaultValue={order}
                  className="w-full px-4 py-2.5 bg-surface border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                >
                  <option value="">Ordenar: Recientes primero</option>
                  <option value="price_asc">Precio: Menor a mayor</option>
                  <option value="price_desc">Precio: Mayor a menor</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Banner */}
      <div className="container mx-auto px-4 pt-6">
        <BannerDisplay placement="marketplace_top" />
      </div>

      {/* Results + Sidebar */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Results */}
          <div className="lg:col-span-3">
            <div className="mb-6">
              <p className="text-gray-600">
                {listings?.length || 0} artículo{(listings?.length || 0) !== 1 ? 's' : ''}
                {query && <span> para &ldquo;<strong>{query}</strong>&rdquo;</span>}
              </p>
            </div>

            {listings && listings.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {(listings as MarketplaceListing[]).map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-5xl">🛍️</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">No hay artículos</h2>
                <p className="text-gray-600 mb-6">
                  {query
                    ? `No hay artículos que coincidan con "${query}"`
                    : 'Sé el primero en publicar un artículo'}
                </p>
                <Link
                  href="/marketplace/publicar"
                  className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
                >
                  Publicar artículo
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <MarketplaceSidebar
            categories={categoriesWithCount}
            activeCategory={categoryId}
            searchParams={currentParams}
          />
        </div>
      </div>
    </main>
  )
}
