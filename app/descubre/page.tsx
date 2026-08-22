import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import BusinessCard from '@/components/shared/BusinessCard'
import PremiumSlider from '@/components/shared/PremiumSlider'
import { StaggerGroup, StaggerItem } from '@/components/animations/StaggerGroup'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Descubre Negocios en Lagos de Moreno',
  description: 'Conoce los mejores negocios de Lagos de Moreno. Restaurantes, tiendas, servicios y mas, todos en un solo lugar.',
  openGraph: {
    title: 'Descubre Negocios | SomosLagos',
    description: 'Conoce los mejores negocios de Lagos de Moreno.',
    url: 'https://www.somoslagos.com.mx/descubre',
  },
}

interface DiscoverBusiness {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  address: string
  neighborhood: string | null
  subscription_tier: string
  is_featured: boolean
  business_hours: any
  rating: number
  total_reviews: number
  created_at: string
  category: { name: string; icon: string } | null
  business_photos: { image_url: string }[]
}

export default async function DescubrePage() {
  const supabase = await createClient()

  const { data: businesses } = await supabase
    .from('businesses')
    .select(`
      id, name, slug, description, logo_url, cover_url, address, neighborhood,
      subscription_tier, is_featured, business_hours, rating, total_reviews, created_at,
      category:categories(name, icon),
      business_photos(image_url)
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50) as { data: DiscoverBusiness[] | null }

  const all = businesses || []

  // Separate by tier
  const avanzado = all.filter(b => b.subscription_tier === 'avanzado')
  const pro = all.filter(b => b.subscription_tier === 'pro')
  const gratis = all.filter(b => b.subscription_tier === 'gratis')

  // Get newest businesses (last 2 weeks, any tier)
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const newest = all.filter(b => new Date(b.created_at) > twoWeeksAgo)

  return (
    <main className="min-h-screen pueblo-shell">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--terracotta)] via-[var(--coral)] to-[var(--gold)]">
        {/* Decorative background blobs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-[var(--gold)]/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24 text-center">
          <span className="pueblo-eyebrow inline-block px-4 py-1.5 text-xs font-semibold rounded-full mb-5 bg-white/15 border-white/30 text-white">
            Turismo · Lagos de Moreno
          </span>
          <h1 className="font-[family-name:var(--font-display)] text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight mb-4 tracking-tight">
            Descubre Negocios<br className="hidden md:block" /> en Lagos
          </h1>
          <p className="text-lg md:text-xl text-white/85 max-w-xl mx-auto leading-relaxed">
            <em className="font-[family-name:var(--font-serif)] not-italic">Conoce lo mejor que este Pueblo Mágico tiene para ofrecer</em>
          </p>
        </div>

        {/* Wave bottom edge */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 48L48 44C96 40 192 32 288 28C384 24 480 24 576 26.7C672 29.3 768 34.7 864 36C960 37.3 1056 34.7 1152 32C1248 29.3 1344 26.7 1392 25.3L1440 24V48H0Z" fill="#FFFDF8"/>
          </svg>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-6xl">

        {/* ── Nuevos ── */}
        {newest.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-4 mb-3">
              <div>
                <p className="pueblo-eyebrow inline-block px-3 py-1 text-xs rounded-full mb-2">Recién llegados</p>
                <h2 className="pueblo-accent-line font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-[var(--ink)]">
                  Nuevos en SomosLagos
                </h2>
              </div>
            </div>
            <div className="pueblo-divider mb-8" />
            <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {newest.map(b => (
                <StaggerItem key={b.id} className="h-full">
                  <BusinessCard business={b} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </section>
        )}

        {/* ── Avanzado — Slider + Large Cards ── */}
        {avanzado.length > 0 && (
          <section className="mb-16">
            <div className="mb-3">
              <p className="pueblo-eyebrow inline-block px-3 py-1 text-xs rounded-full mb-2">Selección premium</p>
              <h2 className="pueblo-accent-line font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-[var(--ink)]">
                Negocios Verificados
              </h2>
            </div>
            <div className="pueblo-divider mb-8" />
            <PremiumSlider businesses={avanzado} />
            {avanzado.length > 1 && (
              <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {avanzado.map(b => (
                  <StaggerItem key={b.id} className="h-full">
                    <BusinessCard business={b} />
                  </StaggerItem>
                ))}
              </StaggerGroup>
            )}
          </section>
        )}

        {/* ── Pro — Horizontal Cards ── */}
        {pro.length > 0 && (
          <section className="mb-16">
            <div className="mb-3">
              <p className="pueblo-eyebrow inline-block px-3 py-1 text-xs rounded-full mb-2">Destacados</p>
              <h2 className="pueblo-accent-line font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-[var(--ink)]">
                Negocios Pro
              </h2>
            </div>
            <div className="pueblo-divider mb-8" />
            <StaggerGroup className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {pro.map(b => (
                <StaggerItem key={b.id} className="h-full">
                  <BusinessCard business={b} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </section>
        )}

        {/* ── Gratis ── */}
        {gratis.length > 0 && (
          <section className="mb-16">
            <div className="mb-3">
              <p className="pueblo-eyebrow inline-block px-3 py-1 text-xs rounded-full mb-2">Directorio completo</p>
              <h2 className="pueblo-accent-line font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-[var(--ink)]">
                Todos los Negocios
              </h2>
            </div>
            <p className="text-[var(--muted)] text-sm mb-6 ml-6">
              Encuentra de todo en Lagos de Moreno — conoce lo que ofrecen
            </p>
            <div className="pueblo-divider mb-8" />
            <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {gratis.map(b => (
                <StaggerItem key={b.id} className="h-full">
                  <BusinessCard business={b} />
                </StaggerItem>
              ))}
            </StaggerGroup>
          </section>
        )}

        {/* ── Empty state ── */}
        {all.length === 0 && (
          <div className="text-center py-24">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[var(--coral)]/10 mb-6">
              <svg className="w-10 h-10 text-[var(--coral)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-[var(--ink-soft)] text-lg mb-2 font-medium">Aún no hay negocios registrados</p>
            <p className="text-[var(--muted)] text-sm mb-6">Sé el primero en poner a Lagos en el mapa</p>
            <Link
              href="/registrar-negocio"
              className="inline-block rounded-full bg-[var(--coral)] text-white px-6 py-3 font-semibold hover:bg-[var(--coral-deep)] transition-colors"
            >
              Registrarme GRATIS
            </Link>
          </div>
        )}

        {/* ── CTA banner ── */}
        <section className="py-4 mt-4">
          <div className="relative overflow-hidden rounded-[var(--r-xl)] bg-gradient-to-br from-[var(--ink)] via-[var(--terracotta)] to-[var(--coral)] p-8 md:p-12 text-center">
            {/* Decorative circles */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-[var(--gold)]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-[var(--coral)]/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="relative">
              <span className="pueblo-eyebrow inline-block px-4 py-1.5 text-xs font-semibold rounded-full mb-5 bg-white/15 border-white/25 text-white">
                Para negocios locales
              </span>
              <h2 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-white mb-3">
                ¿Tienes un negocio en Lagos?
              </h2>
              <p className="text-white/80 mb-8 max-w-md mx-auto leading-relaxed">
                Regístrate gratis y aparece aquí para que miles de personas te encuentren
              </p>
              <Link
                href="/registrar-negocio"
                className="inline-block rounded-full bg-[var(--gold)] text-[var(--ink)] px-8 py-3.5 font-bold text-base hover:bg-[var(--gold-deep)] transition-colors shadow-lg"
              >
                Registrar mi Negocio GRATIS
              </Link>
            </div>
          </div>
        </section>

      </div>
    </main>
  )
}
