import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { createClient as createAnonClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { TIER_ORDER } from '@/lib/constants'
import BusinessCard from '@/components/shared/BusinessCard'

export const revalidate = 1800

const SUFFIX = '-en-lagos-de-moreno'
const BASE_URL = 'https://www.somoslagos.com.mx'

interface PageProps {
  params: Promise<{ slug: string }>
}

interface Category {
  id: string
  name: string
  icon: string | null
  slug: string
  description: string | null
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

function getCategoryColor(slug: string, name: string): string {
  const key = (slug + ' ' + name).toLowerCase()
  if (/comida|restaur|caf[eé]|bar|antoj/.test(key)) return '#FF6B35'
  if (/hospedaje|hotel|motel|hostal/.test(key)) return '#0D9488'
  if (/servicio|taller|plomer|electr|construc/.test(key)) return '#22C55E'
  if (/turismo|tour|atract|museo|cultura/.test(key)) return '#C86B4A'
  if (/belleza|salud|spa|est[eé]tic|cl[ií]nica|gym|fitness/.test(key)) return '#A855F7'
  return '#F5B942'
}

function getCategoryContent(categoryName: string, count: number) {
  const city = 'Lagos de Moreno, Jalisco'
  const nameLower = categoryName.toLowerCase()

  const intro = `¿Buscas ${nameLower} en ${city}? En SomosLagos encontrarás ${
    count > 0
      ? `los ${count} mejores ${nameLower} de la ciudad`
      : `${nameLower} en la ciudad`
  } con horarios de atención, ubicación en el mapa, contacto directo por WhatsApp y opiniones reales de clientes locales. Directorio actualizado de ${nameLower} en Lagos de Moreno — el Pueblo Mágico de los Altos de Jalisco.`

  const faqs = [
    {
      q: `¿Dónde encuentro los mejores ${nameLower} en Lagos de Moreno?`,
      a: `En SomosLagos tienes el directorio más completo de ${nameLower} en Lagos de Moreno, Jalisco. Cada negocio muestra dirección exacta, horarios de atención, teléfono y WhatsApp para contacto inmediato.`,
    },
    {
      q: `¿Cuántos ${nameLower} hay en Lagos de Moreno?`,
      a: count > 0
        ? `Actualmente hay ${count} ${nameLower} registrado${count !== 1 ? 's' : ''} en SomosLagos. La lista se actualiza conforme se suman nuevos negocios al directorio.`
        : `Pronto habrá ${nameLower} registrados en SomosLagos. Si tienes uno, regístralo gratis y sé el primero en aparecer en las búsquedas locales.`,
    },
    {
      q: `¿Cómo registro mi negocio de ${nameLower} en SomosLagos?`,
      a: `El registro es completamente gratis. Entra a SomosLagos, crea tu cuenta y llena la información de tu negocio. En menos de 5 minutos apareces en las búsquedas de ${nameLower} en Lagos de Moreno y en Google.`,
    },
    {
      q: `¿Lagos de Moreno es Pueblo Mágico?`,
      a: `Sí. Lagos de Moreno es Pueblo Mágico desde 2012 y una de las ciudades más bonitas de los Altos de Jalisco. Es cuna de escritores, famosa por su arquitectura barroca del siglo XVII, la Feria de Lagos en agosto y una vida comercial muy activa.`,
    },
  ]

  return { intro, faqs }
}

export async function generateStaticParams() {
  const supabase = createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data: categories } = await supabase
    .from('categories')
    .select('slug')
    .not('slug', 'is', null)
    .not('slug', 'like', '__hidden__%')

  return (categories || []).map((cat: { slug: string }) => ({
    slug: `${cat.slug}${SUFFIX}`,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  if (!slug.endsWith(SUFFIX)) return { title: 'Página no encontrada' }

  const categorySlug = slug.slice(0, -SUFFIX.length)
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('name, slug')
    .eq('slug', categorySlug)
    .single() as unknown as { data: { name: string; slug: string } | null }

  if (!category) return { title: 'Página no encontrada' }

  const title = `${category.name} en Lagos de Moreno, Jalisco`
  const description = `Los mejores ${category.name.toLowerCase()} en Lagos de Moreno, Jalisco. Directorio completo con horarios, ubicación, WhatsApp y opiniones de clientes. Encuentra y contacta ${category.name.toLowerCase()} en el Pueblo Mágico de Jalisco.`

  return {
    title,
    description,
    openGraph: {
      title: `${category.name} en Lagos de Moreno | SomosLagos`,
      description,
      url: `${BASE_URL}/${slug}`,
    },
    alternates: {
      canonical: `${BASE_URL}/${slug}`,
    },
  }
}

export default async function CategoryKeywordPage({ params }: PageProps) {
  const { slug } = await params

  if (!slug.endsWith(SUFFIX)) notFound()

  const categorySlug = slug.slice(0, -SUFFIX.length)
  const supabase = await createClient()

  const { data: category } = await supabase
    .from('categories')
    .select('id, name, icon, slug, description')
    .eq('slug', categorySlug)
    .single() as unknown as { data: Category | null }

  if (!category) notFound()

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

  const businesses = [...(rawBusinesses || [])].sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
    const tierA = TIER_ORDER[a.subscription_tier] || 0
    const tierB = TIER_ORDER[b.subscription_tier] || 0
    if (tierA !== tierB) return tierB - tierA
    return a.name.localeCompare(b.name)
  })

  const accentColor = getCategoryColor(category.slug, category.name)
  const { intro, faqs } = getCategoryContent(category.name, businesses.length)

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
        url: `${BASE_URL}/negocios/${biz.slug}`,
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
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: 'Categorías', item: `${BASE_URL}/categorias` },
      { '@type': 'ListItem', position: 3, name: category.name, item: `${BASE_URL}/categorias/${category.slug}` },
      { '@type': 'ListItem', position: 4, name: `${category.name} en Lagos de Moreno`, item: `${BASE_URL}/${slug}` },
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden pt-12 pb-14"
        style={{ background: 'var(--ivory)' }}
      >
        {/* Mesh background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              `radial-gradient(ellipse at 10% 50%, ${accentColor}14 0%, transparent 52%)`,
              `radial-gradient(ellipse at 85% 20%, rgba(245,185,66,0.07) 0%, transparent 45%)`,
              `radial-gradient(ellipse at 50% 95%, ${accentColor}0a 0%, transparent 40%)`,
            ].join(', '),
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs mb-6" style={{ color: 'var(--muted)' }}>
            <Link href="/" className="transition-opacity hover:opacity-70">Inicio</Link>
            <span>/</span>
            <Link href="/categorias" className="transition-opacity hover:opacity-70">Categorías</Link>
            <span>/</span>
            <Link href={`/categorias/${category.slug}`} className="transition-opacity hover:opacity-70">{category.name}</Link>
            <span>/</span>
            <span style={{ color: 'var(--ink-soft)' }}>Lagos de Moreno</span>
          </nav>

          <div className="flex items-start gap-5">
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1"
              style={{
                background: `${accentColor}1a`,
                border: `1px solid ${accentColor}33`,
              }}
            >
              <span className="text-3xl leading-none">{category.icon || '📁'}</span>
            </div>

            <div>
              {/* Eyebrow */}
              <span
                className="inline-block text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3"
                style={{ background: `${accentColor}18`, color: accentColor }}
              >
                Lagos de Moreno · Jalisco
              </span>

              {/* H1 — exact keyword */}
              <h1
                className="text-3xl md:text-4xl font-black leading-tight mb-2"
                style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
              >
                {category.name} en Lagos de Moreno
              </h1>

              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {businesses.length > 0
                  ? `${businesses.length} negocio${businesses.length !== 1 ? 's' : ''} encontrado${businesses.length !== 1 ? 's' : ''}`
                  : 'Sé el primero en registrar tu negocio'}
                {' · '}
                <Link href={`/categorias/${category.slug}`} style={{ color: accentColor }} className="hover:underline font-medium">
                  Ver todos en categorías →
                </Link>
              </p>
            </div>
          </div>

          {/* SEO intro paragraph */}
          <p
            className="text-sm leading-relaxed max-w-3xl mt-6 pt-5"
            style={{ color: 'var(--muted)', borderTop: '1px solid rgba(31,41,55,0.08)' }}
          >
            {intro}
          </p>
        </div>
      </section>

      {/* ── Business Grid ── */}
      <div className="container mx-auto px-4 py-8">
        {businesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {businesses.map((business) => (
              <BusinessCard key={business.id} business={business} showCategory={false} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-20">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ background: `${accentColor}18` }}
            >
              <span className="text-5xl">{category.icon || '📁'}</span>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>
              Aún no hay {category.name.toLowerCase()} registrados
            </h2>
            <p className="mb-8 max-w-sm" style={{ color: 'var(--muted)' }}>
              Sé el primero en aparecer cuando alguien busque {category.name.toLowerCase()} en Lagos de Moreno.
            </p>
            <Link
              href="/registrar-negocio"
              className="inline-block px-8 py-3 text-white font-bold rounded-full transition-all hover:opacity-90"
              style={{ background: `linear-gradient(135deg, ${accentColor}, var(--gold))` }}
            >
              Registrar mi negocio gratis
            </Link>
          </div>
        )}
      </div>

      {/* ── FAQ ── */}
      <div className="container mx-auto px-4 pb-10">
        <h2 className="text-xl font-bold mb-5" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>
          Preguntas frecuentes sobre {category.name.toLowerCase()} en Lagos de Moreno
        </h2>
        <div className="space-y-3 max-w-3xl">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl overflow-hidden"
              style={{
                background: 'rgba(255,253,248,0.9)',
                border: '1px solid rgba(31,41,55,0.07)',
                boxShadow: '0 2px 12px rgba(31,41,55,0.06)',
              }}
            >
              <summary
                className="flex items-center justify-between px-5 py-4 cursor-pointer font-semibold text-sm list-none [&::-webkit-details-marker]:hidden transition-colors"
                style={{ color: 'var(--ink)' }}
              >
                {faq.q}
                <svg
                  className="w-4 h-4 group-open:rotate-180 transition-transform flex-shrink-0 ml-4"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  style={{ color: 'var(--muted)' }}
                >
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

      {/* ── Related links ── */}
      <div className="container mx-auto px-4 pb-10">
        <div className="pueblo-divider" />
        <div className="pt-8">
          <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
            También te puede interesar
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { label: 'Todas las categorías', href: '/categorias' },
              { label: `${category.name} — directorio`, href: `/categorias/${category.slug}` },
              { label: 'Buscar negocios', href: '/buscar' },
              { label: 'Qué hacer en Lagos', href: '/que-hacer-en-lagos-de-moreno' },
              { label: 'Registrar mi negocio', href: '/registrar-negocio' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-block text-xs font-medium px-3 py-1.5 rounded-full transition-all hover:opacity-80"
                style={{
                  background: 'rgba(31,41,55,0.06)',
                  color: 'var(--ink-soft)',
                  border: '1px solid rgba(31,41,55,0.1)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ── */}
      <div className="container mx-auto px-4 pb-16">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-10 text-center"
          style={{ background: `linear-gradient(135deg, var(--ink) 0%, ${accentColor}cc 100%)` }}
        >
          <div
            className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
            style={{ background: 'var(--gold)', filter: 'blur(48px)' }}
          />
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'var(--display)' }}>
              ¿Tienes un negocio de {category.name.toLowerCase()} en Lagos de Moreno?
            </h2>
            <p className="mb-7 max-w-sm mx-auto text-sm" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Regístrate gratis y aparece cuando alguien busque {category.name.toLowerCase()} en Google y en SomosLagos.
            </p>
            <Link
              href="/registrar-negocio"
              className="inline-block px-8 py-3 font-bold rounded-full transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: 'var(--gold)', color: 'var(--ink)' }}
            >
              Registrar mi negocio GRATIS
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
