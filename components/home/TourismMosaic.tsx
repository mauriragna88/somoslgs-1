'use client'

import { useState } from 'react'
import Image from 'next/image'

const PLACES = [
  {
    src: '/tourism/parroquia-asuncion.jpg',
    alt: 'Parroquia de la Asunción, Lagos de Moreno',
    name: 'Parroquia de la Asunción',
    text: 'Joya barroca del siglo XVII y corazón espiritual de Lagos. Declarada Monumento Histórico Nacional, su fachada es una de las más fotografiadas del Bajío.',
    tall: true,
  },
  {
    src: '/tourism/callelagos1.jpg',
    alt: 'Los Callejones de Lagos de Moreno',
    name: 'Los Callejones',
    text: 'Estrechos senderos empedrados que guardan siglos de historia colonial. El rincón más pintoresco del centro, ideal para perderse entre arcos y fachadas de colores.',
    tall: false,
  },
  {
    src: '/tourism/puente-rio.jpg',
    alt: 'Puente histórico de Lagos de Moreno',
    name: 'Puente Histórico',
    text: 'Construido en el siglo XVIII sobre el Río Lagos, este puente es testigo de la historia de la ciudad y ofrece una vista icónica del centro histórico.',
    tall: false,
  },
  {
    src: '/tourism/teatro-rosas-moreno.jpg',
    alt: 'Teatro Rosas Moreno, Lagos de Moreno',
    name: 'Teatro Rosas Moreno',
    text: 'Inaugurado en 1907, es el principal escenario cultural de la ciudad. Su arquitectura neoclásica y su rica programación lo convierten en orgullo laguense.',
    tall: false,
  },
  {
    src: '/tourism/templo-calvario.jpg',
    alt: 'El Calvario, Lagos de Moreno',
    name: 'El Calvario',
    text: 'Desde la cima de este cerro, los laguenses han contemplado su ciudad por generaciones. El templo y el mirador ofrecen una panorámica única de Lagos de Moreno.',
    tall: false,
  },
]

export default function TourismMosaic() {
  const [active, setActive] = useState<typeof PLACES[0] | null>(null)

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {PLACES.map((place) => (
          <button
            key={place.src}
            onClick={() => setActive(place)}
            className={`relative overflow-hidden rounded-2xl group cursor-pointer text-left ${
              place.tall ? 'row-span-2 min-h-[280px]' : 'min-h-[130px]'
            }`}
          >
            <Image
              src={place.src}
              alt={place.alt}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            <span className="absolute bottom-3 left-3 text-white text-xs font-semibold bg-black/40 px-2 py-1 rounded">
              {place.name}
            </span>
            <span className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </span>
          </button>
        ))}
      </div>

      {/* Lightbox modal */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* Card */}
          <div
            className="relative bg-white rounded-3xl overflow-hidden max-w-lg w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo */}
            <div className="relative aspect-[4/3] w-full">
              <Image
                src={active.src}
                alt={active.alt}
                fill
                sizes="(max-width: 640px) 100vw, 512px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <span
                    className="inline-block text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2"
                    style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}
                  >
                    Pueblo Mágico · Lagos de Moreno
                  </span>
                  <h3
                    className="text-xl font-bold"
                    style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
                  >
                    {active.name}
                  </h3>
                </div>
                <button
                  onClick={() => setActive(null)}
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ background: 'rgba(31,41,55,0.08)' }}
                  aria-label="Cerrar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--ink)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                {active.text}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
