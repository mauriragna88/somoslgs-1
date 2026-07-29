import { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Guias locales de Lagos de Moreno',
  description: 'Encuentra negocios y servicios en Lagos de Moreno organizados por categoria, zona y necesidad.',
  openGraph: {
    title: 'Guias locales de Lagos de Moreno | SomosLagos',
    description: 'Encuentra negocios y servicios organizados por intencion de busqueda.',
  },
}

interface LocalPage {
  id: string
  slug: string
  title: string
  h1: string
  meta_description: string
  category_slug: string | null
  published_at: string | null
}

export default async function LocalesIndexPage() {
  const supabase = await createClient()

  const { data: pages } = await supabase
    .from('local_pages')
    .select('id, slug, title, h1, meta_description, category_slug, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false }) as { data: LocalPage[] | null }

  const list = pages || []

  return (
    <main className="min-h-screen py-16" style={{ background: 'var(--ivory)' }}>
      <section className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <span
            className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-full mb-5"
            style={{ background: 'rgba(255, 107, 53, 0.1)', color: 'var(--coral)' }}
          >
            Guias locales
          </span>
          <h1
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
          >
            Guias de Lagos de Moreno
          </h1>
          <p className="text-lg" style={{ color: 'var(--ink-soft)' }}>
            Paginas organizadas por intencion de busqueda — cada una enlaza a negocios reales de la plataforma.
          </p>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-12">
            <p style={{ color: 'var(--muted)' }}>Pronto publicaremos las primeras guias locales.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {list.map((page) => (
              <Link
                key={page.id}
                href={`/locales/${page.slug}`}
                className="block bg-white rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{
                  border: '1px solid var(--hairline)',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <h3
                  className="font-bold text-lg mb-2"
                  style={{ color: 'var(--ink)', fontFamily: 'var(--display)' }}
                >
                  {page.h1}
                </h3>
                <p className="text-sm line-clamp-3" style={{ color: 'var(--ink-soft)' }}>
                  {page.meta_description}
                </p>
                <p
                  className="text-xs mt-3 font-semibold"
                  style={{ color: 'var(--coral)' }}
                >
                  Ver guia →
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
