import Link from 'next/link'
import Image from 'next/image'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
import StarRating from '@/components/reviews/StarRating'
import FavoriteButton from '@/components/shared/FavoriteButton'
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
  }
  showCategory?: boolean
}

export default function BusinessCard({ business, showCategory = true }: BusinessCardProps) {
  return (
    <Link
      href={`/negocios/${business.slug}`}
      className="pueblo-card rounded-2xl hover:shadow-pueblo transition-all overflow-hidden group border border-pueblo-canteraLight/60 hover:border-pueblo-cantera/40 hover:-translate-y-1"
    >
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-pueblo-barroco via-pueblo-cantera to-pueblo-barroco"></div>

      {/* Image/Logo */}
      <div className="h-48 bg-pueblo-crema relative overflow-hidden">
        {business.logo_url ? (
          <Image
            src={business.logo_url}
            alt={business.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pueblo-barroco/10 to-pueblo-cantera/10">
            <span className="text-6xl text-pueblo-noche/20 font-bold">
              {business.name[0].toUpperCase()}
            </span>
          </div>
        )}
        {/* Category badge */}
        {showCategory && business.category && (
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-pueblo-terracotta shadow-sm">
            {business.category.icon} {business.category.name}
          </div>
        )}
        {/* Avanzado/Featured badge */}
        {(business.subscription_tier === 'avanzado' || business.is_featured) && (
          <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-pueblo-barroco to-pueblo-cantera text-pueblo-noche rounded-full text-xs font-bold shadow-lg">
            &#11088; Destacado
          </div>
        )}
        {/* Favorite button */}
        <div className="absolute bottom-3 right-3">
          <FavoriteButton businessId={business.id} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-pueblo-noche group-hover:text-pueblo-cantera transition-colors">
            {business.name}
          </h2>
          <OpenClosedBadge businessHours={business.business_hours} />
        </div>
        {business.description && (
          <p className="text-sm text-pueblo-terracotta/60 mt-1.5 line-clamp-2">
            {business.description}
          </p>
        )}
        {business.address && (
          <p className="text-sm text-pueblo-terracotta/40 mt-2.5 flex items-center">
            <span className="mr-1.5 text-pueblo-cantera">&#128205;</span>
            {business.address}
          </p>
        )}
        {business.total_reviews > 0 && (
          <div className="mt-2">
            <StarRating value={business.rating} count={business.total_reviews} size="sm" />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-pueblo-canteraLight/30 flex items-center justify-between">
        <span className="text-sm text-pueblo-cantera font-semibold">Ver negocio</span>
        <div className="w-7 h-7 bg-pueblo-cantera/10 rounded-full flex items-center justify-center group-hover:bg-pueblo-cantera transition-colors">
          <svg className="w-3.5 h-3.5 text-pueblo-cantera group-hover:text-pueblo-crema transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
