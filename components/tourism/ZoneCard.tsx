import type { Zone } from '@/lib/tourism'

interface ZoneCardProps {
  zone: Zone
  compact?: boolean
}

export default function ZoneCard({ zone, compact = false }: ZoneCardProps) {
  if (compact) {
    return (
      <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 cursor-default">
        <div className={`bg-gradient-to-br ${zone.gradient} p-6 h-full min-h-[200px] flex flex-col justify-between relative`}>
          {/* Decorative pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-3 right-3 w-24 h-24 border-2 border-white rounded-full" />
            <div className="absolute top-6 right-6 w-16 h-16 border-2 border-white rounded-full" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border border-white/50 rounded-full" />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-2/3 bg-gradient-to-t from-black/40 to-transparent" />

          {/* Icon top */}
          <div className="relative z-10">
            <span className="text-5xl drop-shadow-lg block">{zone.icon}</span>
          </div>

          {/* Text bottom */}
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{zone.name}</h3>
            <p className="text-white/90 text-sm mt-1 line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">{zone.description}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
      <div className={`bg-gradient-to-br ${zone.gradient} relative`}>
        {/* Decorative pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-6 right-6 w-32 h-32 border-2 border-white rounded-full" />
          <div className="absolute top-10 right-10 w-20 h-20 border-2 border-white rounded-full" />
          <div className="absolute bottom-8 left-6 w-16 h-16 border border-white/50 rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-8 h-8 border border-white/30 rounded-full" />
        </div>

        {/* Icon area */}
        <div className="pt-8 px-8 relative z-10">
          <span className="text-6xl drop-shadow-lg block">{zone.icon}</span>
        </div>

        {/* Content with dark overlay for readability */}
        <div className="mt-4 bg-gradient-to-t from-black/50 via-black/30 to-transparent p-8 pt-6">
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] mb-2">{zone.name}</h3>
            <p className="text-white text-sm leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">{zone.longDescription}</p>
            {zone.coordinates && (
              <a
                href={`https://www.google.com/maps?q=${zone.coordinates.lat},${zone.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-4 text-xs font-medium text-white bg-white/20 hover:bg-white/30 px-4 py-2 rounded-full transition-colors backdrop-blur-sm"
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
      </div>
    </div>
  )
}
