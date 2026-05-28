export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BusinessCard from '@/components/shared/BusinessCard'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mis Favoritos',
  description: 'Los negocios que has guardado en SomosLagos.',
}

export default async function FavoritosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: rows } = await (supabase as any)
    .from('user_favorites')
    .select(`
      business:businesses(
        id, name, slug, description, logo_url, cover_url,
        address, neighborhood, phone, subscription_tier,
        is_featured, business_hours, rating, total_reviews,
        category:categories(id, name, icon)
      )
    `)
    .eq('user_id', user.id)

  const businesses = (rows || [])
    .map((r: any) => r.business)
    .filter(Boolean)

  return (
    <main className="min-h-screen bg-[var(--ivory)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium mb-4 inline-flex items-center gap-1.5"
            style={{ color: 'var(--muted)' }}
          >
            ← Inicio
          </Link>
          <h1
            className="text-3xl font-bold mt-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
          >
            Mis Favoritos
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
            {businesses.length} negocio{businesses.length !== 1 ? 's' : ''} guardado{businesses.length !== 1 ? 's' : ''}
          </p>
        </div>

        {businesses.length === 0 ? (
          <div className="text-center py-24">
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
              style={{ background: 'rgba(255,107,53,0.08)' }}
            >
              🤍
            </div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--ink)' }}
            >
              Aún no tienes favoritos
            </h2>
            <p className="mb-8" style={{ color: 'var(--muted)' }}>
              Guarda los negocios que más te gustan para encontrarlos fácilmente.
            </p>
            <Link
              href="/buscar"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold transition-all hover:opacity-90"
              style={{ background: 'var(--coral)' }}
            >
              Explorar negocios
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {businesses.map((business: any) => (
              <BusinessCard key={business.id} business={business} showCategory />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
