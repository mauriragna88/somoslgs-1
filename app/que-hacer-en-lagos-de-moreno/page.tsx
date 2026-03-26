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
    <main className="min-h-screen bg-surface">
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

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background photo */}
        <Image
          src="/tourism/templo-calvario.jpg"
          alt="Templo del Calvario, Lagos de Moreno"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

        <div className="relative container mx-auto px-4 py-20 md:py-28">
          {/* Breadcrumb */}
          <nav className="mb-8" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm text-white/60">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
              </li>
              <li>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </li>
              <li className="text-white/90 font-medium">Qué Hacer</li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <span className="inline-block px-4 py-1.5 bg-accent/20 text-accent text-sm font-semibold rounded-full mb-6">
              Pueblo Mágico de Jalisco
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-6">
              Qué Hacer en{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-light to-accent">
                Lagos de Moreno
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 leading-relaxed max-w-2xl">
              Tu guía completa para descubrir los mejores lugares, actividades y experiencias en Lagos de Moreno.
              Explora este Pueblo Mágico y conoce los negocios locales que lo hacen especial.
            </p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-10">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3">
              <span className="text-2xl">🏛️</span>
              <div>
                <p className="text-xl font-bold text-white">{ZONES.length}</p>
                <p className="text-xs text-white/70">Lugares Emblemáticos</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-xl font-bold text-white">{ACTIVITIES.length}</p>
                <p className="text-xs text-white/70">Actividades</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-3">
              <span className="text-2xl">🏪</span>
              <div>
                <p className="text-xl font-bold text-white">{totalBusinesses || 0}+</p>
                <p className="text-xs text-white/70">Negocios Locales</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L48 55C96 50 192 40 288 35C384 30 480 30 576 33.3C672 36.7 768 43.3 864 45C960 46.7 1056 43.3 1152 40C1248 36.7 1344 33.3 1392 31.7L1440 30V60H1392C1344 60 1248 60 1152 60C1056 60 960 60 864 60C768 60 672 60 576 60C480 60 384 60 288 60C192 60 96 60 48 60H0Z" fill="#F8FAFC"/>
          </svg>
        </div>
      </section>

      {/* Intro SEO */}
      <section className="py-12 bg-surface">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-gray-600 leading-relaxed text-lg">
              Lagos de Moreno es un <strong>Pueblo Mágico de Jalisco</strong> que te espera con sus calles
              empedradas, arquitectura colonial y una rica tradición cultural. Declarado <strong>Patrimonio
              de la Humanidad por la UNESCO</strong> en 2010, este destino te ofrece historia, gastronomía,
              arte y la calidez de su gente. Aquí encontrarás todo lo que necesitas para planear tu visita
              y descubrir los negocios locales que hacen de Lagos un lugar único.
            </p>
          </div>
        </div>
      </section>

      {/* Video de Lagos de Moreno */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4">
              Conoce Lagos
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-3">
              Un vistazo a nuestra ciudad
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Lagos de Moreno en imágenes — Pueblo Mágico de Jalisco
            </p>
          </div>
          <LagosVideoPlayer />
        </div>
      </section>

      {/* Zonas Emblemáticas */}
      <section className="py-16 bg-surface">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4">
              Imperdibles
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-3">
              Lugares Emblemáticos para Visitar
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
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

      {/* Actividades y Experiencias */}
      <section className="py-16 bg-surface">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent-dark text-sm font-semibold rounded-full mb-4">
              Experiencias
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-3">
              Actividades y Experiencias
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
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

      {/* CTA — Registrar negocio */}
      <section className="py-20 bg-gradient-to-br from-primary via-primary-dark to-secondary relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <span className="text-5xl mb-6 block">🏪</span>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Tienes un negocio en Lagos de Moreno?
          </h2>
          <p className="text-white/80 text-lg max-w-xl mx-auto mb-8">
            Registra tu negocio gratis en SomosLagos y aparece en nuestra guía turística.
            Miles de visitantes descubrirán lo que ofreces.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/registrar-negocio"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary font-bold rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
            >
              Registrar mi Negocio GRATIS
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link
              href="/buscar"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-bold rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300"
            >
              Explorar Negocios
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
