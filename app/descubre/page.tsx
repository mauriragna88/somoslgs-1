import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
import StarRating from '@/components/reviews/StarRating'
import PremiumSlider from '@/components/shared/PremiumSlider'

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
  const supabase = createClient()

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
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-12 md:py-16 text-center">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4">Explora</span>
          <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-3">
            Descubre Negocios en Lagos
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Conoce lo mejor que Lagos de Moreno tiene para ofrecer
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-10 max-w-6xl">
        {/* Nuevos */}
        {newest.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🆕</span>
              <h2 className="text-2xl font-bold text-secondary">Nuevos en SomosLagos</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {newest.map(b => {
                if (b.subscription_tier === 'avanzado') return <FeaturedCard key={b.id} business={b} />
                if (b.subscription_tier === 'pro') return <ProCardHorizontal key={b.id} business={b} />
                return <SimpleCard key={b.id} business={b} />
              })}
            </div>
          </section>
        )}

        {/* Avanzado — Slider + Large Cards */}
        {avanzado.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">⭐</span>
              <h2 className="text-2xl font-bold text-secondary">Negocios Verificados</h2>
            </div>
            <PremiumSlider businesses={avanzado} />
            {avanzado.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {avanzado.map(b => (
                  <FeaturedCard key={b.id} business={b} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Pro — Horizontal Cards */}
        {pro.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🏆</span>
              <h2 className="text-2xl font-bold text-secondary">Negocios Pro</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {pro.map(b => (
                <ProCardHorizontal key={b.id} business={b} />
              ))}
            </div>
          </section>
        )}

        {/* Gratis */}
        {gratis.length > 0 && (
          <section className="mb-14">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📍</span>
              <h2 className="text-2xl font-bold text-secondary">Todos los Negocios</h2>
            </div>
            <p className="text-gray-400 text-sm mb-5">Encuentra de todo en Lagos de Moreno — conoce lo que ofrecen</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {gratis.map(b => (
                <SimpleCard key={b.id} business={b} />
              ))}
            </div>
          </section>
        )}

        {all.length === 0 && (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">🏪</span>
            <p className="text-gray-500 text-lg mb-2">Aun no hay negocios registrados</p>
            <Link href="/registrar-negocio" className="text-primary font-semibold hover:underline">
              Se el primero en registrarte
            </Link>
          </div>
        )}

        {/* CTA */}
        <section className="text-center py-12 mt-4">
          <div className="bg-gradient-to-br from-secondary to-primary/90 rounded-3xl p-8 md:p-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              ¿Tienes un negocio en Lagos?
            </h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              Registrate gratis y aparece aqui para que miles de personas te encuentren
            </p>
            <Link
              href="/registrar-negocio"
              className="inline-block bg-accent hover:bg-accent-dark text-secondary px-8 py-3 rounded-full font-bold text-lg transition-all hover:scale-105"
            >
              Registrar mi Negocio GRATIS
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}

/* ============================================
   Card Components (inline, same file)
   ============================================ */

function getDisplayImage(business: DiscoverBusiness): string | null {
  if (business.cover_url) return business.cover_url
  if (business.business_photos?.length > 0) return business.business_photos[0].image_url
  return null
}

// --- Avanzado: Card grande con imagen hero + mini galeria ---
function FeaturedCard({ business }: { business: DiscoverBusiness }) {
  const heroImage = getDisplayImage(business)
  const photos = business.business_photos || []

  return (
    <Link
      href={`/negocios/${business.slug}`}
      className="group bg-gradient-to-br from-amber-50 to-white rounded-2xl overflow-hidden border-2 border-accent/40 hover:shadow-2xl hover:-translate-y-1 transition-all relative"
    >
      {/* Verified badge */}
      <div className="absolute top-3 right-3 z-10 bg-accent text-secondary text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        Verificado
      </div>

      {/* Hero image */}
      {heroImage ? (
        <div className="relative h-52 md:h-60 bg-gray-100">
          <Image src={heroImage} alt={business.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      ) : (
        <div className="h-52 md:h-60 bg-gradient-to-br from-accent/10 to-primary/10" />
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">
          {business.logo_url ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-accent/30 -mt-10 relative bg-white shadow-lg">
              <Image src={business.logo_url} alt={business.name} fill sizes="56px" className="object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 bg-gradient-to-br from-accent to-accent-dark rounded-xl flex items-center justify-center flex-shrink-0 -mt-10 shadow-lg">
              <span className="text-xl text-secondary font-bold">{business.name[0].toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-secondary group-hover:text-primary transition-colors truncate text-lg">{business.name}</h3>
              <OpenClosedBadge businessHours={business.business_hours} />
            </div>
            {business.category && (
              <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full">{business.category.icon} {business.category.name}</span>
            )}
          </div>
        </div>

        {business.description && (
          <p className="text-sm text-gray-600 mt-3 line-clamp-3">{business.description}</p>
        )}

        {/* Mini photo gallery */}
        {photos.length > 1 && (
          <div className="flex gap-2 mt-3">
            {photos.slice(0, 3).map((p, i) => (
              <div key={i} className="relative w-20 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                <Image src={p.image_url} alt="" fill sizes="80px" className="object-cover" />
              </div>
            ))}
            {photos.length > 3 && (
              <div className="w-20 h-14 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-gray-500">+{photos.length - 3}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          {business.total_reviews > 0 ? (
            <StarRating value={business.rating} count={business.total_reviews} size="sm" />
          ) : (
            <span />
          )}
          {business.neighborhood && (
            <span className="text-xs text-gray-400">{business.neighborhood}</span>
          )}
        </div>
      </div>

      <div className="h-1 bg-gradient-to-r from-accent via-primary to-accent" />
    </Link>
  )
}

// --- Pro: Horizontal card (image left, info right on desktop) ---
function ProCardHorizontal({ business }: { business: DiscoverBusiness }) {
  const heroImage = getDisplayImage(business)

  return (
    <Link
      href={`/negocios/${business.slug}`}
      className="group bg-white rounded-2xl overflow-hidden border border-primary/20 hover:shadow-xl hover:-translate-y-1 transition-all relative flex flex-col sm:flex-row"
    >
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 bg-primary text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">PRO</div>

      {/* Image section */}
      {heroImage ? (
        <div className="relative h-44 sm:h-auto sm:w-48 md:w-56 flex-shrink-0 bg-gray-100">
          <Image src={heroImage} alt={business.name} fill sizes="(max-width: 640px) 100vw, 224px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : business.logo_url ? (
        <div className="h-44 sm:h-auto sm:w-48 md:w-56 flex-shrink-0 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
          <div className="w-16 h-16 rounded-xl overflow-hidden relative">
            <Image src={business.logo_url} alt={business.name} fill sizes="64px" className="object-cover" />
          </div>
        </div>
      ) : (
        <div className="h-44 sm:h-auto sm:w-48 md:w-56 flex-shrink-0 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-secondary to-secondary-light rounded-xl flex items-center justify-center">
            <span className="text-2xl text-white font-bold">{business.name[0].toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="flex-1 p-5 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
          {business.logo_url && (
            <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 relative ring-1 ring-primary/20 hidden sm:block">
              <Image src={business.logo_url} alt="" fill sizes="36px" className="object-cover" />
            </div>
          )}
          <h3 className="font-bold text-lg text-secondary group-hover:text-primary transition-colors truncate">{business.name}</h3>
          <OpenClosedBadge businessHours={business.business_hours} />
        </div>
        {business.category && (
          <span className="inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full w-fit mb-2">{business.category.icon} {business.category.name}</span>
        )}
        {business.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-2">{business.description}</p>
        )}
        {business.total_reviews > 0 && (
          <div><StarRating value={business.rating} count={business.total_reviews} size="sm" /></div>
        )}
        {business.neighborhood && (
          <span className="text-xs text-gray-400 mt-1">{business.neighborhood}</span>
        )}
        <span className="text-sm text-primary font-semibold mt-2 group-hover:underline">Ver negocio →</span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary/40 to-primary/10" />
    </Link>
  )
}

// --- Gratis: Card simple with description snippet ---
function SimpleCard({ business }: { business: DiscoverBusiness }) {
  return (
    <Link
      href={`/negocios/${business.slug}`}
      className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all p-4"
    >
      <div className="flex items-center gap-3">
        {business.logo_url ? (
          <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 relative ring-1 ring-gray-100">
            <Image src={business.logo_url} alt={business.name} fill sizes="44px" className="object-cover" />
          </div>
        ) : (
          <div className="w-11 h-11 bg-gradient-to-br from-secondary to-secondary-light rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-sm text-white font-bold">{business.name[0].toUpperCase()}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-secondary group-hover:text-primary transition-colors truncate">
            {business.name}
          </h3>
          {business.category && (
            <span className="text-xs text-gray-400">
              {business.category.icon} {business.category.name}
            </span>
          )}
          {business.total_reviews > 0 && (
            <div className="mt-0.5">
              <StarRating value={business.rating} count={business.total_reviews} size="sm" />
            </div>
          )}
        </div>
      </div>
      {business.description && (
        <p className="text-xs text-gray-400 line-clamp-2 mt-2">{business.description}</p>
      )}
    </Link>
  )
}
