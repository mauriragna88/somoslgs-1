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
  params: { slug: string }
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
  const supabase = createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('name, slug')
    .eq('slug', params.slug)
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
  const supabase = createClient()

  // Get category by slug
  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('id, name, icon, slug')
    .eq('slug', params.slug)
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
    <main className="min-h-screen pueblo-shell">
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
      <div className="bg-gradient-to-b from-pueblo-crema via-pueblo-crema/80 to-transparent border-b border-pueblo-canteraLight/30 py-8">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-pueblo-terracotta/60 mb-4">
            <Link href="/" className="hover:text-pueblo-cantera transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/categorias" className="hover:text-pueblo-cantera transition-colors">Categorias</Link>
            <span>/</span>
            <span className="text-pueblo-noche font-medium">{category.name}</span>
          </nav>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-pueblo-canteraLight/50 to-pueblo-barroco/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">{category.icon || '📁'}</span>
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-pueblo-noche">
                {category.name} en Lagos de Moreno
              </h1>
              <p className="text-pueblo-terracotta/70">
                {businesses.length} negocio{businesses.length !== 1 ? 's' : ''} encontrado{businesses.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* SEO intro paragraph */}
          <div className="pueblo-divider mb-4"></div>
          <p className="text-sm text-pueblo-terracotta/70 max-w-3xl leading-relaxed">
            {intro}
          </p>
        </div>
      </div>

      {/* Banner: Categories Top */}
      <div className="container mx-auto px-4 pt-6">
        <BannerDisplay placement="categories_top" />
      </div>

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        {businesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} showCategory={false} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-pueblo-canteraLight/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">{category.icon || '📁'}</span>
            </div>
            <h2 className="text-2xl font-bold text-pueblo-noche mb-2">
              No hay negocios en {category.name}
            </h2>
            <p className="text-pueblo-terracotta/60 mb-6">
              Aun no hay negocios registrados en esta categoria
            </p>
            <Link
              href="/registrar-negocio"
              className="inline-block px-6 py-3 bg-gradient-to-r from-pueblo-cantera to-pueblo-terracotta text-pueblo-crema font-semibold rounded-xl hover:shadow-pueblo-soft transition-all"
            >
              Registrar mi negocio
            </Link>
          </div>
        )}

        {/* Other Categories */}
        {allCategories && allCategories.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold text-pueblo-noche mb-4">Otras categorias</h2>
            <div className="flex flex-wrap gap-3">
              {allCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/categorias/${cat.slug}`}
                  className="flex items-center gap-2 px-4 py-2.5 pueblo-card rounded-full hover:shadow-pueblo-soft transition-all text-sm"
                >
                  <span>{cat.icon || '📁'}</span>
                  <span className="font-medium text-pueblo-noche hover:text-pueblo-cantera">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* FAQ — SEO: People Also Ask */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-pueblo-noche mb-4">
            Preguntas frecuentes sobre {category.name.toLowerCase()} en Lagos de Moreno
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group pueblo-card rounded-xl overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-pueblo-noche hover:text-pueblo-cantera transition-colors list-none [&::-webkit-details-marker]:hidden text-sm">
                  {faq.q}
                  <svg className="w-4 h-4 text-pueblo-terracotta/50 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-pueblo-terracotta/70 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-pueblo-noche via-pueblo-terracotta to-pueblo-cantera rounded-2xl p-8 text-center text-pueblo-crema relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-pueblo-barroco/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative">
            <h2 className="text-2xl font-bold mb-2">¿Tienes un negocio de {category.name.toLowerCase()}?</h2>
            <p className="text-pueblo-crema/80 mb-6">
              Registrate gratis y aparece en esta pagina
            </p>
            <Link
              href="/registrar-negocio"
              className="inline-block px-8 py-3 bg-pueblo-barroco text-pueblo-noche font-bold rounded-full hover:bg-pueblo-barroco/90 transition-colors shadow-pueblo-soft"
            >
              Registrar mi Negocio GRATIS
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
