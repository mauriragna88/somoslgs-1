import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import SearchForm from '@/components/home/SearchForm'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
import StarRating from '@/components/reviews/StarRating'
import BannerDisplay from '@/components/ads/BannerDisplay'
import PremiumSlider from '@/components/shared/PremiumSlider'
import AnimatedCounter from '@/components/shared/AnimatedCounter'
import ScrollReveal from '@/components/shared/ScrollReveal'
import { TIER_ORDER } from '@/lib/constants'
import TourismPreview from '@/components/tourism/TourismPreview'
import ParroquiaReveal from '@/components/home/animations/ParroquiaReveal'
import FallingBusiness from '@/components/home/animations/FallingBusiness'
import PixelTitle from '@/components/home/animations/PixelTitle'
import AdShowcase from '@/components/home/animations/AdShowcase'
import FeaturedHeader from '@/components/home/animations/FeaturedHeader'
import type { BlogPost } from '@/types/database.types'
import type { BusinessHours } from '@/lib/constants'
import PWAInstallInline from '@/components/PWAInstallInline'

export const revalidate = 3600

interface HomeCategory {
  id: string
  name: string
  icon: string
  slug: string
}

interface FeaturedBusiness {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  address: string | null
  subscription_tier: string
  is_featured: boolean
  business_hours: BusinessHours | null
  rating: number
  total_reviews: number
  category: { name: string; icon: string } | null
  business_photos: BusinessPhoto[]
}

interface BusinessPhoto {
  image_url: string
}

interface BusinessCard {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  subscription_tier: string
  business_hours: BusinessHours | null
  rating: number
  total_reviews: number
  category: { name: string; icon: string } | null
  business_photos: BusinessPhoto[]
}

export default async function Home() {
  const supabase = createClient()

  // Get category IDs that have at least one active business
  const { data: businessCats } = await supabase
    .from('businesses')
    .select('category_id')
    .eq('is_active', true)
    .not('category_id', 'is', null)

  const activeCatIds = Array.from(new Set((businessCats || []).map((b: { category_id: string }) => b.category_id)))

  // Fetch only categories that have active businesses
  let categories: HomeCategory[] = []
  if (activeCatIds.length > 0) {
    const { data } = await supabase
      .from('categories')
      .select('id, name, icon, slug')
      .is('parent_id', null)
      .in('id', activeCatIds)
      .limit(12)
      .order('display_order') as { data: HomeCategory[] | null }
    categories = data || []
  }

  const totalCategories = activeCatIds.length

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
    .limit(6) as { data: FeaturedBusiness[] | null }

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
    .limit(16) as { data: BusinessCard[] | null }

  // Business count rounded down to nearest 5 minus 5 (e.g. 175 → 170, 182 → 175)
  const totalBusinessCount = (businessCats || []).length
  const businessDisplayCount = Math.max(5, Math.floor(totalBusinessCount / 5) * 5 - 5)

  // Sort by tier order client-side (avanzado > pro > emprendedor > gratis)
  const discoverBusinesses = (newestBusinesses || []).sort((a: BusinessCard, b: BusinessCard) => {
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

  const catCount = totalCategories || categories.length

  return (
    <main className="min-h-screen overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      {/* ═══════════════════════════════════════════════════════════
          HERO — Split-screen asymmetric editorial composition
          Left: massive typography + search; Right: dramatic image
      ═══════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex flex-col md:flex-row overflow-hidden bg-pueblo-noche">
        {/* Left panel — editorial content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 md:px-12 lg:px-20 py-16 md:py-24 max-w-2xl lg:max-w-3xl">
          {/* Vertical PUEBLO MAGICO accent */}
          <div className="hidden md:flex absolute left-3 md:left-6 top-0 bottom-0 items-center" aria-hidden="true">
            <span className="text-[10px] font-bold tracking-[0.35em] text-pueblo-barroco/40 uppercase rotate-180" style={{ writingMode: 'vertical-rl' }}>
              Pueblo M&aacute;gico &mdash; Lagos de Moreno
            </span>
          </div>

          {/* Eyebrow badge */}
          <div className="mb-5 animate-fade-in-up">
            <span className="pueblo-eyebrow text-[10px] font-bold px-4 py-1.5 rounded-full inline-flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              Pueblo M&aacute;gico
            </span>
          </div>

          {/* Display headline — 8xl/9xl editorial */}
          <h1 className="text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black text-white leading-[0.9] tracking-tighter mb-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Descubre
            <br />
            <span className="text-pueblo-barroco">Lagos</span>
            <br />
            <span className="text-pueblo-canteraLight">de Moreno</span>
          </h1>

          <p className="text-base md:text-lg text-white/70 mb-8 max-w-md font-light animate-fade-in-up leading-relaxed" style={{ animationDelay: '0.25s' }}>
            La red de negocios m&aacute;s grande de Lagos de Moreno. Conecta, explora y apoya a tu comunidad.
          </p>

          {/* Search — prominent, editorial style */}
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <SearchForm />
            <PWAInstallInline variant="hero" />
          </div>

          {/* Social proof — horizontal strip */}
          <div className="flex flex-wrap gap-6 md:gap-10 animate-fade-in-up" style={{ animationDelay: '0.55s' }}>
            <div>
              <p className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pueblo-barroco via-amber-300 to-pueblo-barroco">
                <AnimatedCounter target={businessDisplayCount} suffix="+" />
              </p>
              <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-0.5">Negocios</p>
            </div>
            <div className="w-px bg-white/10 self-stretch" />
            <div>
              <p className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pueblo-cantera via-pueblo-canteraLight to-pueblo-cantera">
                <AnimatedCounter target={catCount} suffix="+" />
              </p>
              <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-0.5">Categor&iacute;as</p>
            </div>
            <div className="w-px bg-white/10 self-stretch" />
            <div>
              <p className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-pueblo-barroco to-white">
                <AnimatedCounter target={100} suffix="%" />
              </p>
              <p className="text-[10px] text-white/50 uppercase tracking-[0.2em] mt-0.5">Gratis</p>
            </div>
          </div>
        </div>

        {/* Right panel — dramatic image with diagonal clip */}
        <div className="hidden md:block relative flex-1 min-h-[60vh] md:min-h-full pueblo-hero-clip">
          <Image
            src="/tourism/calvario2.jpg"
            alt="Santuario del Calvario, Pueblo M&aacute;gico de Lagos de Moreno"
            fill
            className="object-cover"
            priority
            quality={90}
          />
          {/* Gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-pueblo-noche/80" />
          <div className="absolute inset-0 bg-gradient-to-t from-pueblo-noche/60 via-transparent to-transparent" />
          {/* Location label */}
          <div className="absolute bottom-8 right-8 z-10">
            <span className="text-white/40 text-xs tracking-[0.3em] uppercase font-light">Santuario del Calvario</span>
          </div>
        </div>

        {/* Mobile image — full width below content */}
        <div className="md:hidden relative h-64 -mt-8">
          <Image
            src="/tourism/calvario2.jpg"
            alt="Santuario del Calvario, Pueblo M&aacute;gico de Lagos de Moreno"
            fill
            className="object-cover"
            priority
            quality={85}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-pueblo-noche via-pueblo-noche/40 to-transparent" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CATEGORIES — Full-bleed warm strip
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-6 bg-pueblo-crema border-y border-pueblo-canteraLight/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {categories && categories.length > 0 ? (
              <>
                {categories.slice(0, 6).map((category, i) => (
                  <ScrollReveal key={category.id} direction="up" delay={i * 60}>
                    <Link
                      href={`/categorias/${category.slug}`}
                      className="group flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-pueblo-canteraLight/50 hover:border-pueblo-barroco/60 hover:bg-pueblo-barroco/5 hover:shadow-pueblo-soft hover:scale-105 transition-all duration-300"
                    >
                      <span className="text-lg group-hover:scale-110 transition-transform duration-300">{category.icon || '📦'}</span>
                      <span className="font-medium text-sm text-pueblo-noche group-hover:text-pueblo-cantera transition-colors">
                        {category.name}
                      </span>
                    </Link>
                  </ScrollReveal>
                ))}
                {catCount > 6 && (
                  <Link
                    href="/categorias"
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-pueblo-cantera/10 text-pueblo-cantera rounded-full font-semibold text-sm hover:bg-pueblo-cantera/20 transition-colors"
                  >
                    +{catCount - 6} m&aacute;s
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/buscar?q=restaurantes" className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-pueblo-canteraLight hover:border-pueblo-cantera/50 hover:shadow-pueblo-soft transition-all">
                  <span className="text-lg">🍔</span><span className="font-medium text-sm text-pueblo-noche">Restaurantes</span>
                </Link>
                <Link href="/buscar?q=tiendas" className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-pueblo-canteraLight hover:border-pueblo-cantera/50 hover:shadow-pueblo-soft transition-all">
                  <span className="text-lg">🛒</span><span className="font-medium text-sm text-pueblo-noche">Tiendas</span>
                </Link>
                <Link href="/buscar?q=servicios" className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-pueblo-canteraLight hover:border-pueblo-cantera/50 hover:shadow-pueblo-soft transition-all">
                  <span className="text-lg">🔧</span><span className="font-medium text-sm text-pueblo-noche">Servicios</span>
                </Link>
                <Link href="/categorias" className="flex items-center gap-1.5 px-4 py-2.5 bg-pueblo-cantera/10 text-pueblo-cantera rounded-full font-semibold text-sm hover:bg-pueblo-cantera/20 transition-colors">
                  Ver todas →
                </Link>
              </>
            )}
          </div>
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

      {/* ═══════════════════════════════════════════════════════════
          PHOTO BREAK 1 — Parroquia full-bleed
      ═══════════════════════════════════════════════════════════ */}
      <div className="pueblo-photo-break h-48 md:h-72 relative">
        <Image
          src="/tourism/parroquia-asuncion.jpg"
          alt="Parroquia de la Asunci&oacute;n, Lagos de Moreno"
          fill
          className="object-cover"
          quality={80}
        />
        <div className="absolute inset-0 z-10 flex items-end pb-6 md:pb-10 px-6 md:px-16">
          <div>
            <p className="text-pueblo-barroco/80 text-[10px] tracking-[0.3em] uppercase font-bold mb-1">Pueblo M&aacute;gico</p>
            <p className="text-white text-2xl md:text-4xl font-black tracking-tight">Parroquia de la Asunci&oacute;n</p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TOURISM — Left-aligned editorial header
      ═══════════════════════════════════════════════════════════ */}
      <ScrollReveal direction="left">
        <TourismPreview />
      </ScrollReveal>

      {/* ═══════════════════════════════════════════════════════════
          PARROQUIA REVEAL — Dark editorial section
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-pueblo-noche relative overflow-hidden">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-72 h-72 md:w-[36rem] md:h-[36rem] bg-pueblo-barroco/10 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="mb-12">
            <div className="pueblo-accent-line">
              <span className="pueblo-eyebrow inline-block px-4 py-1.5 text-[10px] font-bold rounded-full mb-4">
                Patrimonio de la Humanidad
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-white mb-3 tracking-tight leading-[0.95]">
                Descubre<br />
                <span className="text-pueblo-barroco">Lagos de Moreno</span>
              </h2>
              <p className="text-pueblo-crema/50 text-sm md:text-base max-w-md">
                Cantera, arcos y memoria colonial en una ciudad que se vive caminando
              </p>
            </div>
          </div>
          <ParroquiaReveal />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PHOTO BREAK 2 — Puente full-bleed
      ═══════════════════════════════════════════════════════════ */}
      <div className="pueblo-photo-break h-48 md:h-64 relative">
        <Image
          src="/tourism/puente-panoramica.jpg"
          alt="Puente colonial sobre el r&iacute;o Lagos de Moreno"
          fill
          className="object-cover"
          quality={80}
        />
        <div className="absolute inset-0 z-10 flex items-end pb-6 md:pb-10 px-6 md:px-16">
          <div>
            <p className="text-pueblo-barroco/80 text-[10px] tracking-[0.3em] uppercase font-bold mb-1">Arquitectura Colonial</p>
            <p className="text-white text-2xl md:text-4xl font-black tracking-tight">Puente sobre el R&iacute;o</p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          FALLING BUSINESS — Asymmetric two-column
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-b from-pueblo-crema via-white to-pueblo-crema/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 md:w-[30rem] md:h-[30rem] bg-pueblo-barroco/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[24rem] h-[24rem] bg-pueblo-cantera/10 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <span className="pueblo-eyebrow inline-block px-4 py-1.5 text-[10px] font-bold rounded-full mb-4">
                Negocios Locales
              </span>
              <h2 className="text-4xl md:text-5xl font-black text-pueblo-noche mb-4 leading-[0.95] tracking-tight">
                176+ negocios<br />
                <span className="text-pueblo-cantera">te esperan</span>
              </h2>
              <p className="text-pueblo-terracotta/70 leading-relaxed mb-6">
                Restaurantes, taquer&iacute;as, pizzer&iacute;as, bares, tiendas y mucho m&aacute;s. Todos con perfil completo, horarios, mapa y contacto directo.
              </p>
              <a
                href="/buscar"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pueblo-barroco to-pueblo-terracotta text-pueblo-crema font-bold rounded-full transition-all hover:scale-105 shadow-pueblo-soft"
              >
                Explorar negocios
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </a>
            </div>
            <FallingBusiness />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PIXEL TITLE — Brand moment
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-10 bg-pueblo-crema/50">
        <div className="container mx-auto px-4 max-w-5xl">
          <PixelTitle />
        </div>
      </section>

      {/* Banner: Home Middle */}
      <div className="container mx-auto px-4 py-6">
        <BannerDisplay placement="home_middle" />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          FEATURED BUSINESSES — Dark editorial with left-aligned header
      ═══════════════════════════════════════════════════════════ */}
      {featuredBusinesses && featuredBusinesses.length > 0 && (
        <section className="py-16 bg-gradient-to-b from-pueblo-noche via-[#3D2418] to-pueblo-noche relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-72 h-72 md:w-[40rem] md:h-[40rem] bg-pueblo-barroco/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 md:w-[30rem] md:h-[30rem] bg-pueblo-cantera/6 rounded-full blur-3xl pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="mb-8">
              <FeaturedHeader />
            </div>

            <ScrollReveal direction="up" delay={200}>
              <PremiumSlider businesses={featuredBusinesses} />
            </ScrollReveal>

            <ScrollReveal direction="up" delay={300}>
              <div className="text-center mt-8">
                <Link
                  href="/descubre"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-pueblo-barroco/20 border border-pueblo-barroco/30 text-pueblo-crema font-medium rounded-full hover:bg-pueblo-barroco/25 transition-all"
                >
                  Ver todos los negocios
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          AD SHOWCASE
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-10 bg-pueblo-noche relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-pueblo-noche via-[#3D2418] to-pueblo-noche pointer-events-none" />
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <AdShowcase />
          <div className="text-center mt-6">
            <Link
              href="/contacto"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-pueblo-barroco to-pueblo-terracotta text-pueblo-crema font-bold rounded-full transition-all hover:scale-105 shadow-pueblo-soft"
            >
              Quiero anunciarme
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PHOTO BREAK 3 — Centro Hist&oacute;rico full-bleed
      ═══════════════════════════════════════════════════════════ */}
      <div className="pueblo-photo-break h-48 md:h-72 relative">
        <Image
          src="/tourism/centro-historico.jpg"
          alt="Centro Hist&oacute;rico de Lagos de Moreno"
          fill
          className="object-cover"
          quality={80}
        />
        <div className="absolute inset-0 z-10 flex items-end pb-6 md:pb-10 px-6 md:px-16">
          <div>
            <p className="text-pueblo-barroco/80 text-[10px] tracking-[0.3em] uppercase font-bold mb-1">Centro Hist&oacute;rico</p>
            <p className="text-white text-2xl md:text-4xl font-black tracking-tight">Cantera y Memoria</p>
          </div>
        </div>
      </div>

      {/* Banner: Home Left (mobile inline) */}
      <div className="xl:hidden container mx-auto px-4 py-6">
        <BannerDisplay placement="home_left" forceHorizontal />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BUSINESS OWNER CTA — Editorial card with image bleed
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-pueblo-noche relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-[30rem] md:h-[30rem] bg-pueblo-barroco/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 md:w-[24rem] md:h-[24rem] bg-pueblo-cantera/10 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="scale">
          <div className="max-w-5xl mx-auto relative overflow-hidden rounded-3xl">
            <Image
              src="/lagos-hero.jpg"
              alt=""
              fill
              className="object-cover"
              aria-hidden="true"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-pueblo-noche/90 via-pueblo-noche/95 to-pueblo-terracotta/90"></div>
            <div className="relative p-8 md:p-14">
              <div className="mb-10">
                <span className="pueblo-eyebrow inline-block px-4 py-1.5 text-[10px] font-bold rounded-full mb-4">
                  Para Negocios
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-pueblo-crema mb-3 leading-[0.95] tracking-tight">
                  Haz crecer<br />
                  <span className="text-pueblo-barroco">tu negocio</span>
                </h2>
                <p className="text-lg text-pueblo-crema/60 max-w-lg">
                  &Uacute;nete a SomosLagos y llega a miles de clientes en Lagos de Moreno
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-10">
                <div className="text-center p-5 bg-pueblo-crema/5 backdrop-blur-sm rounded-2xl border border-pueblo-crema/10">
                  <div className="w-12 h-12 bg-pueblo-barroco/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">📱</span>
                  </div>
                  <h3 className="font-semibold text-pueblo-crema mb-1 text-sm">Presencia Digital</h3>
                  <p className="text-xs text-pueblo-crema/70">Tu negocio visible 24/7</p>
                </div>
                <div className="text-center p-5 bg-pueblo-crema/5 backdrop-blur-sm rounded-2xl border border-pueblo-crema/10">
                  <div className="w-12 h-12 bg-pueblo-cantera/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="font-semibold text-pueblo-crema mb-1 text-sm">M&aacute;s Clientes</h3>
                  <p className="text-xs text-pueblo-crema/70">Miles de personas en Lagos</p>
                </div>
                <div className="text-center p-5 bg-pueblo-crema/5 backdrop-blur-sm rounded-2xl border border-pueblo-crema/10">
                  <div className="w-12 h-12 bg-pueblo-barroco/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">💳</span>
                  </div>
                  <h3 className="font-semibold text-pueblo-crema mb-1 text-sm">Ventas Online</h3>
                  <p className="text-xs text-pueblo-crema/70">Pedidos y pagos en l&iacute;nea</p>
                </div>
              </div>

              {/* Chatbot selling point */}
              <div className="mb-8 p-4 bg-pueblo-barroco/10 border border-pueblo-barroco/20 rounded-2xl flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">🤖</span>
                <p className="text-sm text-pueblo-crema">
                  <strong className="text-pueblo-barroco">Al subir tus productos al Plan Pro</strong>, tu men&uacute; aparece autom&aacute;ticamente en el <strong className="text-pueblo-crema">Chatbot de Inteligencia Artificial</strong> de la ciudad. Presencia web y en WhatsApp al mismo tiempo.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/registrar-negocio"
                  className="bg-gradient-to-r from-pueblo-barroco to-pueblo-terracotta hover:from-pueblo-terracotta hover:to-pueblo-barroco text-pueblo-noche px-10 py-4 rounded-full font-bold text-lg shadow-xl transition-all hover:scale-105 hover:shadow-pueblo"
                >
                  Registrar mi Negocio GRATIS
                </Link>
                <p className="text-sm text-pueblo-crema/70">
                  <strong className="text-pueblo-barroco text-lg">100% Gratis</strong> — sin costo de registro
                </p>
              </div>
            </div>
          </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          CANtera texture stripe — architectural separator
      ═══════════════════════════════════════════════════════════ */}
      <div className="pueblo-cantera-stripe h-3" />

      {/* ═══════════════════════════════════════════════════════════
          DESCUBRE — Left-aligned editorial header, tiered cards
      ═══════════════════════════════════════════════════════════ */}
      {discoverBusinesses.length > 0 && (() => {
        const avanzadoBiz = discoverBusinesses.filter((b: BusinessCard) => b.subscription_tier === 'avanzado')
        const proBiz = discoverBusinesses.filter((b: BusinessCard) => b.subscription_tier === 'pro')
        const emprendedorBiz = discoverBusinesses.filter((b: BusinessCard) => b.subscription_tier === 'emprendedor')
        const gratisBiz = discoverBusinesses.filter((b: BusinessCard) => b.subscription_tier === 'gratis')

        return (
          <section className="py-20 pueblo-shell relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 md:w-[36rem] md:h-[36rem] bg-pueblo-cantera/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 md:w-[28rem] md:h-[28rem] bg-pueblo-barroco/6 rounded-full blur-3xl pointer-events-none" />
            <div className="container mx-auto px-4 relative z-10">
              <ScrollReveal direction="up">
              <div className="flex items-end justify-between mb-12">
                <div className="pueblo-accent-line">
                  <span className="pueblo-eyebrow inline-block px-4 py-1.5 text-[10px] font-bold rounded-full mb-4">
                    Descubre
                  </span>
                  <h2 className="text-4xl md:text-5xl font-black text-pueblo-noche mb-2 leading-[0.95] tracking-tight">
                    Conoce<br />
                    <span className="text-pueblo-cantera">Negocios Locales</span>
                  </h2>
                  <p className="text-pueblo-terracotta/70">Lo mejor de Lagos de Moreno en un solo lugar</p>
                </div>
                <Link
                  href="/descubre"
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-pueblo-canteraLight hover:border-pueblo-cantera/40 text-pueblo-noche font-medium rounded-full hover:shadow-pueblo-soft transition-all"
                >
                  Ver todos
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              </ScrollReveal>

              {/* AVANZADO: Slider + Editorial Premium Cards */}
              {avanzadoBiz.length > 0 && (
                <div className="mb-14">
                  <PremiumSlider businesses={avanzadoBiz} />
                  {avanzadoBiz.length > 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                      {avanzadoBiz.map((business: BusinessCard) => {
                        const photos = business.business_photos || []
                        const heroImage = business.cover_url || photos[0]?.image_url
                        return (
                          <Link
                            key={business.id}
                            href={`/negocios/${business.slug}`}
                            className="group pueblo-card-avanzado rounded-2xl overflow-hidden relative"
                          >
                            {/* Gold accent top stripe */}
                            <div className="h-1 bg-gradient-to-r from-pueblo-barroco via-yellow-500/60 to-pueblo-barroco" />
                            {/* Wax-seal verified badge */}
                            <div className="absolute top-4 right-4 z-10">
                              <span className="pueblo-wax-seal">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                Verificado
                              </span>
                            </div>
                            {heroImage ? (
                              <div className="relative h-56 bg-pueblo-crema">
                                <Image src={heroImage} alt={business.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-pueblo-noche/50 via-transparent to-transparent" />
                              </div>
                            ) : (
                              <div className="h-56 bg-gradient-to-br from-pueblo-barroco/15 to-pueblo-cantera/10 flex items-center justify-center">
                                <span className="text-5xl opacity-20">🏪</span>
                              </div>
                            )}
                            <div className="p-5 pb-4">
                              <div className="flex items-start gap-4">
                                {business.logo_url ? (
                                  <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-pueblo-barroco/40 -mt-10 relative bg-white shadow-lg shadow-pueblo-barroco/20">
                                    <Image src={business.logo_url} alt={business.name} fill sizes="56px" className="object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-14 h-14 bg-gradient-to-br from-pueblo-barroco to-pueblo-terracotta rounded-xl flex items-center justify-center flex-shrink-0 -mt-10 shadow-lg shadow-pueblo-barroco/30">
                                    <span className="text-xl text-pueblo-crema font-bold">{business.name[0].toUpperCase()}</span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-bold text-lg text-pueblo-noche group-hover:text-pueblo-barroco transition-colors truncate">{business.name}</h3>
                                  {business.category && (
                                    <span className="inline-flex items-center text-xs text-pueblo-barroco bg-pueblo-barroco/10 px-2.5 py-0.5 rounded-full font-medium">{business.category.icon} {business.category.name}</span>
                                  )}
                                </div>
                              </div>
                              {business.description && (
                                <p className="text-sm text-pueblo-terracotta/70 mt-3 line-clamp-2">{business.description}</p>
                              )}
                              {photos.length > 1 && (
                                <div className="flex gap-2 mt-3">
                                  {photos.slice(0, 3).map((p: BusinessPhoto, i: number) => (
                                    <div key={i} className="relative w-20 h-14 rounded-lg overflow-hidden bg-pueblo-crema flex-shrink-0 ring-1 ring-pueblo-barroco/20">
                                      <Image src={p.image_url} alt="" fill sizes="80px" className="object-cover" />
                                    </div>
                                  ))}
                                  {photos.length > 3 && (
                                    <div className="w-20 h-14 rounded-lg bg-pueblo-barroco/10 flex items-center justify-center flex-shrink-0 ring-1 ring-pueblo-barroco/20">
                                      <span className="text-xs font-semibold text-pueblo-barroco">+{photos.length - 3}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              {business.total_reviews > 0 && (
                                <div className="mt-3"><StarRating value={business.rating} count={business.total_reviews} size="sm" /></div>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* PRO: Professional horizontal cards */}
              {proBiz.length > 0 && (
                <div className="mb-14">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-pueblo-cantera/15 flex items-center justify-center">
                      <svg className="w-4 h-4 text-pueblo-cantera" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-pueblo-noche">Negocios Pro</h3>
                      <p className="text-xs text-pueblo-terracotta/60">Con presencia digital destacada</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {proBiz.map((business: BusinessCard) => {
                      const photos = business.business_photos || []
                      const heroImage = business.cover_url || photos[0]?.image_url
                      return (
                        <Link
                          key={business.id}
                          href={`/negocios/${business.slug}`}
                          className="group pueblo-card-pro rounded-xl overflow-hidden relative flex flex-col sm:flex-row"
                        >
                          {/* PRO badge */}
                          <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10">
                            <span className="inline-flex items-center gap-1 bg-pueblo-cantera text-pueblo-crema text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm tracking-wide uppercase">Pro</span>
                          </div>
                          {heroImage ? (
                            <div className="relative h-40 sm:h-auto sm:w-44 md:w-52 flex-shrink-0 bg-pueblo-crema">
                              <Image src={heroImage} alt={business.name} fill sizes="(max-width: 640px) 100vw, 208px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-pueblo-crema/10 hidden sm:block" />
                            </div>
                          ) : business.logo_url ? (
                            <div className="h-40 sm:h-auto sm:w-44 md:w-52 flex-shrink-0 bg-gradient-to-br from-pueblo-cantera/10 to-pueblo-barroco/5 flex items-center justify-center">
                              <div className="w-16 h-16 rounded-xl overflow-hidden relative shadow-md">
                                <Image src={business.logo_url} alt={business.name} fill sizes="64px" className="object-cover" />
                              </div>
                            </div>
                          ) : (
                            <div className="h-40 sm:h-auto sm:w-44 md:w-52 flex-shrink-0 bg-gradient-to-br from-pueblo-cantera/10 to-pueblo-barroco/5 flex items-center justify-center">
                              <div className="w-16 h-16 bg-gradient-to-br from-pueblo-noche to-pueblo-terracotta rounded-xl flex items-center justify-center">
                                <span className="text-2xl text-pueblo-crema font-bold">{business.name[0].toUpperCase()}</span>
                              </div>
                            </div>
                          )}
                          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center">
                            <div className="flex items-center gap-2 mb-1">
                              {business.logo_url && (
                                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 relative ring-1 ring-pueblo-canteraLight/40 hidden sm:block">
                                  <Image src={business.logo_url} alt="" fill sizes="32px" className="object-cover" />
                                </div>
                              )}
                              <h3 className="font-bold text-base text-pueblo-noche group-hover:text-pueblo-cantera transition-colors truncate">{business.name}</h3>
                              <OpenClosedBadge businessHours={business.business_hours} />
                            </div>
                            {business.category && (
                              <span className="inline-flex items-center text-xs text-pueblo-cantera bg-pueblo-cantera/10 px-2 py-0.5 rounded font-medium w-fit mb-2">{business.category.icon} {business.category.name}</span>
                            )}
                            {business.description && (
                              <p className="text-sm text-pueblo-terracotta/60 line-clamp-2 mb-2">{business.description}</p>
                            )}
                            {business.total_reviews > 0 && (
                              <div><StarRating value={business.rating} count={business.total_reviews} size="sm" /></div>
                            )}
                            <span className="text-sm text-pueblo-cantera font-semibold mt-2 group-hover:underline">Ver negocio &rarr;</span>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* EMPRENDEDOR + GRATIS: Compact directory cards */}
              {(emprendedorBiz.length > 0 || gratisBiz.length > 0) && (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-pueblo-canteraLight/40 flex items-center justify-center">
                      <svg className="w-4 h-4 text-pueblo-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-pueblo-noche">M&aacute;s Negocios</h3>
                      <p className="text-xs text-pueblo-terracotta/60">Encuentra de todo en Lagos de Moreno</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[...emprendedorBiz, ...gratisBiz].map((business: BusinessCard) => (
                      <Link
                        key={business.id}
                        href={`/negocios/${business.slug}`}
                        className="group pueblo-card-directory rounded-xl p-4 relative"
                      >
                        {/* Subtle left accent line */}
                        <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-gradient-to-b from-pueblo-canteraLight to-transparent rounded-full" />
                        <div className="flex items-center gap-3">
                          {business.logo_url ? (
                            <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 relative ring-1 ring-pueblo-canteraLight/30">
                              <Image src={business.logo_url} alt={business.name} fill sizes="44px" className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-11 h-11 bg-gradient-to-br from-pueblo-noche/80 to-pueblo-terracotta rounded-lg flex items-center justify-center flex-shrink-0">
                              <span className="text-sm text-pueblo-crema font-bold">{business.name[0].toUpperCase()}</span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm text-pueblo-noche group-hover:text-pueblo-cantera transition-colors truncate">{business.name}</h3>
                            {business.category && (
                              <span className="text-xs text-pueblo-terracotta/60">{business.category.icon} {business.category.name}</span>
                            )}
                          </div>
                        </div>
                        {business.description && (
                          <p className="text-xs text-pueblo-terracotta/50 line-clamp-2 mt-2">{business.description}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center mt-8 sm:hidden">
                <Link
                  href="/descubre"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pueblo-cantera to-pueblo-terracotta text-pueblo-crema font-semibold rounded-full hover:shadow-pueblo-soft transition-all"
                >
                  Descubrir m&aacute;s negocios
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
            <div className="pueblo-arch-separator mt-12" />
          </section>
        )
      })()}

      {/* Banner: Home Right (mobile inline) */}
      <div className="xl:hidden container mx-auto px-4 py-6">
        <BannerDisplay placement="home_right" forceHorizontal />
      </div>

      {/* ═══════════════════════════════════════════════════════════
          BLOG — Magazine editorial layout
      ═══════════════════════════════════════════════════════════ */}
      {latestPosts.length > 0 && (
        <section className="py-20 bg-pueblo-noche relative overflow-hidden">
          <div className="absolute top-0 left-1/4 w-72 h-72 md:w-[36rem] md:h-[36rem] bg-pueblo-barroco/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/3 w-56 h-56 md:w-[28rem] md:h-[28rem] bg-pueblo-cantera/6 rounded-full blur-3xl pointer-events-none" />
          <div className="container mx-auto px-4 relative z-10">
            <ScrollReveal direction="up">
            <div className="flex items-end justify-between mb-12">
              <div className="pueblo-accent-line">
                <span className="pueblo-eyebrow inline-block px-4 py-1.5 text-[10px] font-bold rounded-full mb-4" style={{ borderColor: 'rgba(212,168,67,0.4)', background: 'rgba(212,168,67,0.15)', color: '#D4A843' }}>Blog</span>
                <h2 className="text-4xl md:text-5xl font-black text-pueblo-crema mb-2 leading-[0.95] tracking-tight">
                  Del<br className="md:hidden" /> <span className="text-pueblo-barroco">Blog</span>
                </h2>
                <p className="text-pueblo-crema/50">Gu&iacute;as, tips y noticias de Lagos de Moreno</p>
              </div>
              <Link
                href="/blog"
                className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-pueblo-crema/10 border border-pueblo-crema/20 hover:border-pueblo-barroco/50 text-pueblo-crema font-medium rounded-full hover:bg-pueblo-crema/15 transition-all"
              >
                Ver todos
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            </ScrollReveal>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 max-w-5xl mx-auto">
              {latestPosts.map((post, i) => (
                <ScrollReveal key={post.id} direction={i === 0 ? 'left' : 'up'} delay={i * 120} className={i === 0 ? 'md:col-span-7 md:row-span-2' : 'md:col-span-5'}>
                <Link
                  href={`/blog/${post.slug}`}
                  className={`group block rounded-2xl overflow-hidden transition-all duration-300 ${
                    i === 0
                      ? 'pueblo-blog-hero'
                      : 'bg-pueblo-crema/5 border border-pueblo-crema/10 hover:border-pueblo-barroco/30 hover:bg-pueblo-crema/8'
                  }`}
                >
                  {i === 0 ? (
                    /* ── Hero story: image with overlay text ── */
                    <>
                      {post.featured_image_url ? (
                        <div className="relative h-72 md:h-full md:min-h-[380px] bg-pueblo-noche">
                          <Image
                            src={post.featured_image_url}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 58vw"
                            className="object-contain group-hover:brightness-110 transition-all duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-pueblo-noche via-pueblo-noche/40 to-transparent" />
                          <div className="absolute inset-0 bg-gradient-to-r from-pueblo-noche/30 to-transparent" />
                          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 z-10">
                            {post.category && (
                              <span className="pueblo-category-pill mb-3 inline-block">{post.category}</span>
                            )}
                            <h3 className="text-2xl md:text-3xl font-black text-white leading-tight mb-2 group-hover:text-pueblo-barroco transition-colors">
                              {post.title}
                            </h3>
                            {post.excerpt && (
                              <p className="text-sm text-pueblo-crema/70 line-clamp-2 mb-3">{post.excerpt}</p>
                            )}
                            {post.published_at && (
                              <span className="text-xs text-pueblo-crema/40 tracking-wide">
                                {new Date(post.published_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="h-72 md:h-full md:min-h-[380px] bg-gradient-to-br from-pueblo-barroco/15 to-pueblo-cantera/10 flex items-center justify-center">
                          <div className="p-8 text-center">
                            <span className="text-5xl opacity-30 mb-4 block">✍️</span>
                            {post.category && (
                              <span className="pueblo-category-pill mb-3 inline-block">{post.category}</span>
                            )}
                            <h3 className="text-2xl md:text-3xl font-black text-pueblo-crema leading-tight mb-2 group-hover:text-pueblo-barroco transition-colors">
                              {post.title}
                            </h3>
                            {post.excerpt && (
                              <p className="text-sm text-pueblo-crema/60 line-clamp-2 mt-2">{post.excerpt}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    /* ── Secondary stories: compact editorial cards ── */
                    <>
                      {post.featured_image_url ? (
                        <div className="relative h-40 bg-pueblo-noche overflow-hidden">
                          <Image
                            src={post.featured_image_url}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 42vw"
                            className="object-contain group-hover:brightness-110 transition-all duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-pueblo-noche/60 to-transparent" />
                        </div>
                      ) : (
                        <div className="h-40 bg-gradient-to-br from-pueblo-barroco/10 to-pueblo-cantera/8 flex items-center justify-center">
                          <span className="text-3xl opacity-30">✍️</span>
                        </div>
                      )}
                      <div className="p-4">
                        {post.category && (
                          <span className="pueblo-category-pill mb-2 inline-block" style={{ fontSize: '9px' }}>{post.category}</span>
                        )}
                        <h3 className="font-bold text-pueblo-crema group-hover:text-pueblo-barroco transition-colors line-clamp-2 text-sm leading-snug">
                          {post.title}
                        </h3>
                        {post.published_at && (
                          <span className="text-[10px] text-pueblo-crema/35 mt-2 block tracking-wide">
                            {new Date(post.published_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </Link>
                </ScrollReveal>
              ))}
            </div>

            <div className="text-center mt-8 sm:hidden">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pueblo-barroco to-pueblo-cantera text-pueblo-noche font-semibold rounded-full hover:shadow-pueblo-soft transition-all"
              >
                Ver todos los art&iacute;culos
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          CHATBOT CTA — Bold editorial section
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-pueblo-noche relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-[30rem] md:h-[30rem] bg-pueblo-barroco/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 md:w-[24rem] md:h-[24rem] bg-pueblo-cantera/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto">
            {/* Badge */}
            <div className="text-center mb-8 flex flex-col items-center gap-3">
              <a
                href="https://wa.me/528142172127?text=Hola%2C%20me%20interesa%20ver%20los%20negocios%20y%20productos%20de%20SomosLagos"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2 bg-pueblo-agave/20 text-pueblo-agave font-bold text-sm rounded-full border border-pueblo-agave/40 hover:bg-pueblo-agave/30 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                YA DISPONIBLE — Escr&iacute;benos en WhatsApp →
              </a>
            </div>

            <h2 className="text-3xl md:text-5xl font-extrabold text-pueblo-crema text-center mb-4 leading-tight">
              Deja ese chat de{' '}
              <span className="line-through text-pueblo-crema/30 decoration-red-400/70 decoration-4">puro texto</span>
              {' '}en WhatsApp
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pueblo-barroco via-pueblo-canteraLight to-pueblo-barroco">
                Actualiza al Chatbot de WhatsApp
              </span>
            </h2>
            <p className="text-lg text-pueblo-crema/60 text-center max-w-2xl mx-auto mb-12">
              Tus clientes siguen mandando &ldquo;que tienen?&rdquo; y &ldquo;cuanto cuesta?&rdquo;. Con nuestro chatbot de WhatsApp, abren el men&uacute;, eligen productos, ven precios y piden con un solo toque.
            </p>

            {/* Feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-pueblo-crema/5 backdrop-blur-sm rounded-2xl p-6 border border-pueblo-crema/10 hover:border-pueblo-cantera/40 hover:bg-pueblo-crema/10 transition-all group">
                <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <h3 className="text-pueblo-crema font-bold text-lg mb-2">Adioos listas por texto</h3>
                <p className="text-pueblo-crema/50 text-sm leading-relaxed">
                  &ldquo;Que tienen? Cuanto cuesta? Quiero 2 de esto...&rdquo; Eso ya fue. Tu cliente abre el chatbot en WhatsApp y elige tocando.
                </p>
              </div>

              <div className="bg-pueblo-crema/5 backdrop-blur-sm rounded-2xl p-6 border border-pueblo-crema/10 hover:border-pueblo-barroco/40 hover:bg-pueblo-crema/10 transition-all group">
                <div className="w-14 h-14 bg-gradient-to-br from-pueblo-barroco/25 to-pueblo-barroco/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-pueblo-barroco" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </div>
                <h3 className="text-pueblo-crema font-bold text-lg mb-2">Men&uacute; con precios en WhatsApp</h3>
                <p className="text-pueblo-crema/50 text-sm leading-relaxed">
                  Tu cliente ve tus productos con fotos y precios directo en el chat. Arma su pedido solito, sin malentendidos.
                </p>
              </div>

              <div className="bg-pueblo-crema/5 backdrop-blur-sm rounded-2xl p-6 border border-pueblo-crema/10 hover:border-pueblo-agave/40 hover:bg-pueblo-crema/10 transition-all group">
                <div className="w-14 h-14 bg-gradient-to-br from-pueblo-agave/25 to-pueblo-agave/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 text-pueblo-agave" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-pueblo-crema font-bold text-lg mb-2">Paga como quiera</h3>
                <p className="text-pueblo-crema/50 text-sm leading-relaxed">
                  Transferencia, efectivo al recibir, o tarjeta. Tu cliente elige c&oacute;mo pagar y t&uacute; recibes el pedido completo y claro.
                </p>
              </div>
            </div>

            {/* Before vs After comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              <ScrollReveal direction="left">
              <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">😫</span>
                  <h4 className="text-red-300 font-bold">Sin chatbot</h4>
                </div>
                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-start gap-2 text-pueblo-crema/45">
                    <span className="text-red-400 mt-0.5">✗</span>
                    <span>&ldquo;Que tienen?&rdquo; &ldquo;Cuanto cuesta?&rdquo; x100 al d&iacute;a</span>
                  </li>
                  <li className="flex items-start gap-2 text-pueblo-crema/45">
                    <span className="text-red-400 mt-0.5">✗</span>
                    <span>Pedidos confusos por texto que salen mal</span>
                  </li>
                  <li className="flex items-start gap-2 text-pueblo-crema/45">
                    <span className="text-red-400 mt-0.5">✗</span>
                    <span>Pierdes ventas cuando no contestas r&aacute;pido</span>
                  </li>
                  <li className="flex items-start gap-2 text-pueblo-crema/45">
                    <span className="text-red-400 mt-0.5">✗</span>
                    <span>No sabes cu&aacute;nto vendes ni qu&eacute; producto jala m&aacute;s</span>
                  </li>
                </ul>
              </div>
              </ScrollReveal>
              <ScrollReveal direction="right" delay={150}>
              <div className="bg-pueblo-agave/10 border border-pueblo-agave/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🤖</span>
                  <h4 className="text-pueblo-agave font-bold">Con chatbot de WhatsApp</h4>
                </div>
                <ul className="space-y-2.5 text-sm">
                  <li className="flex items-start gap-2 text-pueblo-crema/75">
                    <span className="text-pueblo-agave mt-0.5">✓</span>
                    <span>Tu cliente ve el men&uacute; completo en el chat</span>
                  </li>
                  <li className="flex items-start gap-2 text-pueblo-crema/75">
                    <span className="text-pueblo-agave mt-0.5">✓</span>
                    <span>Elige productos tocando botones, sin escribir</span>
                  </li>
                  <li className="flex items-start gap-2 text-pueblo-crema/75">
                    <span className="text-pueblo-agave mt-0.5">✓</span>
                    <span>Vendes 24/7, el bot atiende aunque est&eacute;s ocupado</span>
                  </li>
                  <li className="flex items-start gap-2 text-pueblo-crema/75">
                    <span className="text-pueblo-agave mt-0.5">✓</span>
                    <span>Panel con estad&iacute;sticas de ventas y productos top</span>
                  </li>
                </ul>
              </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          WHATSAPP CTA — Gold gradient strip
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-gradient-to-r from-pueblo-barroco via-pueblo-cantera to-pueblo-barroco relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwMDAwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTMwVjBoLTEydjRoMTJ6TTI0IDI0aDEydi0ySDI0djJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-30"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                <span className="text-4xl">🤖</span>
                <div>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-pueblo-noche leading-tight">
                    &iquest;Te interesa el chatbot de WhatsApp?
                  </h2>
                  <p className="text-pueblo-noche/70 font-medium">
                    Solo $300 MXN/mes — tu WhatsApp vende solo
                  </p>
                </div>
              </div>
              <p className="text-pueblo-noche/55 text-sm max-w-lg">
                M&aacute;ndame un WhatsApp y te platico c&oacute;mo funciona. Sin compromiso, resolvemos todas tus dudas.
              </p>
            </div>
            <a
              href="https://wa.me/524741082768?text=Hola%2C%20me%20interesa%20el%20chatbot%20para%20mi%20negocio%20en%20SomosLagos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#1fb855] text-white font-bold text-lg rounded-full shadow-pueblo hover:shadow-pueblo-soft hover:scale-105 transition-all"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Escr&iacute;beme por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          TRUST — Horizontal counter strip
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-pueblo-crema/50 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-64 h-64 md:w-[28rem] md:h-[28rem] bg-pueblo-barroco/6 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-56 h-56 md:w-[24rem] md:h-[24rem] bg-pueblo-cantera/6 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="up">
          <div className="text-center mb-10">
            <span className="pueblo-eyebrow inline-block px-4 py-1.5 text-[10px] font-bold rounded-full mb-4">Ventajas</span>
            <h2 className="text-4xl md:text-5xl font-black text-pueblo-noche mb-3 leading-[0.95] tracking-tight">
              &iquest;Por qu&eacute;<br /><span className="text-pueblo-cantera">SomosLagos?</span>
            </h2>
            <p className="text-pueblo-terracotta/70">La plataforma hecha por y para Lagos de Moreno</p>
          </div>
          </ScrollReveal>

          {/* Counters row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mb-12">
            <div className="text-center p-6 pueblo-card rounded-2xl border border-pueblo-canteraLight/60 hover:border-pueblo-barroco/40 hover:shadow-pueblo hover:-translate-y-1 hover:scale-105 transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-pueblo-cantera/20 to-pueblo-cantera/5 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-pueblo-cantera" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pueblo-cantera to-pueblo-terracotta mb-1">
                <AnimatedCounter target={businessDisplayCount} suffix="+" />
              </p>
              <h3 className="font-bold text-pueblo-noche mb-1 text-sm">Negocios</h3>
              <p className="text-xs text-pueblo-terracotta/60">Verificados y activos</p>
            </div>
            <div className="text-center p-6 pueblo-card rounded-2xl border border-pueblo-canteraLight/60 hover:border-pueblo-barroco/40 hover:shadow-pueblo hover:-translate-y-1 hover:scale-105 transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-pueblo-barroco/20 to-pueblo-barroco/5 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-pueblo-barroco" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <p className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pueblo-barroco to-pueblo-cantera mb-1">
                <AnimatedCounter target={catCount} suffix="+" />
              </p>
              <h3 className="font-bold text-pueblo-noche mb-1 text-sm">Categor&iacute;as</h3>
              <p className="text-xs text-pueblo-terracotta/60">Para todo lo que necesitas</p>
            </div>
            <div className="text-center p-6 pueblo-card rounded-2xl border border-pueblo-canteraLight/60 hover:border-pueblo-barroco/40 hover:shadow-pueblo hover:-translate-y-1 hover:scale-105 transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-pueblo-agave/20 to-pueblo-agave/5 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-pueblo-agave" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pueblo-agave to-pueblo-cantera mb-1">24/7</p>
              <h3 className="font-bold text-pueblo-noche mb-1 text-sm">Siempre Activo</h3>
              <p className="text-xs text-pueblo-terracotta/60">Busca en cualquier momento</p>
            </div>
            <div className="text-center p-6 pueblo-card rounded-2xl border border-pueblo-canteraLight/60 hover:border-pueblo-barroco/40 hover:shadow-pueblo hover:-translate-y-1 hover:scale-105 transition-all duration-300 group">
              <div className="w-14 h-14 bg-gradient-to-br from-pueblo-barroco/20 to-pueblo-barroco/5 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-7 h-7 text-pueblo-barroco" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pueblo-barroco to-pueblo-cantera mb-1">
                <AnimatedCounter target={100} suffix="%" />
              </p>
              <h3 className="font-bold text-pueblo-noche mb-1 text-sm">Gratis</h3>
              <p className="text-xs text-pueblo-terracotta/60">Sin costo de registro</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PHOTO BREAK 4 — Teatro full-bleed
      ═══════════════════════════════════════════════════════════ */}
      <div className="pueblo-photo-break h-40 md:h-56 relative">
        <Image
          src="/tourism/teatro-rosas-moreno.jpg"
          alt="Teatro Rosas Moreno, Lagos de Moreno"
          fill
          className="object-cover"
          quality={80}
        />
        <div className="absolute inset-0 z-10 flex items-end pb-6 md:pb-10 px-6 md:px-16">
          <div>
            <p className="text-pueblo-barroco/80 text-[10px] tracking-[0.3em] uppercase font-bold mb-1">Arquitectura Colonial</p>
            <p className="text-white text-2xl md:text-4xl font-black tracking-tight">Teatro Rosas Moreno</p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TESTIMONIALS — Editorial layout
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 pueblo-shell relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 md:w-[30rem] md:h-[30rem] bg-pueblo-cantera/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-56 h-56 md:w-[24rem] md:h-[24rem] bg-pueblo-barroco/6 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="up">
          <div className="mb-12">
            <div className="pueblo-accent-line">
              <span className="pueblo-eyebrow inline-block px-4 py-1.5 text-[10px] font-bold rounded-full mb-4">Opiniones</span>
              <h2 className="text-4xl md:text-5xl font-black text-pueblo-noche mb-3 leading-[0.95] tracking-tight">
                Lo que dicen<br />
                <span className="text-pueblo-cantera">nuestros usuarios</span>
              </h2>
              <p className="text-pueblo-terracotta/70">Opiniones reales de personas en Lagos de Moreno</p>
            </div>
          </div>
          </ScrollReveal>

          {topReviews && topReviews.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-10">
                {topReviews.map((review: any, i: number) => (
                  <ScrollReveal key={review.id} direction={i % 2 === 0 ? 'left' : 'right'} delay={i * 100}>
                  <div className="pueblo-card rounded-2xl p-6 border border-pueblo-canteraLight/60 hover:border-pueblo-barroco/40 hover:shadow-pueblo-soft transition-all">
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-pueblo-barroco' : 'text-pueblo-canteraLight/60'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <p className="text-pueblo-noche text-sm mb-4 line-clamp-3">&ldquo;{review.comment}&rdquo;</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-pueblo-noche">{(review.profile as any)?.full_name || 'Usuario'}</span>
                      {(review.business as any)?.slug && (
                        <Link href={`/negocios/${(review.business as any).slug}`} className="text-xs text-pueblo-cantera hover:underline">
                          {(review.business as any).name}
                        </Link>
                      )}
                    </div>
                  </div>
                  </ScrollReveal>
                ))}
              </div>
              <div className="text-center">
                <Link
                  href="/buscar"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pueblo-cantera to-pueblo-terracotta text-pueblo-crema font-semibold rounded-xl hover:shadow-pueblo-soft transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  Busca un negocio y deja tu opini&oacute;n
                </Link>
              </div>
            </>
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="pueblo-card rounded-2xl p-8 md:p-12 border border-pueblo-canteraLight/60 text-center">
                <div className="w-16 h-16 bg-pueblo-barroco/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-pueblo-barroco" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-pueblo-noche mb-3">S&eacute; el primero en opinar</h3>
                <p className="text-pueblo-terracotta/70 max-w-lg mx-auto mb-6">
                  Visita cualquier negocio de Lagos de Moreno y comparte tu experiencia. Tu opini&oacute;n ayuda a otros a descubrir los mejores lugares.
                </p>
                <Link
                  href="/buscar"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pueblo-cantera to-pueblo-terracotta text-pueblo-crema font-semibold rounded-xl hover:shadow-pueblo-soft transition-all"
                >
                  Explorar negocios
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          PLANS — Editorial closing section with tier stripes
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 bg-pueblo-noche relative overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 md:w-[30rem] md:h-[30rem] bg-pueblo-barroco/10 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-56 h-56 md:w-[24rem] md:h-[24rem] bg-pueblo-cantera/10 rounded-full blur-3xl translate-y-1/2 pointer-events-none"></div>

        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="up">
            <div className="text-center mb-14">
              <span className="pueblo-eyebrow inline-flex items-center gap-2 px-5 py-2 text-sm font-bold rounded-full mb-5" style={{ borderColor: 'rgba(212,168,67,0.4)', background: 'rgba(212,168,67,0.15)', color: '#D4A843' }}>
                ✨ Ya viste todo lo que ofrecemos
              </span>
              <h2 className="text-4xl md:text-6xl font-black text-pueblo-crema mb-4 leading-[0.95] tracking-tight">
                &iquest;Listo para que<br />
                <span className="text-pueblo-barroco">m&aacute;s gente</span> te encuentre?
              </h2>
              <p className="text-lg text-pueblo-crema/60 max-w-xl mx-auto">
                Empieza gratis hoy. Si en alg&uacute;n momento quieres m&aacute;s visibilidad, tenemos planes opcionales sin compromiso.
              </p>
            </div>
          </ScrollReveal>

          {/* Plan cards with tier stripes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 max-w-5xl mx-auto mb-12 items-start">
            {/* Gratis */}
            <ScrollReveal direction="up" delay={0}>
            <div className="pueblo-plan-stripe pueblo-plan-stripe-gratis bg-pueblo-crema/[0.04] border border-pueblo-crema/10 rounded-2xl p-6 flex flex-col hover:bg-pueblo-crema/[0.07] transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-pueblo-canteraLight/60 text-[10px] font-bold uppercase tracking-[0.2em]">Gratis</span>
                <span className="w-2 h-2 rounded-full bg-pueblo-canteraLight/30" />
              </div>
              <p className="text-4xl font-extrabold text-pueblo-crema/90 mb-0.5">$0</p>
              <p className="text-pueblo-crema/30 text-xs mb-6">para siempre</p>
              <ul className="space-y-2.5 text-sm text-pueblo-crema/60 flex-1 mb-6">
                <li className="flex items-start gap-2"><span className="text-pueblo-canteraLight/50 mt-0.5 text-xs">✓</span> Aparece en buscador y mapa</li>
                <li className="flex items-start gap-2"><span className="text-pueblo-canteraLight/50 mt-0.5 text-xs">✓</span> WhatsApp directo</li>
                <li className="flex items-start gap-2"><span className="text-pueblo-canteraLight/50 mt-0.5 text-xs">✓</span> Horarios y opiniones</li>
                <li className="flex items-start gap-2"><span className="text-pueblo-canteraLight/50 mt-0.5 text-xs">✓</span> Hasta 3 fotos</li>
              </ul>
              <Link href="/registrar-negocio" className="block text-center py-2.5 rounded-xl border border-pueblo-crema/15 hover:border-pueblo-crema/30 text-pueblo-crema/70 hover:text-pueblo-crema font-semibold text-sm transition-colors">
                Empezar Gratis
              </Link>
            </div>
            </ScrollReveal>

            {/* Emprendedor */}
            <ScrollReveal direction="up" delay={100}>
            <div className="pueblo-plan-stripe pueblo-plan-stripe-emprendedor bg-pueblo-crema/[0.04] border border-pueblo-cantera/20 rounded-2xl p-6 flex flex-col hover:bg-pueblo-crema/[0.07] hover:border-pueblo-cantera/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-pueblo-cantera text-[10px] font-bold uppercase tracking-[0.2em]">Emprendedor</span>
                <span className="w-2 h-2 rounded-full bg-pueblo-cantera/50" />
              </div>
              <p className="text-4xl font-extrabold text-pueblo-crema mb-0.5">$60</p>
              <p className="text-pueblo-crema/30 text-xs mb-6">MXN/mes &middot; $2/d&iacute;a</p>
              <ul className="space-y-2.5 text-sm text-pueblo-crema/60 flex-1 mb-6">
                <li className="flex items-start gap-2"><span className="text-pueblo-cantera mt-0.5 text-xs">✓</span> Todo lo del plan Gratis</li>
                <li className="flex items-start gap-2"><span className="text-pueblo-cantera mt-0.5 text-xs">✓</span> Portada personalizada</li>
                <li className="flex items-start gap-2"><span className="text-pueblo-cantera mt-0.5 text-xs">✓</span> Redes sociales visibles</li>
                <li className="flex items-start gap-2"><span className="text-pueblo-cantera mt-0.5 text-xs">✓</span> Hasta 8 fotos</li>
              </ul>
              <Link href="/planes" className="block text-center py-2.5 rounded-xl bg-pueblo-cantera/15 hover:bg-pueblo-cantera/25 text-pueblo-canteraLight font-semibold text-sm transition-colors">
                Ver detalles
              </Link>
            </div>
            </ScrollReveal>

            {/* Pro — destacado */}
            <ScrollReveal direction="up" delay={200}>
            <div className="pueblo-plan-featured rounded-2xl p-6 flex flex-col lg:scale-105 relative">
              {/* Gold top stripe */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-gradient-to-r from-pueblo-barroco to-yellow-500 text-pueblo-noche text-[10px] font-bold px-4 py-1 rounded-full shadow-lg shadow-pueblo-barroco/30 tracking-wide uppercase">M&aacute;s Popular</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-pueblo-barroco text-[10px] font-bold uppercase tracking-[0.2em]">Pro</span>
                <span className="w-2.5 h-2.5 rounded-full bg-pueblo-barroco shadow-sm shadow-pueblo-barroco/50" />
              </div>
              <p className="text-4xl font-extrabold text-pueblo-crema mb-0.5">$120</p>
              <p className="text-pueblo-crema/40 text-xs mb-6">MXN/mes &middot; $4/d&iacute;a</p>
              <ul className="space-y-2.5 text-sm text-pueblo-crema/80 flex-1 mb-6">
                <li className="flex items-start gap-2"><span className="text-pueblo-barroco mt-0.5 text-xs">✓</span> Cat&aacute;logo de productos</li>
                <li className="flex items-start gap-2"><span className="text-pueblo-barroco mt-0.5 text-xs">✓</span> Recibe pedidos en l&iacute;nea</li>
                <li className="flex items-start gap-2"><span className="text-pueblo-barroco mt-0.5 text-xs">✓</span> Tus productos en el Chatbot IA 🤖</li>
                <li className="flex items-start gap-2"><span className="text-pueblo-barroco mt-0.5 text-xs">✓</span> Hasta 15 fotos</li>
              </ul>
              <Link href="/planes" className="block text-center py-3 rounded-xl bg-gradient-to-r from-pueblo-barroco to-pueblo-terracotta hover:from-pueblo-terracotta hover:to-pueblo-barroco text-pueblo-noche font-bold text-sm transition-all shadow-lg shadow-pueblo-barroco/30 hover:shadow-pueblo-barroco/50">
                Ver detalles &rarr;
              </Link>
            </div>
            </ScrollReveal>

            {/* Avanzado */}
            <ScrollReveal direction="up" delay={300}>
            <div className="pueblo-plan-stripe pueblo-plan-stripe-avanzado bg-pueblo-crema/[0.04] border border-pueblo-agave/20 rounded-2xl p-6 flex flex-col hover:bg-pueblo-crema/[0.07] hover:border-pueblo-agave/40 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-pueblo-agave text-[10px] font-bold uppercase tracking-[0.2em]">Avanzado</span>
                <span className="w-2 h-2 rounded-full bg-pueblo-agave/50" />
              </div>
              <p className="text-4xl font-extrabold text-pueblo-crema mb-0.5">$180</p>
              <p className="text-pueblo-crema/30 text-xs mb-6">MXN/mes &middot; $6/d&iacute;a</p>
              <ul className="space-y-2.5 text-sm text-pueblo-crema/60 flex-1 mb-6">
                <li className="flex items-start gap-2"><span className="text-pueblo-agave mt-0.5 text-xs">✓</span> Destacado en b&uacute;squedas</li>
                <li className="flex items-start gap-2"><span className="text-pueblo-agave mt-0.5 text-xs">✓</span> Badge verificado ✅</li>
                <li className="flex items-start gap-2"><span className="text-pueblo-agave mt-0.5 text-xs">✓</span> Estad&iacute;sticas detalladas</li>
                <li className="flex items-start gap-2"><span className="text-pueblo-agave mt-0.5 text-xs">✓</span> Hasta 20 fotos</li>
              </ul>
              <Link href="/planes" className="block text-center py-2.5 rounded-xl bg-pueblo-agave/15 hover:bg-pueblo-agave/25 text-pueblo-agave font-semibold text-sm transition-colors">
                Ver detalles
              </Link>
            </div>
            </ScrollReveal>
          </div>

          {/* Bottom note */}
          <ScrollReveal direction="up" delay={400}>
          <div className="text-center">
            <p className="text-pueblo-crema/30 text-sm mb-4">Sin contratos &middot; Cancela cuando quieras &middot; El plan Gratis es para siempre</p>
            <Link
              href="/registrar-negocio"
              className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-pueblo-barroco to-pueblo-terracotta hover:from-pueblo-terracotta hover:to-pueblo-barroco text-pueblo-noche font-bold text-lg rounded-full shadow-2xl shadow-pueblo-barroco/20 hover:scale-105 transition-all"
            >
              Registrar mi Negocio GRATIS
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          </ScrollReveal>
        </div>
      </section>

    </main>
  )
}