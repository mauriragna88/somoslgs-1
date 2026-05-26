import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { stemSpanish } from '@/lib/utils'
import { TIER_ORDER } from '@/lib/constants'
import type { BusinessHours } from '@/lib/constants'
import BusinessCard from '@/components/shared/BusinessCard'
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

export async function generateMetadata({ searchParams }: { searchParams: BuscarSearchParams }): Promise<Metadata> {
  const query = searchParams.q || ''
  const categoriaId = searchParams.categoria || ''

  let title = 'Buscar en Lagos de Moreno'
  let description = 'Encuentra negocios, restaurantes, tiendas, servicios y artículos en venta en Lagos de Moreno, Jalisco.'

  if (query) {
    const capitalizedQuery = query.charAt(0).toUpperCase() + query.slice(1)
    title = `${capitalizedQuery} en Lagos de Moreno`
    description = `Encuentra ${query.toLowerCase()} en Lagos de Moreno, Jalisco. Directorio con horarios, ubicacion, opiniones y contacto.`
  } else if (categoriaId) {
    const supabase = createClient()
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
  business_hours: BusinessHours | null
  rating: number
  total_reviews: number
  category: { id: string; name: string; icon: string } | null
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: BuscarSearchParams
}) {
  const query = searchParams.q || ''
  const categoriaId = searchParams.categoria || ''
  const colonia = searchParams.colonia || ''
  const orden = searchParams.orden || ''
  const tipo = searchParams.tipo || 'negocios'

  const supabase = createClient()
  // Audit: public marketplace reads currently use service_role and bypass RLS.
  // Keep scoped to active listings until marketplace SELECT policies are verified.
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

  const { data: rawBusinesses } = await businessQuery.limit(50) as { data: Business[] | null }

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

  /* ── helpers ── */
  const totalBusinesses = businessCategoryData?.length || 0

  return (
    <main className="min-h-screen bg-[var(--ivory)]">

      {/* ── Search Header ── */}
      <section className="pueblo-shell border-b border-[var(--hairline-soft)] pb-8 pt-8">
        <div className="container mx-auto px-4 space-y-5">

          {/* Title row */}
          <div>
            <span className="pueblo-eyebrow text-[11px] font-bold tracking-widest px-3 py-1 rounded-full inline-block mb-3">
              Directorio
            </span>
            <h1 className="pueblo-accent-line font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-[var(--ink)]">
              Buscar
            </h1>
          </div>

          {/* SmartSearch — mobile only (desktop has it in the header) */}
          <div className="md:hidden">
            <SmartSearch variant="mobile" />
            <p className="text-xs text-[var(--muted)] mt-1.5 text-center">Escribe para ver resultados al instante</p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 w-fit bg-[var(--hairline-soft)] rounded-xl p-1">
            <Link
              href={`/buscar?tipo=negocios${query ? `&q=${encodeURIComponent(query)}` : ''}`}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                tipo === 'negocios'
                  ? 'bg-white text-[var(--ink)] shadow-[var(--shadow-card)]'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Negocios
            </Link>
            <Link
              href={`/buscar?tipo=marketplace${query ? `&q=${encodeURIComponent(query)}` : ''}`}
              className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                tipo === 'marketplace'
                  ? 'bg-white text-[var(--ink)] shadow-[var(--shadow-card)]'
                  : 'text-[var(--muted)] hover:text-[var(--ink)]'
              }`}
            >
              Marketplace
            </Link>
          </div>

          {/* Search form */}
          <form method="GET" className="pueblo-card rounded-2xl p-4 space-y-3">
            <input type="hidden" name="tipo" value={tipo} />

            {/* Main row: text input + category select + button */}
            <div className="flex flex-col md:flex-row gap-3">
              {/* Text input with search icon */}
              <div className="relative flex-1">
                <svg
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                  style={{ color: 'var(--coral)' }}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                </svg>
                <input
                  type="text"
                  name="q"
                  defaultValue={query}
                  placeholder="Buscar por nombre o descripción…"
                  className="w-full pl-11 pr-4 py-3 bg-white border border-[var(--hairline)] rounded-full text-[var(--ink)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/30 focus:border-[var(--coral)] transition-all"
                />
              </div>

              {/* Category select */}
              <div className="w-full md:w-52">
                <select
                  name="categoria"
                  defaultValue={categoriaId}
                  className="w-full px-4 py-3 bg-white border border-[var(--hairline)] rounded-full text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/30 focus:border-[var(--coral)] transition-all appearance-none"
                >
                  <option value="">Todas las categorías</option>
                  {categories?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="rounded-full bg-[var(--coral)] text-white px-8 py-3 font-semibold hover:bg-[var(--coral-deep)] transition-colors shrink-0"
              >
                Buscar
              </button>
            </div>

            {/* Secondary row: neighborhood + sort */}
            <div className="flex flex-col sm:flex-row gap-3">
              {neighborhoods.length > 0 && (
                <div className="w-full sm:w-52">
                  <select
                    name="colonia"
                    defaultValue={colonia}
                    className="w-full px-4 py-2.5 bg-white border border-[var(--hairline)] rounded-full text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/30 focus:border-[var(--coral)] transition-all appearance-none"
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
                  className="w-full px-4 py-2.5 bg-white border border-[var(--hairline)] rounded-full text-sm text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--coral)]/30 focus:border-[var(--coral)] transition-all appearance-none"
                >
                  <option value="">Ordenar: Destacados primero</option>
                  <option value="rating">Ordenar: Mejor calificados</option>
                </select>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* ── Banner: Search Top ── */}
      <div className="container mx-auto px-4 pt-6">
        <BannerDisplay placement="search_top" />
      </div>

      {/* ── Results + Sidebar ── */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* ── Results column ── */}
          <div className="lg:col-span-3">

            {tipo === 'marketplace' ? (
              <>
                {/* Marketplace results */}
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-[var(--muted)] text-sm">
                    <span className="font-semibold text-[var(--ink)]">{marketplaceListings.length}</span>{' '}
                    artículo{marketplaceListings.length !== 1 ? 's' : ''}
                    {query && (
                      <span> para &ldquo;<strong className="text-[var(--ink)]">{query}</strong>&rdquo;</span>
                    )}
                  </p>
                  <Link
                    href="/marketplace"
                    className="text-sm font-medium text-[var(--coral)] hover:underline"
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
                  /* Empty state — marketplace */
                  <div className="flex flex-col items-center text-center py-20">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                      style={{ background: 'color-mix(in srgb, var(--coral) 10%, var(--ivory))' }}
                    >
                      <span className="text-5xl">🛍️</span>
                    </div>
                    <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)] mb-2">
                      No hay artículos
                    </h2>
                    <p className="text-[var(--muted)] mb-7 max-w-xs">
                      {query
                        ? `No hay artículos que coincidan con "${query}"`
                        : 'No hay artículos en el marketplace por ahora.'}
                    </p>
                    <Link
                      href="/marketplace/publicar"
                      className="rounded-full bg-[var(--coral)] text-white px-6 py-3 font-semibold hover:bg-[var(--coral-deep)] transition-colors"
                    >
                      Publicar artículo
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Business results */}
                <div className="mb-6">
                  <p className="text-[var(--muted)] text-sm">
                    <span className="font-semibold text-[var(--ink)]">{businesses?.length || 0}</span>{' '}
                    negocio{businesses?.length !== 1 ? 's' : ''} encontrado{businesses?.length !== 1 ? 's' : ''}
                    {query && (
                      <span> para &ldquo;<strong className="text-[var(--ink)]">{query}</strong>&rdquo;</span>
                    )}
                  </p>
                </div>

                {businesses && businesses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {businesses.map((business, index) => (
                      <React.Fragment key={business.id}>
                        {/* Sponsored card every 8 results */}
                        {index > 0 && index % 8 === 0 && (
                          <div className="pueblo-card rounded-2xl overflow-hidden relative">
                            <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded text-[11px] font-medium"
                              style={{ background: 'color-mix(in srgb, var(--gold) 20%, transparent)', color: 'var(--terracotta)' }}>
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
                  /* Empty state — negocios */
                  <div className="flex flex-col items-center text-center py-20">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
                      style={{ background: 'color-mix(in srgb, var(--coral) 10%, var(--ivory))' }}
                    >
                      {/* Search icon in coral */}
                      <svg
                        className="w-10 h-10"
                        style={{ color: 'var(--coral)' }}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" strokeLinecap="round" />
                      </svg>
                    </div>
                    <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)] mb-2">
                      No se encontraron negocios
                    </h2>
                    <p className="text-[var(--muted)] mb-7 max-w-xs">
                      {query
                        ? `No hay negocios que coincidan con "${query}". Intenta con otro término.`
                        : 'No hay negocios disponibles en este momento.'}
                    </p>
                    <Link
                      href="/"
                      className="rounded-full bg-[var(--coral)] text-white px-6 py-3 font-semibold hover:bg-[var(--coral-deep)] transition-colors"
                    >
                      Volver al Inicio
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Mobile banner (between results and sidebar) ── */}
          <div className="lg:hidden mt-2">
            <BannerDisplay placement="search_sidebar" />
          </div>

          {/* ── Desktop Sidebar ── */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="pueblo-card rounded-2xl p-5 sticky top-24">
              <span className="pueblo-eyebrow text-[11px] font-bold tracking-widest px-3 py-1 rounded-full inline-block mb-4">
                Categorías
              </span>
              <nav className="space-y-0.5">
                {/* All categories link */}
                <Link
                  href={`/buscar${query ? `?q=${encodeURIComponent(query)}` : ''}${colonia ? `${query ? '&' : '?'}colonia=${encodeURIComponent(colonia)}` : ''}${orden ? `${query || colonia ? '&' : '?'}orden=${orden}` : ''}`}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                    !categoriaId
                      ? 'font-bold'
                      : 'text-[var(--muted)] hover:bg-[var(--hairline-soft)] hover:text-[var(--ink)]'
                  }`}
                  style={!categoriaId ? { background: 'color-mix(in srgb, var(--coral) 10%, transparent)', color: 'var(--coral)' } : {}}
                >
                  <span>Todas</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={!categoriaId
                      ? { background: 'color-mix(in srgb, var(--coral) 18%, transparent)', color: 'var(--coral)' }
                      : { background: 'var(--hairline-soft)', color: 'var(--muted)' }}
                  >
                    {totalBusinesses}
                  </span>
                </Link>

                {/* Per-category links */}
                {categoriesWithCount.map((cat) => {
                  const isActive = categoriaId === cat.id
                  return (
                    <Link
                      key={cat.id}
                      href={`/buscar?categoria=${cat.id}${query ? `&q=${encodeURIComponent(query)}` : ''}${colonia ? `&colonia=${encodeURIComponent(colonia)}` : ''}${orden ? `&orden=${orden}` : ''}`}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                        isActive
                          ? 'font-bold'
                          : 'text-[var(--muted)] hover:bg-[var(--hairline-soft)] hover:text-[var(--ink)]'
                      }`}
                      style={isActive ? { background: 'color-mix(in srgb, var(--coral) 10%, transparent)', color: 'var(--coral)' } : {}}
                    >
                      <span className="truncate">
                        <span className="mr-1.5">{cat.icon}</span>
                        {cat.name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2"
                        style={isActive
                          ? { background: 'color-mix(in srgb, var(--coral) 18%, transparent)', color: 'var(--coral)' }
                          : { background: 'var(--hairline-soft)', color: 'var(--muted)' }}
                      >
                        {cat.businessCount}
                      </span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Banner: Search Sidebar */}
            <div className="mt-6">
              <BannerDisplay placement="search_sidebar" />
            </div>
          </aside>

        </div>
      </div>

    </main>
  )
}
