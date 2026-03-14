import Link from 'next/link'
import BusinessCard from '@/components/shared/BusinessCard'
import type { Activity } from '@/lib/tourism'

interface ActivityCardProps {
  activity: Activity
  businesses: any[]
  categorySlug?: string
}

export default function ActivityCard({ activity, businesses, categorySlug }: ActivityCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
      {/* Header con gradiente */}
      <div className={`bg-gradient-to-r ${activity.gradient} p-6 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
        <span className="text-4xl block mb-2 drop-shadow-md">{activity.icon}</span>
        <h3 className="text-xl font-bold text-white drop-shadow-sm">{activity.title}</h3>
        <p className="text-white/90 text-sm mt-2 leading-relaxed max-w-lg">{activity.longDescription}</p>
      </div>

      {/* Negocios relacionados */}
      {businesses.length > 0 && (
        <div className="p-6">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Negocios que te recomendamos
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {businesses.slice(0, 4).map((biz: any) => (
              <BusinessCard key={biz.id} business={biz} />
            ))}
          </div>
          {categorySlug && (
            <div className="text-center mt-6">
              <Link
                href={`/categorias/${categorySlug}`}
                className="inline-flex items-center gap-2 text-primary font-semibold hover:underline text-sm"
              >
                Ver todos los negocios de esta categoría
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
