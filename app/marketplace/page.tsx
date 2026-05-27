import Link from 'next/link'
import { Metadata } from 'next'
import { createServiceClient } from '@/lib/supabase/server'
import ListingCard from '@/components/marketplace/ListingCard'
import MarketplaceSidebar from '@/components/marketplace/MarketplaceSidebar'
import BannerDisplay from '@/components/ads/BannerDisplay'
import { MARKETPLACE_CONDITIONS } from '@/lib/constants'
import { stemSpanish } from '@/lib/utils'
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
  searchParams: Promise<SearchParams>
}) {
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams.q || ''
  const categoryId = resolvedSearchParams.category || ''
  const condition = resolvedSearchParams.condition || ''
  const priceMin = resolvedSearchParams.price_min || ''
  const priceMax = resolvedSearchParams.price_max || ''
  const order = resolvedSearchParams.order || ''

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
      const orConditions = words.map((word: string) => {
        const stem = stemSpanish(word)
        return `title.ilike.%${stem}%,description.ilike.%${stem}%`
      }).join(',')
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
    <main className="min-h-screen bg-[var(--ivory)]">
      {/* ── HEADER ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-[var(--hairline)] py-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="pueblo-eyebrow mb-2 inline-block">Marketplace · Lagos de Moreno</span>
              <h1 className="text-2xl md:text-3xl font-[family-name:var(--font-display)] font-bold text-[var(--ink)]">
                Compra y Vende
              </h1>
              <p className="text-[var(--muted)] text-sm mt-1">Artículos nuevos y usados en tu ciudad</p>
            </div>
            <Link
              href="/marketplace/publicar"
              className="rounded-full bg-[var(--coral)] text-white px-6 py-3 font-semibold hover:bg-[var(--coral-deep)] transition-colors shadow-lg shadow-[var(--coral)]/20 text-sm"
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
                  className="w-full px-4 py-3 bg-[var(--ivory)] border border-[var(--hairline)] rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/30 focus:border-[var(--coral)] transition-all"
                />
              </div>
              <div className="w-full md:w-44">
                <select
                  name="condition"
                  defaultValue={condition}
                  className="w-full px-4 py-3 bg-[var(--ivory)] border border-[var(--hairline)] rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/30 focus:border-[var(--coral)] transition-all"
                >
                  <option value="">Todas las condiciones</option>
                  {Object.entries(MARKETPLACE_CONDITIONS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="rounded-full bg-[var(--coral)] text-white px-8 py-3 font-semibold hover:bg-[var(--coral-deep)] transition-colors shadow-md"
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
                  className="w-full px-4 py-2.5 bg-[var(--ivory)] border border-[var(--hairline)] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/30 focus:border-[var(--coral)] transition-all"
                />
              </div>
              <div className="w-full sm:w-36">
                <input
                  type="number"
                  name="price_max"
                  defaultValue={priceMax}
                  placeholder="Precio máx."
                  min="0"
                  className="w-full px-4 py-2.5 bg-[var(--ivory)] border border-[var(--hairline)] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/30 focus:border-[var(--coral)] transition-all"
                />
              </div>
              <div className="w-full sm:w-52">
                <select
                  name="order"
                  defaultValue={order}
                  className="w-full px-4 py-2.5 bg-[var(--ivory)] border border-[var(--hairline)] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/30 focus:border-[var(--coral)] transition-all"
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
              <p className="text-[var(--ink-soft)] text-sm">
                <span className="font-semibold text-[var(--ink)]">{listings?.length || 0}</span>{' '}
                artículo{(listings?.length || 0) !== 1 ? 's' : ''}
                {query && <span> para &ldquo;<strong className="text-[var(--coral)]">{query}</strong>&rdquo;</span>}
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
                {/* Shopping bag icon */}
                <div className="w-28 h-28 bg-gradient-to-br from-[var(--coral)]/10 to-[var(--gold)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-14 h-14 text-[var(--coral)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-[family-name:var(--font-display)] font-bold text-[var(--ink)] mb-2">
                  {query ? 'Sin resultados' : '¡Sé el primero en publicar!'}
                </h2>
                <p className="text-[var(--muted)] mb-8 max-w-md mx-auto">
                  {query
                    ? `No encontramos artículos para "${query}". Intenta con otras palabras.`
                    : 'El marketplace está listo para ti. Publica lo que ya no uses y dale una segunda vida.'}
                </p>
                <Link
                  href="/marketplace/publicar"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--coral)] text-white px-8 py-3.5 font-semibold hover:bg-[var(--coral-deep)] transition-all hover:scale-105 shadow-lg shadow-[var(--coral)]/20"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Publicar mi primer artículo
                </Link>

                {/* Quick benefits */}
                <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-[var(--muted)]">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--coral)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    100% Gratis
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--coral)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Fácil y rápido
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-[var(--coral)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Contacto directo
                  </div>
                </div>
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
