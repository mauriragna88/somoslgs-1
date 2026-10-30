import Image from 'next/image'
import Link from 'next/link'
import type { Trending } from '@/lib/trending'

/* Lo mas visitado y buscado en SomosLagos: datos reales, publicos, para que la gente
   descubra negocios y los dueños vean que aqui hay trafico. */
export default function TrendingSection({ trending }: { trending: Trending }) {
  const { businesses, categories, searches } = trending
  if (businesses.length < 3) return null

  return (
    <section
      aria-labelledby="trending-title"
      className="py-20 md:py-24"
      style={{ background: 'linear-gradient(180deg,#0a1c33,#072d52)', color: '#f6f1e6' }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-10">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
            style={{ background: 'rgba(240,184,79,0.12)', color: '#f0b84f', border: '1px solid rgba(240,184,79,0.3)' }}
          >
            En tendencia
          </span>
          <h2 id="trending-title" className="text-3xl md:text-5xl font-black" style={{ fontFamily: 'var(--display)', lineHeight: 1.02 }}>
            Lo más visitado en{' '}
            <em style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontWeight: 400, color: '#f0b84f' }}>
              SomosLagos
            </em>
          </h2>
          <p className="mt-3" style={{ color: '#b9c6d4' }}>
            Esto es lo que más está viendo la gente de Lagos ahora mismo. Entra y descubre por qué.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <ol className="grid gap-3 sm:grid-cols-2">
            {businesses.map((b, i) => (
              <li key={b.id}>
                <Link
                  href={`/negocios/${b.slug}`}
                  className="sl-lift flex items-center gap-4 rounded-2xl p-4 min-h-20 focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{ background: 'rgba(246,241,230,0.06)', border: '1px solid rgba(246,241,230,0.12)', outlineColor: '#f0b84f' }}
                >
                  <span className="text-2xl font-black w-7 text-center tabular-nums" style={{ color: i < 3 ? '#f0b84f' : '#7f93a8', fontFamily: 'var(--display)' }}>
                    {i + 1}
                  </span>
                  <span className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0" style={{ background: '#fbeee3' }}>
                    {b.logo_url ? (
                      <Image src={b.logo_url} alt="" fill sizes="48px" className="object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center font-bold" style={{ color: '#0a4172' }} aria-hidden="true">
                        {b.name.charAt(0)}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate">{b.name}</strong>
                    <small className="block truncate" style={{ color: '#b9c6d4' }}>
                      {b.category ? `${b.category.icon} ${b.category.name}` : 'Negocio local'}
                    </small>
                    <small style={{ color: '#f0b84f' }}>{b.total_views.toLocaleString('es-MX')} visitas</small>
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          <div className="space-y-8">
            {categories.length > 0 && (
              <div>
                <h3 className="font-bold mb-3">Categorías que más se visitan</h3>
                <ul className="flex flex-wrap gap-2">
                  {categories.map(c => (
                    <li key={c.slug}>
                      <Link
                        href={`/categorias/${c.slug}`}
                        className="inline-flex items-center gap-2 px-4 min-h-11 rounded-full text-sm font-semibold"
                        style={{ background: 'rgba(240,184,79,0.12)', border: '1px solid rgba(240,184,79,0.3)', color: '#f6f1e6' }}
                      >
                        <span aria-hidden="true">{c.icon}</span>
                        {c.name}
                        <span className="tabular-nums" style={{ color: '#f0b84f' }}>{c.views.toLocaleString('es-MX')}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {searches.length > 0 && (
              <div>
                <h3 className="font-bold mb-3">Lo más buscado este mes</h3>
                <ul className="flex flex-wrap gap-2">
                  {searches.map(s => (
                    <li key={s.term}>
                      <Link
                        href={`/buscar?q=${encodeURIComponent(s.term)}`}
                        className="inline-flex items-center px-4 min-h-11 rounded-full text-sm"
                        style={{ background: 'rgba(246,241,230,0.06)', border: '1px solid rgba(246,241,230,0.16)' }}
                      >
                        🔎 {s.term}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
