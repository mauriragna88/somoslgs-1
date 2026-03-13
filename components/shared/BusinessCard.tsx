import Link from 'next/link'
import Image from 'next/image'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
import StarRating from '@/components/reviews/StarRating'
import FavoriteButton from '@/components/shared/FavoriteButton'

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
    business_hours: any
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
      className="bg-white rounded-2xl hover:shadow-2xl transition-all overflow-hidden group border border-gray-100 hover:border-transparent hover:-translate-y-1"
    >
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-primary via-accent to-warm"></div>

      {/* Image/Logo */}
      <div className="h-48 bg-surface relative overflow-hidden">
        {business.logo_url ? (
          <Image
            src={business.logo_url}
            alt={business.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary/5 to-primary/5">
            <span className="text-6xl text-secondary/30 font-bold">
              {business.name[0].toUpperCase()}
            </span>
          </div>
        )}
        {/* Category badge */}
        {showCategory && business.category && (
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 shadow-sm">
            {business.category.icon} {business.category.name}
          </div>
        )}
        {/* Avanzado/Featured badge */}
        {(business.subscription_tier === 'avanzado' || business.is_featured) && (
          <div className="absolute top-3 right-3 px-3 py-1.5 bg-gradient-to-r from-accent to-accent-dark text-secondary rounded-full text-xs font-bold shadow-lg">
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
          <h2 className="text-lg font-bold text-secondary group-hover:text-primary transition-colors">
            {business.name}
          </h2>
          <OpenClosedBadge businessHours={business.business_hours} />
        </div>
        {business.description && (
          <p className="text-sm text-gray-500 mt-1.5 line-clamp-2">
            {business.description}
          </p>
        )}
        {business.address && (
          <p className="text-sm text-gray-400 mt-2.5 flex items-center">
            <span className="mr-1.5 text-accent">&#128205;</span>
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
      <div className="px-5 py-3 border-t border-gray-50 flex items-center justify-between">
        <span className="text-sm text-primary font-semibold">Ver negocio</span>
        <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary transition-colors">
          <svg className="w-3.5 h-3.5 text-primary group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
