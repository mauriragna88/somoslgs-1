'use client'

import Link from 'next/link'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import { MARKETPLACE_CONDITIONS, MARKETPLACE_PRICE_TYPES } from '@/lib/constants'
import type { MarketplaceListing } from '@/types/database.types'

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} días`
  if (diff < 31536000) return `hace ${Math.floor(diff / 2592000)} meses`
  return `hace ${Math.floor(diff / 31536000)} años`
}

interface ListingCardProps {
  listing: MarketplaceListing
}

export default function ListingCard({ listing }: ListingCardProps) {
  const mainImage = listing.images?.[0]
  const conditionLabel = MARKETPLACE_CONDITIONS[listing.condition]
  const priceLabel = MARKETPLACE_PRICE_TYPES[listing.price_type]

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className={`bg-white rounded-2xl hover:shadow-2xl transition-all overflow-hidden group border hover:-translate-y-1 ${
        listing.is_featured
          ? 'border-accent/50 ring-1 ring-accent/20'
          : 'border-gray-100 hover:border-transparent'
      }`}
    >
      {/* Top accent */}
      <div className={`h-1 ${
        listing.is_featured
          ? 'bg-gradient-to-r from-accent via-amber-400 to-accent'
          : 'bg-gradient-to-r from-primary via-accent to-warm'
      }`} />

      {/* Image */}
      <div className="h-48 bg-surface relative overflow-hidden">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={listing.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/5 to-primary/5">
            <span className="text-5xl">📦</span>
          </div>
        )}

        {/* Condition badge */}
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 shadow-sm">
          {conditionLabel}
        </div>

        {/* Featured badge */}
        {listing.is_featured && (
          <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-accent to-accent-dark text-secondary rounded-full text-xs font-bold shadow-lg">
            &#11088; Destacado
          </div>
        )}

        {/* Photo count */}
        {listing.images && listing.images.length > 1 && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 text-white rounded-lg text-xs font-medium">
            {listing.images.length} fotos
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Price */}
        <div className="mb-1">
          {listing.price_type === 'gratis' ? (
            <span className="text-lg font-bold text-green-600">Gratis</span>
          ) : listing.price_type === 'intercambio' ? (
            <span className="text-lg font-bold text-purple-600">Intercambio</span>
          ) : (
            <span className="text-lg font-bold text-secondary">
              {formatCurrency(listing.price)}
              {listing.price_type === 'negociable' && (
                <span className="text-xs font-normal text-gray-500 ml-1.5">{priceLabel}</span>
              )}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-secondary group-hover:text-primary transition-colors line-clamp-2 text-sm">
          {listing.title}
        </h3>

        {/* Location + Time */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
          <span className="truncate">
            {listing.location && (
              <>
                <span className="mr-1">&#128205;</span>
                {listing.location}
              </>
            )}
          </span>
          <span className="flex-shrink-0 ml-2">{timeAgo(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  )
}
