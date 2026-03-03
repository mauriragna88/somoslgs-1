import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import SearchForm from '@/components/home/SearchForm'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
import StarRating from '@/components/reviews/StarRating'
import BannerDisplay from '@/components/ads/BannerDisplay'
import PremiumSlider from '@/components/shared/PremiumSlider'
import AnimatedCounter from '@/components/shared/AnimatedCounter'
import type { BlogPost } from '@/types/database.types'

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

  // Fetch featured/premium businesses (avanzado) with photos for slider
  const { data: featuredBusinesses } = await supabase
    .from('businesses')
    .select(`
      id, name, slug, description, logo_url, cover_url, address, subscription_tier, is_featured, business_hours, rating, total_reviews,
      category:categories(name, icon),
      business_photos(image_url)
    `)
    .eq('is_active', true)
    .in('subscription_tier', ['avanzado'])
    .order('is_featured', { ascending: false })
    .order('subscription_tier', { ascending: false })
    .limit(6) as { data: any[] | null }

  // Fetch latest blog posts
  const { data: blogPosts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, featured_image_url, category, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(3)

  const latestPosts = (blogPosts as BlogPost[]) || []

  // Fetch newest businesses (all tiers) for Descubre section
  const { data: newestBusinesses } = await supabase
    .from('businesses')
    .select(`
      id, name, slug, description, logo_url, cover_url, subscription_tier, business_hours, rating, total_reviews,
      category:categories(name, icon),
      business_photos(image_url)
    `)
    .eq('is_active', true)
    .order('subscription_tier', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(16) as { data: any[] | null }

  const discoverBusinesses = newestBusinesses || []

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
            <div className="flex justify-center mb-8 animate-fade-in-up">
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

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold text-white mb-5 leading-tight tracking-tight animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              Descubre{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent-light to-accent">Lagos de Moreno</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto font-light animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              Conecta con negocios locales, explora servicios y apoya a tu comunidad
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-12 animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
              <SearchForm />
            </div>

            {/* Social Proof Metrics - glass cards with animated counters */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10 animate-fade-in-up">
                <p className="text-2xl md:text-3xl font-bold text-accent">
                  <AnimatedCounter target={25} suffix="+" />
                </p>
                <p className="text-xs text-white/80 uppercase tracking-wider mt-1">Negocios</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <p className="text-2xl md:text-3xl font-bold text-primary-light">
                  <AnimatedCounter target={catCount} suffix="+" />
                </p>
                <p className="text-xs text-white/80 uppercase tracking-wider mt-1">Categorias</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <p className="text-2xl md:text-3xl font-bold text-white">
                  <AnimatedCounter target={100} suffix="%" />
                </p>
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

      {/* Categories — compact horizontal strip */}
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-3">
            {categories && categories.length > 0 ? (
              <>
                {categories.slice(0, 6).map((category) => (
                  <Link
                    key={category.id}
                    href={`/buscar?categoria=${category.id}`}
                    className="group flex items-center gap-2 px-5 py-3 bg-white rounded-full border border-gray-200 hover:border-primary/30 hover:shadow-lg hover:scale-105 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform duration-300">{category.icon || '📦'}</span>
                    <span className="font-medium text-sm text-secondary group-hover:text-primary transition-colors">
                      {category.name}
                    </span>
                  </Link>
                ))}
                {catCount > 6 && (
                  <Link
                    href="/categorias"
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-primary/10 text-primary rounded-full font-semibold text-sm hover:bg-primary/20 transition-colors"
                  >
                    +{catCount - 6} mas
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/buscar?q=restaurantes" className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all">
                  <span className="text-lg">🍔</span><span className="font-medium text-sm text-secondary">Restaurantes</span>
                </Link>
                <Link href="/buscar?q=tiendas" className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all">
                  <span className="text-lg">🛒</span><span className="font-medium text-sm text-secondary">Tiendas</span>
                </Link>
                <Link href="/buscar?q=servicios" className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-gray-200 hover:border-primary/30 hover:shadow-md transition-all">
                  <span className="text-lg">🔧</span><span className="font-medium text-sm text-secondary">Servicios</span>
                </Link>
                <Link href="/categorias" className="flex items-center gap-1.5 px-4 py-2.5 bg-primary/10 text-primary rounded-full font-semibold text-sm hover:bg-primary/20 transition-colors">
                  Ver todas →
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Banner: Home Middle */}
      <div className="container mx-auto px-4 py-6">
        <BannerDisplay placement="home_middle" />
      </div>

      {/* Featured Businesses — Premium Slider */}
      {featuredBusinesses && featuredBusinesses.length > 0 && (
        <section className="py-20 bg-surface">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent-dark text-sm font-semibold rounded-full mb-4">Destacados</span>
              <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-2">Negocios Destacados</h2>
              <p className="text-gray-500">Los mejores negocios de Lagos de Moreno</p>
            </div>

            <PremiumSlider businesses={featuredBusinesses} />

            <div className="text-center mt-8">
              <Link
                href="/descubre"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-secondary font-medium rounded-full hover:shadow-md transition-all"
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

      {/* Descubre Section — differentiated by tier */}
      {discoverBusinesses.length > 0 && (() => {
        const avanzadoBiz = discoverBusinesses.filter((b: any) => b.subscription_tier === 'avanzado')
        const proBiz = discoverBusinesses.filter((b: any) => b.subscription_tier === 'pro')
        const gratisBiz = discoverBusinesses.filter((b: any) => b.subscription_tier === 'gratis')

        return (
          <section className="py-20 bg-surface">
            <div className="container mx-auto px-4">
              <div className="flex items-end justify-between mb-12">
                <div>
                  <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4">Descubre</span>
                  <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-2">Conoce Negocios Locales</h2>
                  <p className="text-gray-500">Lo mejor de Lagos de Moreno en un solo lugar</p>
                </div>
                <Link
                  href="/descubre"
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-secondary font-medium rounded-full hover:shadow-md transition-all"
                >
                  Ver todos
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* AVANZADO: Slider + Large Cards */}
              {avanzadoBiz.length > 0 && (
                <div className="mb-10">
                  <PremiumSlider businesses={avanzadoBiz} />
                  {avanzadoBiz.length > 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      {avanzadoBiz.map((business: any) => {
                        const photos = business.business_photos || []
                        const heroImage = business.cover_url || photos[0]?.image_url
                        return (
                          <Link
                            key={business.id}
                            href={`/negocios/${business.slug}`}
                            className="group bg-gradient-to-br from-amber-50 to-white rounded-2xl overflow-hidden border-2 border-accent/40 hover:shadow-2xl hover:-translate-y-1 transition-all relative"
                          >
                            <div className="absolute top-3 right-3 z-10 bg-accent text-secondary text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              Verificado
                            </div>
                            {heroImage ? (
                              <div className="relative h-52 bg-gray-100">
                                <Image src={heroImage} alt={business.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                              </div>
                            ) : (
                              <div className="h-52 bg-gradient-to-br from-accent/10 to-primary/10" />
                            )}
                            <div className="p-5">
                              <div className="flex items-start gap-4">
                                {business.logo_url ? (
                                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-accent/30 -mt-10 relative bg-white shadow-lg">
                                    <Image src={business.logo_url} alt={business.name} fill sizes="56px" className="object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent-dark rounded-xl flex items-center justify-center flex-shrink-0 -mt-10 shadow-lg">
                                    <span className="text-xl text-secondary font-bold">{business.name[0].toUpperCase()}</span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-lg text-secondary group-hover:text-primary transition-colors truncate">{business.name}</h3>
                                  {business.category && (
                                    <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">{business.category.icon} {business.category.name}</span>
                                  )}
                                </div>
                              </div>
                              {business.description && (
                                <p className="text-sm text-gray-600 mt-3 line-clamp-3">{business.description}</p>
                              )}
                              {photos.length > 1 && (
                                <div className="flex gap-2 mt-3">
                                  {photos.slice(0, 3).map((p: any, i: number) => (
                                    <div key={i} className="relative w-20 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                      <Image src={p.image_url} alt="" fill sizes="80px" className="object-cover" />
                                    </div>
                                  ))}
                                  {photos.length > 3 && (
                                    <div className="w-20 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                      <span className="text-xs font-semibold text-gray-500">+{photos.length - 3}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {business.total_reviews > 0 && (
                                <div className="mt-3"><StarRating value={business.rating} count={business.total_reviews} size="sm" /></div>
                              )}
                            </div>
                            <div className="h-1 bg-gradient-to-r from-accent via-primary to-accent" />
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PRO: Horizontal cards (image left, info right on desktop) */}
              {proBiz.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-5">
                    <span className="text-xl">🏆</span>
                    <h3 className="text-xl font-bold text-secondary">Negocios Pro</h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {proBiz.map((business: any) => {
                      const photos = business.business_photos || []
                      const heroImage = business.cover_url || photos[0]?.image_url
                      return (
                        <Link
                          key={business.id}
                          href={`/negocios/${business.slug}`}
                          className="group bg-white rounded-2xl overflow-hidden border border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all relative flex flex-col sm:flex-row"
                        >
                          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-primary text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">PRO</div>
                          {/* Image section */}
                          {heroImage ? (
                            <div className="relative h-44 sm:h-auto sm:w-48 md:w-56 flex-shrink-0 bg-gray-100">
                              <Image src={heroImage} alt={business.name} fill sizes="(max-width: 640px) 100vw, 224px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                          ) : business.logo_url ? (
                            <div className="h-44 sm:h-auto sm:w-48 md:w-56 flex-shrink-0 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                              <div className="w-16 h-16 rounded-xl overflow-hidden relative">
                                <Image src={business.logo_url} alt={business.name} fill sizes="64px" className="object-cover" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-44 sm:h-auto sm:w-48 md:w-56 flex-shrink-0 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                              <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary-light rounded-xl flex items-center justify-center">
                                <span className="text-2xl text-white font-bold">{business.name[0].toUpperCase()}</span>
                              </div>
                            </div>
                          )}
                          {/* Info section */}
                          <div className="flex-1 p-5 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                              {business.logo_url && (
                                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 relative ring-1 ring-primary/20 hidden sm:block">
                                  <Image src={business.logo_url} alt="" fill sizes="36px" className="object-cover" />
                                </div>
                              )}
                              <h3 className="font-bold text-lg text-secondary group-hover:text-primary transition-colors truncate">{business.name}</h3>
                              <OpenClosedBadge businessHours={business.business_hours} />
                            </div>
                            {business.category && (
                              <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full w-fit mb-2">{business.category.icon} {business.category.name}</span>
                            )}
                            {business.description && (
                              <p className="text-sm text-gray-500 line-clamp-2 mb-2">{business.description}</p>
                            )}
                            {business.total_reviews > 0 && (
                              <div><StarRating value={business.rating} count={business.total_reviews} size="sm" /></div>
                            )}
                            <span className="text-sm text-primary font-semibold mt-2 group-hover:underline">Ver negocio →</span>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/40 to-primary/10" />
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* GRATIS: Compact cards with description snippet */}
              {gratisBiz.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📍</span>
                    <h3 className="text-xl font-bold text-secondary">Mas Negocios</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-5">Encuentra de todo en Lagos de Moreno — conoce lo que ofrecen</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {gratisBiz.map((business: any) => (
                      <Link
                        key={business.id}
                        href={`/negocios/${business.slug}`}
                        className="group bg-white rounded-xl border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all p-4"
                      >
                        <div className="flex items-center gap-3">
                          {business.logo_url ? (
                            <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 relative ring-1 ring-gray-100">
                              <Image src={business.logo_url} alt={business.name} fill sizes="44px" className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-11 h-11 bg-gradient-to-br from-secondary to-secondary-light rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-sm text-white font-bold">{business.name[0].toUpperCase()}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-secondary group-hover:text-primary transition-colors truncate">{business.name}</h3>
                            {business.category && (
                              <span className="text-xs text-gray-400">{business.category.icon} {business.category.name}</span>
                            )}
                          </div>
                        </div>
                        {business.description && (
                          <p className="text-xs text-gray-400 line-clamp-2 mt-2">{business.description}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center mt-8 sm:hidden">
                <Link
                  href="/descubre"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors"
                >
                  Descubrir mas negocios
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </section>
        )
      })()}

      {/* Blog Section */}
      {latestPosts.length > 0 && (
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4">Blog</span>
                <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-2">Del Blog</h2>
                <p className="text-gray-500">Guias, tips y noticias de Lagos de Moreno</p>
              </div>
              <Link
                href="/blog"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-secondary font-medium rounded-full hover:shadow-md transition-all"
              >
                Ver todos
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {latestPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all"
                >
                  {post.featured_image_url ? (
                    <div className="relative h-44 bg-gray-100">
                      <Image
                        src={post.featured_image_url}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <span className="text-4xl opacity-40">✍️</span>
                    </div>
                  )}
                  <div className="p-5">
                    {post.published_at && (
                      <span className="text-xs text-gray-400">
                        {new Date(post.published_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    <h3 className="font-bold text-secondary group-hover:text-primary transition-colors mt-1 line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">{post.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>

            <div className="text-center mt-8 sm:hidden">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-full hover:bg-primary-dark transition-colors"
              >
                Ver todos los articulos
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Trust Section - with animated counters */}
      <section className="py-20 bg-surface">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-secondary/5 text-secondary text-sm font-semibold rounded-full mb-4">Ventajas</span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-3">¿Por que SomosLagos?</h2>
            <p className="text-gray-500">La plataforma hecha por y para Lagos de Moreno</p>
          </div>

          {/* Counters row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mb-12">
            <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 hover:scale-105 transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-primary mb-1">
                <AnimatedCounter target={25} suffix="+" />
              </p>
              <h3 className="font-bold text-secondary mb-1 text-sm">Negocios</h3>
              <p className="text-xs text-gray-500">Verificados y activos</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 hover:scale-105 transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-accent/15 to-accent/5 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-accent-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-accent-dark mb-1">
                <AnimatedCounter target={catCount} suffix="+" />
              </p>
              <h3 className="font-bold text-secondary mb-1 text-sm">Categorias</h3>
              <p className="text-xs text-gray-500">Para todo lo que necesitas</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 hover:scale-105 transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-primary/15 to-primary/5 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-primary mb-1">24/7</p>
              <h3 className="font-bold text-secondary mb-1 text-sm">Siempre Activo</h3>
              <p className="text-xs text-gray-500">Busca en cualquier momento</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 hover:scale-105 transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-accent/15 to-accent/5 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-accent-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-2xl font-bold text-accent-dark mb-1">
                <AnimatedCounter target={100} suffix="%" />
              </p>
              <h3 className="font-bold text-secondary mb-1 text-sm">Gratis</h3>
              <p className="text-xs text-gray-500">Sin costo de registro</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent-dark text-sm font-semibold rounded-full mb-4">Testimonios</span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-3">Lo que dicen nuestros usuarios</h2>
            <p className="text-gray-500">Negocios que ya son parte de SomosLagos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="bg-surface rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-600 mb-4 italic">
                &ldquo;Desde que registre mi negocio en SomosLagos, me llegan clientes nuevos cada semana. Es como tener un anuncio permanente en todo Lagos.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MR</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-secondary">Maria Rodriguez</p>
                  <p className="text-xs text-gray-500">Restaurante La Casona</p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-600 mb-4 italic">
                &ldquo;Lo mejor es que es gratis y muy facil de usar. En 5 minutos ya tenia mi negocio publicado con fotos, horarios y mapa. Muy recomendable.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-accent-dark rounded-full flex items-center justify-center">
                  <span className="text-secondary font-bold text-sm">JL</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-secondary">Jose Luis Hernandez</p>
                  <p className="text-xs text-gray-500">Taller Mecanico JL</p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-600 mb-4 italic">
                &ldquo;Mis clientes ahora me encuentran facilmente. El plan Pro me permite recibir pedidos y eso ha aumentado mis ventas. SomosLagos es lo que Lagos necesitaba.&rdquo;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AG</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-secondary">Ana Garcia</p>
                  <p className="text-xs text-gray-500">Estetica Bella Lagos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
