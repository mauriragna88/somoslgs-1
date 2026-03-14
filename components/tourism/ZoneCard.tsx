import type { Zone } from '@/lib/tourism'

interface ZoneCardProps {
  zone: Zone
  compact?: boolean
}

export default function ZoneCard({ zone, compact = false }: ZoneCardProps) {
  if (compact) {
    return (
      <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 border border-gray-100">
        {/* Gradient top with icon */}
        <div className={`bg-gradient-to-br ${zone.gradient} p-6 h-28 flex items-center justify-center relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-2 w-20 h-20 border-2 border-white rounded-full" />
            <div className="absolute bottom-2 left-2 w-12 h-12 border border-white/50 rounded-full" />
          </div>
          <span className="text-5xl drop-shadow-lg relative z-10 group-hover:scale-110 transition-transform duration-300">{zone.icon}</span>
        </div>
        {/* Text on solid background */}
        <div className="p-5 bg-white">
          <h3 className="text-base font-bold text-secondary">{zone.name}</h3>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">{zone.description}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100">
      {/* Gradient top with icon */}
      <div className={`bg-gradient-to-br ${zone.gradient} p-8 h-40 flex items-center justify-center relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-28 h-28 border-2 border-white rounded-full" />
          <div className="absolute top-8 right-8 w-16 h-16 border-2 border-white rounded-full" />
          <div className="absolute bottom-4 left-4 w-14 h-14 border border-white/50 rounded-full" />
        </div>
        <span className="text-7xl drop-shadow-lg relative z-10 group-hover:scale-110 transition-transform duration-300">{zone.icon}</span>
      </div>

      {/* Text on solid background */}
      <div className="p-6 bg-white">
        <h3 className="text-lg font-bold text-secondary mb-2">{zone.name}</h3>
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
