'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const ZONES = [
  { id: 'centro', label: 'Centro Histórico', color: 'var(--coral)', cx: 300, cy: 200, businesses: 142, slug: 'centro' },
  { id: 'jardines', label: 'Jardines', color: 'var(--gold)', cx: 180, cy: 150, businesses: 87, slug: 'jardines' },
  { id: 'satelite', label: 'Satélite', color: 'var(--turquoise)', cx: 420, cy: 140, businesses: 64, slug: 'satelite' },
  { id: 'hidalgo', label: 'Hidalgo', color: 'var(--green)', cx: 240, cy: 280, businesses: 53, slug: 'hidalgo' },
  { id: 'obrera', label: 'Obrera', color: 'var(--buga)', cx: 380, cy: 300, businesses: 41, slug: 'obrera' },
  { id: 'morelos', label: 'Morelos', color: 'var(--blue)', cx: 120, cy: 260, businesses: 38, slug: 'morelos' },
]

const TICKER_EVENTS = [
  'Nuevo negocio en Centro Histórico',
  'Reseña 5⭐ en Taquería El Güero',
  'Pedido en Farmacia San Juan',
  'Nuevo en Jardines: Pastelería Luna',
  'Reseña 5⭐ en Hotel Colonial',
  'Pedido confirmado en Centro',
]

const STATS = [
  { value: '380+', label: 'Negocios activos' },
  { value: '6', label: 'Zonas cubiertas' },
  { value: '24/7', label: 'Disponibilidad' },
  { value: '100%', label: 'Gratis para buscar' },
]

export default function InteractiveMap() {
  const [activeZone, setActiveZone] = useState<string | null>(null)
  const [tickerIdx, setTickerIdx] = useState(0)
  const [dotPos, setDotPos] = useState({ x: 300, y: 200 })
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dotRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTickerIdx(i => (i + 1) % TICKER_EVENTS.length)
    }, 2800)
    dotRef.current = setInterval(() => {
      const zone = ZONES[Math.floor(Math.random() * ZONES.length)]
      setDotPos({ x: zone.cx + (Math.random() - 0.5) * 40, y: zone.cy + (Math.random() - 0.5) * 40 })
    }, 1800)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (dotRef.current) clearInterval(dotRef.current)
    }
  }, [])

  const active = ZONES.find(z => z.id === activeZone)

  return (
    <section className="py-24" style={{ background: 'var(--cream)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4"
            style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}
          >
            Zonas de Lagos
          </span>
          <h2
            className="text-4xl md:text-5xl font-bold mb-3"
            style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
          >
            Tu ciudad, en un solo mapa
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--ink-soft)' }}>
            Explora negocios por zona y encuentra lo que necesitas cerca de ti.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Left: zone chips + stats + ticker */}
          <div>
            <div className="flex flex-wrap gap-2 mb-8">
              {ZONES.map(z => (
                <button
                  key={z.id}
                  onClick={() => setActiveZone(activeZone === z.id ? null : z.id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveZone(activeZone === z.id ? null : z.id) } }}
                  tabIndex={0}
                  className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{
                    background: activeZone === z.id ? z.color : 'rgba(31,41,55,0.06)',
                    color: activeZone === z.id ? 'white' : 'var(--ink-soft)',
                    border: `2px solid ${activeZone === z.id ? z.color : 'transparent'}`,
                  }}
                >
                  {z.label}
                </button>
              ))}
            </div>

            {/* Detail panel */}
            {active ? (
              <div className="rounded-2xl p-6 mb-6" style={{ background: 'white', boxShadow: 'var(--shadow-card)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: active.color }} />
                  <h3 className="font-bold text-lg" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>{active.label}</h3>
                </div>
                <p className="text-3xl font-bold mb-1" style={{ color: active.color, fontFamily: 'var(--display)' }}>{active.businesses}</p>
                <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>negocios registrados</p>
                <Link
                  href={`/negocios-en/${active.slug}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: active.color }}
                >
                  Ver negocios en {active.label} →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-6">
                {STATS.map(s => (
                  <div key={s.label} className="rounded-2xl p-4" style={{ background: 'white', boxShadow: 'var(--shadow-soft)' }}>
                    <p className="text-2xl font-bold" style={{ fontFamily: 'var(--display)', color: 'var(--coral)' }}>{s.value}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Live ticker */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-full text-sm overflow-hidden"
              style={{ background: 'rgba(31,41,55,0.05)' }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: 'var(--green)' }} />
              <span className="truncate" style={{ color: 'var(--ink-soft)' }}>{TICKER_EVENTS[tickerIdx]}</span>
            </div>
          </div>

          {/* Right: SVG map */}
          <div className="rounded-3xl overflow-hidden" style={{ background: '#e8f4f0', boxShadow: 'var(--shadow-card)' }}>
            <svg viewBox="0 0 540 380" className="w-full" style={{ display: 'block' }}>
              {/* Background city grid lines */}
              {[100, 200, 300, 400].map(x => (
                <line key={`v${x}`} x1={x} y1={0} x2={x} y2={380} stroke="rgba(31,41,55,0.06)" strokeWidth="1" />
              ))}
              {[80, 160, 240, 320].map(y => (
                <line key={`h${y}`} x1={0} y1={y} x2={540} y2={y} stroke="rgba(31,41,55,0.06)" strokeWidth="1" />
              ))}

              {/* Animated connection routes */}
              {ZONES.slice(0, -1).map((z, i) => (
                <line
                  key={i}
                  x1={z.cx} y1={z.cy}
                  x2={ZONES[i + 1].cx} y2={ZONES[i + 1].cy}
                  stroke="rgba(255,107,53,0.15)"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />
              ))}

              {/* Moving live dot */}
              <circle cx={dotPos.x} cy={dotPos.y} r="5" fill="var(--green)" opacity="0.9">
                <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
              </circle>

              {/* Zone pins */}
              {ZONES.map(z => (
                <g
                  key={z.id}
                  onClick={() => setActiveZone(activeZone === z.id ? null : z.id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveZone(activeZone === z.id ? null : z.id) } }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Zona ${z.label}: ${z.businesses} negocios`}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  {/* Pulse ring */}
                  {activeZone === z.id && (
                    <circle cx={z.cx} cy={z.cy} r="24" fill={z.color} opacity="0.15">
                      <animate attributeName="r" values="16;28;16" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={z.cx} cy={z.cy} r="14" fill={z.color} opacity="0.9" />
                  <circle cx={z.cx} cy={z.cy} r="6" fill="white" />
                  {/* Label */}
                  <text
                    x={z.cx}
                    y={z.cy + 26}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--ink)"
                    fontFamily="var(--body)"
                    fontWeight="600"
                  >
                    {z.label.split(' ')[0]}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
