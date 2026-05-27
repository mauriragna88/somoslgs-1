'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Zone {
  id: string
  label: string
  businesses: number
  slug: string
  color: string
  cx: number
  cy: number
}

const TICKER_EVENTS = [
  'Negocio registrado en Lagos de Moreno',
  'Nueva reseña 5⭐ en el directorio',
  'Pedido confirmado en Lagos',
  'Nuevo negocio en el directorio',
  'Reseña positiva en negocio local',
  'Cliente encontró lo que buscaba',
]

export default function InteractiveMap() {
  const [activeZone, setActiveZone] = useState<string | null>(null)
  const [tickerIdx, setTickerIdx] = useState(0)
  const [dotPos, setDotPos] = useState({ x: 300, y: 200 })
  const [zones, setZones] = useState<Zone[]>([])
  const [totalActive, setTotalActive] = useState(0)
  const [loading, setLoading] = useState(true)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const dotRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('/api/map/zones')
      .then(r => r.json())
      .then((data: Zone[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setZones(data)
          setTotalActive(data.reduce((acc, z) => acc + z.businesses, 0))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTickerIdx(i => (i + 1) % TICKER_EVENTS.length)
    }, 2800)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  useEffect(() => {
    if (zones.length === 0) return
    dotRef.current = setInterval(() => {
      const zone = zones[Math.floor(Math.random() * zones.length)]
      setDotPos({ x: zone.cx + (Math.random() - 0.5) * 40, y: zone.cy + (Math.random() - 0.5) * 40 })
    }, 1800)
    return () => { if (dotRef.current) clearInterval(dotRef.current) }
  }, [zones])

  const active = zones.find(z => z.id === activeZone)

  const STATS = [
    { value: totalActive > 0 ? `${totalActive}+` : '—', label: 'Negocios registrados' },
    { value: zones.length > 0 ? `${zones.length}` : '—', label: 'Colonias con negocios' },
    { value: '24/7', label: 'Disponibilidad' },
    { value: '100%', label: 'Gratis para buscar' },
  ]

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
            Explora negocios por colonia y encuentra lo que necesitas cerca de ti.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* Left: zone chips + stats + ticker */}
          <div>
            {loading ? (
              <div className="flex flex-wrap gap-2 mb-8">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="h-9 w-28 rounded-full animate-pulse" style={{ background: 'rgba(31,41,55,0.08)' }} />
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 mb-8">
                {zones.map(z => (
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
            )}

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
              {[100, 200, 300, 400].map(x => (
                <line key={`v${x}`} x1={x} y1={0} x2={x} y2={380} stroke="rgba(31,41,55,0.06)" strokeWidth="1" />
              ))}
              {[80, 160, 240, 320].map(y => (
                <line key={`h${y}`} x1={0} y1={y} x2={540} y2={y} stroke="rgba(31,41,55,0.06)" strokeWidth="1" />
              ))}

              {zones.slice(0, -1).map((z, i) => (
                <line
                  key={i}
                  x1={z.cx} y1={z.cy}
                  x2={zones[i + 1].cx} y2={zones[i + 1].cy}
                  stroke="rgba(255,107,53,0.15)"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />
              ))}

              <circle cx={dotPos.x} cy={dotPos.y} r="5" fill="var(--green)" opacity="0.9">
                <animate attributeName="r" values="4;6;4" dur="1.5s" repeatCount="indefinite" />
              </circle>

              {zones.map(z => (
                <g
                  key={z.id}
                  onClick={() => setActiveZone(activeZone === z.id ? null : z.id)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveZone(activeZone === z.id ? null : z.id) } }}
                  tabIndex={0}
                  role="button"
                  aria-label={`${z.label}: ${z.businesses} negocios`}
                  style={{ cursor: 'pointer', outline: 'none' }}
                >
                  {activeZone === z.id && (
                    <circle cx={z.cx} cy={z.cy} r="24" fill={z.color} opacity="0.15">
                      <animate attributeName="r" values="16;28;16" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle cx={z.cx} cy={z.cy} r="14" fill={z.color} opacity="0.9" />
                  <circle cx={z.cx} cy={z.cy} r="6" fill="white" />
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
