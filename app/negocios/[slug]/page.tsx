import Link from 'next/link'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ORDER_ENABLED_TIERS } from '@/lib/constants'
import type { BusinessHours } from '@/lib/constants'
import ProductList from '@/components/public/ProductList'
import PhotoCarousel from '@/components/public/PhotoCarousel'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
import BusinessHoursDisplay from '@/components/public/BusinessHoursDisplay'
import BannerDisplay from '@/components/ads/BannerDisplay'
import FavoriteButton from '@/components/shared/FavoriteButton'
import ViewTracker from '@/components/shared/ViewTracker'
import ReviewsSection from '@/components/reviews/ReviewsSection'
import type { Review } from '@/types/reviews'

const MapDisplay = dynamic(() => import('@/components/maps/MapDisplay'), { ssr: false })

export const revalidate = 1800

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('name, description, logo_url, cover_url, slug, category:categories(name)')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single() as unknown as { data: { name: string; description: string | null; logo_url: string | null; cover_url: string | null; slug: string; category: { name: string } | null } | null }

  if (!business) {
    return { title: 'Negocio no encontrado' }
  }

  const title = business.name
  const description = business.description
    || `${business.name}${business.category ? ` - ${business.category.name}` : ''} en Lagos de Moreno. Encuentra productos y servicios en SomosLagos.`

  return {
    title,
    description,
    openGraph: {
      title: `${business.name} | SomosLagos`,
      description,
      type: 'website',
      url: `https://www.somoslagos.com.mx/negocios/${business.slug}`,
      ...((business.cover_url || business.logo_url) && {
        images: [business.cover_url
          ? { url: business.cover_url, width: 1200, height: 400, alt: business.name }
          : { url: business.logo_url!, width: 400, height: 400, alt: business.name }
        ],
      }),
    },
  }
}

interface PublicBusiness {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  phone: string
  whatsapp: string | null
  email: string | null
  address: string
  latitude: number | null
  longitude: number | null
  subscription_tier: string
  business_type: 'productos' | 'servicios' | 'ambos'
  category: { id: string; name: string; icon: string } | null
  // Datos bancarios para pagos por transferencia
  bank_name: string | null
  bank_account_holder: string | null
  bank_account_number: string | null
  bank_clabe: string | null
  business_hours: BusinessHours | null
  owner_id: string
  rating: number
  total_reviews: number
  cover_url: string | null
  website: string | null
  neighborhood: string | null
  facebook_url: string | null
  instagram_url: string | null
  tiktok_url: string | null
}

export default async function BusinessPage({ params }: PageProps) {
  const supabase = createClient()

  // Get business by slug
  const { data: business, error } = await supabase
    .from('businesses')
    .select(`
      *,
      category:categories(id, name, icon)
    `)
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single() as unknown as { data: PublicBusiness | null; error: any }

  if (error || !business) {
    notFound()
  }

  // Get products if business has the right plan
  const canShowProducts = ['pro', 'avanzado'].includes(business.subscription_tier)
  let products: any[] = []

  if (canShowProducts) {
    const { data } = await supabase
      .from('products')
      .select('id, name, description, price, image_url, images, is_available, stock, type')
      .eq('business_id', business.id)
      .eq('is_available', true)
      .order('name')

    products = data || []
  }

  // Get gallery photos
  const { data: galleryPhotos } = await supabase
    .from('business_photos')
    .select('id, image_url, display_order')
    .eq('business_id', business.id)
    .order('display_order', { ascending: true })

  const photos = galleryPhotos || []

  // Get initial reviews
  const { data: reviewsData } = await supabase
    .from('reviews')
    .select('id, business_id, user_id, rating, comment, response, responded_at, created_at, profile:profiles(full_name, avatar_url)')
    .eq('business_id', business.id)
    .order('created_at', { ascending: false })
    .limit(10) as unknown as { data: Review[] | null }

  const initialReviews = reviewsData || []

  // JSON-LD structured data
  const businessJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    url: `https://www.somoslagos.com.mx/negocios/${business.slug}`,
    ...(business.description && { description: business.description }),
    ...(business.logo_url && { image: business.logo_url }),
    ...(business.phone && { telephone: business.phone }),
    ...(business.email && { email: business.email }),
    ...(business.address && {
      address: {
        '@type': 'PostalAddress',
        streetAddress: business.address,
        addressLocality: 'Lagos de Moreno',
        addressRegion: 'Jalisco',
        addressCountry: 'MX',
      },
    }),
    ...(business.total_reviews > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: business.rating,
        reviewCount: business.total_reviews,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Inicio',
        item: 'https://www.somoslagos.com.mx',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Buscar',
        item: 'https://www.somoslagos.com.mx/buscar',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: business.name,
        item: `https://www.somoslagos.com.mx/negocios/${business.slug}`,
      },
    ],
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(businessJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Cover Image */}
      {business.cover_url && (
        <div className="relative w-full h-48 md:h-64 lg:h-80">
          <Image
            src={business.cover_url}
            alt={`Portada de ${business.name}`}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Logo */}
            <div className={`w-32 h-32 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 relative ${business.cover_url ? '-mt-20 ring-4 ring-white shadow-lg' : ''}`}>
              {business.logo_url ? (
                <Image
                  src={business.logo_url}
                  alt={business.name}
                  fill
                  sizes="128px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary">
                  <span className="text-5xl text-white font-bold">
                    {business.name[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {business.category && (
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    {business.category.icon} {business.category.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{business.name}</h1>
                <OpenClosedBadge businessHours={business.business_hours} size="md" />
                <FavoriteButton businessId={business.id} size="md" />
              </div>
              {business.description && (
                <p className="text-gray-600 mb-4">{business.description}</p>
              )}

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 text-sm">
                {business.address && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">📍</span>
                    {business.address}
                    {business.neighborhood && (
                      <span className="ml-1 text-gray-500">· Col. {business.neighborhood}</span>
                    )}
                  </div>
                )}
                {business.phone && (
                  <a
                    href={`tel:${business.phone}`}
                    className="flex items-center text-primary hover:underline"
                  >
                    <span className="mr-2">📞</span>
                    {business.phone}
                  </a>
                )}
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-primary hover:underline"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Sitio web
                  </a>
                )}
              </div>

              {/* Social Links */}
              {(business.facebook_url || business.instagram_url || business.tiktok_url) && (
                <div className="flex items-center gap-3 mt-3">
                  {business.facebook_url && (
                    <a
                      href={business.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-gray-100 hover:bg-[#1877F2]/10 text-gray-600 hover:text-[#1877F2] transition-colors"
                      aria-label="Facebook"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                  )}
                  {business.instagram_url && (
                    <a
                      href={business.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-gray-100 hover:bg-[#E4405F]/10 text-gray-600 hover:text-[#E4405F] transition-colors"
                      aria-label="Instagram"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 11-2.88 0 1.441 1.441 0 012.88 0z"/>
                      </svg>
                    </a>
                  )}
                  {business.tiktok_url && (
                    <a
                      href={business.tiktok_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-gray-100 hover:bg-black/10 text-gray-600 hover:text-black transition-colors"
                      aria-label="TikTok"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 flex flex-col gap-2">
              {business.whatsapp && (
                <a
                  href={`https://wa.me/52${business.whatsapp}?text=Hola, vi tu negocio en SomosLagos y me gustaría más información`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                >
                  <span className="mr-2">💬</span>
                  Contactar por WhatsApp
                </a>
              )}
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Mira este negocio en Lagos de Moreno: ${business.name} 👉 https://www.somoslagos.com.mx/negocios/${business.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-6 py-3 border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/>
                </svg>
                Compartir
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Photo Gallery Carousel */}
      {photos.length > 0 && (
        <PhotoCarousel photos={photos} businessName={business.name} />
      )}

      {/* Map Section */}
      {business.latitude && business.longitude && (
        <div className="container mx-auto px-4 py-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ubicación</h2>
          <MapDisplay
            latitude={business.latitude}
            longitude={business.longitude}
            businessName={business.name}
            address={business.address}
          />
        </div>
      )}

      {/* Hours Section */}
      {business.business_hours && (
        <div className="container mx-auto px-4 py-6">
          <BusinessHoursDisplay hours={business.business_hours} />
        </div>
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Products & Services Sections */}
        {canShowProducts && products.length > 0 && (() => {
          const productItems = products.filter(p => p.type !== 'servicio')
          const serviceItems = products.filter(p => p.type === 'servicio')
          const canReceiveOrders = ORDER_ENABLED_TIERS.includes(business.subscription_tier)
          const bType = business.business_type || 'productos'

          return (
            <>
              {/* Products */}
              {productItems.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {bType === 'ambos' ? 'Productos' : bType === 'servicios' ? 'Servicios' : 'Productos'}
                  </h2>
                  <ProductList
                    products={productItems}
                    businessId={business.id}
                    businessName={business.name}
                    businessSlug={business.slug}
                    businessWhatsapp={business.whatsapp}
                    canReceiveOrders={canReceiveOrders}
                  />
                </section>
              )}

              {/* Services */}
              {serviceItems.length > 0 && (
                <section className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Servicios</h2>
                  <ProductList
                    products={serviceItems}
                    businessId={business.id}
                    businessName={business.name}
                    businessSlug={business.slug}
                    businessWhatsapp={business.whatsapp}
                    canReceiveOrders={canReceiveOrders}
                  />
                </section>
              )}
            </>
          )
        })()}

        {/* No Products Message */}
        {canShowProducts && products.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <span className="text-6xl mb-4 block">{business.business_type === 'servicios' ? '🔧' : '📦'}</span>
            <p className="text-gray-600">
              {business.business_type === 'servicios'
                ? 'Este negocio aún no ha agregado servicios'
                : business.business_type === 'ambos'
                ? 'Este negocio aún no ha agregado productos ni servicios'
                : 'Este negocio aún no ha agregado productos'}
            </p>
          </div>
        )}

        {/* Contact Section for non-product plans */}
        {!canShowProducts && (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contacta a {business.name}</h2>
            <p className="text-gray-600 mb-6">
              Comunícate directamente con este negocio para conocer sus productos y servicios
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {business.phone && (
                <a
                  href={`tel:${business.phone}`}
                  className="inline-flex items-center px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
                >
                  <span className="mr-2">📞</span>
                  Llamar
                </a>
              )}
              {business.whatsapp && (
                <a
                  href={`https://wa.me/52${business.whatsapp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                >
                  <span className="mr-2">💬</span>
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-8">
          <ReviewsSection
            businessId={business.id}
            ownerId={business.owner_id}
            rating={business.rating}
            totalReviews={business.total_reviews}
            initialReviews={initialReviews}
          />
        </div>

        {/* Banner: Business Sidebar */}
        <div className="mt-8">
          <BannerDisplay placement="business_sidebar" />
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/buscar"
            className="text-primary hover:underline"
          >
            ← Volver a la búsqueda
          </Link>
        </div>
      </div>

      {/* Analytics: track page view */}
      <ViewTracker businessId={business.id} />
    </main>
  )
}
