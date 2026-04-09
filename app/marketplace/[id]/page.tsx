import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient, getUser } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MARKETPLACE_CONDITIONS, MARKETPLACE_PRICE_TYPES, MARKETPLACE_FEATURED_PRICE } from '@/lib/constants'
import ListingGallery from '@/components/marketplace/ListingGallery'
import ListingCard from '@/components/marketplace/ListingCard'
import ReportButton from '@/components/marketplace/ReportButton'
import InterestButton from '@/components/marketplace/InterestButton'
import type { MarketplaceListing } from '@/types/database.types'

export const revalidate = 300

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('marketplace_listings')
    .select('title, description, images, price, price_type')
    .eq('id', id)
    .single()

  if (!data) return { title: 'Artículo no encontrado' }

  const priceText = data.price_type === 'gratis' ? 'Gratis'
    : data.price_type === 'intercambio' ? 'Intercambio'
    : formatCurrency(data.price)

  return {
    title: `${data.title} - ${priceText}`,
    description: data.description?.slice(0, 160) || data.title,
    openGraph: {
      title: `${data.title} - ${priceText} | Marketplace SomosLagos`,
      description: data.description?.slice(0, 160) || data.title,
      images: data.images?.[0] ? [{ url: data.images[0], width: 800, height: 800 }] : undefined,
      url: `https://www.somoslagos.com.mx/marketplace/${id}`,
    },
  }
}

export default async function ListingDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createServiceClient()

  // Try with FK join first, fallback without it
  let listing: any = null
  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*, category:marketplace_categories(*), seller:profiles!marketplace_listings_seller_id_fkey(full_name, created_at)')
    .eq('id', id)
    .single()

  if (error) {
    // Fallback: query without FK hint (in case FK doesn't exist)
    const { data: fallback } = await supabase
      .from('marketplace_listings')
      .select('*, category:marketplace_categories(*)')
      .eq('id', id)
      .single()

    if (!fallback || fallback.status === 'removed') {
      notFound()
    }
    listing = { ...fallback, seller: null }
  } else {
    if (!data || data.status === 'removed') {
      notFound()
    }
    listing = data
  }

  // Increment views
  supabase
    .from('marketplace_listings')
    .update({ views: (listing.views || 0) + 1 })
    .eq('id', id)
    .then(() => {})

  // Get seller listing count
  const { count: sellerCount } = await supabase
    .from('marketplace_listings')
    .select('id', { count: 'exact', head: true })
    .eq('seller_id', listing.seller_id)
    .eq('status', 'active')

  // Get similar listings
  const { data: similar } = await supabase
    .from('marketplace_listings')
    .select('*, category:marketplace_categories(*)')
    .eq('status', 'active')
    .neq('id', listing.id)
    .eq('category_id', listing.category_id)
    .gte('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(4)

  const typedListing = listing as unknown as MarketplaceListing
  const conditionLabel = MARKETPLACE_CONDITIONS[typedListing.condition]
  const priceTypeLabel = MARKETPLACE_PRICE_TYPES[typedListing.price_type]

  // Check if listing is currently featured
  const isFeatured = typedListing.is_featured &&
    typedListing.featured_until &&
    new Date(typedListing.featured_until) > new Date()

  // Get current user + lead data
  const user = await getUser()
  const [{ count: leadCount }, { data: userLead }] = await Promise.all([
    supabase
      .from('marketplace_leads')
      .select('id', { count: 'exact', head: true })
      .eq('listing_id', id),
    user
      ? supabase
          .from('marketplace_leads')
          .select('id')
          .eq('listing_id', id)
          .eq('buyer_id', user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const whatsappUrl = `https://wa.me/52${typedListing.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hola, me interesa tu artículo "${typedListing.title}" en SomosLagos Marketplace.`
  )}`

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: typedListing.title,
    description: typedListing.description,
    image: typedListing.images?.[0],
    offers: {
      '@type': 'Offer',
      price: typedListing.price,
      priceCurrency: 'MXN',
      availability: typedListing.status === 'active'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut',
      itemCondition: typedListing.condition === 'nuevo'
        ? 'https://schema.org/NewCondition'
        : 'https://schema.org/UsedCondition',
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-surface">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="container mx-auto px-4 py-3">
            <nav className="text-sm text-gray-500 flex items-center gap-2">
              <Link href="/marketplace" className="hover:text-primary transition-colors">Marketplace</Link>
              <span>/</span>
              {typedListing.category && (
                <>
                  <Link
                    href={`/marketplace?category=${typedListing.category.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {typedListing.category.name}
                  </Link>
                  <span>/</span>
                </>
              )}
              <span className="text-gray-700 truncate">{typedListing.title}</span>
            </nav>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gallery */}
            <div>
              <ListingGallery images={typedListing.images || []} title={typedListing.title} />
            </div>

            {/* Info */}
            <div>
              {/* Status badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold">
                  {conditionLabel}
                </span>
                {typedListing.is_featured && (
                  <span className="px-3 py-1 bg-gradient-to-r from-accent to-accent-dark text-secondary rounded-full text-xs font-bold">
                    &#11088; Destacado
                  </span>
                )}
                {typedListing.status === 'sold' && (
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold">Vendido</span>
                )}
                {typedListing.status === 'reserved' && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">Reservado</span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-secondary mb-2">{typedListing.title}</h1>

              {/* Price */}
              <div className="mb-4">
                {typedListing.price_type === 'gratis' ? (
                  <span className="text-3xl font-bold text-green-600">Gratis</span>
                ) : typedListing.price_type === 'intercambio' ? (
                  <span className="text-3xl font-bold text-purple-600">Intercambio</span>
                ) : (
                  <div>
                    <span className="text-3xl font-bold text-secondary">
                      {formatCurrency(typedListing.price)}
                    </span>
                    {typedListing.price_type === 'negociable' && (
                      <span className="text-sm text-gray-500 ml-2">{priceTypeLabel}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Description */}
              {typedListing.description && (
                <div className="mb-6">
                  <h2 className="font-semibold text-secondary mb-2">Descripción</h2>
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{typedListing.description}</p>
                </div>
              )}

              {/* Details */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 space-y-2">
                {typedListing.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2 text-accent">&#128205;</span>
                    {typedListing.location}
                  </div>
                )}
                {typedListing.category && (
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">{typedListing.category.icon}</span>
                    {typedListing.category.name}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-2">&#128065;</span>
                  {typedListing.views} vista{typedListing.views !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-2">&#128197;</span>
                  Publicado el {formatDate(typedListing.created_at)}
                </div>
              </div>

              {/* Seller */}
              <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6">
                <h3 className="font-semibold text-secondary mb-2">Vendedor</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-dark text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {(typedListing.seller?.full_name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-secondary">{typedListing.seller?.full_name || 'Usuario'}</p>
                    <p className="text-xs text-gray-500">
                      Miembro desde {typedListing.seller?.created_at ? formatDate(typedListing.seller.created_at) : 'N/A'}
                      {sellerCount ? ` · ${sellerCount} artículo${sellerCount !== 1 ? 's' : ''}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* CTA: WhatsApp (featured) or Interest button (free) */}
              {typedListing.status === 'active' && (
                isFeatured ? (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-colors text-lg"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.75.75 0 00.913.913l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.34 0-4.508-.646-6.372-1.766l-.246-.151-3.244 1.088 1.088-3.244-.151-.246A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
                    </svg>
                    Contactar por WhatsApp
                  </a>
                ) : (
                  <>
                    {typedListing.seller_id !== user?.id && (
                      <InterestButton
                        listingId={typedListing.id}
                        isLoggedIn={!!user}
                        alreadyInterested={!!userLead}
                        interestCount={leadCount || 0}
                      />
                    )}
                    <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <p className="text-xs text-amber-800 text-center">
                        El WhatsApp del vendedor se muestra en articulos Destacados.
                        <br />
                        <span className="font-semibold">Destaca tu articulo por ${MARKETPLACE_FEATURED_PRICE} / 7 dias</span>
                      </p>
                    </div>
                  </>
                )
              )}

              {/* Report */}
              <div className="mt-4 text-center">
                <ReportButton listingId={typedListing.id} />
              </div>
            </div>
          </div>

          {/* Similar Listings */}
          {similar && similar.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-secondary mb-6">Artículos similares</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(similar as MarketplaceListing[]).map((item) => (
                  <ListingCard key={item.id} listing={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  )
}
