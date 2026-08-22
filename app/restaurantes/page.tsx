import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TIER_ORDER } from '@/lib/constants'
import BusinessCard from '@/components/shared/BusinessCard'
import BannerDisplay from '@/components/ads/BannerDisplay'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Restaurantes y dónde comer en Lagos de Moreno, Jalisco | SomosLagos',
  description:
    'Encuentra los mejores restaurantes y lugares para comer en Lagos de Moreno: comida típica alteña, taquerías, cenar en Lagos, cafeterías y más. Directorio con horarios, opiniones y WhatsApp directo.',
  keywords: [
    'restaurantes en lagos de moreno',
    'dónde comer en lagos de moreno',
    'comida típica lagos de moreno',
    'cenar en lagos de moreno',
    'taquerías lagos de moreno',
    'comida en lagos de moreno jalisco',
    'pueblo mágico restaurantes',
  ],
  alternates: {
    canonical: 'https://www.somoslagos.com.mx/restaurantes',
  },
  openGraph: {
    title: 'Restaurantes y dónde comer en Lagos de Moreno, Jalisco | SomosLagos',
    description:
      'Los mejores restaurantes, taquerías y lugares para comer en Lagos de Moreno, Pueblo Mágico de Jalisco. Horarios, opiniones y contacto directo.',
    url: 'https://www.somoslagos.com.mx/restaurantes',
    type: 'website',
    locale: 'es_MX',
    siteName: 'SomosLagos',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Restaurantes y dónde comer en Lagos de Moreno, Jalisco | SomosLagos',
    description:
      'Los mejores restaurantes, taquerías y lugares para comer en Lagos de Moreno, Pueblo Mágico de Jalisco.',
  },
}

interface Business {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  address: string | null
  neighborhood: string | null
  phone?: string | null
  subscription_tier: string
  is_featured: boolean
  business_hours: any
  rating: number
  total_reviews: number
  category: { id: string; name: string; icon: string } | null
}

const FOOD_SLUGS = ['restaurantes', 'comida', 'comer', 'taquerias', 'cafeterias', 'heladerias', 'antojitos', 'cenadurias']

export default async function RestaurantesPage() {
  const supabase = await createClient()

  // Buscar categorías de comida/restaurantes (incluye subcategorías)
  const { data: foodCats } = await supabase
    .from('categories')
    .select('id, name, icon, slug')
    .in('slug', FOOD_SLUGS)

  const foodCatIds = (foodCats || []).map((c: { id: string }) => c.id)

  let businesses: Business[] = []

  if (foodCatIds.length > 0) {
    const { data: rawBusinesses } = await supabase
      .from('businesses')
      .select(`
        id, name, slug, description, logo_url, cover_url, address, neighborhood, phone,
        subscription_tier, is_featured, business_hours, rating, total_reviews,
        category:categories(id, name, icon)
      `)
      .eq('is_active', true)
      .in('category_id', foodCatIds)
      .order('is_featured', { ascending: false })
      .order('name')
      .limit(60) as { data: Business[] | null }

    businesses = rawBusinesses
      ? [...rawBusinesses].sort((a, b) => {
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
          const tierA = TIER_ORDER[a.subscription_tier] || 0
          const tierB = TIER_ORDER[b.subscription_tier] || 0
          if (tierA !== tierB) return tierB - tierA
          return a.name.localeCompare(b.name)
        })
      : []
  }

  // JSON-LD: ItemList de restaurantes
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Restaurantes y dónde comer en Lagos de Moreno, Jalisco',
    description:
      'Directorio de restaurantes, taquerías y lugares para comer en Lagos de Moreno, Pueblo Mágico de Jalisco.',
    numberOfItems: businesses.length,
    itemListElement: businesses.slice(0, 30).map((biz, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Restaurant',
        name: biz.name,
        url: `https://www.somoslagos.com.mx/negocios/${biz.slug}`,
        servesCuisine: 'Mexicana, regional',
        address: {
          '@type': 'PostalAddress',
          streetAddress: biz.address || '',
          addressLocality: 'Lagos de Moreno',
          addressRegion: 'Jalisco',
          addressCountry: 'MX',
        },
        ...(biz.total_reviews > 0 && {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: biz.rating,
            reviewCount: biz.total_reviews,
          },
        }),
      },
    })),
  }

  // JSON-LD: Breadcrumb
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.somoslagos.com.mx' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Restaurantes en Lagos de Moreno',
        item: 'https://www.somoslagos.com.mx/restaurantes',
      },
    ],
  }

  // JSON-LD: FAQ (SEO local)
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Dónde comer en Lagos de Moreno?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Lagos de Moreno tiene una gran oferta gastronómica: restaurantes de comida típica alteña, taquerías, cenadurías, cafeterías y lugares para cenar en el centro histórico del Pueblo Mágico.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué comida típica se come en Lagos de Moreno?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'La gastronomía de Lagos de Moreno incluye birria, tortas ahogadas, carnitas, gorditas, tamales, dulces típicos y la famosa comida jalisciense en restaurantes del centro y sus alrededores.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Hay taquerías en Lagos de Moreno?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Sí, en Lagos de Moreno hay varias taquerías reconocidas. En SomosLagos puedes ver sus horarios, ubicación, opiniones y contactarlas por WhatsApp directamente.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Dónde cenar en Lagos de Moreno por la noche?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'En el centro de Lagos de Moreno y sus portales encontrarás restaurantes y centros nocturnos. Consulta los horarios en cada negocio para saber cuáles están abiertos por la noche.',
        },
      },
    ],
  }

  return (
    <main className="min-h-screen" style={{ background: '#FFFDF8' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ═══ HERO — Restaurantes en Lagos ═══ */}
      <section className="relative overflow-hidden pt-28 pb-16 md:pt-32 md:pb-20">
        {/* Blobs decorativos */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(255,107,53,0.12)' }} />
        <div className="absolute bottom-0 left-10 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(245,185,66,0.14)' }} />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            {/* Eyebrow */}
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-5"
              style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}
            >
              <span className="text-sm">🍽️</span> Guía gastronómica · Pueblo Mágico
            </span>

            {/* H1 principal SEO */}
            <h1
              className="text-4xl md:text-6xl font-black leading-[1.02] tracking-tight mb-5"
              style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
            >
              Restaurantes y dónde comer en{' '}
              <span className="relative inline-block">
                <span style={{ color: 'var(--coral)' }}>Lagos de Moreno, Jalisco</span>
                <span className="absolute -bottom-2 left-0 right-0 h-1.5 rounded-full" style={{ background: 'linear-gradient(90deg, var(--coral), var(--gold))', opacity: 0.5 }} />
              </span>
            </h1>

            {/* Bloque SEO descriptivo ~150 palabras */}
            <p className="text-base md:text-lg leading-relaxed mb-8" style={{ color: 'var(--ink-soft)' }}>
              Lagos de Moreno es mucho más que un <strong className="font-semibold" style={{ color: 'var(--ink)' }}>Pueblo Mágico</strong>: es un destino
              gastronómico donde la <strong className="font-semibold" style={{ color: 'var(--ink)' }}>comida típica</strong> alteña se sirve con orgullo en
              restaurantes del centro, mercados y plazas. Aquí encuentras desde taquerías de barrio con recetas de generaciones, hasta
              lugares para <strong className="font-semibold" style={{ color: 'var(--ink)' }}>cenar en Lagos</strong> bajo los portales coloniales. La oferta
              incluye birria, tortas ahogadas, carnitas, gorditas, tamales y dulces tradicionales, sin olvidar los centros nocturnos
              y cafeterías que completan la vida social de la ciudad. En SomosLagos reunimos los mejores restaurantes de la región con
              horarios actualizados, ubicación en el mapa, opiniones reales y WhatsApp directo para que comas como local.
            </p>

            {/* Chips de búsqueda rápida */}
            <div className="flex flex-wrap gap-2 mb-10">
              {[
                { label: 'Comida típica', emoji: '🌮' },
                { label: 'Taquerías', emoji: '🌯' },
                { label: 'Cenar en Lagos', emoji: '🌙' },
                { label: 'Cafeterías', emoji: '☕' },
              ].map(chip => (
                <Link
                  key={chip.label}
                  href="/buscar"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-[1.03] hover:-translate-y-0.5"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(31,41,55,0.08)',
                    color: 'var(--ink)',
                    boxShadow: '0 4px 16px rgba(31,41,55,0.06)',
                  }}
                >
                  <span>{chip.emoji}</span> {chip.label}
                </Link>
              ))}
            </div>

            {/* Stats ligeras */}
            <div className="flex items-center gap-6">
              <div>
                <p className="text-3xl font-black" style={{ color: 'var(--coral)', fontFamily: 'var(--display)' }}>{businesses.length}+</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Restaurantes y lugares</p>
              </div>
              <div className="w-px h-10" style={{ background: 'rgba(31,41,55,0.1)' }} />
              <div>
                <p className="text-3xl font-black" style={{ color: 'var(--gold)', fontFamily: 'var(--display)' }}>1</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Pueblo Mágico</p>
              </div>
              <div className="w-px h-10" style={{ background: 'rgba(31,41,55,0.1)' }} />
              <div>
                <p className="text-3xl font-black" style={{ color: 'var(--turquoise)', fontFamily: 'var(--display)' }}>100%</p>
                <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>Local y auténtico</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ GRID DE RESTAURANTES ═══ */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-2" style={{ background: 'rgba(245,185,66,0.15)', color: 'var(--gold)' }}>
                Directorio
              </span>
              <h2 className="text-2xl md:text-3xl font-black" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>
                {businesses.length > 0 ? `Los ${businesses.length} mejores lugares para comer` : 'Lugares para comer en Lagos de Moreno'}
              </h2>
            </div>
            <Link
              href="/buscar"
              className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold transition-colors hover:opacity-70"
              style={{ color: 'var(--coral)' }}
            >
              Ver todos
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {businesses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {businesses.map((business, i) => (
                <BusinessCard key={business.id} business={business} showCategory={false} index={i} />
              ))}
            </div>
          ) : (
            <div
              className="rounded-3xl p-12 text-center"
              style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(31,41,55,0.06)', boxShadow: 'var(--shadow-card)' }}
            >
              <span className="text-5xl block mb-4">🍽️</span>
              <h3 className="font-black text-xl mb-2" style={{ color: 'var(--ink)' }}>Pronto más restaurantes</h3>
              <p className="text-sm max-w-md mx-auto mb-6" style={{ color: 'var(--ink-soft)' }}>
                Estamos agregando nuevos restaurantes de Lagos de Moreno. Mientras tanto, explora todo el directorio de SomosLagos.
              </p>
              <Link
                href="/buscar"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all hover:opacity-90"
                style={{ background: 'var(--coral)' }}
              >
                Explorar negocios
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ═══ SEO EXTRA — texto rico en keywords ═══ */}
      <section className="pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="rounded-3xl p-8 md:p-10" style={{ background: 'var(--ink)', color: 'var(--cream)' }}>
            <h2 className="text-2xl md:text-3xl font-black mb-4" style={{ fontFamily: 'var(--display)' }}>
              Comer en Lagos de Moreno: una experiencia de <span style={{ color: 'var(--gold)' }}>Pueblo Mágico</span>
            </h2>
            <div className="space-y-4 text-sm md:text-base leading-relaxed" style={{ color: 'rgba(255,253,248,0.75)' }}>
              <p>
                La <strong className="text-white">comida típica</strong> de Lagos de Moreno es un reflejo de su historia: platillos alteños
                preparados con recetas que pasan de generación en generación. En el centro histórico encontrarás restaurantes con
                vista a los portales, ideales para <strong className="text-white">cenar en Lagos</strong> después de un recorrido por sus plazas.
              </p>
              <p>
                Las <strong className="text-white">taquerías</strong> locales son parada obligada para los visitantes del Pueblo Mágico, y los fines de
                semana los <strong className="text-white">centros nocturnos</strong> y bares del centro se llenan de ambiente. Ya sea que busques un
                desayuno tradicional, una comida corrida o una cena especial, este directorio te conecta directo con cada negocio.
              </p>
              <p>
                Todos los restaurantes aquí listados cuentan con su perfil completo en SomosLagos: horarios de atención, ubicación en el
                mapa, número de teléfono y <strong className="text-white">WhatsApp directo</strong> para hacer tu pedido o reservación en segundos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ BANNER ═══ */}
      <BannerDisplay placement="home_middle" />

      {/* ═══ CTA FINAL ═══ */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div
            className="max-w-4xl mx-auto rounded-3xl p-10 md:p-14 text-center"
            style={{ background: 'linear-gradient(135deg, var(--coral), var(--gold))' }}
          >
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3" style={{ fontFamily: 'var(--display)' }}>
              ¿Tienes un restaurante en Lagos?
            </h2>
            <p className="text-white/85 text-base md:text-lg max-w-xl mx-auto mb-8">
              Registra tu negocio gratis y aparece en la guía gastronómica del Pueblo Mágico. Miles de visitantes te encontrarán.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/registrar-negocio"
                className="inline-flex items-center justify-center px-8 py-4 bg-white font-bold rounded-full transition-all hover:scale-[1.02]"
                style={{ color: 'var(--coral)' }}
              >
                Registrar mi restaurante
              </Link>
              <Link
                href="/planes"
                className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-full border-2 border-white text-white transition-all hover:bg-white/10"
              >
                Ver planes
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
