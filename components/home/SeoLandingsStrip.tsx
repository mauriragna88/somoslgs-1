'use client'

import Link from 'next/link'

/* ═══════════════════════════════════════════════════════════
   SeoLandingsStrip — enlaces internos a landings SEO
   (red de links que ayuda a Google a indexar las landings
   rápido y mejora su autoridad)
   ═══════════════════════════════════════════════════════════ */

const LINKS = [
  { href: '/restaurantes', label: 'Restaurantes', emoji: '🍽️' },
  { href: '/taquerias', label: 'Taquerías', emoji: '🌮' },
  { href: '/cafeterias', label: 'Cafeterías', emoji: '☕' },
  { href: '/hoteles', label: 'Hoteles', emoji: '🏨' },
  { href: '/bares', label: 'Bares', emoji: '🍸' },
  { href: '/salud', label: 'Salud', emoji: '⚕️' },
  { href: '/belleza', label: 'Belleza', emoji: '💅' },
  { href: '/donde-comer-en-lagos', label: 'Dónde comer', emoji: '🌮' },
  { href: '/que-hacer-en-lagos-de-moreno', label: 'Qué hacer', emoji: '🗺️' },
]

export default function SeoLandingsStrip() {
  return (
    <div className="mt-8">
      <p className="text-[11px] font-bold uppercase tracking-widest text-center mb-4" style={{ color: 'var(--muted)' }}>
        Explora por guía
      </p>
      <div className="flex flex-wrap gap-2 justify-center">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-lg"
            style={{
              background: 'rgba(255,255,255,0.75)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1px solid rgba(6,60,103,0.10)',
              color: 'var(--ink)',
              boxShadow: '0 2px 10px rgba(6,60,103,0.05)',
            }}
          >
            <span>{l.emoji}</span>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
