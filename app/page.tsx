import Link from 'next/link'
import Image from 'next/image'
import { unstable_noStore as noStore } from 'next/cache'
import { createPublicClient, createPublicServiceClient } from '@/lib/supabase/server'
import SearchForm from '@/components/home/SearchForm'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
import StarRating from '@/components/reviews/StarRating'
import AnimatedCounter from '@/components/shared/AnimatedCounter'
import ScrollReveal from '@/components/shared/ScrollReveal'
import { TIER_ORDER } from '@/lib/constants'
import type { Metadata } from 'next'
import type { BlogPost } from '@/types/database.types'
import { HOME_FAQ } from '@/lib/home/faq'
import HomeFaq from '@/components/home/HomeFaq'
import type { BusinessHours } from '@/lib/constants'
import HeroCinematic, { type HeroSpotlight } from '@/components/home/HeroCinematic'
import InteractiveMap from '@/components/home/InteractiveMap'
import DescubreLagos from '@/components/home/DescubreLagos'
import BannerDisplay from '@/components/ads/BannerDisplay'
import EventsSection from '@/components/home/EventsSection'
import FeaturedSection from '@/components/home/FeaturedSection'
import MarketplaceStrip from '@/components/home/MarketplaceStrip'
import DevogatecSpotlight from '@/components/home/DevogatecSpotlight'
import CityStoryV2 from '@/components/home/CityStoryV2'
import CategoryGrid from '@/components/home/CategoryGrid'
import SeoLandingsStrip from '@/components/home/SeoLandingsStrip'
import HowItWorks from '@/components/home/HowItWorks'
import BlogCard from '@/components/blog/BlogCard'
import { StaggerGroup, StaggerItem } from '@/components/animations/StaggerGroup'
import SectionReveal from '@/components/animations/SectionReveal'
import ScrollWrapper from '@/components/animations/ScrollWrapper'
import { resolveBlogImage } from '@/lib/blog-image-fallbacks'

export const revalidate = 3600

const HOME_TITLE = 'SomosLagos | Directorio de negocios en Lagos de Moreno, Jalisco'
const HOME_DESCRIPTION =
  'Encuentra restaurantes, taquerías, cafeterías, hoteles, servicios y más negocios locales en Lagos de Moreno, Jalisco. Horarios, ubicación y contacto directo por WhatsApp.'
const HOME_OG_IMAGE = 'https://www.somoslagos.com.mx/og-somoslagos.jpg'

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: 'https://www.somoslagos.com.mx' },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    siteName: 'SomosLagos',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: 'https://www.somoslagos.com.mx',
    images: [{ url: HOME_OG_IMAGE, width: 1200, height: 630, alt: 'Templo de El Calvario en Lagos de Moreno, Jalisco' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: [HOME_OG_IMAGE],
  },
}

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

export default async function HomePage() {
  // Home publica: sin cookies y con cache de datos para que se pre-genere (ISR cada hora)
  const supabase = createPublicClient(revalidate)

  // Get category IDs from active businesses (for category filtering)
  const { data: businessCats, error: businessCatsError } = await supabase
    .from('businesses')
    .select('category_id')
    .eq('is_active', true)
    .not('category_id', 'is', null)

  // Si la consulta base falla (p. ej. sin variables de entorno en el build), no
  // congelar una home vacia: renderizar dinamicamente en esa visita
  if (businessCatsError || !businessCats || businessCats.length === 0) {
    noStore()
  }

  // Count active businesses per category (for >=2 filter)
  const catCountMap = new Map<string, number>()
  ;(businessCats || []).forEach((b: { category_id: string }) => {
    catCountMap.set(b.category_id, (catCountMap.get(b.category_id) || 0) + 1)
  })

  // Only show categories with at least 2 active businesses
  const activeCatIds = Array.from(catCountMap.entries())
    .filter(([, count]) => count >= 2)
    .map(([id]) => id)

  // Fetch only categories that have >= 2 active businesses
  let categories: HomeCategory[] = []
  if (activeCatIds.length > 0) {
    const { data } = await supabase
      .from('categories')
      .select('id, name, icon, slug')
      .is('parent_id', null)
      .in('id', activeCatIds)
      .not('slug', 'like', '__hidden__%')
      .limit(12)
      .order('display_order') as { data: HomeCategory[] | null }
    categories = data || []
  }

  // Total category count = parent categories with >= 2 businesses
  const totalCategories = activeCatIds.length

  // Get the REAL total business count (not just those with category_id)
  const { count: totalBusinessCount } = await supabase
    .from('businesses')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true) as { count: number | null }

  // Business count rounded down to nearest 5 (minimum 5)
  const realBusinessCount = totalBusinessCount || 0
  const businessDisplayCount = Math.max(5, Math.floor(realBusinessCount / 5) * 5)

  // Fetch featured/premium businesses (avanzado) with photos
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

  const latestPosts = ((blogPosts as BlogPost[]) || []).map((post, index) => ({
    ...post,
    featured_image_url: resolveBlogImage(post.featured_image_url, index),
  }))

  // Fetch top reviews for testimonials section
  const { data: topReviews } = await supabase
    .from('reviews')
    .select('id, rating, comment, created_at, profile:profiles(full_name), business:businesses(name, slug)')
    .gte('rating', 4)
    .not('comment', 'is', null)
    .order('rating', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(6)

  // Fetch newest businesses (all tiers) for Discover section
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

  // Fetch latest marketplace listings for homepage strip
  const marketplaceSupabase = createPublicServiceClient(revalidate)
  const { data: latestListings } = await marketplaceSupabase
    .from('marketplace_listings')
    .select('*')
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(4)

  const discoverBusinesses = (newestBusinesses || []).sort((a: BusinessCard, b: BusinessCard) => {
    const tierA = TIER_ORDER[a.subscription_tier] || 0
    const tierB = TIER_ORDER[b.subscription_tier] || 0
    return tierB - tierA
  })

  // JSON-LD structured data (el WebSite lo emite el layout para todo el sitio)
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': 'https://www.somoslagos.com.mx/#organization',
    name: 'SomosLagos',
    url: 'https://www.somoslagos.com.mx',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.somoslagos.com.mx/logo.png',
    },
    sameAs: [
      'https://www.facebook.com/profile.php?id=61588240258457',
      'https://instagram.com/somoslagos',
      'https://x.com/somoslagos',
      'https://youtube.com/@somoslagos',
    ],
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

  const catCount = Math.max(1, totalCategories || categories.length)

  // Tarjetas vivas del hero: destacados primero, luego los mas recientes con foto
  const heroSpotlight: HeroSpotlight[] = [...(featuredBusinesses || []), ...discoverBusinesses]
    .filter((b, i, all) => all.findIndex(x => x.id === b.id) === i)
    .map(b => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      category: b.category?.name ?? null,
      image: b.cover_url || b.business_photos?.[0]?.image_url || b.logo_url || null,
      hours: b.business_hours,
    }))
    .filter(b => b.image)
    .slice(0, 3)

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQ.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }

  return (
    <ScrollWrapper>
    <main id="sl-home" className="min-h-screen overflow-x-clip sl-public-v2 sl-home-v2">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ═══════════════════════════════════════════════════════════
          1. HERO — Scroll-synced video (con transición de salida)
      ═══════════════════════════════════════════════════════════ */}
      <HeroCinematic
        categories={categories}
        spotlight={heroSpotlight}
        businessCount={businessDisplayCount}
        catCount={catCount}
      />

      {/* ═══════════════════════════════════════════════════════════
          1b. (Marquee removido — texto en movimiento eliminado)
      ═══════════════════════════════════════════════════════════ */}

      {/* ═══════════════════════════════════════════════════════════
          2. CATEGORIES — What are you looking for?
      ═══════════════════════════════════════════════════════════ */}
      {/* Divider coral→gold */}
      <div id="sl-discovery" className="pueblo-divider" />

      {categories.length > 0 && (
        <SectionReveal>
          <section
          className="py-20 md:py-28"
          style={{
            background: `
              radial-gradient(60% 45% at 8% 30%, rgba(240,184,79,0.10), transparent 70%),
              radial-gradient(50% 40% at 95% 80%, rgba(59,130,246,0.10), transparent 70%),
              linear-gradient(180deg, #050d1a, #0a1c33)
            `,
            color: '#f6f1e6',
          }}
        >
          <div className="container mx-auto px-4">
            <ScrollReveal direction="up">
              <div className="text-center mb-12">
                <span
                  className="inline-block text-[12px] font-semibold uppercase tracking-[0.16em] mb-4"
                  style={{ color: '#f0b84f' }}
                >
                  Categorías
                </span>
                <h2
                  className="text-4xl md:text-6xl font-bold mb-4"
                  style={{ fontFamily: 'var(--display)', color: '#f6f1e6', letterSpacing: '-0.04em' }}
                >
                  ¿Qué buscas{' '}
                  <em style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400, color: '#f0b84f' }}>hoy?</em>
                </h2>
                <p className="text-base md:text-lg max-w-lg mx-auto" style={{ color: '#b9c6d4' }}>
                  Encuentra exactamente lo que necesitas en Lagos de Moreno.
                </p>
              </div>
            </ScrollReveal>

            <CategoryGrid categories={categories} />

            <SeoLandingsStrip />

            <div className="text-center">
              <Link
                href="/categorias"
                className="inline-flex items-center gap-2 px-6 min-h-11 rounded-full font-semibold text-sm transition-all hover:-translate-y-0.5"
                style={{ background: '#f0b84f', color: '#1a1204' }}
              >
                Ver todas las categorías
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
        </SectionReveal>
      )}

      {/* ═══════════════════════════════════════════════════════════
          2b. (Franja de contadores removida — contadores en 0+ eliminados)
      ═══════════════════════════════════════════════════════════ */}

      {/* ═══════════════════════════════════════════════════════════
          3. FEATURED BUSINESSES
      ═══════════════════════════════════════════════════════════ */}
      {featuredBusinesses && featuredBusinesses.length > 0 && (
        <SectionReveal>
          <FeaturedSection initialBusinesses={featuredBusinesses} />
        </SectionReveal>
      )}

      {/* ═══════════════════════════════════════════════════════════
          4. HOW IT WORKS — animación interactiva tipo app
      ═══════════════════════════════════════════════════════════ */}
      <SectionReveal>
        <HowItWorks />
      </SectionReveal>

      {/* ═══════════════════════════════════════════════════════════
          5. (Sección B2B movida a /para-negocios — fuera de la vista
          del consumidor)
      ═══════════════════════════════════════════════════════════ */}

      {/* ═══════════════════════════════════════════════════════════
          6. DESCUBRE LAGOS — Bento editorial
      ═══════════════════════════════════════════════════════════ */}
      <SectionReveal>
        <DescubreLagos />
      </SectionReveal>

      {/* ═══════════════════════════════════════════════════════════
          6b. EVENTOS Y FECHAS ESPECIALES
      ═══════════════════════════════════════════════════════════ */}
      <SectionReveal>
        <EventsSection />
      </SectionReveal>

      {/* ═══════════════════════════════════════════════════════════
          6c. BANNER — home_middle (solo si hay banner activo)
      ═══════════════════════════════════════════════════════════ */}
      <BannerDisplay placement="home_middle" />

      {/* ═══════════════════════════════════════════════════════════
          6d. MARKETPLACE STRIP — últimas 4 publicaciones
      ═══════════════════════════════════════════════════════════ */}
      <SectionReveal>
        <MarketplaceStrip listings={latestListings || []} />
         <DevogatecSpotlight />
       <CityStoryV2 />
      </SectionReveal>

      {/* ═══════════════════════════════════════════════════════════
          7. (Chatbot WhatsApp Devogatec movido a /para-negocios)
      ═══════════════════════════════════════════════════════════ */}

      {/* ═══════════════════════════════════════════════════════════
          9. INTERACTIVE MAP
      ═══════════════════════════════════════════════════════════ */}
      <SectionReveal>
        <InteractiveMap />
      </SectionReveal>

      {/* ═══════════════════════════════════════════════════════════
          10. TRUST / TESTIMONIALS
      ═══════════════════════════════════════════════════════════ */}
      <SectionReveal>
      <section className="py-20 md:py-28 relative overflow-hidden" style={{ background: 'linear-gradient(180deg,#fbeee3,#f8e4d3)' }}>
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl" style={{ background: 'rgba(14,152,171,0.14)' }} />
        <div className="container mx-auto px-4 relative">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Left */}
            <ScrollReveal direction="left">
              <div className="flex flex-col justify-center h-full">
                <span
                  className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
                  style={{ background: 'rgba(217,110,51,0.12)', color: 'var(--logo-terracotta)', border: '1px solid rgba(217,110,51,0.28)' }}
                >
                  Comunidad
                </span>
                <h2
                  className="text-3xl md:text-4xl font-black mb-6"
                  style={{ fontFamily: 'var(--display)', color: 'var(--logo-navy-deep)' }}
                >
                  Hecho con Lagos,<br />
                  <em style={{ color: 'var(--logo-terracotta)', fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400 }}>para Lagos</em>
                </h2>
                <div className="flex gap-8 mb-6">
                  <div>
                    <p
                      className="text-4xl font-black mb-1"
                      style={{ color: 'var(--logo-terracotta)', fontFamily: 'var(--display)' }}
                    >
                      <AnimatedCounter target={businessDisplayCount} suffix="+" />
                    </p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Negocios registrados</p>
                  </div>
                  <div>
                    <p
                      className="text-4xl font-black mb-1"
                      style={{ color: 'var(--logo-teal)', fontFamily: 'var(--display)' }}
                    >
                      <AnimatedCounter target={catCount} suffix="+" />
                    </p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Categorías disponibles</p>
                  </div>
                </div>
                <p className="text-base leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                  La plataforma local hecha por y para la comunidad de Lagos de Moreno, Jalisco.
                </p>
              </div>
            </ScrollReveal>

            {/* Right: review cards */}
            <ScrollReveal direction="right" delay={150}>
              {topReviews && topReviews.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {topReviews.map((review: any) => {
                    const initials = (review.profile as any)?.full_name
                      ?.split(' ')
                      .map((w: string) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || '?'
                    return (
                      <div
                        key={review.id}
                        className="sl-lift rounded-xl p-3"
                        style={{ background: 'rgba(255,255,255,0.85)', boxShadow: '0 1px 6px rgba(10,65,114,0.08)', border: '1px solid rgba(10,65,114,0.1)', borderTop: '3px solid var(--logo-amber)' }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, var(--logo-terracotta), var(--logo-amber))' }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs truncate" style={{ color: 'var(--ink)' }}>
                              {(review.profile as any)?.full_name || 'Usuario'}
                            </p>
                            {(review.business as any)?.slug && (
                              <Link
                                href={`/negocios/${(review.business as any).slug}`}
                                className="text-[10px] truncate block hover:underline"
                                style={{ color: 'var(--muted)' }}
                              >
                                {(review.business as any).name}
                              </Link>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? 'text-pueblo-barroco' : 'text-gray-200'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        {review.comment && (
                          <p
                            className="text-xs italic line-clamp-2"
                            style={{ color: 'rgba(31,41,55,0.7)' }}
                          >
                            &ldquo;{review.comment}&rdquo;
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div
                  className="sl-lift rounded-2xl p-8 text-center"
                  style={{ background: 'rgba(255,255,255,0.85)', boxShadow: '0 2px 12px rgba(10,65,114,0.08)', border: '1px solid rgba(10,65,114,0.1)' }}
                >
                  <span className="text-4xl mb-4 block">💬</span>
                  <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--ink)' }}>Sé el primero en opinar</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--ink-soft)' }}>
                    Visita cualquier negocio y comparte tu experiencia.
                  </p>
                  <Link
                    href="/buscar"
                    className="inline-flex items-center gap-2 px-5 min-h-11 rounded-full font-semibold text-sm text-white"
                    style={{ background: 'var(--logo-terracotta)' }}
                  >
                    Explorar negocios
                  </Link>
                </div>
              )}
            </ScrollReveal>
          </div>
        </div>
      </section>
      </SectionReveal>

      {/* ═══════════════════════════════════════════════════════════
          10b. PREGUNTAS FRECUENTES — visibles y con el mismo texto del JSON-LD
      ═══════════════════════════════════════════════════════════ */}
      <SectionReveal>
        <HomeFaq />
      </SectionReveal>

      {/* ═══════════════════════════════════════════════════════════
          11. CONTACTO
      ═══════════════════════════════════════════════════════════ */}
      <SectionReveal>
      <section className="py-20 md:py-24 relative overflow-hidden" style={{ background: 'linear-gradient(160deg,#0a4172,#072d52 70%)' }}>
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(600px 300px at 15% 10%,rgba(14,152,171,.25),transparent 65%), radial-gradient(500px 280px at 90% 90%,rgba(229,148,56,.18),transparent 65%)' }} />
        <div className="container mx-auto px-4 relative">
          <ScrollReveal direction="up">
            <div className="max-w-2xl mx-auto text-center">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
                style={{ background: 'rgba(229,148,56,0.14)', color: 'var(--logo-amber)', border: '1px solid rgba(229,148,56,0.35)' }}
              >
                Contacto
              </span>
              <h2
                className="text-3xl md:text-4xl font-black mb-3"
                style={{ fontFamily: 'var(--display)', color: '#fbeee3' }}
              >
                ¿Tienes dudas o quieres <em style={{ color: 'var(--logo-amber)', fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400 }}>registrar tu negocio?</em>
              </h2>
              <p className="text-base mb-10" style={{ color: '#c9d8e6' }}>
                Escríbenos directo por WhatsApp. Te respondemos personalmente.
              </p>

              <div
                className="sl-lift rounded-3xl p-8 md:p-10 flex flex-col sm:flex-row items-center gap-6"
                style={{
                  background: 'rgba(251,238,227,0.08)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: '1px solid rgba(251,238,227,0.2)',
                  boxShadow: '0 30px 60px -30px rgba(0,0,0,0.5)',
                }}
              >
                {/* WA icon */}
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: '#25D366' }}
                >
                  <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>

                {/* Info */}
                <div className="flex-1 text-left">
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: '#c9d8e6' }}>
                    WhatsApp directo
                  </p>
                  <p className="text-xl font-black mb-0.5" style={{ color: '#fbeee3', fontFamily: 'var(--display)' }}>
                    +52 474 108 2768
                  </p>
                  <p className="text-sm" style={{ color: '#c9d8e6' }}>
                    Lun–Vie · 9:00 am – 7:00 pm
                  </p>
                </div>

                {/* CTA */}
                <a
                  href="https://wa.me/524741082768?text=Hola%2C%20me%20interesa%20saber%20m%C3%A1s%20sobre%20SomosLagos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-7 min-h-12 rounded-full font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02] flex-shrink-0"
                  style={{ background: '#25D366', boxShadow: '0 8px 24px rgba(37,211,102,0.3)' }}
                >
                  Escribir ahora
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
      </SectionReveal>

      {/* ═══════════════════════════════════════════════════════════
          12. BLOG — últimas entradas
      ═══════════════════════════════════════════════════════════ */}
      {latestPosts.length > 0 && (
        <SectionReveal>
        <section className="py-16 md:py-24" style={{ background: 'linear-gradient(180deg,#fbeee3,#fdf6ee)' }}>
          <div className="container mx-auto px-4">
            <ScrollReveal direction="up">
              <div className="flex items-end justify-between mb-10">
                <div>
                  <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--logo-terracotta)' }}>Blog</span>
                  <h2 className="text-3xl md:text-4xl font-black mt-1" style={{ fontFamily: 'var(--display)', color: 'var(--logo-navy-deep)' }}>
                    Lo último de <em style={{ color: 'var(--logo-terracotta)', fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400 }}>Lagos</em>
                  </h2>
                </div>
                <Link
                  href="/blog"
                  className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold transition-colors"
                  style={{ color: 'var(--logo-terracotta)' }}
                >
                  Ver todo
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {latestPosts.map((post, index) => (
                  <StaggerItem key={post.id} className="h-full">
                    <BlogCard post={post} index={index} />
                  </StaggerItem>
                ))}
              </StaggerGroup>

              <div className="text-center mt-8 sm:hidden">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1 text-sm font-semibold min-h-11"
                  style={{ color: 'var(--logo-terracotta)' }}
                >
                  Ver todos los artículos →
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </section>
        </SectionReveal>
      )}

      {/* ═══════════════════════════════════════════════════════════
          13. FINAL CTA — escenario dramático con parallax
      ═══════════════════════════════════════════════════════════ */}
      <SectionReveal dramatic>
      <section className="relative py-24 overflow-hidden">
        {/* Fondo parallax de la ciudad */}
        <div className="absolute inset-0 z-0">
          <img src="/lagos-hero.jpg" alt="" aria-hidden loading="lazy" decoding="async" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,15,30,0.72) 0%, rgba(6,15,30,0.85) 100%)' }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="scale">
            <div
              className="max-w-4xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom right, rgba(217,110,51,0.95), rgba(229,148,56,0.95))',
                boxShadow: '0 30px 80px -20px rgba(6,15,30,0.6)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {/* Resplandor superior */}
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl" style={{ background: 'rgba(255,255,255,0.28)' }} />
              <h2
                className="text-3xl md:text-5xl font-black text-white mb-4 relative"
                style={{ fontFamily: 'var(--display)' }}
              >
                ¿Listo para ser parte de <span className="drop-shadow">SomosLagos</span>?
              </h2>
              <p className="text-white/85 text-lg mb-10 max-w-xl mx-auto relative">
                Únete gratis hoy y empieza a conectar con tu comunidad.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center relative">
                <Link
                  href="/registrar-negocio"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white font-bold rounded-full transition-all hover:scale-[1.04] hover:shadow-xl"
                  style={{ color: 'var(--logo-terracotta)' }}
                >
                  Registrar mi negocio
                </Link>
                <Link
                  href="/buscar"
                  className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-full border-2 border-white/70 text-white transition-all hover:bg-white/10 hover:scale-[1.02]"
                >
                  Explorar negocios
                </Link>
              </div>
              <Link
                href="/para-negocios"
                className="inline-block text-sm text-white/70 underline hover:text-white self-center mt-6 relative"
              >
                Para negocios
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>
      </SectionReveal>

    </main>
    </ScrollWrapper>
  )
}
