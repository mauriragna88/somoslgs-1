import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ORDER_ENABLED_TIERS } from '@/lib/constants'
import ProductList from '@/components/public/ProductList'
import PhotoCarousel from '@/components/public/PhotoCarousel'

export const revalidate = 1800

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('name, description, logo_url, slug, category:categories(name)')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single() as unknown as { data: { name: string; description: string | null; logo_url: string | null; slug: string; category: { name: string } | null } | null }

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
      ...(business.logo_url && {
        images: [{ url: business.logo_url, width: 400, height: 400, alt: business.name }],
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
  subscription_tier: string
  category: { id: string; name: string; icon: string } | null
  // Datos bancarios para pagos por transferencia
  bank_name: string | null
  bank_account_holder: string | null
  bank_account_number: string | null
  bank_clabe: string | null
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
  const canShowProducts = ['ventas', 'delivery', 'premium'].includes(business.subscription_tier)
  let products: any[] = []

  if (canShowProducts) {
    const { data } = await supabase
      .from('products')
      .select('id, name, description, price, image_url, images, is_available, stock')
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
      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Logo */}
            <div className="w-32 h-32 rounded-xl overflow-hidden bg-gray-200 flex-shrink-0 relative">
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{business.name}</h1>
              {business.description && (
                <p className="text-gray-600 mb-4">{business.description}</p>
              )}

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 text-sm">
                {business.address && (
                  <div className="flex items-center text-gray-600">
                    <span className="mr-2">📍</span>
                    {business.address}
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
              </div>
            </div>

            {/* WhatsApp Button */}
            {business.whatsapp && (
              <div className="flex-shrink-0">
                <a
                  href={`https://wa.me/52${business.whatsapp}?text=Hola, vi tu negocio en SomosLagos y me gustaría más información`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
                >
                  <span className="mr-2">💬</span>
                  Contactar por WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Photo Gallery Carousel */}
      {photos.length > 0 && (
        <PhotoCarousel photos={photos} businessName={business.name} />
      )}

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Products Section */}
        {canShowProducts && products.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Productos</h2>
            <ProductList
              products={products}
              businessId={business.id}
              businessName={business.name}
              businessSlug={business.slug}
              businessWhatsapp={business.whatsapp}
              canReceiveOrders={ORDER_ENABLED_TIERS.includes(business.subscription_tier)}
            />
          </section>
        )}

        {/* No Products Message */}
        {canShowProducts && products.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm">
            <span className="text-6xl mb-4 block">📦</span>
            <p className="text-gray-600">Este negocio aún no ha agregado productos</p>
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
    </main>
  )
}
