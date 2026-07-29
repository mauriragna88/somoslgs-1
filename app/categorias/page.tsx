import Link from 'next/link'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import BannerDisplay from '@/components/ads/BannerDisplay'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Categorías de Negocios en Lagos de Moreno',
  description: 'Explora todas las categorías de negocios en Lagos de Moreno: restaurantes, tiendas, servicios, profesionales y más.',
  openGraph: {
    title: 'Categorías de Negocios | SomosLagos',
    description: 'Explora todas las categorías de negocios en Lagos de Moreno.',
    url: 'https://www.somoslagos.com.mx/categorias',
  },
}

interface Category {
  id: string
  name: string
  icon: string | null
  slug: string
}

/** Map category slug/name keywords → accent color */
function getCategoryColor(slug: string, name: string): string {
  const key = (slug + ' ' + name).toLowerCase()
  if (/comida|restaur|caf[eé]|bar|antoj/.test(key)) return 'var(--coral)'
  if (/hospedaje|hotel|motel|hostal/.test(key)) return 'var(--turquoise, #0D9488)'
  if (/servicio|taller|plomer|electr|construc/.test(key)) return 'var(--green, #22C55E)'
  if (/turismo|tour|atract|museo|cultura/.test(key)) return 'var(--terracotta, #C86B4A)'
  if (/belleza|salud|spa|est[eé]tic|cl[ií]nica|gym|fitness/.test(key)) return 'var(--buga, #A855F7)'
  return 'var(--gold)'
}

export default async function CategoriasPage() {
  const supabase = await createClient()

  // Get all categories with business count in 2 queries (instead of N+1)
  const [{ data: categories }, { data: businessCounts }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, icon, slug')
      .is('parent_id', null)
      .order('display_order') as unknown as Promise<{ data: Category[] | null }>,
    supabase
      .from('businesses')
      .select('category_id')
      .eq('is_active', true) as unknown as Promise<{ data: { category_id: string }[] | null }>,
  ])

  // Count businesses per category in memory (0 extra queries)
  const countMap = new Map<string, number>()
  ;(businessCounts || []).forEach((b) => {
    if (b.category_id) {
      countMap.set(b.category_id, (countMap.get(b.category_id) || 0) + 1)
    }
  })

  const categoriesWithCount = (categories || [])
    .map((cat) => ({
      ...cat,
      businessCount: countMap.get(cat.id) || 0,
    }))
    .filter((cat) => cat.businessCount >= 2)
    .sort((a, b) => b.businessCount - a.businessCount)

  return (
    <main className="min-h-screen" style={{ background: 'var(--ivory)' }}>

      {/* ── Hero / Header ── */}
      <section
        className="relative overflow-hidden pt-14 pb-16"
        style={{ background: 'var(--ivory)' }}
      >
        {/* Mesh background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: [
              'radial-gradient(ellipse at 15% 40%, rgba(255,107,53,0.08) 0%, transparent 48%)',
              'radial-gradient(ellipse at 80% 20%, rgba(245,185,66,0.07) 0%, transparent 42%)',
              'radial-gradient(ellipse at 55% 90%, rgba(255,107,53,0.05) 0%, transparent 40%)',
            ].join(', '),
          }}
        />

        <div className="container mx-auto px-4 relative z-10">
          {/* Eyebrow badge */}
          <span
            className="inline-block text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-5"
            style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}
          >
            Categorías
          </span>

          <h1
            className="text-4xl md:text-5xl font-black mb-4 leading-tight"
            style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
          >
            Encuentra negocios
            <br />
            <span style={{ color: 'var(--coral)' }}>por categoría</span>
          </h1>

          <p className="text-base max-w-lg" style={{ color: 'var(--muted)' }}>
            Explora todos los negocios de Lagos de Moreno organizados por categoría.
            {categoriesWithCount.length > 0 && (
              <> &nbsp;<strong style={{ color: 'var(--ink-soft)' }}>{categoriesWithCount.length} categorías disponibles.</strong></>
            )}
          </p>
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="container mx-auto px-4">
        <div className="pueblo-divider" />
      </div>

      {/* ── Banner: Categories Top ── */}
      <div className="container mx-auto px-4 pt-6">
        <BannerDisplay placement="categories_top" />
      </div>

      {/* ── Categories Grid ── */}
      <div className="container mx-auto px-4 py-10">
        {categoriesWithCount.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {categoriesWithCount.map((category) => {
              const accentColor = getCategoryColor(category.slug, category.name)
              return (
                <Link
                  key={category.id}
                  href={`/categorias/${category.slug}`}
                  className="group relative rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:scale-[1.04]"
                  style={{
                    background: 'rgba(255,253,248,0.78)',
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid rgba(31,41,55,0.07)',
                    boxShadow: '0 2px 20px rgba(31,41,55,0.07)',
                    borderLeft: `3px solid ${accentColor}`,
                  }}
                >
                  {/* Icon circle with glow-on-hover via box-shadow on the wrapper */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-200"
                    style={{
                      background: `color-mix(in srgb, ${accentColor} 14%, var(--ivory))`,
                    }}
                  >
                    <span className="text-3xl leading-none">{category.icon || '📁'}</span>
                  </div>

                  {/* Name */}
                  <h3
                    className="font-bold text-sm leading-snug mb-2 transition-colors duration-200"
                    style={{ color: 'var(--ink)' }}
                  >
                    {category.name}
                  </h3>

                  {/* Count badge */}
                  <span
                    className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                    style={{
                      background: `color-mix(in srgb, ${accentColor} 12%, transparent)`,
                      color: accentColor,
                    }}
                  >
                    {category.businessCount} negocio{category.businessCount !== 1 ? 's' : ''}
                  </span>
                </Link>
              )
            })}
            {/* Otros servicios — fallback */}
            <Link
              href="/buscar"
              className="group relative rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-200 hover:scale-[1.04]"
              style={{
                background: 'rgba(255,253,248,0.78)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(31,41,55,0.07)',
                boxShadow: '0 2px 20px rgba(31,41,55,0.07)',
                borderLeft: `3px solid var(--muted)`,
              }}
            >
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-200"
                style={{
                  background: `color-mix(in srgb, var(--muted) 14%, var(--ivory))`,
                }}
              >
                <span className="text-3xl leading-none">📋</span>
              </div>
              <h3
                className="font-bold text-sm leading-snug mb-2 transition-colors duration-200"
                style={{ color: 'var(--ink)' }}
              >
                Otros servicios
              </h3>
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{
                  background: `color-mix(in srgb, var(--muted) 12%, transparent)`,
                  color: 'var(--muted)',
                }}
              >
                Ver todos
              </span>
            </Link>
          </div>
        ) : (
          /* ── Empty state ── */
          <div className="flex flex-col items-center text-center py-20">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ background: 'color-mix(in srgb, var(--coral) 10%, var(--ivory))' }}
            >
              <span className="text-5xl">📁</span>
            </div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
            >
              No hay categorías
            </h2>
            <p style={{ color: 'var(--muted)' }}>Las categorías se agregarán pronto.</p>
          </div>
        )}
      </div>

      {/* ── Divider ── */}
      <div className="container mx-auto px-4">
        <div className="pueblo-divider" />
      </div>

      {/* ── CTA Banner ── */}
      <div className="container mx-auto px-4 py-10">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-10 text-center"
          style={{
            background: 'linear-gradient(135deg, var(--ink) 0%, var(--terracotta, #C86B4A) 60%, var(--coral) 100%)',
          }}
        >
          {/* Decorative blobs */}
          <div
            className="pointer-events-none absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20"
            style={{ background: 'var(--gold)', filter: 'blur(48px)' }}
          />
          <div
            className="pointer-events-none absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-15"
            style={{ background: 'var(--coral)', filter: 'blur(40px)' }}
          />

          <div className="relative z-10">
            <h2
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: 'var(--display)' }}
            >
              ¿No encuentras lo que buscas?
            </h2>
            <p className="mb-7 max-w-sm mx-auto" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Usa nuestra búsqueda avanzada para encontrar exactamente lo que necesitas.
            </p>
            <Link
              href="/buscar"
              className="inline-block rounded-full font-semibold px-8 py-3 transition-colors"
              style={{ background: 'var(--gold)', color: 'var(--ink)' }}
            >
              Ir a Búsqueda
            </Link>
          </div>
        </div>
      </div>

    </main>
  )
}
