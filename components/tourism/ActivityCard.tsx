import Link from 'next/link'
import Image from 'next/image'
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
      {/* Header con imagen y texto */}
      <div className="relative overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Imagen */}
          <div className="relative w-full md:w-72 h-48 md:h-auto md:min-h-[200px] shrink-0">
            <Image
              src={activity.image}
              alt={activity.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 288px"
            />
            {/* Icon badge on image */}
            <div className="absolute top-4 left-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">{activity.icon}</span>
            </div>
          </div>

          {/* Texto sobre fondo sólido (siempre legible) */}
          <div className="flex-1 p-6">
            <h3 className="text-xl font-bold text-secondary mb-2">{activity.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{activity.longDescription}</p>
          </div>
        </div>
      </div>

      {/* Negocios relacionados */}
      {businesses.length > 0 && (
        <div className="p-6 border-t border-gray-100">
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
