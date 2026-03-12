import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import SearchForm from '@/components/home/SearchForm'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
import StarRating from '@/components/reviews/StarRating'
import BannerDisplay from '@/components/ads/BannerDisplay'
import PremiumSlider from '@/components/shared/PremiumSlider'
import AnimatedCounter from '@/components/shared/AnimatedCounter'
import { TIER_ORDER } from '@/lib/constants'
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

  // Fetch top reviews for testimonials section
  const { data: topReviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, profile:profiles(full_name), business:businesses(name, slug)')
    .gte('rating', 4)
    .not('comment', 'is', null)
    .order('rating', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(6)

  // Fetch newest businesses (all tiers) for Descubre section
  const { data: newestBusinesses } = await supabase
    .from('businesses')
    .select(`
      id, name, slug, description, logo_url, cover_url, subscription_tier, business_hours, rating, total_reviews,
      category:categories(name, icon),
      business_photos(image_url)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(16) as { data: any[] | null }

  // Sort by tier order client-side (avanzado > pro > emprendedor > gratis)
  const discoverBusinesses = (newestBusinesses || []).sort((a: any, b: any) => {
    const tierA = TIER_ORDER[a.subscription_tier] || 0
    const tierB = TIER_ORDER[b.subscription_tier] || 0
    return tierB - tierA
  })

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
              La red de negocios mas grande de Lagos de Moreno. Conecta, explora y apoya a tu comunidad
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto mb-12 animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
              <SearchForm />
            </div>

            {/* Social Proof Metrics - glass cards with animated counters */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10 animate-fade-in-up">
                <p className="text-2xl md:text-3xl font-bold text-accent">
                  <AnimatedCounter target={100} suffix="+" />
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

      {/* Lateral banners (desktop xl+ only) */}
      <div className="hidden xl:block fixed left-2 top-1/2 -translate-y-1/2 z-30 w-[130px]">
        <BannerDisplay placement="home_left" />
      </div>
      <div className="hidden xl:block fixed right-2 top-1/2 -translate-y-1/2 z-30 w-[130px]">
        <BannerDisplay placement="home_right" />
      </div>

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
        const emprendedorBiz = discoverBusinesses.filter((b: any) => b.subscription_tier === 'emprendedor')
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

              {/* EMPRENDEDOR + GRATIS: Compact cards with description snippet */}
              {(emprendedorBiz.length > 0 || gratisBiz.length > 0) && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">📍</span>
                    <h3 className="text-xl font-bold text-secondary">Mas Negocios</h3>
                  </div>
                  <p className="text-gray-400 text-sm mb-5">Encuentra de todo en Lagos de Moreno — conoce lo que ofrecen</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...emprendedorBiz, ...gratisBiz].map((business: any) => (
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

      {/* BANNER 1: Chatbot — Que es y para que sirve */}
      <section className="py-16 bg-gradient-to-br from-secondary via-[#1a2744] to-secondary relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Badge */}
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-2 px-5 py-2 bg-accent/20 text-accent font-bold text-sm rounded-full border border-accent/30 animate-pulse">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                PROXIMAMENTE
              </span>
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold text-white text-center mb-4 leading-tight">
              Deja de pedir por{' '}
              <span className="line-through text-white/40 decoration-red-400 decoration-4">WhatsApp</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-primary-light to-accent">
                Tu negocio merece un Chatbot
              </span>
            </h2>
            <p className="text-lg text-white/70 text-center max-w-2xl mx-auto mb-12">
              Tus clientes ya no tendran que escribir listas interminables. Con nuestro chatbot eligen productos, ven precios y pagan en segundos.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-primary/40 hover:bg-white/10 transition-all group">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Adioos textos largos</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  &ldquo;Hola, quiero 2 hamburguesas, una sin cebolla, y unas papas...&rdquo; Eso ya fue. Tu cliente solo toca, elige y listo.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-accent/40 hover:bg-white/10 transition-all group">
                <div className="w-14 h-14 bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Catalogo con precios</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Muestra tus productos con fotos y precios. Tu cliente arma su pedido solito, sin confusiones ni malentendidos.
                </p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-primary-light/40 hover:bg-white/10 transition-all group">
                <div className="w-14 h-14 bg-gradient-to-br from-primary-light/20 to-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Paga como quieras</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Transferencia, pago en efectivo al recibir, o tarjeta. Tu cliente elige y tu recibes el pedido completo.
                </p>
              </div>
            </div>

            {/* Before vs After comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">😫</span>
                  <h4 className="text-red-300 font-bold">Sin chatbot</h4>
                </div>
                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-start gap-2 text-white/50">
                    <span className="text-red-400 mt-0.5">✗</span>
                    <span>&ldquo;Que tienen?&rdquo; &ldquo;Cuanto cuesta?&rdquo; x100 al dia</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/50">
                    <span className="text-red-400 mt-0.5">✗</span>
                    <span>Pedidos confusos por texto que salen mal</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/50">
                    <span className="text-red-400 mt-0.5">✗</span>
                    <span>Pierdes ventas cuando no contestas rapido</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/50">
                    <span className="text-red-400 mt-0.5">✗</span>
                    <span>No sabes cuanto vendes ni que producto jala mas</span>
                  </li>
                </ul>
              </div>
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🤖</span>
                  <h4 className="text-primary-light font-bold">Con chatbot</h4>
                </div>
                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-start gap-2 text-white/80">
                    <span className="text-primary-light mt-0.5">✓</span>
                    <span>Tu cliente ve el menu completo con precios</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/80">
                    <span className="text-primary-light mt-0.5">✓</span>
                    <span>Arma su pedido tocando botones, sin escribir</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/80">
                    <span className="text-primary-light mt-0.5">✓</span>
                    <span>Vendes 24/7, el bot atiende aunque estes ocupado</span>
                  </li>
                  <li className="flex items-start gap-2 text-white/80">
                    <span className="text-primary-light mt-0.5">✓</span>
                    <span>Panel con estadisticas de ventas y productos top</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BANNER 2: CTA — Te interesa? Mandame WhatsApp */}
      <section className="py-12 bg-gradient-to-r from-accent via-amber-500 to-accent relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTMwVjBoLTEydjRoMTJ6TTI0IDI0aDEydi0ySDI0djJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                <span className="text-4xl">🤖</span>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-secondary leading-tight">
                    ¿Te interesa el chatbot?
                  </h2>
                  <p className="text-secondary/70 font-medium">
                    Solo $300/mes — tu negocio vende solo
                  </p>
                </div>
              </div>
              <p className="text-secondary/60 text-sm max-w-lg">
                Mandame un WhatsApp y te platico como funciona. Sin compromiso, resolvemos todas tus dudas.
              </p>
            </div>
            <a
              href="https://wa.me/524741082768?text=Hola%2C%20me%20interesa%20el%20chatbot%20para%20mi%20negocio%20en%20SomosLagos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#1fb855] text-white font-bold text-lg rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Escribeme por WhatsApp
            </a>
          </div>
        </div>
      </section>

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
                <AnimatedCounter target={100} suffix="+" />
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
            <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent-dark text-sm font-semibold rounded-full mb-4">Opiniones</span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-3">Lo que dicen nuestros usuarios</h2>
            <p className="text-gray-500">Opiniones reales de personas en Lagos de Moreno</p>
          </div>

          {topReviews && topReviews.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
                {topReviews.map((review: any) => (
                  <div key={review.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-accent' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-gray-700 text-sm mb-4 line-clamp-3">&ldquo;{review.comment}&rdquo;</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-secondary">{(review.profile as any)?.full_name || 'Usuario'}</span>
                      {(review.business as any)?.slug && (
                        <Link href={`/negocios/${(review.business as any).slug}`} className="text-xs text-primary hover:underline">
                          {(review.business as any).name}
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <Link
                  href="/buscar"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Busca un negocio y deja tu opinion
                </Link>
              </div>
            </>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="bg-gradient-to-br from-primary/5 to-accent/5 rounded-2xl p-8 md:p-12 border border-gray-100 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-secondary mb-3">Se el primero en opinar</h3>
                <p className="text-gray-600 max-w-lg mx-auto mb-6">
                  Visita cualquier negocio de Lagos de Moreno y comparte tu experiencia. Tu opinion ayuda a otros a descubrir los mejores lugares.
                </p>
                <Link
                  href="/buscar"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark transition-colors"
                >
                  Explorar negocios
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

    </main>
  )
}
