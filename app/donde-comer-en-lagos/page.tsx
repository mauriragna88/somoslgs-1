import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { TIER_ORDER } from '@/lib/constants'
import BusinessCard from '@/components/shared/BusinessCard'
import SectionReveal from '@/components/animations/SectionReveal'
import { StaggerGroup, StaggerItem } from '@/components/animations/StaggerGroup'

export const metadata: Metadata = {
  title: '¿Dónde comer en Lagos de Moreno? Guía de comida, tacos y más | SomosLagos',
  description:
    'Guía completa para saber dónde comer en Lagos de Moreno, Jalisco: comida típica, tacos, birria, carnitas, cafeterías y restaurantes del Pueblo Mágico. Horarios y contacto.',
  keywords: [
    'dónde comer en lagos de moreno',
    'comida en lagos de moreno',
    'que comer en lagos de moreno',
    'comida típica lagos de moreno',
    'restaurantes lagos de moreno',
  ],
  alternates: { canonical: 'https://www.somoslagos.com.mx/donde-comer-en-lagos' },
  openGraph: {
    title: '¿Dónde comer en Lagos de Moreno? Guía de comida | SomosLagos',
    description: 'Guía de dónde comer en Lagos de Moreno: comida típica, tacos, birria y cafeterías del Pueblo Mágico.',
    url: 'https://www.somoslagos.com.mx/donde-comer-en-lagos',
    type: 'website',
    locale: 'es_MX',
  },
}

const FOOD_SLUGS = ['restaurantes', 'comida', 'comer', 'taquerias', 'tacos', 'cafeterias', 'antojitos', 'cenadurias', 'bares']

export default async function DondeComerPage() {
  const supabase = await createClient()

  const { data: cats } = await supabase
    .from('categories')
    .select('id, name, slug')
    .in('slug', FOOD_SLUGS)
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
      .limit(40) as { data: any[] | null }
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

  // JSON-LD FAQ
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: '¿Dónde comer en Lagos de Moreno?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Lagos de Moreno tiene una gran oferta: comida típica alteña, taquerías, birria, carnitas, cafeterías y restaurantes. Explora el directorio SomosLagos para ver horarios, ubicación y contacto.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Qué comida típica se come en Lagos de Moreno?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'La cocina alteña de Lagos incluye birria, carnitas, tortas ahogadas, tacos de guisado, gorditas, tamales y dulces tradicionales del Pueblo Mágico.',
        },
      },
      {
        '@type': 'Question',
        name: '¿Dónde hay taquerías en Lagos de Moreno?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Las taquerías de Lagos se concentran en el centro y en la zona del mercado. En SomosLagos puedes ver sus horarios y contactarlas por WhatsApp.',
        },
      },
    ],
  }

  return (
    <main className="min-h-screen overflow-x-clip" style={{ background: '#FBF0E5' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      {/* HERO */}
      <section className="relative overflow-hidden pt-28 pb-14 md:pt-32 md:pb-16">
        <div className="absolute inset-0 z-0">
          <img src="/tourism/centro-historico.jpg" alt="" aria-hidden className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(6,15,30,0.6) 0%, rgba(6,15,30,0.55) 60%, #FBF0E5 100%)' }} />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-5" style={{ background: 'rgba(251,240,229,0.92)', color: 'var(--coral)' }}>
              🍽️ Guía gastronómica · Pueblo Mágico
            </span>
            <h1 className="text-4xl md:text-6xl font-black leading-[1.02] tracking-tight mb-5" style={{ fontFamily: 'var(--display)', color: 'white', textShadow: '0 4px 24px rgba(6,15,30,0.5)' }}>
              ¿Dónde comer en Lagos de Moreno?
            </h1>
            <div className="space-y-4 text-base md:text-lg leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.92)' }}>
              <p>
                <strong>Lagos de Moreno</strong> es un <strong>Pueblo Mágico</strong> con una cocina que se vive todos los días.
                Desde <strong>birria y carnitas</strong> hasta <strong>tacos de guisado</strong>, <strong>tortas ahogadas</strong> y
                <strong> cafeterías</strong> de especialidad, la ciudad ofrece una de las escenas gastronómicas más ricas de
                <strong> Los Altos de Jalisco</strong>.
              </p>
              <p>
                En esta guía te contamos <strong>qué comer</strong> y <strong>dónde encontrarlo</strong>, con los negocios del directorio
                SomosLagos y su <strong>contacto directo por WhatsApp</strong>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIONES DE LA GUÍA */}
      <section className="pb-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { emoji: '🌮', title: 'Tacos y antojitos', desc: 'Tacos de guisado, birria, al pastor y antojitos del mercado.', href: '/taquerias', color: 'var(--coral)' },
              { emoji: '☕', title: 'Cafeterías y desayunos', desc: 'Café de especialidad, chilaquiles y pan de casa.', href: '/cafeterias', color: 'var(--gold)' },
              { emoji: '🍽️', title: 'Restaurantes', desc: 'Comida típica y de autor para cenar en el centro.', href: '/restaurantes', color: 'var(--coral)' },
              { emoji: '🍸', title: 'Bares y cantinas', desc: 'Vida nocturna, botanas y música en vivo.', href: '/bares', color: 'var(--blue)' },
            ].map((c) => (
              <Link
                key={c.href}
                href={c.href}
                className="group rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{ background: 'white', border: '1px solid rgba(6,60,103,0.08)', boxShadow: '0 4px 20px rgba(6,60,103,0.05)' }}
              >
                <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">{c.emoji}</span>
                <h2 className="font-black text-lg mb-1" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>{c.title}</h2>
                <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>{c.desc}</p>
                <span className="text-sm font-bold inline-flex items-center gap-1" style={{ color: c.color }}>
                  Explorar
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* GRID DE NEGOCIOS */}
      <SectionReveal>
        <section className="pb-16">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest mb-2" style={{ background: 'rgba(217,110,51,0.12)', color: 'var(--coral)' }}>
                  Recomendados
                </span>
                <h2 className="text-2xl md:text-3xl font-black" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>
                  Dónde comer hoy
                </h2>
              </div>
              <Link href="/restaurantes" className="text-sm font-semibold" style={{ color: 'var(--coral)' }}>Ver todos →</Link>
            </div>
            {businesses.length > 0 ? (
              <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {businesses.map((b) => (
                  <StaggerItem key={b.id} className="h-full"><BusinessCard business={b} /></StaggerItem>
                ))}
              </StaggerGroup>
            ) : (
              <div className="rounded-3xl p-12 text-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
                <span className="text-5xl block mb-4">🍽️</span>
                <p className="font-semibold mb-1" style={{ color: 'var(--ink)' }}>Pronto más opciones</p>
                <p className="text-sm mb-6" style={{ color: 'var(--ink-soft)' }}>Explora el directorio completo.</p>
                <Link href="/buscar" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white" style={{ background: 'var(--coral)' }}>Explorar negocios</Link>
              </div>
            )}
          </div>
        </section>
      </SectionReveal>

      {/* CTA */}
      <section className="pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto rounded-3xl p-10 md:p-14 text-center" style={{ background: 'linear-gradient(135deg, var(--coral), var(--gold))' }}>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3" style={{ fontFamily: 'var(--display)' }}>
              ¿Tienes un restaurante en Lagos?
            </h2>
            <p className="text-white/85 text-base md:text-lg max-w-xl mx-auto mb-8">
              Regístrate gratis y aparece en la guía gastronómica del Pueblo Mágico.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/registrar-negocio" className="inline-flex items-center justify-center px-8 py-4 bg-white font-bold rounded-full transition-all hover:scale-[1.02]" style={{ color: 'var(--coral)' }}>Registrar mi negocio</Link>
              <Link href="/para-negocios" className="inline-flex items-center justify-center px-8 py-4 font-semibold rounded-full border-2 border-white text-white transition-all hover:bg-white/10">Para negocios</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
