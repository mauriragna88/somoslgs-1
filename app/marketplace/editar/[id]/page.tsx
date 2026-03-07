import { redirect, notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import ListingForm from '@/components/marketplace/ListingForm'
import { MARKETPLACE_FREE_PHOTO_LIMIT, MARKETPLACE_PHOTO_LIMIT } from '@/lib/constants'
import type { MarketplaceCategory, MarketplaceListing } from '@/types/database.types'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Editar artículo - Marketplace',
}

interface PageProps {
  params: { id: string }
}

export default async function EditarListingPage({ params }: PageProps) {
  const user = await getUser()
  if (!user) {
    redirect(`/login?redirect=/marketplace/editar/${params.id}`)
  }

  const supabase = createServiceClient()

  const [{ data: listing }, { data: categories }] = await Promise.all([
    supabase
      .from('marketplace_listings')
      .select('*')
      .eq('id', params.id)
      .single(),
    supabase
      .from('marketplace_categories')
      .select('*')
      .order('display_order'),
  ])

  if (!listing) {
    notFound()
  }

  // Only owner can edit
  if (listing.seller_id !== user.id) {
    redirect('/marketplace/mis-articulos')
  }

  const isFeatured = listing.is_featured &&
    listing.featured_until &&
    new Date(listing.featured_until) > new Date()

  return (
    <main className="min-h-screen bg-surface">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-secondary mb-2">Editar artículo</h1>
          <p className="text-gray-500 mb-8">Modifica los detalles de tu publicación.</p>

          <ListingForm
            categories={(categories || []) as MarketplaceCategory[]}
            listing={listing as unknown as MarketplaceListing}
            photoLimit={isFeatured ? MARKETPLACE_PHOTO_LIMIT : MARKETPLACE_FREE_PHOTO_LIMIT}
          />
        </div>
      </div>
    </main>
  )
}
