import Link from 'next/link'
import Image from 'next/image'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Buscar Negocios en Lagos de Moreno',
  description: 'Encuentra restaurantes, tiendas, servicios y más negocios locales en Lagos de Moreno, Jalisco. Busca por nombre, categoría o ubicación.',
  openGraph: {
    title: 'Buscar Negocios en Lagos de Moreno | SomosLagos',
    description: 'Encuentra restaurantes, tiendas, servicios y más negocios locales en Lagos de Moreno, Jalisco.',
    url: 'https://www.somoslagos.com.mx/buscar',
  },
}

interface SearchParams {
  q?: string
  categoria?: string
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
  is_active: boolean
  subscription_tier: string
  is_featured: boolean
  category: { id: string; name: string; icon: string } | null
}

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const query = searchParams.q || ''
  const categoriaId = searchParams.categoria || ''

  const supabase = createClient()

  // Get categories for filter
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon')
    .order('name') as { data: Category[] | null }

  // Build search query - Premium businesses appear first
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
      is_active,
      subscription_tier,
      is_featured,
      category:categories(id, name, icon)
    `)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('subscription_tier', { ascending: false })
    .order('name')

  // Apply search filter - split into words for smarter matching
  if (query) {
    const words = query.toLowerCase().split(/\s+/).filter((w: string) => w.length >= 2)
    if (words.length > 0) {
      const orConditions = words.map((word: string) =>
        `name.ilike.%${word}%,description.ilike.%${word}%`
      ).join(',')
      businessQuery = businessQuery.or(orConditions)
    } else {
      businessQuery = businessQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }
  }

  // Apply category filter
  if (categoriaId) {
    businessQuery = businessQuery.eq('category_id', categoriaId)
  }

  const { data: businesses, error } = await businessQuery.limit(50) as { data: Business[] | null; error: any }

  // error is handled gracefully - empty results shown

  return (
    <main className="min-h-screen bg-surface">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-100 py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-secondary mb-6">Buscar Negocios</h1>

          {/* Search Form */}
          <form method="GET" className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="Buscar por nombre o descripcion..."
                className="w-full px-4 py-3 bg-surface border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
            </div>
            <div className="w-full md:w-64">
              <select
                name="categoria"
                defaultValue={categoriaId}
                className="w-full px-4 py-3 bg-surface border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
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
              className="px-8 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-primary/20"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        {/* Results count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {businesses?.length || 0} negocio{businesses?.length !== 1 ? 's' : ''} encontrado{businesses?.length !== 1 ? 's' : ''}
            {query && <span> para &ldquo;<strong>{query}</strong>&rdquo;</span>}
          </p>
        </div>

        {/* Business Grid */}
        {businesses && businesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <Link
                key={business.id}
                href={`/negocios/${business.slug}`}
                className="bg-white rounded-2xl hover:shadow-2xl transition-all overflow-hidden group border border-gray-100 hover:border-transparent hover:-translate-y-1"
              >
                {/* Top accent */}
                <div className="h-1 bg-gradient-to-r from-primary via-accent to-warm"></div>

                {/* Image/Logo */}
                <div className="h-48 bg-surface relative overflow-hidden">
                  {business.logo_url ? (
                    <Image
                      src={business.logo_url}
                      alt={business.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/5 to-primary/5">
                      <span className="text-6xl text-secondary/30 font-bold">
                        {business.name[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Category badge */}
                  {business.category && (
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 shadow-sm">
                      {business.category.icon} {business.category.name}
                    </div>
                  )}
                  {/* Premium/Featured badge */}
                  {(business.subscription_tier === 'premium' || business.is_featured) && (
                    <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-accent to-accent-dark text-secondary rounded-full text-xs font-bold shadow-lg">
                      &#11088; Destacado
                    </div>
                  )}
                  {business.subscription_tier === 'delivery' && !business.is_featured && (
                    <div className="absolute top-3 right-3 px-3 py-1.5 bg-secondary text-white rounded-full text-xs font-bold shadow-lg">
                      &#128640; Delivery
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-secondary group-hover:text-primary transition-colors">
                    {business.name}
                  </h3>
                  {business.description && (
                    <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">
                      {business.description}
                    </p>
                  )}
                  {business.address && (
                    <p className="text-sm text-gray-400 mt-2.5 flex items-center">
                      <span className="mr-1.5 text-accent">&#128205;</span>
                      {business.address}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-sm text-primary font-semibold">Ver negocio</span>
                  <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary transition-colors">
                    <svg className="w-3.5 h-3.5 text-primary group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🔍</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No se encontraron negocios</h2>
            <p className="text-gray-600 mb-6">
              {query
                ? `No hay negocios que coincidan con "${query}"`
                : 'No hay negocios disponibles en este momento'}
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
            >
              Volver al Inicio
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
