import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import SearchForm from '@/components/home/SearchForm'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
import StarRating from '@/components/reviews/StarRating'
import AnimatedCounter from '@/components/shared/AnimatedCounter'
import ScrollReveal from '@/components/shared/ScrollReveal'
import { TIER_ORDER } from '@/lib/constants'
import type { BlogPost } from '@/types/database.types'
import type { BusinessHours } from '@/lib/constants'
import HeroVideoScroll from '@/components/home/HeroVideoScroll'
import MarqueeTicker from '@/components/home/MarqueeTicker'
import InteractiveMap from '@/components/home/InteractiveMap'
import DescubreLagos from '@/components/home/DescubreLagos'
import BannerDisplay from '@/components/ads/BannerDisplay'
import EventsSection from '@/components/home/EventsSection'
import FeaturedSection from '@/components/home/FeaturedSection'

export const revalidate = 3600

const LOCAL_BLOG_IMAGE = '/blog/lagos-pueblo-magico.jpg'

function resolveBlogImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) return imageUrl
  return imageUrl.includes('images.unsplash.com') ? LOCAL_BLOG_IMAGE : imageUrl
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

const CAT_COLORS: Record<string, string> = {
  'comida': 'var(--coral)', 'comer': 'var(--coral)',
  'compras': 'var(--gold)', 'comprar': 'var(--gold)',
  'servicios': 'var(--turquoise)',
  'salud': 'var(--green)',
  'belleza': 'var(--buga)',
  'hospedaje': 'var(--turquoise)',
  'turismo': 'var(--terracotta)',
  'entretenimiento': 'var(--blue)',
}

function getCatColor(slug: string): string {
  for (const key of Object.keys(CAT_COLORS)) {
    if (slug.toLowerCase().includes(key)) return CAT_COLORS[key]
  }
  return 'var(--ink)'
}

export default async function HomePage() {
  const supabase = await createClient()

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

  const latestPosts = ((blogPosts as BlogPost[]) || []).map((post) => ({
    ...post,
    featured_image_url: resolveBlogImageUrl(post.featured_image_url),
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

  // Business count rounded down to nearest 5 minus 5
  const totalBusinessCount = (businessCats || []).length
  const businessDisplayCount = Math.max(5, Math.floor(totalBusinessCount / 5) * 5 - 5)

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

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Cómo registro mi negocio en SomosLagos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Entra a somoslagos.com.mx, haz clic en "Registrar negocio" y completa el formulario gratuito. Tu negocio aparecerá en el directorio en minutos.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Es gratis registrar mi negocio en SomosLagos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, el plan Gratis es para siempre. Incluye perfil con fotos, WhatsApp directo, horarios y aparición en el mapa. Existen planes de pago para negocios que quieren mayor visibilidad.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué es Lagos de Moreno Pueblo Mágico?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Lagos de Moreno es un Pueblo Mágico de Jalisco, México, famoso por su arquitectura barroca, gastronomía, artesanías y tradiciones. SomosLagos es la plataforma digital oficial de su comunidad de negocios.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Puedo pedir a un negocio local por WhatsApp desde SomosLagos?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí. Desde el perfil de cada negocio puedes contactarlos directamente por WhatsApp. Los negocios con Plan Pro además tienen catálogo de productos y pedidos en línea.',
        },
      },
      {
        '@type': 'Question',
        name: '¿SomosLagos tiene app móvil?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'SomosLagos funciona como una Progressive Web App (PWA). Puedes instalarla en tu celular desde el navegador, sin necesidad de descargarla en la tienda de apps.',
        },
      },
    ],
  }

  return (
    <main className="min-h-screen overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ═══════════════════════════════════════════════════════════
          1. HERO — Scroll-synced video
      ═══════════════════════════════════════════════════════════ */}
      <HeroVideoScroll
        categories={categories}
        businessCount={businessDisplayCount}
        catCount={catCount}
      />

      {/* ═══════════════════════════════════════════════════════════
          1b. MARQUEE TICKER
      ═══════════════════════════════════════════════════════════ */}
      <MarqueeTicker />


      {/* ═══════════════════════════════════════════════════════════
          2. CATEGORIES — What are you looking for?
      ═══════════════════════════════════════════════════════════ */}
      {/* Divider coral→gold */}
      <div className="pueblo-divider" />

      {categories.length > 0 && (
        <section
          className="py-20"
          style={{
            background: `
              radial-gradient(ellipse at 8% 40%, rgba(255,107,53,0.08) 0%, transparent 48%),
              radial-gradient(ellipse at 92% 15%, rgba(245,185,66,0.10) 0%, transparent 42%),
              radial-gradient(ellipse at 55% 95%, rgba(34,184,207,0.05) 0%, transparent 38%),
              #FFFDF8
            `,
          }}
        >
          <div className="container mx-auto px-4">
            <ScrollReveal direction="up">
              <div className="text-center mb-12">
                <span
                  className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
                  style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}
                >
                  Categorías
                </span>
                <h2
                  className="text-4xl md:text-5xl font-black mb-3"
                  style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
                >
                  ¿Qué buscas hoy?
                </h2>
                <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--ink-soft)' }}>
                  Encuentra exactamente lo que necesitas en Lagos de Moreno.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
              {categories.map((cat, i) => {
                const color = getCatColor(cat.slug)
                return (
                  <ScrollReveal key={cat.id} direction="up" delay={i * 40}>
                    <Link
                      href={`/categorias/${cat.slug}`}
                      className="flex flex-col items-center gap-3 p-5 rounded-2xl transition-all duration-300 hover:scale-[1.05] group"
                      style={{
                        background: 'rgba(255,253,248,0.78)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        border: `1px solid rgba(255,253,248,0.6)`,
                        borderLeft: `4px solid ${color}`,
                        boxShadow: `0 2px 20px rgba(31,41,55,0.07), inset 0 1px 0 rgba(255,255,255,0.7)`,
                      }}
                    >
                      <span
                        className="text-3xl transition-transform duration-300 group-hover:scale-110"
                        style={{ filter: `drop-shadow(0 0 8px ${color}55)` }}
                      >
                        {cat.icon || '📦'}
                      </span>
                      <span
                        className="text-sm font-semibold text-center leading-tight"
                        style={{ color: 'var(--ink)' }}
                      >
                        {cat.name}
                      </span>
                    </Link>
                  </ScrollReveal>
                )
              })}
            </div>

            <div className="text-center">
              <Link
                href="/categorias"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition-all hover:opacity-90"
                style={{ background: 'var(--coral)', color: 'white' }}
              >
                Ver todas las categorías
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════
          2b. STATS STRIP
      ═══════════════════════════════════════════════════════════ */}
      <section
        className="py-12"
        style={{
          background: `
            radial-gradient(ellipse at 20% 50%, rgba(255,107,53,0.18) 0%, transparent 55%),
            radial-gradient(ellipse at 80% 50%, rgba(245,185,66,0.15) 0%, transparent 50%),
            var(--ink)
          `,
        }}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { target: businessDisplayCount, suffix: '+', label: 'Negocios registrados', color: 'var(--coral)' },
              { target: catCount, suffix: '+', label: 'Categorías', color: 'var(--gold)' },
              { target: 1, suffix: '', label: 'Pueblo Mágico', color: 'var(--turquoise)' },
              { target: 100, suffix: '%', label: 'Lagos de Moreno', color: 'rgba(255,253,248,0.9)' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p
                  className="text-5xl md:text-6xl font-black mb-1 tabular-nums"
                  style={{ color: stat.color, fontFamily: 'var(--display)', lineHeight: 1 }}
                >
                  <AnimatedCounter target={stat.target} suffix={stat.suffix} />
                </p>
                <p className="text-sm mt-2" style={{ color: 'rgba(255,253,248,0.45)' }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. FEATURED BUSINESSES
      ═══════════════════════════════════════════════════════════ */}
      {featuredBusinesses && featuredBusinesses.length > 0 && (
        <FeaturedSection initialBusinesses={featuredBusinesses} />
      )}

      {/* ═══════════════════════════════════════════════════════════
          4. HOW IT WORKS
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: '#FFFDF8' }}>
        <div className="container mx-auto px-4">
          <ScrollReveal direction="up">
            <div className="text-center mb-12">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
                style={{ background: 'rgba(245,185,66,0.15)', color: 'var(--gold)' }}
              >
                ¿Cómo funciona?
              </span>
              <h2
                className="text-3xl md:text-4xl font-black mb-3"
                style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
              >
                Así funciona SomosLagos
              </h2>
              <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--ink-soft)' }}>
                Conectar con negocios locales nunca fue tan fácil.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                num: '1',
                color: 'var(--coral)',
                title: 'Busca',
                body: 'Encuentra negocios locales por categoría, nombre o ubicación.',
                mock: (
                  <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(255,107,53,0.07)' }}>
                    <div className="h-2.5 rounded-full bg-current opacity-20 mb-2" style={{ color: 'var(--coral)', width: '80%' }} />
                    <div className="h-2 rounded-full bg-current opacity-10" style={{ color: 'var(--coral)', width: '60%' }} />
                  </div>
                ),
              },
              {
                num: '2',
                color: 'var(--gold)',
                title: 'Conecta',
                body: 'Llama, manda WhatsApp o visita el negocio directo desde su perfil.',
                mock: (
                  <div className="mt-4 flex gap-2">
                    <div className="flex-1 h-8 rounded-lg" style={{ background: 'rgba(245,185,66,0.2)' }} />
                    <div className="flex-1 h-8 rounded-lg" style={{ background: '#25D36633' }} />
                  </div>
                ),
              },
              {
                num: '3',
                color: 'var(--ink)',
                title: 'Pide',
                body: 'Ordena productos en línea si el negocio tiene Plan Pro activado.',
                mock: (
                  <div className="mt-4 p-3 rounded-xl" style={{ background: 'rgba(31,41,55,0.06)' }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="h-2 w-16 rounded bg-current opacity-20" style={{ color: 'var(--ink)' }} />
                      <div className="h-5 w-5 rounded-full" style={{ background: 'var(--coral)' }} />
                    </div>
                    <div className="h-2 w-24 rounded bg-current opacity-10" style={{ color: 'var(--ink)' }} />
                  </div>
                ),
              },
            ].map((step, i) => (
              <ScrollReveal key={step.num} direction="up" delay={i * 100}>
                <div
                  className="p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2 group"
                  style={{ background: 'white', boxShadow: '0 2px 12px rgba(31,41,55,0.06)' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 16px 40px rgba(31,41,55,0.12), 0 0 0 2px ${step.color}22`)}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(31,41,55,0.06)')}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-black text-xl text-white mb-4 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: step.color, boxShadow: `0 4px 14px ${step.color}55` }}
                  >
                    {step.num}
                  </div>
                  <h3 className="font-black text-xl mb-2" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>{step.body}</p>
                  {step.mock}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          5. GROW / OWNER CTA
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-pueblo-noche relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 md:w-[30rem] md:h-[30rem] bg-pueblo-barroco/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-56 h-56 md:w-[24rem] md:h-[24rem] bg-pueblo-cantera/10 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto px-4 relative z-10">
          <ScrollReveal direction="scale">
            <div className="max-w-5xl mx-auto rounded-3xl border border-white/10 overflow-hidden grid md:grid-cols-2 gap-0 bg-pueblo-noche">
              {/* Left column */}
              <div className="p-10 md:p-14 flex flex-col justify-center">
                <span className="pueblo-eyebrow inline-block px-4 py-1.5 text-[10px] font-bold rounded-full mb-6">
                  Para Negocios
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-pueblo-crema mb-6 leading-[0.95] tracking-tight">
                  Haz crecer<br />
                  <span className="text-pueblo-barroco">tu negocio</span>
                </h2>
                <ul className="space-y-3 mb-8">
                  {[
                    'Perfil completo con fotos y descripción',
                    'Aparece en búsquedas y mapa',
                    'Recibe WhatsApp directo',
                    'Catálogo de productos con Plan Pro',
                    'Tus productos en el Chatbot IA',
                    'Estadísticas de visitas y clics',
                  ].map(benefit => (
                    <li key={benefit} className="flex items-start gap-3 text-sm text-pueblo-crema/80">
                      <span className="text-pueblo-barroco mt-0.5 text-base">✓</span>
                      {benefit}
                    </li>
                  ))}
                </ul>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/registrar-negocio"
                    className="px-8 py-3.5 rounded-full font-bold text-pueblo-noche text-center transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(to right, var(--gold), var(--terracotta))' }}
                  >
                    Registrar gratis
                  </Link>
                  <Link
                    href="/planes"
                    className="px-8 py-3.5 rounded-full font-semibold text-center border-2 transition-all hover:opacity-80"
                    style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}
                  >
                    Ver planes
                  </Link>
                </div>
              </div>

              {/* Right column: animated shop preview */}
              <div className="p-10 md:p-14 flex items-center justify-center">
                <div className="relative w-full max-w-xs">
                  <div
                    className="rounded-2xl p-6 relative"
                    style={{ background: 'white', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
                  >
                    <div className="h-24 rounded-xl bg-gradient-to-br from-pueblo-barroco/20 to-pueblo-cantera/10 mb-4 flex items-center justify-center">
                      <span className="text-4xl">🏪</span>
                    </div>
                    <h4 className="font-bold text-pueblo-noche mb-1">Mi Negocio Lagos</h4>
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className="w-3.5 h-3.5 text-pueblo-barroco" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="text-xs text-pueblo-terracotta/60 ml-1">5.0</span>
                    </div>
                    <div className="h-2 rounded-full bg-pueblo-noche/10 mb-2" style={{ width: '85%' }} />
                    <div className="h-2 rounded-full bg-pueblo-noche/10" style={{ width: '65%' }} />

                    {/* Notification badge 1 */}
                    <div className="absolute -top-3 -right-3 bg-green-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg animate-bounce">
                      📩 Nuevo pedido
                    </div>
                    {/* Notification badge 2 */}
                    <div
                      className="absolute -bottom-3 -left-3 text-pueblo-noche text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse"
                      style={{ background: 'var(--gold)' }}
                    >
                      ⭐ Nueva reseña
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          6. DESCUBRE LAGOS — Bento editorial
      ═══════════════════════════════════════════════════════════ */}
      <DescubreLagos />

      {/* ═══════════════════════════════════════════════════════════
          6b. EVENTOS Y FECHAS ESPECIALES
      ═══════════════════════════════════════════════════════════ */}
      <EventsSection />

      {/* ═══════════════════════════════════════════════════════════
          6c. BANNER — home_middle (solo si hay banner activo)
      ═══════════════════════════════════════════════════════════ */}
      <BannerDisplay placement="home_middle" />

      {/* ═══════════════════════════════════════════════════════════
          7. WHATSAPP COMMERCE — servicio ofrecido
      ═══════════════════════════════════════════════════════════ */}
      <section
        className="py-20"
        style={{
          background: `
            radial-gradient(ellipse at 5% 30%, rgba(37,211,102,0.06) 0%, transparent 45%),
            radial-gradient(ellipse at 95% 70%, rgba(255,107,53,0.05) 0%, transparent 40%),
            var(--ink)
          `,
        }}
      >
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <ScrollReveal direction="up">
              {/* Header */}
              <div className="text-center mb-12">
                <span
                  className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
                  style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366' }}
                >
                  WhatsApp Commerce
                </span>
                <h2
                  className="text-3xl md:text-4xl font-black mb-4"
                  style={{ fontFamily: 'var(--display)', color: 'var(--ivory)', lineHeight: 1 }}
                >
                  ¿Quieres que tus clientes{' '}
                  <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400, color: '#25D366' }}>
                    pidan por WhatsApp?
                  </em>
                </h2>
                <p className="text-base max-w-xl mx-auto" style={{ color: 'rgba(255,253,248,0.6)' }}>
                  Lo implementamos para tu negocio en Lagos de Moreno. Tu catálogo, tus precios,
                  tus pedidos — todo desde WhatsApp, sin apps, sin complicaciones.
                </p>
              </div>

              {/* 3 benefit cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                {[
                  {
                    icon: '🍽️',
                    title: 'Menú digital',
                    body: 'Tus productos con fotos y precios visibles directo en el chat de WhatsApp.',
                  },
                  {
                    icon: '🛒',
                    title: 'Pedidos sin confusión',
                    body: 'El cliente elige tocando botones. Tú recibes el pedido completo y ordenado.',
                  },
                  {
                    icon: '💳',
                    title: 'Paga como quiera',
                    body: 'Transferencia, efectivo o tarjeta. Sin fricción, sin malentendidos.',
                  },
                ].map(item => (
                  <div
                    key={item.title}
                    className="p-6 rounded-2xl"
                    style={{
                      background: 'rgba(255,253,248,0.05)',
                      border: '1px solid rgba(255,253,248,0.08)',
                    }}
                  >
                    <span className="text-3xl mb-3 block">{item.icon}</span>
                    <h4 className="font-bold mb-2" style={{ color: 'var(--ivory)', fontFamily: 'var(--display)' }}>
                      {item.title}
                    </h4>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,253,248,0.5)' }}>
                      {item.body}
                    </p>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="https://wa.me/524741082768?text=Hola%2C%20me%20interesa%20WhatsApp%20Commerce%20para%20mi%20negocio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02]"
                  style={{ background: '#25D366', boxShadow: '0 8px 28px rgba(37,211,102,0.3)' }}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Me interesa, cuéntame más
                </a>
                <Link
                  href="/planes"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full font-semibold border-2 transition-all hover:opacity-80"
                  style={{ borderColor: 'rgba(255,253,248,0.25)', color: 'rgba(255,253,248,0.7)' }}
                >
                  Ver planes disponibles
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          8. PLANS
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: '#FFFDF8' }}>
        <div className="container mx-auto px-4">
          <ScrollReveal direction="up">
            <div className="text-center mb-12">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
                style={{ background: 'rgba(245,185,66,0.15)', color: 'var(--gold)' }}
              >
                ✨ Planes
              </span>
              <h2
                className="text-3xl md:text-4xl font-black mb-2"
                style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
              >
                Elige tu plan
              </h2>
              <p className="text-base" style={{ color: 'var(--ink-soft)' }}>
                Empieza gratis. Escala cuando quieras.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto items-start mb-8">
            {/* Gratis */}
            <ScrollReveal direction="up" delay={0}>
              <div className="rounded-2xl p-6 flex flex-col bg-white border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Gratis</p>
                <p className="text-4xl font-extrabold mb-0.5" style={{ color: 'var(--ink)' }}>$0</p>
                <p className="text-xs text-gray-400 mb-6">para siempre</p>
                <ul className="space-y-2.5 text-sm text-gray-600 flex-1 mb-6">
                  {['Buscador y mapa', 'WhatsApp directo', 'Horarios', 'Hasta 3 fotos'].map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-gray-400 text-xs mt-0.5">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/registrar-negocio"
                  className="block text-center py-2.5 rounded-xl border font-semibold text-sm transition-all hover:opacity-80"
                  style={{ borderColor: 'var(--coral)', color: 'var(--coral)' }}
                >
                  Empezar Gratis
                </Link>
              </div>
            </ScrollReveal>

            {/* Emprendedor */}
            <ScrollReveal direction="up" delay={100}>
              <div className="rounded-2xl p-6 flex flex-col bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" style={{ border: '1px solid rgba(255,107,53,0.3)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--coral)' }}>Emprendedor</p>
                <p className="text-4xl font-extrabold mb-0.5" style={{ color: 'var(--ink)' }}>$60</p>
                <p className="text-xs text-gray-400 mb-6">MXN/mes · $2/día</p>
                <ul className="space-y-2.5 text-sm text-gray-600 flex-1 mb-6">
                  {['Todo Gratis +', 'Portada personalizada', 'Redes sociales', 'Hasta 8 fotos'].map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-xs mt-0.5" style={{ color: 'var(--coral)' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/planes"
                  className="block text-center py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
                  style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}
                >
                  Ver detalles
                </Link>
              </div>
            </ScrollReveal>

            {/* Pro — FEATURED */}
            <ScrollReveal direction="up" delay={200}>
              <div
                className="rounded-2xl p-6 flex flex-col relative lg:scale-105 shadow-2xl"
                style={{ background: 'var(--ink)', color: 'var(--cream)' }}
              >
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <span
                    className="text-pueblo-noche text-[10px] font-bold px-4 py-1 rounded-full shadow-lg tracking-wide uppercase"
                    style={{ background: 'linear-gradient(to right, var(--gold), #EAB308)' }}
                  >
                    Más Popular
                  </span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--gold)' }}>Pro</p>
                <p className="text-4xl font-extrabold mb-0.5 text-pueblo-crema">$120</p>
                <p className="text-xs text-pueblo-crema/40 mb-6">MXN/mes · $4/día</p>
                <ul className="space-y-2.5 text-sm text-pueblo-crema/80 flex-1 mb-6">
                  {['Catálogo de productos', 'Pedidos en línea', 'Productos en Chatbot IA 🤖', 'Hasta 15 fotos'].map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-xs mt-0.5" style={{ color: 'var(--gold)' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/planes"
                  className="block text-center py-3 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(to right, var(--gold), var(--terracotta))', color: 'var(--ink)' }}
                >
                  Ver detalles →
                </Link>
              </div>
            </ScrollReveal>

            {/* Avanzado */}
            <ScrollReveal direction="up" delay={300}>
              <div className="rounded-2xl p-6 flex flex-col bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl" style={{ border: '1px solid rgba(20,184,166,0.3)' }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3 text-teal-500">Avanzado</p>
                <p className="text-4xl font-extrabold mb-0.5" style={{ color: 'var(--ink)' }}>$180</p>
                <p className="text-xs text-gray-400 mb-6">MXN/mes · $6/día</p>
                <ul className="space-y-2.5 text-sm text-gray-600 flex-1 mb-6">
                  {['Destacado en búsquedas', 'Badge verificado ✅', 'Estadísticas detalladas', 'Hasta 20 fotos'].map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-xs mt-0.5 text-teal-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/planes"
                  className="block text-center py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 text-teal-600"
                  style={{ background: 'rgba(20,184,166,0.1)' }}
                >
                  Ver detalles
                </Link>
              </div>
            </ScrollReveal>
          </div>

          <p className="text-center text-sm" style={{ color: 'var(--muted)' }}>
            Sin contratos · Cancela cuando quieras · El plan Gratis es para siempre
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          9. INTERACTIVE MAP
      ═══════════════════════════════════════════════════════════ */}
      <InteractiveMap />

      {/* ═══════════════════════════════════════════════════════════
          10. TRUST / TESTIMONIALS
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: '#FFFDF8' }}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Left */}
            <ScrollReveal direction="left">
              <div className="flex flex-col justify-center h-full">
                <span
                  className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
                  style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}
                >
                  Comunidad
                </span>
                <h2
                  className="text-3xl md:text-4xl font-black mb-6"
                  style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
                >
                  Hecho con Lagos,<br />
                  <span style={{ color: 'var(--coral)' }}>para Lagos</span>
                </h2>
                <div className="flex gap-8 mb-6">
                  <div>
                    <p
                      className="text-4xl font-black mb-1"
                      style={{ color: 'var(--coral)', fontFamily: 'var(--display)' }}
                    >
                      <AnimatedCounter target={businessDisplayCount} suffix="+" />
                    </p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Negocios registrados</p>
                  </div>
                  <div>
                    <p
                      className="text-4xl font-black mb-1"
                      style={{ color: 'var(--gold)', fontFamily: 'var(--display)' }}
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
                        className="rounded-xl p-3"
                        style={{ background: 'white', boxShadow: '0 1px 6px rgba(31,41,55,0.07)', border: '1px solid rgba(255,253,248,0.6)' }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                            style={{ background: 'linear-gradient(to br, var(--coral), var(--gold))' }}
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
                  className="rounded-2xl p-8 text-center"
                  style={{ background: 'white', boxShadow: '0 2px 12px rgba(31,41,55,0.06)' }}
                >
                  <span className="text-4xl mb-4 block">💬</span>
                  <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--ink)' }}>Sé el primero en opinar</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--ink-soft)' }}>
                    Visita cualquier negocio y comparte tu experiencia.
                  </p>
                  <Link
                    href="/buscar"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm text-white"
                    style={{ background: 'var(--coral)' }}
                  >
                    Explorar negocios
                  </Link>
                </div>
              )}
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          11. CONTACTO
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-20" style={{ background: 'var(--cream)' }}>
        <div className="container mx-auto px-4">
          <ScrollReveal direction="up">
            <div className="max-w-2xl mx-auto text-center">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
                style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}
              >
                Contacto
              </span>
              <h2
                className="text-3xl md:text-4xl font-black mb-3"
                style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
              >
                ¿Tienes dudas o quieres registrar tu negocio?
              </h2>
              <p className="text-base mb-10" style={{ color: 'var(--ink-soft)' }}>
                Escríbenos directo por WhatsApp. Te respondemos personalmente.
              </p>

              <div
                className="rounded-3xl p-8 md:p-10 flex flex-col sm:flex-row items-center gap-6"
                style={{
                  background: 'white',
                  boxShadow: '0 2px 24px rgba(31,41,55,0.08), 0 0 0 1px rgba(31,41,55,0.05)',
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
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>
                    WhatsApp directo
                  </p>
                  <p className="text-xl font-black mb-0.5" style={{ color: 'var(--ink)', fontFamily: 'var(--display)' }}>
                    +52 474 108 2768
                  </p>
                  <p className="text-sm" style={{ color: 'var(--ink-soft)' }}>
                    Lun–Vie · 9:00 am – 7:00 pm
                  </p>
                </div>

                {/* CTA */}
                <a
                  href="https://wa.me/524741082768?text=Hola%2C%20me%20interesa%20saber%20m%C3%A1s%20sobre%20SomosLagos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02] flex-shrink-0"
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

      {/* ═══════════════════════════════════════════════════════════
          12. FINAL CTA
      ═══════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-pueblo-noche">
        <div className="container mx-auto px-4">
          <ScrollReveal direction="up">
            <div
              className="max-w-4xl mx-auto rounded-3xl p-12 text-center"
              style={{ background: 'linear-gradient(to bottom right, var(--coral), var(--gold))' }}
            >
              <h2
                className="text-3xl md:text-5xl font-black text-white mb-4"
                style={{ fontFamily: 'var(--display)' }}
              >
                ¿Listo para ser parte de SomosLagos?
              </h2>
              <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
                Únete gratis hoy y empieza a conectar con tu comunidad.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/registrar-negocio"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white font-bold rounded-full transition-all hover:opacity-90"
                  style={{ color: 'var(--coral)' }}
                >
                  Registrar mi negocio
                </Link>
                <Link
                  href="/buscar"
                  className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-full border-2 border-white text-white transition-all hover:bg-white/10"
                >
                  Explorar negocios
                </Link>
                <Link
                  href="/planes"
                  className="inline-flex items-center justify-center text-sm text-white/70 underline hover:text-white self-center"
                >
                  Ver planes
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

    </main>
  )
}
