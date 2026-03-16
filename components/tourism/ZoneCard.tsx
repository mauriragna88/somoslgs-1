import Image from 'next/image'
import type { Zone } from '@/lib/tourism'

interface ZoneCardProps {
  zone: Zone
  compact?: boolean
}

export default function ZoneCard({ zone, compact = false }: ZoneCardProps) {
  if (compact) {
    return (
      <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl hover:scale-[1.03] transition-all duration-300">
        {/* Photo background */}
        <div className="relative h-52 overflow-hidden">
          <Image
            src={zone.image}
            alt={zone.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          {/* Icon badge */}
          <div className="absolute top-3 right-3 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <span className="text-lg">{zone.icon}</span>
          </div>
          {/* Text overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <h3 className="text-lg font-bold text-white drop-shadow-lg">{zone.name}</h3>
            <p className="text-white/90 text-sm mt-1 line-clamp-2 drop-shadow">{zone.description}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
      {/* Photo section */}
      <div className="relative h-56 overflow-hidden">
        <Image
          src={zone.image}
          alt={zone.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        {/* Icon badge */}
        <div className="absolute top-4 right-4 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/30">
          <span className="text-2xl drop-shadow">{zone.icon}</span>
        </div>
        {/* Title on photo */}
        <div className="absolute bottom-4 left-5 right-5">
          <h3 className="text-xl font-bold text-white drop-shadow-lg">{zone.name}</h3>
        </div>
      </div>

      {/* Description below */}
      <div className="p-5 bg-white">
        <p className="text-gray-600 text-sm leading-relaxed">{zone.longDescription}</p>
        {zone.coordinates && (
          <a
            href={`https://www.google.com/maps?q=${zone.coordinates.lat},${zone.coordinates.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-full transition-colors"
            aria-label={`Ver ${zone.name} en Google Maps`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Ver en mapa
          </a>
        )}
      </div>
    </div>
  )
}
