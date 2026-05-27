'use client'

import Image from 'next/image'
import Link from 'next/link'

type EventItem = {
  name: string
  month: string
  dates: string
  desc: string
  category: string
  categoryColor: string
  src: string
  alt: string
  upcoming?: boolean
}

const EVENTS: EventItem[] = [
  {
    name: 'Feria de Lagos',
    month: 'Agosto',
    dates: '1 – 15 Ago',
    desc: 'La fiesta más grande del año. Charrería, música en vivo, artesanías, gastronomía y el desfile más colorido del Bajío.',
    category: 'Tradición',
    categoryColor: 'var(--coral)',
    src: '/tourism/danza-matachines.jpg',
    alt: 'Feria de Lagos de Moreno',
    upcoming: true,
  },
  {
    name: 'Día de Muertos',
    month: 'Noviembre',
    dates: '1 – 2 Nov',
    desc: 'Las calles del centro histórico se llenan de ofrendas, flores de cempasúchil y danzas que honran a los que ya no están.',
    category: 'Tradición',
    categoryColor: 'var(--buga)',
    src: '/tourism/dia-muertos.jpg',
    alt: 'Día de Muertos en Lagos de Moreno',
  },
  {
    name: 'Aniversario de la Ciudad',
    month: 'Marzo',
    dates: '21 Mar',
    desc: 'Lagos de Moreno celebra su fundación en 1563 con eventos culturales, conciertos y una ciudad que se viste de fiesta.',
    category: 'Cultural',
    categoryColor: 'var(--gold)',
    src: '/tourism/centro-historico.jpg',
    alt: 'Centro histórico de Lagos de Moreno',
  },
  {
    name: 'Calles Decembrinas',
    month: 'Diciembre',
    dates: 'Todo Dic',
    desc: 'En diciembre, Lagos se transforma. Las calles del centro se cubren de luces, nacimientos y el olor a ponche y buñuelos.',
    category: 'Familiar',
    categoryColor: 'var(--turquoise)',
    src: '/tourism/callelagos1.jpg',
    alt: 'Callejones de Lagos en diciembre',
  },
  {
    name: 'Semana Santa',
    month: 'Abril',
    dates: 'Semana Santa',
    desc: 'Procesiones, representaciones y una devoción que llena cada rincón del centro histórico. Una de las más emotivas de Jalisco.',
    category: 'Religioso',
    categoryColor: 'var(--terracotta)',
    src: '/tourism/turismo-religioso.jpg',
    alt: 'Turismo religioso en Lagos de Moreno',
  },
  {
    name: 'Haciendas de Lagos',
    month: 'Todo el año',
    dates: 'Fin de semana',
    desc: 'Visita las haciendas históricas de los Altos de Jalisco. Arquitectura colonial, tequila y paisajes que cortan el aliento.',
    category: 'Turismo',
    categoryColor: 'var(--green)',
    src: '/tourism/panoramica-lagos.jpg',
    alt: 'Panorámica de Lagos de Moreno',
  },
]

export default function EventsSection() {
  return (
    <section className="py-20" style={{ background: 'var(--cream)' }}>
      <div className="container mx-auto px-4">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 gap-4">
          <div>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
              style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}
            >
              📅 Eventos y Fechas Especiales
            </span>
            <h2
              className="text-3xl md:text-4xl font-black"
              style={{ fontFamily: 'var(--display)', color: 'var(--ink)', lineHeight: 1 }}
            >
              Lagos que se celebra<br />
              <em
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: 'var(--coral)',
                }}
              >
                todo el año
              </em>
            </h2>
          </div>

          <Link
            href="/que-hacer-en-lagos-de-moreno"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm border transition-all hover:opacity-80 self-start sm:self-auto flex-shrink-0"
            style={{ borderColor: 'var(--coral)', color: 'var(--coral)' }}
          >
            Ver todo →
          </Link>
        </div>

        {/* Events grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {EVENTS.map((event) => (
            <div
              key={event.name}
              className="group rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{
                background: 'white',
                boxShadow: '0 2px 16px rgba(31,41,55,0.07)',
              }}
            >
              {/* Photo */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={event.src}
                  alt={event.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                {/* Upcoming badge */}
                {event.upcoming && (
                  <div className="absolute top-3 left-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest text-white"
                      style={{ background: 'var(--coral)', boxShadow: '0 4px 12px rgba(255,107,53,0.45)' }}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"
                      />
                      Próximo
                    </span>
                  </div>
                )}

                {/* Month pill */}
                <div className="absolute bottom-3 right-3">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest"
                    style={{
                      background: 'rgba(255,253,248,0.92)',
                      color: 'var(--ink)',
                    }}
                  >
                    {event.dates}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full"
                    style={{
                      background: `${event.categoryColor}18`,
                      color: event.categoryColor,
                    }}
                  >
                    {event.category}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                    {event.month}
                  </span>
                </div>

                <h3
                  className="font-black text-lg mb-2 leading-tight"
                  style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
                >
                  {event.name}
                </h3>

                <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                  {event.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom note */}
        <p className="text-center text-sm mt-10" style={{ color: 'var(--muted)' }}>
          ¿Organizas un evento en Lagos?{' '}
          <a
            href="https://wa.me/524741082768?text=Hola%2C%20quiero%20publicar%20un%20evento%20en%20SomosLagos"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold hover:underline"
            style={{ color: 'var(--coral)' }}
          >
            Escríbenos para publicarlo →
          </a>
        </p>

      </div>
    </section>
  )
}
