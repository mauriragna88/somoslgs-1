'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import FavoriteButton from '@/components/shared/FavoriteButton'
import StarRating from '@/components/reviews/StarRating'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
import type { BusinessHours } from '@/lib/constants'

const WA_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.337 11.891-11.893 11.891a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.711.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
)

interface BusinessCardProps {
  business: {
    id: string
    name: string
    slug: string
    description: string | null
    logo_url: string | null
    address: string | null
    neighborhood?: string | null
    phone?: string | null
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

function StarRow({ rating, count }: { rating: number; count: number }) {
  if (count === 0) return null
  const filled = Math.round(Math.min(Math.max(rating, 0), 5))
  return (
    <div className="biz__rating">
      <span className="stars">{'★'.repeat(filled)}{'☆'.repeat(5 - filled)}</span>
      {rating.toFixed(1)} · {count} reseñas
    </div>
  )
}

function BizRow({ slug, phone }: { slug: string; phone?: string | null }) {
  return (
    <div className="biz__row" onClick={e => e.stopPropagation()}>
      <Link
        href={`/negocios/${slug}`}
        className="flex-1 h-[42px] flex items-center justify-center rounded-full text-white text-sm font-semibold transition-colors"
        style={{ background: 'var(--coral)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--coral-deep)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'var(--coral)')}
      >
        Ver perfil
      </Link>
      {phone && (
        <a
          href={`https://wa.me/${phone.replace(/\D/g, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactar por WhatsApp"
          className="h-[42px] px-[14px] flex items-center justify-center rounded-full text-white transition-colors"
          style={{ background: '#25D366' }}
        >
          {WA_SVG}
        </a>
      )}
    </div>
  )
}

export default function BusinessCard({ business, showCategory = true, variant }: BusinessCardProps) {
  const tierVariant = getTierVariant(business.subscription_tier, variant)
  if (tierVariant === 'avanzado') return <AvanzadoCard business={business} showCategory={showCategory} />
  if (tierVariant === 'pro') return <ProCard business={business} showCategory={showCategory} />
  return <CompactCard business={business} showCategory={showCategory} />
}

/* ═══════════════════════════════════════════════════════════
   AVANZADO — Premium editorial card, gold badge, mini gallery
   ═══════════════════════════════════════════════════════════ */
function AvanzadoCard({ business, showCategory }: { business: BusinessCardProps['business']; showCategory: boolean }) {
  const router = useRouter()
  const heroImage = getDisplayImage(business)
  const photos = business.business_photos || []

  return (
    <article className="biz cursor-pointer" onClick={() => router.push(`/negocios/${business.slug}`)}>
      <div className="biz__media">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={business.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--gold), var(--coral))' }} />
        )}
        <span className="biz__badge">
          <span className="b-dot" style={{ background: 'var(--gold)' }} />
          Premium · Verificado
        </span>
        <div className="biz__fav" onClick={e => e.stopPropagation()}>
          <FavoriteButton businessId={business.id} />
        </div>
      </div>

      <div className="biz__body">
        {showCategory && business.category && (
          <div className="biz__cat">{business.category.icon} {business.category.name}</div>
        )}
        <div className="biz__name">{business.name}</div>
        {(business.neighborhood || business.address || hasCompleteBusinessHours(business.business_hours)) && (
          <div className="biz__meta">
            {business.neighborhood && <span>{business.neighborhood}</span>}
            {business.neighborhood && business.address && <span className="dot" />}
            {business.address && <span className="truncate max-w-[140px]">{business.address}</span>}
            {hasCompleteBusinessHours(business.business_hours) && (
              <>
                <span className="dot" />
                <OpenClosedBadge businessHours={business.business_hours} />
              </>
            )}
          </div>
        )}
        <StarRow rating={business.rating} count={business.total_reviews} />
        <BizRow slug={business.slug} phone={business.phone} />
      </div>

      {photos.length > 1 && (
        <div className="biz__gallery">
          {photos.slice(0, 3).map((p, i) => (
            <div key={i} className="biz__gallery-thumb">
              <Image src={p.image_url} alt="" fill sizes="80px" className="object-cover" />
            </div>
          ))}
          {photos.length > 3 && (
            <div className="biz__gallery-more">+{photos.length - 3}</div>
          )}
        </div>
      )}
    </article>
  )
}

/* ═══════════════════════════════════════════════════════════
   PRO — Standard biz card with media, turquoise badge
   ═══════════════════════════════════════════════════════════ */
function ProCard({ business, showCategory }: { business: BusinessCardProps['business']; showCategory: boolean }) {
  const router = useRouter()
  const heroImage = getDisplayImage(business)

  return (
    <article className="biz cursor-pointer" onClick={() => router.push(`/negocios/${business.slug}`)}>
      <div className="biz__media">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={business.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-300"
          />
        ) : business.logo_url ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--coral), var(--gold))' }}>
            <div className="w-20 h-20 rounded-2xl overflow-hidden relative shadow-lg">
              <Image src={business.logo_url} alt={business.name} fill sizes="80px" className="object-cover" />
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--coral), var(--gold))' }}>
            <span className="text-4xl text-white font-bold opacity-80">{business.name[0]}</span>
          </div>
        )}
        <span className="biz__badge">
          <span className="b-dot" style={{ background: 'var(--turquoise)' }} />
          Pro
        </span>
        <div className="biz__fav" onClick={e => e.stopPropagation()}>
          <FavoriteButton businessId={business.id} />
        </div>
      </div>

      <div className="biz__body">
        {showCategory && business.category && (
          <div className="biz__cat">{business.category.icon} {business.category.name}</div>
        )}
        <div className="biz__name">{business.name}</div>
        {(business.neighborhood || business.address) && (
          <div className="biz__meta">
            {business.neighborhood && <span>{business.neighborhood}</span>}
            {business.neighborhood && business.address && <span className="dot" />}
            {business.address && <span className="truncate max-w-[160px]">{business.address}</span>}
            {hasCompleteBusinessHours(business.business_hours) && (
              <>
                <span className="dot" />
                <OpenClosedBadge businessHours={business.business_hours} />
              </>
            )}
          </div>
        )}
        <StarRow rating={business.rating} count={business.total_reviews} />
        <BizRow slug={business.slug} phone={business.phone} />
      </div>
    </article>
  )
}

/* ═══════════════════════════════════════════════════════════
   COMPACT — Body-only card for emprendedor / gratis tiers
   ═══════════════════════════════════════════════════════════ */
function CompactCard({ business, showCategory }: { business: BusinessCardProps['business']; showCategory: boolean }) {
  const router = useRouter()

  return (
    <article className="biz cursor-pointer" onClick={() => router.push(`/negocios/${business.slug}`)}>
      <div className="biz__body">
        <div className="flex items-center gap-3">
          {business.logo_url ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative ring-1" style={{ '--tw-ring-color': 'var(--hairline)' } as React.CSSProperties}>
              <Image src={business.logo_url} alt={business.name} fill sizes="48px" className="object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--coral), var(--gold))' }}>
              <span className="text-lg text-white font-bold">{business.name[0].toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[17px] leading-tight tracking-tight truncate" style={{ color: 'var(--ink)', fontFamily: 'var(--display)' }}>
              {business.name}
            </h3>
            {showCategory && business.category && (
              <div className="biz__cat mt-0.5">{business.category.icon} {business.category.name}</div>
            )}
          </div>
          <div onClick={e => e.stopPropagation()} className="flex-shrink-0">
            <FavoriteButton businessId={business.id} />
          </div>
        </div>

        {business.description && (
          <p className="text-[13px] line-clamp-2 mt-1" style={{ color: 'var(--muted)' }}>{business.description}</p>
        )}

        {(business.neighborhood || business.address) && (
          <div className="biz__meta">
            {business.neighborhood && <span>{business.neighborhood}</span>}
            {business.neighborhood && business.address && <span className="dot" />}
            {business.address && <span className="truncate max-w-[180px]">{business.address}</span>}
          </div>
        )}

        <StarRow rating={business.rating} count={business.total_reviews} />
        <BizRow slug={business.slug} phone={business.phone} />
      </div>
    </article>
  )
}
