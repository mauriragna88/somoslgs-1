import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import SearchForm from '@/components/home/SearchForm'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
import StarRating from '@/components/reviews/StarRating'
import BannerDisplay from '@/components/ads/BannerDisplay'

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
  address: string | null
  subscription_tier: string
  is_featured: boolean
  business_hours: any
  rating: number
  total_reviews: number
  category: { name: string; icon: string } | null
}

export default async function Home() {
  const supabase = createClient()

  // Fetch popular categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon')
    .is('parent_id', null)
    .limit(12)
    .order('display_order') as { data: HomeCategory[] | null }

  // Get total category count
  const { count: totalCategories } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })

  // Fetch featured/premium businesses
  const { data: featuredBusinesses } = await supabase
    .from('businesses')
    .select(`
      id, name, slug, description, logo_url, address, subscription_tier, is_featured, business_hours, rating, total_reviews,
      category:categories(name, icon)
    `)
    .eq('is_active', true)
    .eq('subscription_status', 'active')
    .in('subscription_tier', ['avanzado'])
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

  const catCount = totalCategories || (categories?.length ?? 0)

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

      {/* Hero Section with Lagos de Moreno background */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background Photo */}
        <Image
          src="/lagos-hero.jpg"
          alt="Lagos de Moreno"
          fill
          className="object-cover"
          priority
          quality={85}
        />
        {/* Dark overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/80 via-secondary/70 to-secondary/90"></div>
        {/* Accent glow */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-accent/10 to-transparent"></div>

        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="text-center max-w-3xl mx-auto">
            {/* Logo in hero */}
            <div className="flex justify-center mb-8">
              <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
                <Image
                  src="/logo.png"
                  alt="SomosLagos"
                  width={80}
                  height={80}
                  className="w-16 h-16 md:w-20 md:h-20"
                  priority
                />
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-5 leading-tight tracking-tight">
              Descubre{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent-light to-accent">Lagos de Moreno</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto font-light">
              Conecta con negocios locales, explora servicios y apoya a tu comunidad
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-12">
              <SearchForm />
            </div>

            {/* Social Proof Metrics - glass cards */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                <p className="text-2xl md:text-3xl font-bold text-accent">25+</p>
                <p className="text-xs text-white/80 uppercase tracking-wider mt-1">Negocios</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                <p className="text-2xl md:text-3xl font-bold text-primary-light">{catCount}+</p>
                <p className="text-xs text-white/80 uppercase tracking-wider mt-1">Categorias</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
                <p className="text-2xl md:text-3xl font-bold text-white">100%</p>
                <p className="text-xs text-white/80 uppercase tracking-wider mt-1">Gratis</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80H1440V40C1440 40 1320 0 1200 0C1080 0 960 40 840 40C720 40 600 0 480 0C360 0 240 40 120 40C60 40 0 20 0 20V80Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Banner: Home Top */}
      <div className="container mx-auto px-4 py-6">
        <BannerDisplay placement="home_top" />
      </div>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4">Categorias</span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-3">Explora por categoria</h2>
            <p className="text-gray-500 max-w-lg mx-auto">Encuentra exactamente lo que necesitas entre nuestras categorias de negocios</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
            {categories && categories.length > 0 ? (
              categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/buscar?categoria=${category.id}`}
                  className="group flex flex-col items-center p-5 bg-white rounded-2xl hover:shadow-xl transition-all border border-gray-100 hover:border-accent/30 hover:-translate-y-1"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <span className="text-3xl">{category.icon || '📦'}</span>
                  </div>
                  <h3 className="font-semibold text-secondary group-hover:text-primary transition-colors text-xs text-center leading-tight">
                    {category.name}
                  </h3>
                </Link>
              ))
            ) : (
              <>
                <Link href="/buscar?q=restaurantes" className="group flex flex-col items-center p-5 bg-white rounded-2xl hover:shadow-xl transition-all border border-gray-100 hover:border-accent/30 hover:-translate-y-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><span className="text-3xl">🍔</span></div>
                  <h3 className="font-semibold text-secondary group-hover:text-primary transition-colors text-xs text-center">Restaurantes</h3>
                </Link>
                <Link href="/buscar?q=tiendas" className="group flex flex-col items-center p-5 bg-white rounded-2xl hover:shadow-xl transition-all border border-gray-100 hover:border-accent/30 hover:-translate-y-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><span className="text-3xl">🛒</span></div>
                  <h3 className="font-semibold text-secondary group-hover:text-primary transition-colors text-xs text-center">Tiendas</h3>
                </Link>
                <Link href="/buscar?q=servicios" className="group flex flex-col items-center p-5 bg-white rounded-2xl hover:shadow-xl transition-all border border-gray-100 hover:border-accent/30 hover:-translate-y-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><span className="text-3xl">🔧</span></div>
                  <h3 className="font-semibold text-secondary group-hover:text-primary transition-colors text-xs text-center">Servicios</h3>
                </Link>
                <Link href="/buscar?q=profesionales" className="group flex flex-col items-center p-5 bg-white rounded-2xl hover:shadow-xl transition-all border border-gray-100 hover:border-accent/30 hover:-translate-y-1">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><span className="text-3xl">👔</span></div>
                  <h3 className="font-semibold text-secondary group-hover:text-primary transition-colors text-xs text-center">Profesionales</h3>
                </Link>
              </>
            )}
          </div>

          <div className="text-center mt-10">
            <Link
              href="/categorias"
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary/5 hover:bg-secondary/10 text-secondary font-semibold rounded-full transition-colors"
            >
              Ver todas las categorias
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Banner: Home Middle */}
      <div className="container mx-auto px-4 py-6">
        <BannerDisplay placement="home_middle" />
      </div>

      {/* Featured Businesses */}
      {featuredBusinesses && featuredBusinesses.length > 0 && (
        <section className="py-20 bg-surface">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent-dark text-sm font-semibold rounded-full mb-4">Destacados</span>
                <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-2">Negocios Destacados</h2>
                <p className="text-gray-500">Los mejores negocios de Lagos de Moreno</p>
              </div>
              <Link
                href="/buscar"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-secondary font-medium rounded-full hover:shadow-md transition-all"
              >
                Ver todos
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBusinesses.map((business) => (
                <Link
                  key={business.id}
                  href={`/negocios/${business.slug}`}
                  className="group bg-white rounded-2xl hover:shadow-2xl transition-all overflow-hidden border border-gray-100 hover:border-transparent hover:-translate-y-1"
                >
                  {/* Gradient top */}
                  <div className="h-1 bg-gradient-to-r from-primary via-accent to-warm"></div>

                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {business.logo_url ? (
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-gray-100 relative">
                          <Image
                            src={business.logo_url}
                            alt={business.name}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 bg-gradient-to-br from-secondary to-secondary-light rounded-xl flex items-center justify-center flex-shrink-0">
                          <span className="text-xl text-white font-bold">
                            {business.name[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-secondary group-hover:text-primary transition-colors truncate">
                            {business.name}
                          </h3>
                          <OpenClosedBadge businessHours={business.business_hours} />
                        </div>
                        {business.category && (
                          <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full mb-2">
                            {business.category.icon} {business.category.name}
                          </span>
                        )}
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {business.description || 'Visita este negocio para conocer mas'}
                        </p>
                        {business.total_reviews > 0 && (
                          <div className="mt-1.5">
                            <StarRating value={business.rating} count={business.total_reviews} size="sm" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="px-6 py-3 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-sm text-primary font-semibold">
                      Ver negocio
                    </span>
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                      <svg className="w-4 h-4 text-primary group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8 sm:hidden">
              <Link
                href="/buscar"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors"
              >
                Ver todos los negocios
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA for Business Owners */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl">
            {/* Background image reuse */}
            <Image
              src="/lagos-hero.jpg"
              alt=""
              fill
              className="object-cover"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/90 via-secondary/85 to-primary/80"></div>
            <div className="relative p-8 md:p-14">
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
                  Haz crecer tu negocio
                </h2>
                <p className="text-lg text-white/80 max-w-xl mx-auto">
                  Unete a SomosLagos y llega a miles de clientes en Lagos de Moreno
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="text-center p-5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                  <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📱</span>
                  </div>
                  <h3 className="font-semibold text-white mb-1 text-sm">Presencia Digital</h3>
                  <p className="text-xs text-white/80">Tu negocio visible 24/7</p>
                </div>
                <div className="text-center p-5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                  <div className="w-12 h-12 bg-primary-light/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="font-semibold text-white mb-1 text-sm">Mas Clientes</h3>
                  <p className="text-xs text-white/80">Miles de personas en Lagos</p>
                </div>
                <div className="text-center p-5 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
                  <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">💳</span>
                  </div>
                  <h3 className="font-semibold text-white mb-1 text-sm">Ventas Online</h3>
                  <p className="text-xs text-white/80">Pedidos y pagos en linea</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/registrar-negocio"
                  className="bg-accent hover:bg-accent-dark text-secondary px-10 py-4 rounded-full font-bold text-lg shadow-xl transition-all hover:scale-105 hover:shadow-accent/30"
                >
                  Registrar mi Negocio GRATIS
                </Link>
                <p className="text-sm text-white/80">
                  <strong className="text-accent text-lg">100% Gratis</strong> — sin costo de registro
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-surface">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-secondary/5 text-secondary text-sm font-semibold rounded-full mb-4">Ventajas</span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-3">¿Por que SomosLagos?</h2>
            <p className="text-gray-500">La plataforma hecha por y para Lagos de Moreno</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-secondary mb-1 text-sm">Seguro</h3>
              <p className="text-xs text-gray-500">Negocios verificados</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-accent/15 to-accent/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-accent-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-secondary mb-1 text-sm">Local</h3>
              <p className="text-xs text-gray-500">100% Lagos de Moreno</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-secondary mb-1 text-sm">Rapido</h3>
              <p className="text-xs text-gray-500">Busca en segundos</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all">
              <div className="w-12 h-12 bg-gradient-to-br from-accent/15 to-accent/5 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-accent-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-secondary mb-1 text-sm">Gratis</h3>
              <p className="text-xs text-gray-500">Explora sin costo</p>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
