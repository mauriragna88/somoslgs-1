'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface Zone {
  id: string
  label: string
  businesses: number
  slug: string
  color: string
  cx: number
  cy: number
}

const EASE = [0.16, 1, 0.3, 1] as const

const TICKER_EVENTS = [
  'Negocio registrado en Lagos de Moreno',
  'Nueva reseña 5⭐ en el directorio',
  'Pedido confirmado en Lagos',
  'Nuevo negocio en el directorio',
  'Reseña positiva en negocio local',
  'Cliente encontró lo que buscaba',
]

const BUSINESS_EMOJIS = ['🏪', '🍽️', '☕', '🛍️', '💇', '🏨', '🔧', '🍦', '🎨', '📦']

/* Genera posiciones pseudoaleatorias deterministas alrededor de una zona */
function generatePositions(cx: number, cy: number, count: number) {
  const positions: { x: number; y: number; e: number }[] = []
  for (let i = 0; i < count; i++) {
    const angle = (i / Math.max(count, 1)) * Math.PI * 2 + (i % 3) * 0.35
    const radius = 26 + ((i * 37) % 40)
    const x = cx + Math.cos(angle) * radius
    const y = cy + Math.sin(angle) * radius * 0.72
    positions.push({ x, y, e: (i + (cx + cy) % 5) % BUSINESS_EMOJIS.length })
  }
  return positions
}

export default function InteractiveMap() {
  const [activeZone, setActiveZone] = useState<string | null>(null)
  const [tickerIdx, setTickerIdx] = useState(0)
  const [zones, setZones] = useState<Zone[]>([])
  const [totalActive, setTotalActive] = useState(0)
  const [loading, setLoading] = useState(true)
  const [growth, setGrowth] = useState(0) // 0..1 progreso de llenado global
  const maxTotalRef = useRef(1)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('/api/map/zones')
      .then(r => r.json())
      .then((data: Zone[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setZones(data)
          const total = data.reduce((acc, z) => acc + z.businesses, 0)
          setTotalActive(total)
          maxTotalRef.current = total
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Ticker de eventos
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTickerIdx(i => (i + 1) % TICKER_EVENTS.length)
    }, 2800)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  // Animación de "crecimiento": el mapa se va llenando de negocios en bucle
  useEffect(() => {
    if (totalActive === 0) return
    let raf: number
    let start: number | null = null
    const duration = 4200 // ms por ciclo de crecimiento

    const tick = (t: number) => {
      if (start === null) start = t
      const p = (t - start) / duration
      const eased = Math.min(1, p)
      setGrowth(eased)
      if (eased < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        // Pausa breve y reinicio
        setTimeout(() => {
          start = performance.now()
          raf = requestAnimationFrame(tick)
        }, 1400)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [totalActive])

  const active = zones.find(z => z.id === activeZone)

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
            La ciudad se llena de <span style={{ color: 'var(--coral)' }}>negocios</span>
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--ink-soft)' }}>
            Mira cómo las colonias de Lagos de Moreno cobran vida, negocio a negocio.
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
                    className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                    style={{
                      background: activeZone === z.id ? z.color : 'rgba(31,41,55,0.06)',
                      color: activeZone === z.id ? 'white' : 'var(--ink-soft)',
                      border: `2px solid ${activeZone === z.id ? z.color : 'transparent'}`,
                    }}
                  >
                    {z.label}
                    <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.8 }}>· {z.businesses}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Detail panel o stats */}
            {active ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl p-6 mb-6" style={{ background: 'white', boxShadow: 'var(--shadow-card)' }}
              >
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
              </motion.div>
            ) : (
              <div className="rounded-2xl p-5 mb-6" style={{ background: 'white', boxShadow: 'var(--shadow-card)' }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--muted)' }}>
                  Negocios por colonia
                </p>
                <div className="space-y-2.5">
                  {/* Top 3 destacadas */}
                  {zones.slice(0, 3).map(z => (
                    <Link
                      key={z.id}
                      href={`/negocios-en/${z.slug}`}
                      className="flex items-center justify-between p-3 rounded-xl transition-all hover:-translate-y-0.5"
                      style={{ background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.12)' }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: z.color }} />
                        <span className="font-bold text-sm truncate" style={{ color: 'var(--ink)' }}>{z.label}</span>
                      </div>
                      <span className="font-extrabold text-sm flex-shrink-0" style={{ color: 'var(--coral)', fontFamily: 'var(--display)' }}>
                        +{z.businesses}
                      </span>
                    </Link>
                  ))}
                  {/* Resto en lista compacta */}
                  {zones.slice(3).map(z => (
                    <div key={z.id} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: z.color }} />
                        <span className="text-sm truncate" style={{ color: 'var(--ink-soft)' }}>{z.label}</span>
                      </div>
                      <span className="text-sm font-bold flex-shrink-0" style={{ color: 'var(--muted)' }}>{z.businesses}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'rgba(6,60,103,0.08)' }}>
                  <span className="text-2xl font-extrabold" style={{ color: 'var(--coral)', fontFamily: 'var(--display)' }}>
                    {totalActive}+
                  </span>
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>negocios en {zones.length} colonias de Lagos</span>
                </div>
              </div>
            )}

            {/* Live ticker */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-full text-sm overflow-hidden"
              style={{ background: 'rgba(31,41,55,0.05)' }}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: 'var(--green)' }} />
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={tickerIdx}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="truncate"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  {TICKER_EVENTS[tickerIdx]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* Right: SVG map con llenado de negocios */}
          <div className="rounded-3xl overflow-hidden" style={{ background: '#e8f4f0', boxShadow: 'var(--shadow-card)' }}>
            <svg viewBox="0 0 540 400" className="w-full" style={{ display: 'block' }}>
              {/* Grid */}
              {[100, 200, 300, 400].map(x => (
                <line key={`v${x}`} x1={x} y1={0} x2={x} y2={400} stroke="rgba(31,41,55,0.06)" strokeWidth="1" />
              ))}
              {[80, 160, 240, 320].map(y => (
                <line key={`h${y}`} x1={0} y1={y} x2={540} y2={y} stroke="rgba(31,41,55,0.06)" strokeWidth="1" />
              ))}

              {/* Conexiones entre zonas */}
              {zones.slice(0, -1).map((z, i) => (
                <motion.line
                  key={i}
                  x1={z.cx} y1={z.cy}
                  x2={zones[i + 1].cx} y2={zones[i + 1].cy}
                  stroke="rgba(255,107,53,0.18)"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: EASE, delay: i * 0.15 }}
                />
              ))}

              {zones.map((z, zi) => {
                const fillCount = Math.round(z.businesses * growth)
                const positions = generatePositions(z.cx, z.cy, Math.min(z.businesses, 14))
                const isActive = activeZone === z.id
                return (
                  <g key={z.id}>
                    {/* Halo pulsante cuando la zona está activa o llena */}
                    {(isActive || fillCount >= z.businesses) && (
                      <circle cx={z.cx} cy={z.cy} r="16" fill={z.color} opacity="0.15">
                        <animate attributeName="r" values="16;30;16" dur="2.2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.22;0;0.22" dur="2.2s" repeatCount="indefinite" />
                      </circle>
                    )}

                    {/* Iconos de negocios que aparecen progresivamente */}
                    {positions.slice(0, fillCount).map((p, i) => (
                      <motion.g
                        key={`${z.id}-${i}`}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 * i, duration: 0.35, ease: EASE }}
                      >
                        <circle cx={p.x} cy={p.y} r="11" fill="white" stroke={z.color} strokeWidth="1.2" opacity="0.95" />
                        <text x={p.x} y={p.y + 3} textAnchor="middle" fontSize="9" style={{ pointerEvents: 'none' }}>
                          {BUSINESS_EMOJIS[p.e]}
                        </text>
                      </motion.g>
                    ))}

                    {/* Nodo principal de la zona */}
                    <g
                      onClick={() => setActiveZone(isActive ? null : z.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <motion.circle
                        cx={z.cx} cy={z.cy} r="15" fill={z.color}
                        animate={{ scale: isActive ? 1.25 : 1 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                        opacity="0.95"
                      />
                      <circle cx={z.cx} cy={z.cy} r="6" fill="white" />
                      <text
                        x={z.cx} y={z.cy + 28}
                        textAnchor="middle" fontSize="10"
                        fill="var(--ink)" fontFamily="var(--body)" fontWeight="600"
                      >
                        {z.label.split(' ')[0]}
                      </text>
                    </g>
                  </g>
                )
              })}
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
