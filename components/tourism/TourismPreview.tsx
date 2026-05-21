import Link from 'next/link'
import ZoneCard from '@/components/tourism/ZoneCard'
import { ZONES } from '@/lib/tourism'

export default function TourismPreview() {
  // Mostrar las 3 zonas más emblemáticas
  const previewZones = [ZONES[0], ZONES[1], ZONES[2]] // Calvario, Centro, Puente

  return (
    <section className="pueblo-shell py-20 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 pueblo-divider" />
      <div className="container mx-auto px-4 relative">
        <div className="text-center mb-10">
          <span className="pueblo-eyebrow inline-block px-4 py-1.5 text-xs font-semibold rounded-full mb-4">
            Pueblo Mágico
          </span>
          <h2 className="text-3xl md:text-5xl font-extrabold text-pueblo-noche mb-3 tracking-tight">
            ¿Qué Hacer en Lagos de Moreno?
          </h2>
          <p className="text-pueblo-terracotta/80 max-w-2xl mx-auto leading-relaxed">
            Descubre los lugares emblemáticos, actividades y experiencias que te esperan en nuestro Pueblo Mágico
          </p>
        </div>

        {/* Grid de zonas destacadas */}
        <div className="pueblo-card rounded-[2rem] p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 max-w-5xl mx-auto">
          {previewZones.map((zone) => (
            <ZoneCard key={zone.id} zone={zone} compact />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/que-hacer-en-lagos-de-moreno"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-pueblo-cantera to-pueblo-terracotta text-white font-bold rounded-full shadow-pueblo hover:shadow-pueblo-soft hover:scale-105 transition-all duration-300"
          >
            Ver Guía Completa
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
