import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import ZoneCard from '@/components/tourism/ZoneCard'
import ActivityCard from '@/components/tourism/ActivityCard'
import LagosVideoPlayer from '@/components/tourism/video/LagosVideoPlayer'
import { ACTIVITIES, ZONES, TOURISM_SEO } from '@/lib/tourism'

export const revalidate = 1800

export const metadata: Metadata = {
  title: TOURISM_SEO.title,
  description: TOURISM_SEO.description,
  keywords: TOURISM_SEO.keywords,
  openGraph: {
    title: TOURISM_SEO.title,
    description: TOURISM_SEO.description,
    url: 'https://www.somoslagos.com.mx/que-hacer-en-lagos-de-moreno',
    type: 'website',
    locale: 'es_MX',
  },
  twitter: {
    card: 'summary_large_image',
    title: TOURISM_SEO.title,
    description: TOURISM_SEO.description,
  },
}

export default async function QueHacerPage() {
  const supabase = createClient()

  // Obtener todas las categorías para mapear slugs → IDs
  const { data: allCategories } = await supabase
    .from('categories')
    .select('id, name, slug, icon')

  const categoryMap = new Map(
    (allCategories || []).map((cat: any) => [cat.slug, cat])
  )

  // Para cada actividad con categorías relacionadas, buscar negocios
  const activitiesWithBusinesses = await Promise.all(
    ACTIVITIES.map(async (activity) => {
      if (activity.relatedCategories.length === 0) {
        return { activity, businesses: [], primarySlug: null }
      }

      const categoryIds = activity.relatedCategories
        .map((slug) => categoryMap.get(slug)?.id)
        .filter(Boolean) as string[]

      if (categoryIds.length === 0) {
        return { activity, businesses: [], primarySlug: null }
      }

      const { data: businesses } = await supabase
        .from('businesses')
        .select(`
          id, name, slug, description, logo_url, address, neighborhood,
          subscription_tier, is_featured, business_hours, rating, total_reviews,
          category:categories(id, name, icon)
        `)
        .eq('is_active', true)
        .in('category_id', categoryIds)
        .order('is_featured', { ascending: false })
        .limit(4)

      return {
        activity,
        businesses: businesses || [],
        primarySlug: activity.relatedCategories[0],
      }
    })
  )

  // Contar negocios activos totales
  const { count: totalBusinesses } = await supabase
    .from('businesses')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  // JSON-LD: TouristDestination
  const touristDestinationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    name: 'Lagos de Moreno',
    description: 'Lagos de Moreno es un Pueblo Mágico de Jalisco, México, con rica historia colonial, arquitectura barroca, gastronomía tradicional y tradiciones culturales únicas.',
    url: 'https://www.somoslagos.com.mx/que-hacer-en-lagos-de-moreno',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Lagos de Moreno',
      addressRegion: 'Jalisco',
      addressCountry: 'MX',
    },
    touristType: ['Turismo cultural', 'Turismo religioso', 'Gastronomía', 'Pueblo Mágico'],
    publicAccess: true,
  }

  // JSON-LD: ItemList de actividades
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Qué Hacer en Lagos de Moreno',
    description: 'Actividades y experiencias en Lagos de Moreno, Jalisco',
    numberOfItems: ACTIVITIES.length + ZONES.length,
    itemListElement: [
      ...ACTIVITIES.map((a, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Thing',
          name: a.title,
          description: a.description,
        },
      })),
      ...ZONES.map((z, i) => ({
        '@type': 'ListItem',
        position: ACTIVITIES.length + i + 1,
        item: {
          '@type': 'LandmarksOrHistoricalBuildings',
          name: z.name,
          description: z.description,
          ...(z.coordinates && {
            geo: {
              '@type': 'GeoCoordinates',
              latitude: z.coordinates.lat,
              longitude: z.coordinates.lng,
            },
          }),
        },
      })),
    ],
  }

  // JSON-LD: BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: 'https://www.somoslagos.com.mx',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Qué Hacer en Lagos de Moreno',
      },
    ],
  }

  return (
    <main className="min-h-screen bg-[var(--ivory)]">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(touristDestinationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden" style={{ minHeight: '520px' }}>
        {/* Background photo */}
        <Image
          src="/tourism/templo-calvario.jpg"
          alt="Templo del Calvario, Lagos de Moreno"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Warm layered overlay — darker at top and bottom for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--ink)]/85 via-[var(--ink)]/55 to-[var(--ink)]/90" />
        {/* Warm coral tint layer */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[var(--terracotta)]/30 via-transparent to-[var(--gold)]/15" />

        <div className="relative container mx-auto px-4 py-20 md:py-28">
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-white/60">
              <li>
                <Link href="/" className="hover:text-[var(--gold)] transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </li>
              <li className="text-[var(--gold)] font-medium">Qué Hacer</li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <span className="pueblo-eyebrow inline-block px-4 py-1.5 text-xs font-semibold rounded-full mb-6 bg-white/12 border-white/25 text-white">
              Pueblo Mágico · Jalisco
            </span>
            <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Qué Hacer en{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--gold)] to-[var(--coral)]">
                Lagos de Moreno
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/85 leading-relaxed max-w-2xl">
              Tu guía completa para descubrir los mejores lugares, actividades y experiencias en Lagos de Moreno.{' '}
              <em className="font-[family-name:var(--font-serif)] not-italic">
                Explora este Pueblo Mágico y conoce los negocios locales que lo hacen especial.
              </em>
            </p>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mt-10">
            <div className="flex items-center gap-3 bg-[var(--gold)]/15 backdrop-blur-sm border border-[var(--gold)]/25 rounded-2xl px-5 py-3">
              <svg className="w-6 h-6 text-[var(--gold)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <div>
                <p className="text-xl font-bold text-[var(--gold)]">{ZONES.length}</p>
                <p className="text-xs text-white/70">Lugares Emblemáticos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[var(--coral)]/15 backdrop-blur-sm border border-[var(--coral)]/25 rounded-2xl px-5 py-3">
              <svg className="w-6 h-6 text-[var(--coral)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
              <div>
                <p className="text-xl font-bold text-[var(--coral)]">{ACTIVITIES.length}</p>
                <p className="text-xs text-white/70">Actividades</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-[var(--green)]/15 backdrop-blur-sm border border-[var(--green)]/25 rounded-2xl px-5 py-3">
              <svg className="w-6 h-6 text-[var(--green)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <div>
                <p className="text-xl font-bold text-[var(--green)]">{totalBusinesses || 0}+</p>
                <p className="text-xs text-white/70">Negocios Locales</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider into warm ivory */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L48 55C96 50 192 40 288 35C384 30 480 30 576 33.3C672 36.7 768 43.3 864 45C960 46.7 1056 43.3 1152 40C1248 36.7 1344 33.3 1392 31.7L1440 30V60H1392C1344 60 1248 60 1152 60C1056 60 960 60 864 60C768 60 672 60 576 60C480 60 384 60 288 60C192 60 96 60 48 60H0Z" fill="#FFFDF8"/>
          </svg>
        </div>
      </section>

      {/* ── Intro SEO ── */}
      <section className="py-14">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[var(--ink-soft)] leading-relaxed text-lg">
              Lagos de Moreno es un{' '}
              <strong className="text-[var(--terracotta)]">Pueblo Mágico de Jalisco</strong>{' '}
              que te espera con sus calles empedradas, arquitectura colonial y una rica tradición cultural.
              Declarado{' '}
              <strong className="text-[var(--ink)]">Patrimonio de la Humanidad por la UNESCO</strong>{' '}
              en 2010, este destino te ofrece historia, gastronomía, arte y la calidez de su gente.
              Aquí encontrarás todo lo que necesitas para planear tu visita y descubrir los negocios
              locales que hacen de Lagos un lugar único.
            </p>
          </div>
        </div>
      </section>

      <div className="pueblo-divider mx-auto max-w-4xl" />

      {/* ── Video de Lagos de Moreno ── */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <span className="pueblo-eyebrow inline-block px-4 py-1.5 text-xs font-semibold rounded-full mb-4">
              Conoce Lagos
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-[var(--ink)] mb-3">
              Un vistazo a nuestra ciudad
            </h2>
            <p className="text-[var(--muted)] max-w-xl mx-auto">
              Lagos de Moreno en imágenes — Pueblo Mágico de Jalisco
            </p>
          </div>
          <LagosVideoPlayer />
        </div>
      </section>

      <div className="pueblo-divider mx-auto max-w-4xl" />

      {/* ── Zonas Emblemáticas ── */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="pueblo-eyebrow inline-block px-4 py-1.5 text-xs font-semibold rounded-full mb-4">
              Imperdibles
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-[var(--ink)] mb-3">
              Lugares Emblemáticos para Visitar
            </h2>
            <p className="text-[var(--muted)] max-w-xl mx-auto">
              Los rincones más icónicos de Lagos de Moreno que no te puedes perder
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {ZONES.map((zone) => (
              <ZoneCard key={zone.id} zone={zone} />
            ))}
          </div>
        </div>
      </section>

      <div className="pueblo-divider mx-auto max-w-4xl" />

      {/* ── Actividades y Experiencias ── */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="pueblo-eyebrow inline-block px-4 py-1.5 text-xs font-semibold rounded-full mb-4">
              Experiencias
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-[var(--ink)] mb-3">
              Actividades y Experiencias
            </h2>
            <p className="text-[var(--muted)] max-w-xl mx-auto">
              Todo lo que puedes hacer en Lagos de Moreno, acompañado de los mejores negocios locales
            </p>
          </div>

          <div className="space-y-8 max-w-5xl mx-auto">
            {activitiesWithBusinesses.map(({ activity, businesses, primarySlug }) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                businesses={businesses}
                categorySlug={primarySlug || undefined}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — Registrar negocio ── */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-r from-[var(--ink)] via-[var(--terracotta)] to-[var(--coral)]">
        {/* Decorative blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-[var(--gold)]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-[var(--coral)]/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <span className="pueblo-eyebrow inline-block px-4 py-1.5 text-xs font-semibold rounded-full mb-6 bg-white/15 border-white/25 text-white">
            Para negocios locales
          </span>
          <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Tienes un negocio en Lagos de Moreno?
          </h2>
          <p className="text-white/80 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
            Registra tu negocio gratis en SomosLagos y aparece en nuestra guía turística.
            Miles de visitantes descubrirán lo que ofreces.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/registrar-negocio"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--gold)] text-[var(--ink)] px-8 py-4 font-bold text-base hover:bg-[var(--gold-deep)] transition-colors shadow-lg"
            >
              Registrar mi Negocio GRATIS
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/buscar"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 text-white px-8 py-4 font-bold text-base hover:bg-white/10 transition-colors"
            >
              Explorar Negocios
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
