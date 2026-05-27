import Link from 'next/link'
import Image from 'next/image'
import type { MarketplaceListing } from '@/types/database.types'
import { MARKETPLACE_CONDITIONS, MARKETPLACE_PRICE_TYPES } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 3600) return `hace ${Math.max(1, Math.floor(diff / 60))} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} días`
  return `hace ${Math.floor(diff / 2592000)} meses`
}

function ListingMiniCard({ listing }: { listing: MarketplaceListing }) {
  const mainImage = listing.images?.[0]
  const conditionLabel = MARKETPLACE_CONDITIONS[listing.condition]

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'rgba(255,253,248,0.05)',
        border: '1px solid rgba(255,253,248,0.1)',
      }}
    >
      {/* Image */}
      <div className="relative h-44 bg-white/5 overflow-hidden flex-shrink-0">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-30">📦</span>
          </div>
        )}

        {/* Condition badge */}
        <span
          className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full"
          style={{
            background: 'rgba(10,6,2,0.75)',
            backdropFilter: 'blur(8px)',
            color: 'rgba(255,253,248,0.85)',
          }}
        >
          {conditionLabel}
        </span>

        {/* Featured badge */}
        {listing.is_featured && (
          <span
            className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--gold)', color: 'var(--ink)' }}
          >
            ★ Destacado
          </span>
        )}

        {/* Hover accent line */}
        <div
          className="absolute inset-x-0 bottom-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(90deg, var(--coral), var(--gold))' }}
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        {/* Price */}
        <div>
          {listing.price_type === 'gratis' ? (
            <span className="text-base font-black" style={{ color: '#22C55E' }}>Gratis</span>
          ) : listing.price_type === 'intercambio' ? (
            <span className="text-base font-black" style={{ color: 'var(--gold)' }}>Intercambio</span>
          ) : (
            <span className="text-base font-black" style={{ color: 'var(--ivory)' }}>
              {formatCurrency(listing.price)}
              {listing.price_type === 'negociable' && (
                <span className="text-[11px] font-normal ml-1.5" style={{ color: 'rgba(255,253,248,0.4)' }}>negociable</span>
              )}
            </span>
          )}
        </div>

        {/* Title */}
        <h3
          className="text-sm font-semibold leading-snug line-clamp-2 transition-colors duration-200 group-hover:text-white"
          style={{ color: 'rgba(255,253,248,0.75)' }}
        >
          {listing.title}
        </h3>

        {/* Meta */}
        <p className="text-[11px] mt-auto" style={{ color: 'rgba(255,253,248,0.3)' }}>
          {listing.location && <span>{listing.location} · </span>}
          {timeAgo(listing.created_at)}
        </p>
      </div>
    </Link>
  )
}

interface MarketplaceStripProps {
  listings: MarketplaceListing[]
}

export default function MarketplaceStrip({ listings }: MarketplaceStripProps) {
  if (!listings || listings.length === 0) return null

  return (
    <section
      className="py-16"
      style={{
        background: `
          radial-gradient(ellipse at 20% 50%, rgba(245,185,66,0.07) 0%, transparent 55%),
          radial-gradient(ellipse at 80% 20%, rgba(255,107,53,0.06) 0%, transparent 50%),
          var(--ink)
        `,
      }}
    >
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
          <div>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
              style={{ background: 'rgba(245,185,66,0.12)', color: 'var(--gold)', border: '1px solid rgba(245,185,66,0.2)' }}
            >
              🛍️ Marketplace
            </span>
            <h2
              className="text-4xl md:text-5xl font-black"
              style={{
                fontFamily: 'var(--display)',
                color: 'var(--ivory)',
                lineHeight: 0.96,
                letterSpacing: '-0.03em',
              }}
            >
              Compra y vende{' '}
              <em
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: 'var(--gold)',
                }}
              >
                en Lagos
              </em>
            </h2>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <Link
              href="/marketplace/publicar"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all hover:opacity-90"
              style={{ background: 'var(--gold)', color: 'var(--ink)' }}
            >
              + Publicar gratis
            </Link>
            <Link
              href="/marketplace"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all hover:opacity-80"
              style={{
                border: '1px solid rgba(255,253,248,0.18)',
                color: 'rgba(255,253,248,0.65)',
              }}
            >
              Ver todo →
            </Link>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {listings.map((listing) => (
            <ListingMiniCard key={listing.id} listing={listing} />
          ))}
        </div>

      </div>
    </section>
  )
}
