import type { Zone } from '@/lib/tourism'

interface ZoneCardProps {
  zone: Zone
  compact?: boolean
}

export default function ZoneCard({ zone, compact = false }: ZoneCardProps) {
  if (compact) {
    return (
      <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br shadow-lg hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 cursor-default">
        <div className={`bg-gradient-to-br ${zone.gradient} p-6 h-full min-h-[180px] flex flex-col justify-end relative`}>
          {/* Decorative circles */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-white/10 rounded-full blur-sm group-hover:scale-125 transition-transform duration-500" />
          <div className="absolute top-8 right-8 w-10 h-10 bg-white/10 rounded-full" />

          <span className="text-4xl mb-3 drop-shadow-lg">{zone.icon}</span>
          <h3 className="text-lg font-bold text-white drop-shadow-md">{zone.name}</h3>
          <p className="text-white/80 text-sm mt-1 line-clamp-2">{zone.description}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300">
      <div className={`bg-gradient-to-br ${zone.gradient} p-8 min-h-[260px] flex flex-col justify-end relative`}>
        {/* Decorative elements */}
        <div className="absolute top-6 right-6 w-28 h-28 bg-white/10 rounded-full blur-md group-hover:scale-150 transition-transform duration-700" />
        <div className="absolute top-10 right-10 w-14 h-14 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/30 to-transparent" />

        <div className="relative z-10">
          <span className="text-5xl mb-4 block drop-shadow-lg">{zone.icon}</span>
          <h3 className="text-xl font-bold text-white drop-shadow-md mb-2">{zone.name}</h3>
          <p className="text-white/90 text-sm leading-relaxed">{zone.longDescription}</p>
          {zone.coordinates && (
            <a
              href={`https://www.google.com/maps?q=${zone.coordinates.lat},${zone.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-3 text-xs text-white/80 hover:text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-full transition-colors"
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
  )
}
