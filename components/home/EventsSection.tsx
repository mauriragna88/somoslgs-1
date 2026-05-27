'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type EventItem = {
  name: string
  monthCode: string
  dates: string
  desc: string
  category: string
  categoryColor: string
  src: string
  alt: string
  upcoming?: boolean
  colSpan: string
  rowSpan: string
}

const EVENTS: EventItem[] = [
  {
    name: 'Feria de Lagos',
    monthCode: 'AGO',
    dates: '1 – 15 Agosto',
    desc: 'La fiesta más grande del año. Charrería, música en vivo, artesanías, gastronomía y el desfile más colorido del Bajío. Un evento que marca a Lagos para siempre.',
    category: 'Tradición',
    categoryColor: 'var(--coral)',
    src: '/tourism/danza-matachines.jpg',
    alt: 'Feria de Lagos de Moreno — Danza de Matachines',
    upcoming: true,
    colSpan: 'md:col-span-1',
    rowSpan: 'md:row-span-2',
  },
  {
    name: 'Día de Muertos',
    monthCode: 'NOV',
    dates: '1 – 2 Nov',
    desc: 'Ofrendas, cempasúchil y danzas que honran a quienes ya no están. El centro histórico se transforma en un altar vivo.',
    category: 'Tradición',
    categoryColor: '#D946EF',
    src: '/tourism/dia-muertos.jpg',
    alt: 'Día de Muertos en Lagos de Moreno',
    colSpan: 'md:col-span-1',
    rowSpan: 'md:row-span-1',
  },
  {
    name: 'Aniversario de la Ciudad',
    monthCode: 'MAR',
    dates: '21 Marzo',
    desc: 'Lagos celebra su fundación en 1563 con eventos culturales, conciertos y una ciudad que se viste de orgullo.',
    category: 'Cultural',
    categoryColor: 'var(--gold)',
    src: '/tourism/centro-historico.jpg',
    alt: 'Centro histórico de Lagos de Moreno',
    colSpan: 'md:col-span-1',
    rowSpan: 'md:row-span-1',
  },
  {
    name: 'Calles Decembrinas',
    monthCode: 'DIC',
    dates: 'Todo Diciembre',
    desc: 'En diciembre Lagos se transforma. Luces, nacimientos, ponche y buñuelos llenan cada rincón del centro histórico.',
    category: 'Familiar',
    categoryColor: 'var(--turquoise)',
    src: '/tourism/callelagos1.jpg',
    alt: 'Callejones de Lagos en diciembre',
    colSpan: 'md:col-span-2',
    rowSpan: 'md:row-span-1',
  },
  {
    name: 'Semana Santa',
    monthCode: 'ABR',
    dates: 'Semana Santa',
    desc: 'Procesiones y representaciones que llenan de devoción el corazón de Lagos. Una de las más emotivas de todo Jalisco.',
    category: 'Religioso',
    categoryColor: 'var(--terracotta)',
    src: '/tourism/turismo-religioso.jpg',
    alt: 'Turismo religioso en Lagos de Moreno',
    colSpan: 'md:col-span-1',
    rowSpan: 'md:row-span-1',
  },
  {
    name: 'Haciendas de los Altos',
    monthCode: '365',
    dates: 'Todo el año',
    desc: 'Las haciendas históricas de los Altos de Jalisco: arquitectura colonial, tequila artesanal y paisajes que enamoran.',
    category: 'Turismo',
    categoryColor: 'var(--green)',
    src: '/tourism/panoramica-lagos.jpg',
    alt: 'Panorámica de Lagos de Moreno',
    colSpan: 'md:col-span-1',
    rowSpan: 'md:row-span-1',
  },
]

function EventCard({ event }: { event: EventItem }) {
  const [hovered, setHovered] = useState(false)
  const isTall = event.rowSpan.includes('row-span-2')

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${event.colSpan} ${event.rowSpan}`}
      style={{ minHeight: isTall ? 500 : 240 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Photo */}
      <Image
        src={event.src}
        alt={event.alt}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        className="object-cover"
        style={{
          transform: hovered ? 'scale(1.07)' : 'scale(1)',
          transition: 'transform 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      />

      {/* Month code — huge typographic background element */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: -16,
          right: 6,
          fontFamily: 'var(--display)',
          fontWeight: 900,
          fontSize: isTall ? '9rem' : '6rem',
          color: 'rgba(255,255,255,0.055)',
          lineHeight: 1,
          letterSpacing: '-0.05em',
          userSelect: 'none',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        {event.monthCode}
      </span>

      {/* Permanent gradient — bottom dark */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 3,
          background: 'linear-gradient(to top, rgba(10,6,2,0.92) 0%, rgba(10,6,2,0.35) 50%, rgba(10,6,2,0.08) 100%)',
        }}
      />

      {/* Hover extra overlay */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 3,
          background: 'rgba(10,6,2,0.28)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      />

      {/* Category-colored accent line — top, on hover */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 5,
          background: `linear-gradient(90deg, ${event.categoryColor}, transparent 70%)`,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.35s ease',
        }}
      />

      {/* Top badges */}
      <div
        style={{
          position: 'absolute', top: 14, left: 14, right: 14,
          zIndex: 5, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            padding: '4px 11px',
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            background: `color-mix(in srgb, ${event.categoryColor} 18%, transparent)`,
            color: event.categoryColor,
            border: `1px solid color-mix(in srgb, ${event.categoryColor} 40%, transparent)`,
            backdropFilter: 'blur(8px)',
          }}
        >
          {event.category}
        </span>

        {event.upcoming && (
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 11px', borderRadius: 999,
              fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              background: 'var(--coral)', color: 'white',
            }}
          >
            <span
              style={{
                width: 5, height: 5, borderRadius: '50%',
                background: 'white', flexShrink: 0,
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            Próximo
          </span>
        )}

        <span
          style={{
            marginLeft: 'auto',
            padding: '4px 11px', borderRadius: 999,
            fontSize: 11, fontWeight: 600,
            background: 'rgba(255,253,248,0.12)',
            backdropFilter: 'blur(10px)',
            color: 'rgba(255,253,248,0.85)',
            border: '1px solid rgba(255,253,248,0.14)',
            whiteSpace: 'nowrap',
          }}
        >
          {event.dates}
        </span>
      </div>

      {/* Bottom content */}
      <div
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0 20px 20px',
          zIndex: 5,
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--display)',
            fontWeight: 800,
            fontSize: isTall ? '1.65rem' : '1.1rem',
            color: 'white',
            lineHeight: 1.1,
            marginBottom: hovered ? 10 : 0,
            transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
            transition: 'all 0.4s ease',
          }}
        >
          {event.name}
        </h3>

        <p
          style={{
            fontSize: '0.82rem',
            color: 'rgba(255,253,248,0.75)',
            lineHeight: 1.55,
            maxWidth: '34ch',
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.4s ease',
          }}
        >
          {event.desc}
        </p>
      </div>
    </div>
  )
}

export default function EventsSection() {
  return (
    <section
      className="py-20"
      style={{
        background: `
          radial-gradient(ellipse at 15% 20%, rgba(255,107,53,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 85% 80%, rgba(217,70,239,0.06) 0%, transparent 45%),
          var(--ink)
        `,
      }}
    >
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
          <div>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
              style={{ background: 'rgba(255,107,53,0.12)', color: 'var(--coral)', border: '1px solid rgba(255,107,53,0.2)' }}
            >
              📅 Fechas especiales
            </span>
            <h2
              className="text-4xl md:text-5xl font-black"
              style={{
                fontFamily: 'var(--display)',
                color: 'var(--ivory)',
                lineHeight: 0.96,
                letterSpacing: '-0.03em',
              }}
            >
              Lagos que se celebra{' '}
              <em
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: 'var(--gold)',
                }}
              >
                todo el año
              </em>
            </h2>
          </div>

          <Link
            href="/que-hacer-en-lagos-de-moreno"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all hover:opacity-80 flex-shrink-0 self-start sm:self-auto"
            style={{
              border: '1px solid rgba(255,253,248,0.18)',
              color: 'rgba(255,253,248,0.65)',
            }}
          >
            Ver qué hacer en Lagos →
          </Link>
        </div>

        {/* Bento grid */}
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10"
          style={{ gridAutoRows: '240px' }}
        >
          {EVENTS.map((event) => (
            <EventCard key={event.name} event={event} />
          ))}
        </div>

        {/* Bottom CTA */}
        <p className="text-center text-sm" style={{ color: 'rgba(255,253,248,0.35)' }}>
          ¿Organizas un evento en Lagos?{' '}
          <a
            href="https://wa.me/524741082768?text=Hola%2C%20quiero%20publicar%20un%20evento%20en%20SomosLagos"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline transition-colors"
            style={{ color: 'var(--coral)' }}
          >
            Escríbenos para publicarlo →
          </a>
        </p>

      </div>
    </section>
  )
}
