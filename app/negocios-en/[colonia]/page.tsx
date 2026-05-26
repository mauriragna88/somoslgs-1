import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { TIER_ORDER } from '@/lib/constants'
import BusinessCard from '@/components/shared/BusinessCard'

export const revalidate = 1800

interface PageProps {
  params: { colonia: string }
}

interface Business {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  address: string | null
  neighborhood: string | null
  subscription_tier: string
  is_featured: boolean
  business_hours: any
  rating: number
  total_reviews: number
  category: { id: string; name: string; icon: string } | null
}

export async function generateStaticParams() {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: businesses } = await supabase
    .from('businesses')
    .select('neighborhood')
    .eq('is_active', true)
    .not('neighborhood', 'is', null)

  const unique = Array.from(
    new Set(
      (businesses || [])
        .map((b: { neighborhood: string | null }) => b.neighborhood)
        .filter(Boolean) as string[]
    )
  )

  return unique.map((colonia) => ({ colonia }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const colonia = decodeURIComponent(params.colonia)
  const title = `Negocios en ${colonia}, Lagos de Moreno`
  const description = `Directorio de negocios en ${colonia}, Lagos de Moreno, Jalisco. Encuentra restaurantes, tiendas, servicios y más con horarios, ubicación y contacto directo.`

  return {
    title,
    description,
    openGraph: {
      title: `${title} | SomosLagos`,
      description,
      url: `https://www.somoslagos.com.mx/negocios-en/${params.colonia}`,
    },
  }
}

function getColoniaContent(colonia: string, count: number) {
  const city = 'Lagos de Moreno, Jalisco'

  const intro = `¿Buscas negocios en ${colonia}, ${city}? En SomosLagos encontrarás ${
    count > 0
      ? `los ${count} negocios activos en esta zona`
      : 'negocios de esta zona'
  } con horarios de atención, ubicación en el mapa, WhatsApp directo y opiniones reales de clientes locales.`

  const faqs = [
    {
      q: `¿Cuántos negocios hay en ${colonia}, Lagos de Moreno?`,
      a:
        count > 0
          ? `Actualmente hay ${count} negocio${count !== 1 ? 's' : ''} registrado${count !== 1 ? 's' : ''} en ${colonia} dentro de SomosLagos. La lista se actualiza conforme se registran nuevos negocios.`
          : `Aún no hay negocios registrados en ${colonia}. Si tienes uno, puedes registrarlo gratis y ser el primero en aparecer.`,
    },
    {
      q: `¿Cómo encuentro un negocio cerca de ${colonia}?`,
      a: `Usa el buscador de SomosLagos o navega por categorías. Cada negocio muestra su dirección exacta y puedes abrirlo en Google Maps con un toque.`,
    },
    {
      q: `¿Cómo registro mi negocio en ${colonia}, Lagos de Moreno?`,
      a: `El registro es completamente gratis. Entra a SomosLagos, crea tu cuenta y llena la información de tu negocio. En menos de 5 minutos apareces en las búsquedas locales.`,
    },
  ]

  return { intro, faqs }
}

export default async function NegociosEnColoniaPage({ params }: PageProps) {
  const colonia = decodeURIComponent(params.colonia)
  const supabase = createClient()

  const { data: rawBusinesses } = await supabase
    .from('businesses')
    .select(`
      id, name, slug, description, logo_url, address, neighborhood,
      subscription_tier, is_featured, business_hours, rating, total_reviews,
      category:categories(id, name, icon)
    `)
    .eq('is_active', true)
    .eq('neighborhood', colonia)
    .order('is_featured', { ascending: false })
    .order('name')
    .limit(60) as { data: Business[] | null }

  if (!rawBusinesses) {
    notFound()
  }

  const businesses = [...rawBusinesses].sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
    const tierA = TIER_ORDER[a.subscription_tier] || 0
    const tierB = TIER_ORDER[b.subscription_tier] || 0
    if (tierA !== tierB) return tierB - tierA
    return a.name.localeCompare(b.name)
  })

  const { intro, faqs } = getColoniaContent(colonia, businesses.length)

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Negocios en ${colonia}, Lagos de Moreno`,
    description: `Directorio de negocios en ${colonia}, Lagos de Moreno, Jalisco.`,
    numberOfItems: businesses.length,
    itemListElement: businesses.slice(0, 20).map((biz, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        name: biz.name,
        url: `https://www.somoslagos.com.mx/negocios/${biz.slug}`,
        ...(biz.address && {
          address: {
            '@type': 'PostalAddress',
            streetAddress: biz.address,
            addressLocality: 'Lagos de Moreno',
            addressRegion: 'Jalisco',
            addressCountry: 'MX',
          },
        }),
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

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.somoslagos.com.mx' },
      { '@type': 'ListItem', position: 2, name: 'Negocios por zona', item: 'https://www.somoslagos.com.mx/buscar' },
      { '@type': 'ListItem', position: 3, name: colonia, item: `https://www.somoslagos.com.mx/negocios-en/${params.colonia}` },
    ],
  }

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faq.a },
    })),
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--ivory)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Header */}
      <div className="bg-white py-8" style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-4" style={{ color: 'var(--muted)' }}>
            <Link href="/" className="transition-opacity hover:opacity-70">Inicio</Link>
            <span>/</span>
            <Link href="/buscar" className="transition-opacity hover:opacity-70">Negocios por zona</Link>
            <span>/</span>
            <span className="font-medium" style={{ color: 'var(--ink)' }}>{colonia}</span>
          </nav>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(245,185,66,0.1))' }}>
              <span className="text-2xl">📍</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--ink)' }}>
                Negocios en {colonia}, Lagos de Moreno
              </h1>
              <p style={{ color: 'var(--muted)' }}>
                {businesses.length} negocio{businesses.length !== 1 ? 's' : ''} encontrado{businesses.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* SEO intro */}
          <p className="text-sm max-w-3xl leading-relaxed pt-4" style={{ color: 'var(--muted)', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
            {intro}
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        {businesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} showCategory />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--cream)' }}>
              <span className="text-5xl">📍</span>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--ink)' }}>
              No hay negocios en {colonia}
            </h2>
            <p className="mb-6" style={{ color: 'var(--muted)' }}>
              Aun no hay negocios registrados en esta zona
            </p>
            <Link
              href="/registrar-negocio"
              className="inline-block px-6 py-3 text-white font-semibold rounded-lg transition-colors"
              style={{ background: 'var(--coral)' }}
            >
              Registrar mi negocio
            </Link>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--ink)' }}>
            Preguntas frecuentes sobre negocios en {colonia}
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group bg-white rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold transition-colors list-none [&::-webkit-details-marker]:hidden text-sm" style={{ color: 'var(--ink)' }}>
                  {faq.q}
                  <svg className="w-4 h-4 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--muted)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 rounded-2xl p-8 text-center text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--coral), #E2541F)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" style={{ background: 'rgba(255,255,255,0.1)' }}></div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-2">¿Tienes un negocio en {colonia}?</h2>
            <p className="text-white/80 mb-6">Registrate gratis y aparece en esta pagina</p>
            <Link
              href="/registrar-negocio"
              className="inline-block px-8 py-3 font-bold rounded-full transition-colors shadow-lg"
              style={{ background: 'var(--gold)', color: 'var(--ink)' }}
            >
              Registrar mi Negocio GRATIS
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
