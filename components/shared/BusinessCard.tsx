import Link from 'next/link'
import Image from 'next/image'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
import StarRating from '@/components/reviews/StarRating'
import FavoriteButton from '@/components/shared/FavoriteButton'
import TierBadge from '@/components/shared/TierBadge'
import type { BusinessHours } from '@/lib/constants'

interface BusinessCardProps {
  business: {
    id: string
    name: string
    slug: string
    description: string | null
    logo_url: string | null
    address: string | null
    neighborhood?: string | null
    subscription_tier: string
    is_featured: boolean
    business_hours: BusinessHours | null
    rating: number
    total_reviews: number
    category: { id?: string; name: string; icon: string } | null
    cover_url?: string | null
    business_photos?: { image_url: string }[]
  }
  showCategory?: boolean
  variant?: 'auto' | 'avanzado' | 'pro' | 'compact'
}

function getDisplayImage(business: BusinessCardProps['business']): string | null {
  if (business.cover_url) return business.cover_url
  if (business.business_photos && business.business_photos.length > 0) return business.business_photos[0].image_url
  return null
}

function getTierVariant(tier: string, variant?: string): 'avanzado' | 'pro' | 'compact' {
  if (variant === 'avanzado') return 'avanzado'
  if (variant === 'pro') return 'pro'
  if (variant === 'compact') return 'compact'
  if (tier === 'avanzado') return 'avanzado'
  if (tier === 'pro') return 'pro'
  return 'compact'
}

function hasCompleteBusinessHours(hours: BusinessHours | null): hours is BusinessHours {
  return Boolean(hours?.weekdays && hours.saturday && hours.sunday)
}

export default function BusinessCard({ business, showCategory = true, variant }: BusinessCardProps) {
  const tierVariant = getTierVariant(business.subscription_tier, variant)

  if (tierVariant === 'avanzado') return <AvanzadoCard business={business} showCategory={showCategory} />
  if (tierVariant === 'pro') return <ProCard business={business} showCategory={showCategory} />
  return <CompactCard business={business} showCategory={showCategory} />
}

/* ═══════════════════════════════════════════════════════════════
   AVANZADO — Editorial premium card with gold accent, verified
   badge, hero image, logo overlap, mini gallery
   ═══════════════════════════════════════════════════════════════ */
function AvanzadoCard({ business, showCategory }: { business: BusinessCardProps['business']; showCategory: boolean }) {
  const heroImage = getDisplayImage(business)
  const photos = business.business_photos || []

  return (
    <Link
      href={`/negocios/${business.slug}`}
      className="group pueblo-card-avanzado rounded-2xl overflow-hidden relative"
    >
      {/* Gold accent top stripe */}
      <div className="h-1 bg-gradient-to-r from-pueblo-barroco via-yellow-500/60 to-pueblo-barroco" />

      {/* Verified badge */}
      <div className="absolute top-4 left-4 z-10">
        <FavoriteButton businessId={business.id} />
      </div>
      <div className="absolute top-4 right-4 z-10">
        <TierBadge tier="avanzado" />
      </div>

      {/* Hero image */}
      {heroImage ? (
        <div className="relative h-56 bg-pueblo-crema">
          <Image src={heroImage} alt={business.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-pueblo-noche/50 via-transparent to-transparent" />
        </div>
      ) : (
        <div className="h-56 bg-gradient-to-br from-pueblo-barroco/15 to-pueblo-cantera/10 flex items-center justify-center">
          <span className="text-5xl opacity-20">&#127978;</span>
        </div>
      )}

      {/* Content */}
      <div className="p-5 pb-4">
        <div className="flex items-start gap-4">
          {business.logo_url ? (
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-pueblo-barroco/40 -mt-10 relative bg-white shadow-lg shadow-pueblo-barroco/20">
              <Image src={business.logo_url} alt={business.name} fill sizes="56px" className="object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 bg-gradient-to-br from-pueblo-barroco to-pueblo-terracotta rounded-xl flex items-center justify-center flex-shrink-0 -mt-10 shadow-lg shadow-pueblo-barroco/30">
              <span className="text-xl text-pueblo-crema font-bold">{business.name[0].toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-lg text-pueblo-noche group-hover:text-pueblo-barroco transition-colors truncate">{business.name}</h3>
              {hasCompleteBusinessHours(business.business_hours) && <OpenClosedBadge businessHours={business.business_hours} />}
            </div>
            {showCategory && business.category && (
              <span className="inline-flex items-center text-xs text-pueblo-barroco bg-pueblo-barroco/10 px-2.5 py-0.5 rounded-full font-medium">{business.category.icon} {business.category.name}</span>
            )}
          </div>
        </div>

        {business.description && (
          <p className="text-sm text-pueblo-terracotta/70 mt-3 line-clamp-2">{business.description}</p>
        )}

        {/* Mini photo gallery */}
        {photos.length > 1 && (
          <div className="flex gap-2 mt-3">
            {photos.slice(0, 3).map((p, i) => (
              <div key={i} className="relative w-20 h-14 rounded-lg overflow-hidden bg-pueblo-crema flex-shrink-0 ring-1 ring-pueblo-barroco/20">
                <Image src={p.image_url} alt="" fill sizes="80px" className="object-cover" />
              </div>
            ))}
            {photos.length > 3 && (
              <div className="w-20 h-14 rounded-lg bg-pueblo-barroco/10 flex items-center justify-center flex-shrink-0 ring-1 ring-pueblo-barroco/20">
                <span className="text-xs font-semibold text-pueblo-barroco">+{photos.length - 3}</span>
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
            <span className="text-xs text-pueblo-terracotta/50">{business.neighborhood}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ═══════════════════════════════════════════════════════════════
   PRO — Professional horizontal card with cantera accent,
   PRO badge, image left / info right on larger screens
   ═══════════════════════════════════════════════════════════════ */
function ProCard({ business, showCategory }: { business: BusinessCardProps['business']; showCategory: boolean }) {
  const heroImage = getDisplayImage(business)

  return (
    <Link
      href={`/negocios/${business.slug}`}
      className="group pueblo-card-pro rounded-xl overflow-hidden relative flex flex-col sm:flex-row"
    >
      {/* PRO badge */}
      <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 z-10">
        <FavoriteButton businessId={business.id} />
      </div>
      <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 z-10">
        <TierBadge tier="pro" />
      </div>

      {/* Image section */}
      {heroImage ? (
        <div className="relative h-40 sm:h-auto sm:w-44 md:w-52 flex-shrink-0 bg-pueblo-crema">
          <Image src={heroImage} alt={business.name} fill sizes="(max-width: 640px) 100vw, 208px" className="object-cover group-hover:scale-105 transition-transform duration-300" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-pueblo-crema/10 hidden sm:block" />
        </div>
      ) : business.logo_url ? (
        <div className="h-40 sm:h-auto sm:w-44 md:w-52 flex-shrink-0 bg-gradient-to-br from-pueblo-cantera/10 to-pueblo-barroco/5 flex items-center justify-center">
          <div className="w-16 h-16 rounded-xl overflow-hidden relative shadow-md">
            <Image src={business.logo_url} alt={business.name} fill sizes="64px" className="object-cover" />
          </div>
        </div>
      ) : (
        <div className="h-40 sm:h-auto sm:w-44 md:w-52 flex-shrink-0 bg-gradient-to-br from-pueblo-cantera/10 to-pueblo-barroco/5 flex items-center justify-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pueblo-noche to-pueblo-terracotta rounded-xl flex items-center justify-center">
            <span className="text-2xl text-pueblo-crema font-bold">{business.name[0].toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Info section */}
      <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1">
          {business.logo_url && (
            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 relative ring-1 ring-pueblo-canteraLight/40 hidden sm:block">
              <Image src={business.logo_url} alt="" fill sizes="32px" className="object-cover" />
            </div>
          )}
          <h3 className="font-bold text-base text-pueblo-noche group-hover:text-pueblo-cantera transition-colors truncate">{business.name}</h3>
          {hasCompleteBusinessHours(business.business_hours) && <OpenClosedBadge businessHours={business.business_hours} />}
        </div>
        {showCategory && business.category && (
          <span className="inline-flex items-center text-xs text-pueblo-cantera bg-pueblo-cantera/10 px-2 py-0.5 rounded font-medium w-fit mb-2">{business.category.icon} {business.category.name}</span>
        )}
        {business.description && (
          <p className="text-sm text-pueblo-terracotta/60 line-clamp-2 mb-2">{business.description}</p>
        )}
        {business.total_reviews > 0 && (
          <div><StarRating value={business.rating} count={business.total_reviews} size="sm" /></div>
        )}
        {business.neighborhood && (
          <span className="text-xs text-pueblo-terracotta/40 mt-1">{business.neighborhood}</span>
        )}
        <span className="text-sm text-pueblo-cantera font-semibold mt-2 group-hover:underline">Ver negocio &rarr;</span>
      </div>
    </Link>
  )
}

/* ═══════════════════════════════════════════════════════════════
   COMPACT — Clean directory card for emprendedor/gratis tiers.
   Not ugly, just simpler. Left accent line, logo + info row.
   ═══════════════════════════════════════════════════════════════ */
function CompactCard({ business, showCategory }: { business: BusinessCardProps['business']; showCategory: boolean }) {
  return (
    <Link
      href={`/negocios/${business.slug}`}
      className="group pueblo-card-directory rounded-xl p-4 relative"
    >
      {/* Subtle left accent line */}
      <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-gradient-to-b from-pueblo-canteraLight to-transparent rounded-full" />
      <div className="flex items-center gap-3">
        {business.logo_url ? (
          <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 relative ring-1 ring-pueblo-canteraLight/30">
            <Image src={business.logo_url} alt={business.name} fill sizes="44px" className="object-cover" />
          </div>
        ) : (
          <div className="w-11 h-11 bg-gradient-to-br from-pueblo-noche/80 to-pueblo-terracotta rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-sm text-pueblo-crema font-bold">{business.name[0].toUpperCase()}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-pueblo-noche group-hover:text-pueblo-cantera transition-colors truncate">{business.name}</h3>
            {hasCompleteBusinessHours(business.business_hours) && <OpenClosedBadge businessHours={business.business_hours} />}
          </div>
          {showCategory && business.category && (
            <span className="text-xs text-pueblo-terracotta/60">{business.category.icon} {business.category.name}</span>
          )}
          {business.total_reviews > 0 && (
            <div className="mt-0.5"><StarRating value={business.rating} count={business.total_reviews} size="sm" /></div>
          )}
        </div>

        {/* Favorite button for all tiers */}
        <div className="flex-shrink-0">
          <FavoriteButton businessId={business.id} />
        </div>
      </div>
      {business.description && (
        <p className="text-xs text-pueblo-terracotta/50 line-clamp-2 mt-2">{business.description}</p>
      )}
      {business.address && (
        <p className="text-xs text-pueblo-terracotta/40 mt-1.5 flex items-center">
          <span className="mr-1 text-pueblo-cantera">&#128205;</span>
          {business.address}
        </p>
      )}
    </Link>
  )
}
