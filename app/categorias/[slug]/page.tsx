import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { TIER_ORDER } from '@/lib/constants'
import BusinessCard from '@/components/shared/BusinessCard'
import BannerDisplay from '@/components/ads/BannerDisplay'

export const revalidate = 1800

interface PageProps {
  params: Promise<{ slug: string }>
}

interface Category {
  id: string
  name: string
  icon: string | null
  slug: string
  description?: string | null
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('name, slug')
    .eq('slug', slug)
    .single() as unknown as { data: { name: string; slug: string } | null }

  if (!category) {
    return { title: 'Categoria no encontrada' }
  }

  const title = `${category.name} en Lagos de Moreno`
  const description = `Encuentra los mejores ${category.name.toLowerCase()} en Lagos de Moreno, Jalisco. Directorio completo con horarios, ubicacion, opiniones y contacto.`

  return {
    title,
    description,
    openGraph: {
      title: `${category.name} en Lagos de Moreno | SomosLagos`,
      description,
      url: `https://www.somoslagos.com.mx/categorias/${category.slug}`,
    },
  }
}

export async function generateStaticParams() {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: categories } = await supabase
    .from('categories')
    .select('slug')

  return (categories || []).map((cat: { slug: string }) => ({
    slug: cat.slug,
  }))
}

// Generates SEO intro text and FAQ based on category name
function getCategoryContent(name: string, count: number) {
  const n = name.toLowerCase()
  const city = 'Lagos de Moreno, Jalisco'

  const intro = `¿Buscas ${n} en ${city}? En SomosLagos encontrarás ${count > 0 ? `los ${count} negocios de ${n}` : 'negocios de ' + n} más recomendados de la ciudad, con horarios de atención, ubicación exacta en el mapa, número de WhatsApp directo y opiniones reales de clientes locales. Toda la información actualizada en un solo lugar.`

  const faqs = [
    {
      q: `¿Cuántos negocios de ${n} hay en Lagos de Moreno?`,
      a: count > 0
        ? `Actualmente hay ${count} negocio${count !== 1 ? 's' : ''} de ${n} registrado${count !== 1 ? 's' : ''} en SomosLagos. La lista se actualiza en tiempo real conforme se registran nuevos negocios.`
        : `Aún no hay negocios de ${n} registrados en SomosLagos. Si tienes uno, puedes registrarlo gratis y ser el primero en aparecer.`,
    },
    {
      q: `¿Cómo contactar a un negocio de ${n} en Lagos de Moreno?`,
      a: `Desde cada perfil puedes escribirles directamente por WhatsApp con un solo toque, ver su ubicación en el mapa y consultar sus horarios de atención sin necesidad de llamar.`,
    },
    {
      q: `¿Cómo registro mi negocio de ${n} en Lagos de Moreno?`,
      a: `El registro es completamente gratis. Solo entra a SomosLagos, crea tu cuenta y llena la información de tu negocio. En menos de 5 minutos tu negocio aparece en las búsquedas de Lagos de Moreno.`,
    },
  ]

  return { intro, faqs }
}

export default async function CategoriaPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // Get category by slug
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('id, name, icon, slug')
    .eq('slug', slug)
    .single() as unknown as { data: Category | null; error: any }

  if (catError || !category) {
    notFound()
  }

  // Get businesses in this category
  const { data: rawBusinesses } = await supabase
    .from('businesses')
    .select(`
      id, name, slug, description, logo_url, address, neighborhood,
      subscription_tier, is_featured, business_hours, rating, total_reviews,
      category:categories(id, name, icon)
    `)
    .eq('is_active', true)
    .eq('category_id', category.id)
    .order('is_featured', { ascending: false })
    .order('name')
    .limit(60) as { data: Business[] | null }

  // Sort by tier order (avanzado first)
  const businesses = rawBusinesses
    ? [...rawBusinesses].sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
        const tierA = TIER_ORDER[a.subscription_tier] || 0
        const tierB = TIER_ORDER[b.subscription_tier] || 0
        if (tierA !== tierB) return tierB - tierA
        return a.name.localeCompare(b.name)
      })
    : []

  // Get other categories for navigation
  const { data: allCategories } = await supabase
    .from('categories')
    .select('id, name, icon, slug')
    .is('parent_id', null)
    .neq('id', category.id)
    .order('display_order')
    .limit(12) as unknown as { data: Category[] | null }

  // JSON-LD: ItemList
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.name} en Lagos de Moreno`,
    description: `Directorio de ${category.name.toLowerCase()} en Lagos de Moreno, Jalisco.`,
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
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: 'https://www.somoslagos.com.mx',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Categorias',
        item: 'https://www.somoslagos.com.mx/categorias',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: category.name,
        item: `https://www.somoslagos.com.mx/categorias/${category.slug}`,
      },
    ],
  }

  const { intro, faqs } = getCategoryContent(category.name, businesses.length)

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

      {/* ── Hero Section ── */}
      <section
        className="relative overflow-hidden pt-12 pb-14"
        style={{ background: 'var(--ivory)' }}
      >
        {/* Mesh background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              'radial-gradient(ellipse at 10% 50%, rgba(255,107,53,0.08) 0%, transparent 50%)',
              'radial-gradient(ellipse at 85% 15%, rgba(245,185,66,0.07) 0%, transparent 44%)',
              'radial-gradient(ellipse at 60% 95%, rgba(255,107,53,0.05) 0%, transparent 38%)',
            ].join(', '),
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-2 text-sm mb-6"
            style={{ color: 'var(--muted)' }}
          >
            <Link href="/" className="hover:opacity-70 transition-opacity">Inicio</Link>
            <span>/</span>
            <Link href="/categorias" className="hover:opacity-70 transition-opacity">Categorias</Link>
            <span>/</span>
            <span className="font-medium" style={{ color: 'var(--ink)' }}>{category.name}</span>
          </nav>

          {/* Eyebrow */}
          <span
            className="inline-block text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-5"
            style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}
          >
            Lagos de Moreno · {category.name}
          </span>

          {/* Icon + Title row */}
          <div className="flex items-center gap-5 mb-4">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(255,253,248,0.78)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(31,41,55,0.08)',
                boxShadow: '0 2px 20px rgba(31,41,55,0.07)',
              }}
            >
              <span className="text-4xl leading-none">{category.icon || '📁'}</span>
            </div>
            <div>
              <h1
                className="text-3xl md:text-4xl font-black leading-tight mb-1"
                style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
              >
                {category.name}
                <br />
                <span style={{ color: 'var(--coral)' }}>en Lagos de Moreno</span>
              </h1>
              <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
                {businesses.length} negocio{businesses.length !== 1 ? 's' : ''} encontrado{businesses.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* SEO intro */}
          <div className="pueblo-divider my-5" />
          <p
            className="text-sm max-w-3xl leading-relaxed"
            style={{ color: 'var(--muted)' }}
          >
            {intro}
          </p>
        </div>
      </section>

      {/* ── Banner: Categories Top ── */}
      <div className="container mx-auto px-4 pt-2 pb-4">
        <BannerDisplay placement="categories_top" />
      </div>

      {/* ── Business Results ── */}
      <div className="container mx-auto px-4 py-8">
        {businesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} showCategory={false} />
            ))}
          </div>
        ) : (
          /* ── Empty / No results state ── */
          <div
            className="flex flex-col items-center text-center py-20 rounded-3xl"
            style={{
              background: 'rgba(255,253,248,0.78)',
              backdropFilter: 'blur(14px)',
              WebkitBackdropFilter: 'blur(14px)',
              border: '1px solid rgba(31,41,55,0.07)',
              boxShadow: '0 2px 20px rgba(31,41,55,0.07)',
            }}
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ background: 'rgba(255,107,53,0.1)' }}
            >
              <span className="text-5xl">{category.icon || '📁'}</span>
            </div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
            >
              No hay negocios en {category.name}
            </h2>
            <p className="mb-8 max-w-xs" style={{ color: 'var(--muted)' }}>
              Aún no hay negocios registrados en esta categoría. ¡Sé el primero!
            </p>
            <Link
              href="/registrar-negocio"
              className="inline-block px-8 py-3 text-white font-semibold rounded-full transition-all"
              style={{ background: 'linear-gradient(135deg, var(--coral) 0%, var(--coral-deep) 100%)' }}
            >
              Registrar mi negocio gratis
            </Link>
          </div>
        )}

        {/* ── Other Categories ── */}
        {allCategories && allCategories.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-3 mb-5">
              <span
                className="inline-block text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full"
                style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}
              >
                Explorar
              </span>
              <h2
                className="text-lg font-bold"
                style={{ color: 'var(--ink)' }}
              >
                Otras categorías
              </h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {allCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categorias/${cat.slug}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full transition-all text-sm"
                  style={{
                    background: 'rgba(255,253,248,0.78)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid rgba(31,41,55,0.07)',
                    boxShadow: '0 2px 12px rgba(31,41,55,0.06)',
                    color: 'var(--ink)',
                  }}
                >
                  <span>{cat.icon || '📁'}</span>
                  <span className="font-medium">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── FAQ — SEO: People Also Ask ── */}
        <div className="mt-14">
          <div className="flex items-center gap-3 mb-5">
            <span
              className="inline-block text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}
            >
              FAQ
            </span>
            <h2
              className="text-lg font-bold"
              style={{ color: 'var(--ink)' }}
            >
              Preguntas frecuentes sobre {category.name.toLowerCase()} en Lagos de Moreno
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(255,253,248,0.78)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: '1px solid rgba(31,41,55,0.07)',
                  boxShadow: '0 2px 20px rgba(31,41,55,0.07)',
                }}
              >
                <summary
                  className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold transition-colors list-none [&::-webkit-details-marker]:hidden text-sm"
                  style={{ color: 'var(--ink)' }}
                >
                  {faq.q}
                  <svg
                    className="w-4 h-4 group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                    style={{ color: 'var(--muted)' }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div
                  className="px-5 pb-4 text-sm leading-relaxed"
                  style={{ color: 'var(--muted)' }}
                >
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* ── CTA ── */}
        <div
          className="mt-12 rounded-3xl p-8 text-center text-white relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, var(--ink) 0%, var(--terracotta, #C86B4A) 60%, var(--coral) 100%)' }}
        >
          <div
            className="pointer-events-none absolute top-0 right-0 w-40 h-40 rounded-full -translate-y-1/2 translate-x-1/2"
            style={{ background: 'rgba(255,255,255,0.1)', filter: 'blur(40px)' }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 w-36 h-36 rounded-full translate-y-1/2 -translate-x-1/2"
            style={{ background: 'rgba(245,185,66,0.15)', filter: 'blur(36px)' }}
          />
          <div className="relative z-10">
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: 'var(--display)' }}
            >
              ¿Tienes un negocio de {category.name.toLowerCase()}?
            </h2>
            <p className="mb-6" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Regístrate gratis y aparece en esta página
            </p>
            <Link
              href="/registrar-negocio"
              className="inline-block px-8 py-3 font-bold rounded-full transition-colors"
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
