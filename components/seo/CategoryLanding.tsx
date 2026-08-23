import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TIER_ORDER } from '@/lib/constants'
import BusinessCard from '@/components/shared/BusinessCard'
import BannerDisplay from '@/components/ads/BannerDisplay'
import SectionReveal from '@/components/animations/SectionReveal'
import { StaggerGroup, StaggerItem } from '@/components/animations/StaggerGroup'
import CategorySeoContent from '@/components/seo/CategorySeoContent'

/* ═══════════════════════════════════════════════════════════
   CategoryLanding — landing SEO genérica por keyword
   Reutilizable para /taquerias, /hoteles, /cafeterias, /bares...
   Genera H1, texto SEO, JSON-LD ItemList, breadcrumb y grid.
   ═══════════════════════════════════════════════════════════ */

interface LandingConfig {
  slug: string
  keyword: string            // ej: 'Taquerías'
  title: string              // ej: 'Taquerías y dónde comer tacos en Lagos de Moreno'
  h1: string
  eyebrow: string
  emoji: string
  description: string
  intro: string[]            // párrafos SEO (~150-250 palabras)
  categorySlugs: string[]    // slugs de categorías a incluir
  schemaType: string         // 'Restaurant' | 'Hotel' | 'CafeOrCoffeeShop' | 'BarOrPub'
  schemaCuisine?: string
  heroImage?: string         // imagen de fondo del hero (local /tourism)
}

export default async function CategoryLanding({ config }: { config: LandingConfig }) {
  const supabase = await createClient()

  // Buscar categorías relacionadas
  const { data: cats } = await supabase
    .from('categories')
    .select('id, name, icon, slug')
    .in('slug', config.categorySlugs)

  const catIds = (cats || []).map((c: { id: string }) => c.id)

  let businesses: any[] = []
  if (catIds.length > 0) {
    const { data: raw } = await supabase
      .from('businesses')
      .select(`
        id, name, slug, description, logo_url, cover_url, address, neighborhood, phone,
        subscription_tier, is_featured, business_hours, rating, total_reviews,
        category:categories(id, name, icon)
      `)
      .eq('is_active', true)
      .in('category_id', catIds)
      .order('is_featured', { ascending: false })
      .order('name')
      .limit(60) as { data: any[] | null }

    businesses = raw
      ? [...raw].sort((a, b) => {
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
          const ta = TIER_ORDER[a.subscription_tier] || 0
          const tb = TIER_ORDER[b.subscription_tier] || 0
          if (ta !== tb) return tb - ta
          return a.name.localeCompare(b.name)
        })
      : []
  }

  // Colonias con negocios de esta categoría (para SEO interno)
  const neighborhoods = Array.from(
    new Set((businesses || []).map((b: any) => b.neighborhood).filter(Boolean) as string[])
  )

  // JSON-LD ItemList
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: config.title,
    description: config.description,
    numberOfItems: businesses.length,
    itemListElement: businesses.slice(0, 30).map((biz: any, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': config.schemaType,
        name: biz.name,
        url: `https://www.somoslagos.com.mx/negocios/${biz.slug}`,
        ...(config.schemaCuisine && { servesCuisine: config.schemaCuisine }),
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

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://www.somoslagos.com.mx' },
      { '@type': 'ListItem', position: 2, name: config.keyword, item: `https://www.somoslagos.com.mx/${config.slug}` },
    ],
  }

  return (
    <main className="min-h-screen overflow-x-clip" style={{ background: '#FBF0E5' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* HERO — con fondo parallax de imagen local */}
      <SectionReveal entryY={30} amount={0.4} blur={false}>
        <section className="relative overflow-hidden pt-28 pb-14 md:pt-32 md:pb-16">
          {/* Fondo con imagen de tourism + parallax */}
          <div className="absolute inset-0 z-0">
            <img src={config.heroImage} alt="" aria-hidden className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,15,30,0.55) 0%, rgba(6,15,30,0.55) 60%, #FBF0E5 100%)' }} />
          </div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-5" style={{ background: 'rgba(251,240,229,0.92)', color: 'var(--coral)', boxShadow: '0 2px 12px rgba(6,60,103,0.12)' }}>
                <span className="text-sm">{config.emoji}</span> {config.eyebrow} · Pueblo Mágico
              </span>
              <h1 className="text-4xl md:text-6xl font-black leading-[1.02] tracking-tight mb-5" style={{ fontFamily: 'var(--display)', color: 'white', textShadow: '0 4px 24px rgba(6,15,30,0.5)' }}>
                {config.h1}
              </h1>
              {/* Texto SEO intro */}
              <div className="space-y-4 text-base md:text-lg leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.92)', textShadow: '0 2px 12px rgba(6,15,30,0.4)' }}>
                {config.intro.map((p, i) => (<p key={i} dangerouslySetInnerHTML={{ __html: p }} />))}
              </div>
            </div>
          </div>
        </section>
      </SectionReveal>

      {/* GRID */}
      <SectionReveal>
        <section className="pb-16">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-2" style={{ background: 'rgba(14,155,163,0.12)', color: 'var(--turquoise)' }}>
                  Directorio
                </span>
                <h2 className="text-2xl md:text-3xl font-black" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>
                  {businesses.length > 0 ? `Los ${businesses.length} mejores lugares` : `Lugares de ${config.keyword.toLowerCase()} en Lagos`}
                </h2>
              </div>
            </div>

            {businesses.length > 0 ? (
              <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {businesses.map((b) => (
                  <StaggerItem key={b.id} className="h-full">
                    <BusinessCard business={b} />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            ) : (
              <div className="rounded-3xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(6,60,103,0.06)' }}>
                <span className="text-5xl block mb-4">{config.emoji}</span>
                <h3 className="font-black text-xl mb-2" style={{ color: 'var(--ink)' }}>Pronto más opciones</h3>
                <p className="text-sm max-w-md mx-auto mb-6" style={{ color: 'var(--ink-soft)' }}>
                  Estamos sumando más negocios de {config.keyword.toLowerCase()} en Lagos de Moreno.
                </p>
                <Link href="/buscar" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all hover:opacity-90" style={{ background: 'var(--coral)' }}>
                  Explorar negocios
                </Link>
              </div>
            )}
          </div>
        </section>
      </SectionReveal>

      {/* SEO CONTENT */}
      <SectionReveal>
        <section className="pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <CategorySeoContent
              categoryName={config.keyword}
              categorySlug={config.slug}
              businessCount={businesses.length}
              neighborhoods={neighborhoods}
            />
          </div>
        </section>
      </SectionReveal>

      <BannerDisplay placement="home_middle" />

      {/* CTA */}
      <SectionReveal>
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto rounded-3xl p-10 md:p-14 text-center" style={{ background: 'linear-gradient(135deg, var(--coral), var(--gold))' }}>
              <h2 className="text-3xl md:text-4xl font-black text-white mb-3" style={{ fontFamily: 'var(--display)' }}>
                ¿Tienes un negocio de {config.keyword.toLowerCase()} en Lagos?
              </h2>
              <p className="text-white/85 text-base md:text-lg max-w-xl mx-auto mb-8">
                Regístralo gratis y aparece en la guía del Pueblo Mágico. Miles de visitantes te encontrarán.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/registrar-negocio" className="inline-flex items-center justify-center px-8 py-4 bg-white font-bold rounded-full transition-all hover:scale-[1.02]" style={{ color: 'var(--coral)' }}>
                  Registrar mi negocio
                </Link>
                <Link href="/para-negocios" className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-full border-2 border-white text-white transition-all hover:bg-white/10">
                  Para negocios
                </Link>
              </div>
            </div>
          </div>
        </section>
      </SectionReveal>
    </main>
  )
}
