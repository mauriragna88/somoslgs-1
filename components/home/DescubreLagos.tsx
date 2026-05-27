'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

const STATS = [
  { label: 'Fundada en 1563' },
  { label: 'Pueblo Mágico' },
  { label: 'Cuna de Escritores' },
  { label: 'Arte Barroco' },
  { label: 'Jalisco, México' },
]

type Place = {
  src: string
  alt: string
  name: string
  desc: string
  col: string
  row: string
}

const PLACES: Place[] = [
  {
    src: '/tourism/parroquia-asuncion.jpg',
    alt: 'Parroquia de la Asunción',
    name: 'Parroquia de la Asunción',
    desc: 'Joya barroca del siglo XVII. Declarada Monumento Histórico Nacional y corazón espiritual de Lagos.',
    col: 'md:col-span-2',
    row: 'md:row-span-2',
  },
  {
    src: '/tourism/teatro-rosas-moreno.jpg',
    alt: 'Teatro Rosas Moreno',
    name: 'Teatro Rosas Moreno',
    desc: 'Principal escenario cultural de Lagos, inaugurado en 1907. Arquitectura neoclásica pura.',
    col: 'md:col-span-1',
    row: 'md:row-span-1',
  },
  {
    src: '/tourism/callelagos1.jpg',
    alt: 'Los Callejones de Lagos',
    name: 'Los Callejones',
    desc: 'Estrechos senderos empedrados que guardan siglos de historia colonial y fachadas de colores.',
    col: 'md:col-span-1',
    row: 'md:row-span-1',
  },
  {
    src: '/tourism/calvario-panoramica.jpg',
    alt: 'El Calvario panorámica',
    name: 'El Calvario',
    desc: 'El mirador más icónico de la ciudad. Desde la cima, Lagos se revela en toda su belleza.',
    col: 'md:col-span-1',
    row: 'md:row-span-1',
  },
  {
    src: '/tourism/jardin-constituyentes.jpg',
    alt: 'Jardín Constituyentes',
    name: 'Jardín Constituyentes',
    desc: 'El corazón de la vida social de Lagos. Punto de encuentro, descanso y tradición.',
    col: 'md:col-span-1',
    row: 'md:row-span-1',
  },
  {
    src: '/tourism/palacio-municipal.jpg',
    alt: 'Palacio Municipal de Lagos',
    name: 'Palacio Municipal',
    desc: 'Símbolo de la vida cívica de Lagos de Moreno, frente al jardín principal desde el siglo XIX.',
    col: 'md:col-span-1',
    row: 'md:row-span-1',
  },
  {
    src: '/tourism/puente-panoramica.jpg',
    alt: 'Puente histórico de Lagos',
    name: 'Puente Histórico',
    desc: 'Construido en el siglo XVIII sobre el Río Lagos, ofrece una vista icónica del centro histórico.',
    col: 'md:col-span-1',
    row: 'md:row-span-1',
  },
]

function PlaceCard({ place }: { place: Place }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`relative overflow-hidden rounded-2xl cursor-pointer group ${place.col} ${place.row}`}
      style={{ minHeight: place.row.includes('row-span-2') ? 480 : 220 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Photo */}
      <Image
        src={place.src}
        alt={place.alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover transition-transform duration-700 ease-out"
        style={{ transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
      />

      {/* Always-visible gradient + name */}
      <div
        className="absolute inset-0 transition-opacity duration-400"
        style={{
          background: 'linear-gradient(to top, rgba(15,10,5,0.78) 0%, rgba(15,10,5,0.2) 45%, rgba(15,10,5,0) 70%)',
        }}
      />

      {/* Hover overlay */}
      <div
        className="absolute inset-0 transition-opacity duration-400"
        style={{
          background: 'linear-gradient(to top, rgba(15,10,5,0.92) 0%, rgba(15,10,5,0.6) 50%, rgba(15,10,5,0.2) 100%)',
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* Coral accent line top */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(90deg, var(--coral), var(--gold))',
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* Content */}
      <div className="absolute inset-0 p-5 flex flex-col justify-end">
        {/* Name — always visible */}
        <p
          className="font-bold text-white leading-tight mb-1 transition-transform duration-400"
          style={{
            fontFamily: 'var(--display)',
            fontSize: place.row.includes('row-span-2') ? '1.25rem' : '0.95rem',
            transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          }}
        >
          {place.name}
        </p>

        {/* Description — slides up on hover */}
        <p
          className="text-xs leading-relaxed transition-all duration-400"
          style={{
            color: 'rgba(255,253,248,0.82)',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(8px)',
            maxWidth: '30ch',
          }}
        >
          {place.desc}
        </p>

        {/* Explore chip — on hover */}
        <div
          className="mt-3 transition-all duration-400"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(6px)',
          }}
        >
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
            style={{ background: 'var(--coral)', color: 'white' }}
          >
            Pueblo Mágico ✦
          </span>
        </div>
      </div>
    </div>
  )
}

export default function DescubreLagos() {
  return (
    <section style={{ background: 'var(--ink)' }} className="py-20">
      <div className="container mx-auto px-4">

        {/* Editorial header */}
        <div className="max-w-4xl mx-auto text-center mb-14">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {STATS.map((s) => (
              <span
                key={s.label}
                className="inline-block px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest"
                style={{
                  background: 'rgba(255,253,248,0.07)',
                  color: 'rgba(255,253,248,0.5)',
                  border: '1px solid rgba(255,253,248,0.1)',
                }}
              >
                {s.label}
              </span>
            ))}
          </div>

          <h2
            className="text-4xl md:text-6xl font-black mb-5"
            style={{
              fontFamily: 'var(--display)',
              color: 'var(--ivory)',
              lineHeight: 0.95,
              letterSpacing: '-0.03em',
            }}
          >
            Una ciudad{' '}
            <em
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'var(--gold)',
              }}
            >
              que enamora
            </em>
          </h2>

          <p
            className="text-base md:text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ color: 'rgba(255,253,248,0.62)' }}
          >
            Lagos de Moreno es más que un Pueblo Mágico — es una ciudad viva, con siglos de
            historia barroca, gastronomía única, haciendas, fiestas y una comunidad que la hace
            brillar todo el año.
          </p>
        </div>

        {/* Bento grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-10"
          style={{ gridAutoRows: '220px' }}
        >
          {PLACES.map((place) => (
            <PlaceCard key={place.src} place={place} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/que-hacer-en-lagos-de-moreno"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-full font-bold transition-all hover:opacity-90 hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, var(--coral), var(--gold))',
              color: 'white',
              boxShadow: '0 8px 32px rgba(255,107,53,0.3)',
            }}
          >
            Ver ruta turística completa de Lagos
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

      </div>
    </section>
  )
}
