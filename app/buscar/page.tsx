import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stemSpanish } from '@/lib/utils'
import { TIER_ORDER } from '@/lib/constants'
import BusinessCard from '@/components/shared/BusinessCard'
import SkeletonCard from '@/components/shared/SkeletonCard'
import BannerDisplay from '@/components/ads/BannerDisplay'
import ListingCard from '@/components/marketplace/ListingCard'
import SmartSearch from '@/components/SmartSearch'
import type { MarketplaceListing } from '@/types/database.types'

export const revalidate = 1800

interface BuscarSearchParams {
  q?: string
  categoria?: string
  colonia?: string
  orden?: string
  tipo?: string
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<BuscarSearchParams> }): Promise<Metadata> {
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams.q || ''
  const categoriaId = resolvedSearchParams.categoria || ''

  let title = 'Buscar en Lagos de Moreno'
  let description = 'Encuentra negocios, restaurantes, tiendas, servicios y artículos en venta en Lagos de Moreno, Jalisco.'

  if (query) {
    const capitalizedQuery = query.charAt(0).toUpperCase() + query.slice(1)
    title = `${capitalizedQuery} en Lagos de Moreno`
    description = `Encuentra ${query.toLowerCase()} en Lagos de Moreno, Jalisco. Directorio con horarios, ubicacion, opiniones y contacto.`
  } else if (categoriaId) {
    const supabase = await createClient()
    const { data: cat } = await supabase
      .from('categories')
      .select('name')
      .eq('id', categoriaId)
      .single() as unknown as { data: { name: string } | null }
    if (cat) {
      title = `${cat.name} en Lagos de Moreno`
      description = `Encuentra los mejores ${cat.name.toLowerCase()} en Lagos de Moreno, Jalisco.`
    }
  }

  return {
    title,
    description,
    openGraph: {
      title: `${title} | SomosLagos`,
      description,
      url: 'https://www.somoslagos.com.mx/buscar',
    },
  }
}

interface Category {
  id: string
  name: string
  icon: string
}

interface Business {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  phone: string
  address: string
  neighborhood: string | null
  is_active: boolean
  subscription_tier: string
  is_featured: boolean
  business_hours: any
  rating: number
  total_reviews: number
  category: { id: string; name: string; icon: string } | null
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<BuscarSearchParams>
}) {
  const resolvedSearchParams = await searchParams
  const query = resolvedSearchParams.q || ''
  const categoriaId = resolvedSearchParams.categoria || ''
  const colonia = resolvedSearchParams.colonia || ''
  const orden = resolvedSearchParams.orden || ''
  const tipo = resolvedSearchParams.tipo || 'negocios'

  const supabase = await createClient()
  const serviceSupabase = createServiceClient()

  // Get categories + business counts + neighborhoods in parallel
  const [{ data: categories }, { data: businessCategoryData }, { data: neighborhoodData }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, icon')
      .order('name') as unknown as Promise<{ data: Category[] | null }>,
    supabase
      .from('businesses')
      .select('category_id')
      .eq('is_active', true) as unknown as Promise<{ data: { category_id: string }[] | null }>,
    supabase
      .from('businesses')
      .select('neighborhood')
      .eq('is_active', true)
      .not('neighborhood', 'is', null)
      .order('neighborhood') as unknown as Promise<{ data: { neighborhood: string }[] | null }>,
  ])

  // Count businesses per category
  const categoryCountMap = new Map<string, number>()
  ;(businessCategoryData || []).forEach((b) => {
    if (b.category_id) {
      categoryCountMap.set(b.category_id, (categoryCountMap.get(b.category_id) || 0) + 1)
    }
  })

  // Categories with count, sorted by count descending
  const categoriesWithCount = (categories || []).map((cat) => ({
    ...cat,
    businessCount: categoryCountMap.get(cat.id) || 0,
  })).sort((a, b) => b.businessCount - a.businessCount)

  const neighborhoods = Array.from(new Set(
    (neighborhoodData || [])
      .map(b => b.neighborhood)
      .filter((n): n is string => !!n && n.trim() !== '')
  ))

  // Build search query
  let businessQuery = supabase
    .from('businesses')
    .select(`
      id,
      name,
      slug,
      description,
      logo_url,
      phone,
      address,
      neighborhood,
      is_active,
      subscription_tier,
      is_featured,
      business_hours,
      rating,
      total_reviews,
      category:categories(id, name, icon)
    `)
    .eq('is_active', true)

  // Apply sort order
  if (orden === 'rating') {
    businessQuery = businessQuery
      .order('rating', { ascending: false })
      .order('total_reviews', { ascending: false })
      .order('name')
  } else {
    // Default: featured first, then name (tier sorting done client-side)
    businessQuery = businessQuery
      .order('is_featured', { ascending: false })
      .order('name')
  }

  // Apply search filter - split into words and stem for plural/singular matching
  if (query) {
    const words = query.toLowerCase().split(/\s+/).filter((w: string) => w.length >= 2)
    if (words.length > 0) {
      const orConditions = words.map((word: string) => {
        const stem = stemSpanish(word)
        return `name.ilike.%${stem}%,description.ilike.%${stem}%`
      }).join(',')
      businessQuery = businessQuery.or(orConditions)
    } else {
      const stem = stemSpanish(query)
      businessQuery = businessQuery.or(`name.ilike.%${stem}%,description.ilike.%${stem}%`)
    }
  }

  // Apply category filter
  if (categoriaId) {
    businessQuery = businessQuery.eq('category_id', categoriaId)
  }

  // Apply neighborhood filter
  if (colonia) {
    businessQuery = businessQuery.eq('neighborhood', colonia)
  }

  const { data: rawBusinesses, error } = await businessQuery.limit(50) as { data: Business[] | null; error: any }

  // Sort by tier order client-side (Supabase sorts TEXT alphabetically which gives wrong order)
  const businesses = orden !== 'rating' && rawBusinesses
    ? [...rawBusinesses].sort((a, b) => {
        // Featured first
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
        // Then by tier order (avanzado > pro > emprendedor > gratis)
        const tierA = TIER_ORDER[a.subscription_tier] || 0
        const tierB = TIER_ORDER[b.subscription_tier] || 0
        if (tierA !== tierB) return tierB - tierA
        // Then alphabetically
        return a.name.localeCompare(b.name)
      })
    : rawBusinesses

  // Marketplace listings (only fetch when tab is marketplace)
  let marketplaceListings: MarketplaceListing[] = []
  if (tipo === 'marketplace') {
    let mkQuery = serviceSupabase
      .from('marketplace_listings')
      .select('*, category:marketplace_categories(*)')
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })

    if (query) {
      const words = query.toLowerCase().split(/\s+/).filter((w: string) => w.length >= 2)
      if (words.length > 0) {
        const orCond = words.map((word: string) => {
          const stem = stemSpanish(word)
          return `title.ilike.%${stem}%,description.ilike.%${stem}%`
        }).join(',')
        mkQuery = mkQuery.or(orCond)
      }
    }

    const { data: mkData } = await mkQuery.limit(40)
    marketplaceListings = (mkData || []) as MarketplaceListing[]
  }

  // Skeleton grid: shown as a visual placeholder — in SSR context we never actually
  // render it conditionally since data is already available; it's exported so client
  // wrappers can use it in Suspense boundaries in the future.
  const skeletonGrid = (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )

  return (
    <main className="min-h-screen" style={{ background: 'var(--ivory)' }}>
      {/* ── Search Header ── */}
      <div
        className="border-b py-8"
        style={{
          background: 'linear-gradient(135deg, var(--ivory) 0%, var(--cream) 100%)',
          borderColor: 'rgba(245,185,66,0.18)',
        }}
      >
        <div className="container mx-auto px-4">
          {/* Title */}
          <h1
            className="text-2xl md:text-3xl font-bold mb-1"
            style={{ color: 'var(--ink)', fontFamily: 'var(--display)' }}
          >
            {query
              ? <>Resultados para <span style={{ color: 'var(--coral)' }}>&ldquo;{query}&rdquo;</span></>
              : 'Buscar en Lagos de Moreno'
            }
          </h1>
          <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
            Encuentra negocios, servicios y artículos de tu ciudad
          </p>

          {/* SmartSearch - solo móvil (desktop ya tiene en header) */}
          <div className="md:hidden mb-5">
            <SmartSearch variant="mobile" />
            <p className="text-xs mt-1.5 text-center" style={{ color: 'var(--muted)' }}>
              Escribe para ver resultados al instante
            </p>
          </div>

          {/* Tabs */}
          <div
            className="flex gap-1 rounded-xl p-1 mb-6 w-fit"
            style={{ background: 'rgba(31,41,55,0.06)' }}
          >
            <Link
              href={`/buscar?tipo=negocios${query ? `&q=${encodeURIComponent(query)}` : ''}`}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
              style={
                tipo === 'negocios'
                  ? { background: 'var(--coral)', color: '#fff', boxShadow: '0 2px 8px rgba(255,107,53,0.25)' }
                  : { color: 'var(--ink-soft)' }
              }
            >
              Negocios
            </Link>
            <Link
              href={`/buscar?tipo=marketplace${query ? `&q=${encodeURIComponent(query)}` : ''}`}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors"
              style={
                tipo === 'marketplace'
                  ? { background: 'var(--coral)', color: '#fff', boxShadow: '0 2px 8px rgba(255,107,53,0.25)' }
                  : { color: 'var(--ink-soft)' }
              }
            >
              Marketplace
            </Link>
          </div>

          {/* Search Form */}
          <form
            method="GET"
            className="space-y-3 rounded-2xl p-4"
            style={{
              background: 'rgba(255,253,248,0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(245,185,66,0.2)',
              boxShadow: '0 2px 16px rgba(31,41,55,0.06)',
            }}
          >
            <input type="hidden" name="tipo" value={tipo} />
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Buscar por nombre o descripción..."
                  className="w-full px-4 py-3 rounded-xl transition-all outline-none"
                  style={{
                    background: 'var(--ivory)',
                    border: '1px solid rgba(31,41,55,0.12)',
                    color: 'var(--ink)',
                    fontFamily: 'var(--body)',
                  }}
                />
              </div>
              <div className="w-full md:w-52">
                <select
                  name="categoria"
                  defaultValue={categoriaId}
                  className="w-full px-4 py-3 rounded-xl transition-all outline-none"
                  style={{
                    background: 'var(--ivory)',
                    border: '1px solid rgba(31,41,55,0.12)',
                    color: 'var(--ink)',
                    fontFamily: 'var(--body)',
                  }}
                >
                  <option value="">Todas las categorias</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="px-8 py-3 font-semibold rounded-xl transition-all"
                style={{
                  background: 'linear-gradient(135deg, var(--coral) 0%, var(--coral-deep) 100%)',
                  color: '#fff',
                  boxShadow: '0 4px 14px rgba(255,107,53,0.3)',
                  fontFamily: 'var(--display)',
                }}
              >
                Buscar
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {neighborhoods.length > 0 && (
                <div className="w-full sm:w-52">
                  <select
                    name="colonia"
                    defaultValue={colonia}
                    className="w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none"
                    style={{
                      background: 'var(--ivory)',
                      border: '1px solid rgba(31,41,55,0.12)',
                      color: 'var(--ink)',
                      fontFamily: 'var(--body)',
                    }}
                  >
                    <option value="">Todas las colonias</option>
                    {neighborhoods.map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="w-full sm:w-52">
                <select
                  name="orden"
                  defaultValue={orden}
                  className="w-full px-4 py-2.5 rounded-xl text-sm transition-all outline-none"
                  style={{
                    background: 'var(--ivory)',
                    border: '1px solid rgba(31,41,55,0.12)',
                    color: 'var(--ink)',
                    fontFamily: 'var(--body)',
                  }}
                >
                  <option value="">Ordenar: Destacados primero</option>
                  <option value="rating">Ordenar: Mejor calificados</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Banner: Search Top */}
      <div className="container mx-auto px-4 pt-6">
        <BannerDisplay placement="search_top" />
      </div>

      {/* ── Results + Sidebar ── */}
      <div
        className="relative"
        style={{
          background: [
            'radial-gradient(ellipse 60% 40% at 15% 20%, rgba(255,107,53,0.06) 0%, transparent 70%)',
            'radial-gradient(ellipse 50% 35% at 85% 70%, rgba(245,185,66,0.05) 0%, transparent 70%)',
            'var(--ivory)',
          ].join(', '),
        }}
      >
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Results Column */}
            <div className="lg:col-span-3">
              {tipo === 'marketplace' ? (
                <>
                  {/* Marketplace Results */}
                  <div className="mb-6 flex items-center justify-between">
                    <p style={{ color: 'var(--muted)', fontFamily: 'var(--body)' }}>
                      <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{marketplaceListings.length}</span>
                      {' '}artículo{marketplaceListings.length !== 1 ? 's' : ''}
                      {query && <span> para <strong style={{ color: 'var(--ink)' }}>&ldquo;{query}&rdquo;</strong></span>}
                    </p>
                    <Link
                      href="/marketplace"
                      className="text-sm font-semibold transition-colors"
                      style={{ color: 'var(--coral)', fontFamily: 'var(--body)' }}
                    >
                      Ver marketplace completo →
                    </Link>
                  </div>

                  {marketplaceListings.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {marketplaceListings.map((listing) => (
                        <ListingCard key={listing.id} listing={listing} />
                      ))}
                    </div>
                  ) : (
                    <div
                      className="text-center py-16 rounded-3xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,107,53,0.04) 0%, rgba(245,185,66,0.04) 100%)',
                        border: '1px dashed rgba(255,107,53,0.2)',
                      }}
                    >
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                        style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.12), rgba(245,185,66,0.12))' }}
                      >
                        <span className="text-4xl" role="img" aria-label="marketplace">🛍️</span>
                      </div>
                      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--ink)', fontFamily: 'var(--display)' }}>
                        No hay artículos
                      </h2>
                      <p className="mb-6 max-w-xs mx-auto" style={{ color: 'var(--muted)', fontFamily: 'var(--body)' }}>
                        {query
                          ? `No hay artículos que coincidan con "${query}"`
                          : 'No hay artículos en el marketplace por ahora'}
                      </p>
                      <Link
                        href="/marketplace/publicar"
                        className="inline-block px-7 py-3 font-semibold rounded-full transition-all"
                        style={{
                          background: 'linear-gradient(135deg, var(--coral) 0%, var(--coral-deep) 100%)',
                          color: '#fff',
                          boxShadow: '0 4px 14px rgba(255,107,53,0.3)',
                          fontFamily: 'var(--display)',
                        }}
                      >
                        Publicar artículo
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Business Results */}
                  <div className="mb-5 flex items-center gap-2">
                    <p style={{ color: 'var(--muted)', fontFamily: 'var(--body)' }}>
                      <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{businesses?.length || 0}</span>
                      {' '}negocio{businesses?.length !== 1 ? 's' : ''} encontrado{businesses?.length !== 1 ? 's' : ''}
                      {query && <span> para <strong style={{ color: 'var(--ink)' }}>&ldquo;{query}&rdquo;</strong></span>}
                    </p>
                  </div>

                  {businesses && businesses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {businesses.map((business, index) => (
                        <React.Fragment key={business.id}>
                          {/* Sponsored card every 8 results */}
                          {index > 0 && index % 8 === 0 && (
                            <div
                              className="rounded-2xl overflow-hidden relative"
                              style={{
                                background: 'var(--ivory)',
                                border: '1px solid rgba(31,41,55,0.08)',
                              }}
                            >
                              <div
                                className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded text-xs font-medium"
                                style={{ background: 'rgba(31,41,55,0.07)', color: 'var(--muted)' }}
                              >
                                Patrocinado
                              </div>
                              <BannerDisplay placement="search_inline" />
                            </div>
                          )}
                          <BusinessCard business={business} />
                        </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="text-center py-16 rounded-3xl"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255,107,53,0.04) 0%, rgba(245,185,66,0.04) 100%)',
                        border: '1px dashed rgba(255,107,53,0.2)',
                      }}
                    >
                      <div
                        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
                        style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.12), rgba(245,185,66,0.12))' }}
                      >
                        <svg
                          width="36"
                          height="36"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="var(--coral)"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--ink)', fontFamily: 'var(--display)' }}>
                        No se encontraron negocios
                      </h2>
                      <p className="mb-6 max-w-xs mx-auto" style={{ color: 'var(--muted)', fontFamily: 'var(--body)' }}>
                        {query
                          ? `No hay negocios que coincidan con "${query}". Prueba con otras palabras.`
                          : 'No hay negocios disponibles en este momento.'}
                      </p>
                      <Link
                        href="/"
                        className="inline-block px-7 py-3 font-semibold rounded-full transition-all"
                        style={{
                          background: 'linear-gradient(135deg, var(--coral) 0%, var(--coral-deep) 100%)',
                          color: '#fff',
                          boxShadow: '0 4px 14px rgba(255,107,53,0.3)',
                          fontFamily: 'var(--display)',
                        }}
                      >
                        Explorar directorio
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Banner: visible on mobile only (sidebar banner shows on desktop) */}
            <div className="lg:hidden mt-6">
              <BannerDisplay placement="search_sidebar" />
            </div>

            {/* Sidebar - Categories (desktop only) */}
            <aside className="hidden lg:block lg:col-span-1">
              <div
                className="rounded-2xl p-5 sticky top-24"
                style={{
                  background: 'rgba(255,253,248,0.9)',
                  border: '1px solid rgba(245,185,66,0.18)',
                  boxShadow: '0 2px 16px rgba(31,41,55,0.05)',
                }}
              >
                <h3
                  className="font-bold mb-4 text-xs uppercase tracking-widest"
                  style={{ color: 'var(--muted)', fontFamily: 'var(--display)' }}
                >
                  Categorias
                </h3>
                <nav className="space-y-0.5">
                  <Link
                    href={`/buscar${query ? `?q=${encodeURIComponent(query)}` : ''}${colonia ? `${query ? '&' : '?'}colonia=${encodeURIComponent(colonia)}` : ''}${orden ? `${query || colonia ? '&' : '?'}orden=${orden}` : ''}`}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all"
                    style={
                      !categoriaId
                        ? { background: 'rgba(255,107,53,0.1)', color: 'var(--coral)', fontWeight: 700 }
                        : { color: 'var(--ink-soft)' }
                    }
                  >
                    <span>Todas</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={
                        !categoriaId
                          ? { background: 'rgba(255,107,53,0.15)', color: 'var(--coral)' }
                          : { background: 'rgba(31,41,55,0.07)', color: 'var(--muted)' }
                      }
                    >
                      {businessCategoryData?.length || 0}
                    </span>
                  </Link>
                  {categoriesWithCount.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/buscar?categoria=${cat.id}${query ? `&q=${encodeURIComponent(query)}` : ''}${colonia ? `&colonia=${encodeURIComponent(colonia)}` : ''}${orden ? `&orden=${orden}` : ''}`}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all"
                      style={
                        categoriaId === cat.id
                          ? { background: 'rgba(255,107,53,0.1)', color: 'var(--coral)', fontWeight: 700 }
                          : { color: 'var(--ink-soft)' }
                      }
                    >
                      <span className="truncate">
                        <span className="mr-1.5">{cat.icon}</span>
                        {cat.name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                        style={
                          categoriaId === cat.id
                            ? { background: 'rgba(255,107,53,0.15)', color: 'var(--coral)' }
                            : { background: 'rgba(31,41,55,0.07)', color: 'var(--muted)' }
                        }
                      >
                        {cat.businessCount}
                      </span>
                    </Link>
                  ))}
                </nav>
              </div>

              {/* Banner: Search Sidebar */}
              <div className="mt-6">
                <BannerDisplay placement="search_sidebar" />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* Hidden skeleton grid — available for Suspense wrappers */}
      <div className="hidden" aria-hidden="true">{skeletonGrid}</div>
    </main>
  )
}

