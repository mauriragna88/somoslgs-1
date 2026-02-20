import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import SearchForm from '@/components/home/SearchForm'

export const revalidate = 3600

interface HomeCategory {
  id: string
  name: string
  icon: string
}

interface FeaturedBusiness {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  subscription_tier: string
  is_featured: boolean
  category: { name: string; icon: string } | null
}

export default async function Home() {
  const supabase = createClient()

  // Fetch popular categories (ordered by display_order to show most important first)
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon')
    .is('parent_id', null)
    .limit(8)
    .order('display_order') as { data: HomeCategory[] | null }

  // Fetch featured/premium businesses
  const { data: featuredBusinesses } = await supabase
    .from('businesses')
    .select(`
      id, name, slug, description, logo_url, subscription_tier, is_featured,
      category:categories(name, icon)
    `)
    .eq('is_active', true)
    .eq('subscription_status', 'active')
    .in('subscription_tier', ['premium', 'delivery'])
    .order('is_featured', { ascending: false })
    .order('subscription_tier', { ascending: false })
    .limit(6) as { data: FeaturedBusiness[] | null }

  // JSON-LD structured data
  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'SomosLagos',
    url: 'https://www.somoslagos.com.mx',
    description: 'La plataforma digital de Lagos de Moreno. Descubre negocios locales, pide productos y conecta con tu comunidad.',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.somoslagos.com.mx/buscar?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  }

  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SomosLagos',
    url: 'https://www.somoslagos.com.mx',
    logo: 'https://www.somoslagos.com.mx/logo.png',
    description: 'Plataforma digital de negocios locales en Lagos de Moreno, Jalisco, México.',
    areaServed: {
      '@type': 'City',
      name: 'Lagos de Moreno',
      containedInPlace: {
        '@type': 'State',
        name: 'Jalisco',
        containedInPlace: {
          '@type': 'Country',
          name: 'México',
        },
      },
    },
  }

  return (
    <main className="min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-secondary via-secondary to-primary overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-primary-light rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-56 h-56 sm:w-80 sm:h-80 bg-accent rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
              Todo lo que buscas en{' '}
              <span className="text-primary-light">Lagos de Moreno</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Descubre negocios locales, pide productos y conecta con tu comunidad
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-10">
              <SearchForm />
            </div>

            {/* Social Proof Metrics */}
            <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white">50+</p>
                <p className="text-sm text-gray-400">Negocios activos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white">8</p>
                <p className="text-sm text-gray-400">Categorias</p>
              </div>
              <div className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white">100%</p>
                <p className="text-sm text-gray-400">Gratis para explorar</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-secondary mb-2">Explora por categoria</h2>
            <p className="text-gray-500">Encuentra exactamente lo que necesitas</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {categories && categories.length > 0 ? (
              categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/buscar?categoria=${category.id}`}
                  className="group p-6 bg-gray-50 rounded-2xl hover:bg-primary/5 hover:shadow-md transition-all border border-transparent hover:border-primary/20"
                >
                  <div className="text-4xl mb-3">{category.icon || '📦'}</div>
                  <h3 className="font-semibold text-secondary group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                </Link>
              ))
            ) : (
              <>
                <Link href="/buscar?q=restaurantes" className="group p-6 bg-gray-50 rounded-2xl hover:bg-primary/5 hover:shadow-md transition-all border border-transparent hover:border-primary/20">
                  <div className="text-4xl mb-3">🍔</div>
                  <h3 className="font-semibold text-secondary group-hover:text-primary transition-colors">Restaurantes</h3>
                </Link>
                <Link href="/buscar?q=tiendas" className="group p-6 bg-gray-50 rounded-2xl hover:bg-primary/5 hover:shadow-md transition-all border border-transparent hover:border-primary/20">
                  <div className="text-4xl mb-3">🛒</div>
                  <h3 className="font-semibold text-secondary group-hover:text-primary transition-colors">Tiendas</h3>
                </Link>
                <Link href="/buscar?q=servicios" className="group p-6 bg-gray-50 rounded-2xl hover:bg-primary/5 hover:shadow-md transition-all border border-transparent hover:border-primary/20">
                  <div className="text-4xl mb-3">🔧</div>
                  <h3 className="font-semibold text-secondary group-hover:text-primary transition-colors">Servicios</h3>
                </Link>
                <Link href="/buscar?q=profesionales" className="group p-6 bg-gray-50 rounded-2xl hover:bg-primary/5 hover:shadow-md transition-all border border-transparent hover:border-primary/20">
                  <div className="text-4xl mb-3">👔</div>
                  <h3 className="font-semibold text-secondary group-hover:text-primary transition-colors">Profesionales</h3>
                </Link>
              </>
            )}
          </div>

          <div className="text-center mt-8">
            <Link
              href="/categorias"
              className="inline-flex items-center text-primary hover:text-primary-dark font-medium transition-colors"
            >
              Ver todas las categorias
              <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Businesses */}
      {featuredBusinesses && featuredBusinesses.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <h2 className="text-3xl font-bold text-secondary mb-2">Negocios Destacados</h2>
                <p className="text-gray-500">Los mejores negocios de Lagos de Moreno</p>
              </div>
              <Link
                href="/buscar"
                className="hidden sm:inline-flex items-center text-primary hover:text-primary-dark font-medium transition-colors"
              >
                Ver todos
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBusinesses.map((business) => (
                <Link
                  key={business.id}
                  href={`/negocios/${business.slug}`}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-100"
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {business.logo_url ? (
                        <Image
                          src={business.logo_url}
                          alt={business.name}
                          width={56}
                          height={56}
                          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-xl text-white font-bold">
                            {business.name[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-secondary group-hover:text-primary transition-colors truncate mb-1">
                          {business.name}
                        </h3>
                        {business.category && (
                          <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full mb-2">
                            {business.category.icon} {business.category.name}
                          </span>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {business.description || 'Visita este negocio para conocer mas'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-sm text-primary font-medium group-hover:underline">
                      Ver negocio
                    </span>
                    <svg className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8 sm:hidden">
              <Link
                href="/buscar"
                className="inline-flex items-center text-primary hover:text-primary-dark font-medium transition-colors"
              >
                Ver todos los negocios
                <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA for Business Owners */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto bg-gradient-to-br from-primary to-secondary rounded-3xl overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Haz crecer tu negocio
                </h2>
                <p className="text-lg text-gray-300 max-w-xl mx-auto">
                  Unete a SomosLagos y llega a miles de clientes en Lagos de Moreno
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="text-center p-4">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📱</span>
                  </div>
                  <h3 className="font-semibold text-white mb-1">Presencia Digital</h3>
                  <p className="text-sm text-gray-300">Tu negocio visible 24/7 en internet</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">🎯</span>
                  </div>
                  <h3 className="font-semibold text-white mb-1">Mas Clientes</h3>
                  <p className="text-sm text-gray-300">Llega a miles de personas en Lagos</p>
                </div>
                <div className="text-center p-4">
                  <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">💳</span>
                  </div>
                  <h3 className="font-semibold text-white mb-1">Ventas Online</h3>
                  <p className="text-sm text-gray-300">Recibe pagos y pedidos en linea</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/registrar-negocio"
                  className="bg-accent hover:bg-accent-dark text-secondary px-10 py-4 rounded-full font-bold text-lg shadow-lg transition-all hover:scale-105"
                >
                  Registrar mi Negocio
                </Link>
                <p className="text-sm text-gray-300">
                  Planes desde <strong className="text-accent text-lg">$99 MXN/mes</strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-secondary mb-2">¿Por que SomosLagos?</h2>
            <p className="text-gray-500">La plataforma hecha por y para Lagos de Moreno</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-secondary mb-1">Seguro</h3>
              <p className="text-sm text-gray-500">Negocios verificados y pagos protegidos</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-secondary mb-1">Local</h3>
              <p className="text-sm text-gray-500">100% enfocado en Lagos de Moreno</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-secondary mb-1">Rapido</h3>
              <p className="text-sm text-gray-500">Encuentra lo que buscas en segundos</p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-secondary mb-1">Gratis</h3>
              <p className="text-sm text-gray-500">Explora sin costo, siempre</p>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
