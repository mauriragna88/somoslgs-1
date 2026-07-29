import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import LocalPageClickTracker from '@/components/local-pages/LocalPageClickTracker'

// Inline tracker para visualizaciones de local pages
function LocalPageViewTracker({ localPageId }: { localPageId: string }) {
  if (typeof window !== 'undefined') {
    fetch('/api/local-pages/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localPageId }),
    }).catch(() => {})
  }
  return null
}
import type { BusinessHours } from '@/lib/constants'

export const revalidate = 3600

interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()

  const { data: page } = await supabase
    .from('local_pages')
    .select('title, h1, meta_description, slug')
    .eq('slug', slug)
    .eq('status', 'published')
    .single() as { data: { title: string; h1: string; meta_description: string; slug: string } | null }

  if (!page) return { title: 'Pagina no encontrada' }

  return {
    title: page.title,
    description: page.meta_description,
    alternates: {
      canonical: `https://www.somoslagos.com.mx/locales/${page.slug}`,
    },
    openGraph: {
      title: `${page.h1} | SomosLagos`,
      description: page.meta_description,
      type: 'article',
      url: `https://www.somoslagos.com.mx/locales/${page.slug}`,
    },
  }
}

interface BusinessCard {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  address: string | null
  neighborhood: string | null
  phone: string
  whatsapp: string | null
  business_hours: BusinessHours | null
  rating: number
  total_reviews: number
  subscription_tier: string
  is_featured: boolean
  category: { name: string; icon: string | null } | null
}

interface LocalPage {
  id: string
  slug: string
  h1: string
  intro: string | null
  body_markdown: string | null
  category_slug: string | null
  zone_filter: string | null
  featured_image_url: string | null
}

export default async function LocalPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // 1. Obtener la pagina local
  const { data: pageData } = await supabase
    .from('local_pages')
    .select('id, slug, h1, intro, body_markdown, category_slug, zone_filter, featured_image_url')
    .eq('slug', slug)
    .eq('status', 'published')
    .single() as { data: LocalPage | null }

  if (!pageData) notFound()

  // 2. Buscar la categoria por slug
  let categoryId: string | null = null
  if (pageData.category_slug) {
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', pageData.category_slug)
      .single() as { data: { id: string } | null }
    categoryId = cat?.id ?? null
  }

  // 3. Obtener negocios relevantes (filtro: category_id, neighborhood)
  let businesses: BusinessCard[] = []
  if (categoryId) {
    let query = supabase
      .from('businesses')
      .select(`
        id, name, slug, description, logo_url, cover_url, address, neighborhood,
        phone, whatsapp, business_hours, rating, total_reviews,
        subscription_tier, is_featured,
        category:categories(name, icon)
      `)
      .eq('is_active', true)
      .eq('category_id', categoryId)
      .order('is_featured', { ascending: false })
      .order('rating', { ascending: false })
      .limit(24)

    if (pageData.zone_filter) {
      query = query.eq('neighborhood', pageData.zone_filter)
    }

    const { data } = await query as { data: BusinessCard[] | null }
    businesses = data || []
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--ivory)' }}>
      <LocalPageViewTracker localPageId={pageData.id} />

      {/* Hero */}
      <section
        className="relative py-16 md:py-20 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--ink) 0%, var(--coral) 100%)',
        }}
      >
        <div className="absolute inset-0 bg-black/20" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span
            className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full mb-5"
            style={{ background: 'rgba(245, 185, 66, 0.2)', color: 'var(--gold)' }}
          >
            Guia local
          </span>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 leading-tight"
            style={{ fontFamily: 'var(--display)' }}
          >
            {pageData.h1}
          </h1>
          {pageData.intro && (
            <p className="text-lg text-white/85 max-w-2xl mx-auto">
              {pageData.intro}
            </p>
          )}
        </div>
      </section>

      {/* Body markdown */}
      {pageData.body_markdown && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4 max-w-3xl">
            <article className="prose prose-lg max-w-none" style={{ color: 'var(--ink-soft)' }}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
              >
                {pageData.body_markdown}
              </ReactMarkdown>
            </article>
          </div>
        </section>
      )}

      {/* Lista de negocios */}
      <section className="py-12" style={{ background: 'var(--cream)' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2
              className="text-3xl md:text-4xl font-black mb-2"
              style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
            >
              {businesses.length} {businesses.length === 1 ? 'opcion encontrada' : 'opciones encontradas'}
            </h2>
            <p style={{ color: 'var(--muted)' }}>
              Información de contacto y ubicación de cada negocio
            </p>
          </div>

          {businesses.length === 0 ? (
            <div className="text-center py-12">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(245, 185, 66, 0.1)' }}
              >
                <span className="text-3xl">🔍</span>
              </div>
              <p style={{ color: 'var(--muted)' }}>
                Estamos agregando más negocios a esta guía. Vuelve pronto.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
              {businesses.map((business) => (
                <LocalPageClickTracker
                  key={business.id}
                  localPageId={pageData.id}
                  businessId={business.id}
                >
                  <Link
                    href={`/negocios/${business.slug}`}
                    className="block bg-white rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-xl"
                    style={{
                      border: '1px solid var(--hairline)',
                      boxShadow: 'var(--shadow-card)',
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {business.logo_url ? (
                        <img
                          src={business.logo_url}
                          alt={business.name}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(255, 107, 53, 0.1)' }}
                        >
                          <span className="text-xl">🏪</span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3
                          className="font-bold text-base mb-1 truncate"
                          style={{ color: 'var(--ink)' }}
                        >
                          {business.name}
                        </h3>
                        {business.category && (
                          <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            {business.category.icon} {business.category.name}
                          </p>
                        )}
                      </div>
                      {business.is_featured && (
                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--gold)', color: 'var(--ink)' }}
                        >
                          Destacado
                        </span>
                      )}
                    </div>

                    {business.description && (
                      <p
                        className="text-sm mb-3 line-clamp-2"
                        style={{ color: 'var(--ink-soft)' }}
                      >
                        {business.description}
                      </p>
                    )}

                    <div className="space-y-1.5 text-xs" style={{ color: 'var(--muted)' }}>
                      {business.neighborhood && (
                        <p className="flex items-center gap-1.5">
                          <span>📍</span>
                          <span className="truncate">{business.neighborhood}</span>
                        </p>
                      )}
                      {business.whatsapp && (
                        <p className="flex items-center gap-1.5">
                          <span>💬</span>
                          <span className="truncate">WhatsApp disponible</span>
                        </p>
                      )}
                      {business.rating > 0 && (
                        <p className="flex items-center gap-1.5">
                          <span>⭐</span>
                          <span>{business.rating.toFixed(1)} ({business.total_reviews})</span>
                        </p>
                      )}
                    </div>
                  </Link>
                </LocalPageClickTracker>
              ))}
            </div>
          )}

          {businesses.length > 0 && (
            <div className="text-center mt-8">
              <Link
                href="/buscar"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm text-white transition-all hover:opacity-90"
                style={{ background: 'var(--coral)' }}
              >
                Ver todas las opciones
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA final */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div
            className="max-w-3xl mx-auto rounded-3xl px-8 py-10 text-center"
            style={{
              background: 'linear-gradient(135deg, var(--ink) 0%, var(--coral-deep) 100%)',
            }}
          >
            <h2
              className="text-2xl md:text-3xl font-extrabold text-white mb-3"
              style={{ fontFamily: 'var(--display)' }}
            >
              ¿Tienes un negocio?
            </h2>
            <p className="text-white/80 mb-6">
              Reclama tu perfil gratis y aparece en esta guía y en todo el directorio de Lagos de Moreno.
            </p>
            <Link
              href="/registrar-negocio"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-base transition-all hover:scale-105"
              style={{ background: 'var(--gold)', color: 'var(--ink)' }}
            >
              Registrar mi negocio gratis
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
