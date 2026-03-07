import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import ListingForm from '@/components/marketplace/ListingForm'
import { MARKETPLACE_FREE_PHOTO_LIMIT } from '@/lib/constants'
import type { MarketplaceCategory } from '@/types/database.types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Publicar artículo - Marketplace',
  description: 'Publica un artículo para vender en el marketplace de SomosLagos.',
}

export default async function PublicarPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login?redirect=/marketplace/publicar')
  }

  const supabase = createServiceClient()

  // Get categories and user profile in parallel
  const [{ data: categories }, { data: profile }] = await Promise.all([
    supabase
      .from('marketplace_categories')
      .select('*')
      .order('display_order'),
    supabase
      .from('profiles')
      .select('phone')
      .eq('id', user.id)
      .single(),
  ])

  return (
    <main className="min-h-screen bg-surface">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-secondary mb-2">Publicar artículo</h1>
          <p className="text-gray-500 mb-8">Tu artículo estará visible por 30 días. Puedes renovarlo cuando esté por expirar.</p>

          <ListingForm
            categories={(categories || []) as MarketplaceCategory[]}
            userWhatsapp={profile?.phone}
            photoLimit={MARKETPLACE_FREE_PHOTO_LIMIT}
          />
        </div>
      </div>
    </main>
  )
}
