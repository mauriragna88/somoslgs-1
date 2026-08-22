'use client'
import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SearchForm from '@/components/home/SearchForm'
import Link from 'next/link'

interface Category { id: string; name: string; icon: string; slug: string }
interface HeroVideoScrollProps {
  categories: Category[]
  businessCount: number
  catCount: number
}

const EASE = [0.16, 1, 0.3, 1] as const

/* Cards flotantes — aparecen en bucle (time-driven, no scroll) */
const FLOATS = [
  { emoji: '🌮', name: 'Las Antojadas', meta: 'Tacos · Centro', grad: 'linear-gradient(135deg,var(--coral),var(--gold))', pos: { top: '30%', left: '24px' } },
  { emoji: '🏨', name: 'Casa Cantera', meta: 'Hotel · 4.8 ★', grad: 'linear-gradient(135deg,#22B8CF,#2F80ED)', pos: { top: '42%', right: '24px' } },
  { emoji: '🍦', name: 'Neverías Don Pancho', meta: 'Postres · 4.9 ★', grad: 'linear-gradient(135deg,#22C55E,#22B8CF)', pos: { bottom: '26%', left: '24px' } },
  { emoji: '💇‍♀️', name: 'Estudio Bugambilia', meta: 'Belleza · Centro', grad: 'linear-gradient(135deg,#D946EF,var(--coral))', pos: { bottom: '16%', right: '24px' } },
  { emoji: '☕', name: 'Café Cantera 1563', meta: 'Brunch · Galeana', grad: 'linear-gradient(135deg,var(--gold),#C86B4A)', pos: { top: '62%', left: '24px' } },
]

function FloatingCard({ f, visible, delay }: { f: typeof FLOATS[number]; visible: boolean; delay: number }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.9 }}
          animate={{ opacity: 1, y: [0, -10, 0], scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{
            opacity: { duration: 0.5, ease: EASE },
            y: { duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay },
            scale: { duration: 0.5, ease: EASE },
          }}
          className="hidden md:inline-flex"
          style={{
            position: 'absolute', zIndex: 4,
            ...f.pos,
            alignItems: 'center', gap: 10,
            padding: '7px 14px 7px 7px',
            background: 'rgba(255,253,248,0.92)',
            backdropFilter: 'blur(14px) saturate(160%)',
            WebkitBackdropFilter: 'blur(14px) saturate(160%)',
            borderRadius: 999,
            border: '1px solid rgba(255,253,248,0.55)',
            boxShadow: '0 4px 14px -4px rgba(31,41,55,0.18), 0 12px 30px -16px rgba(31,41,55,0.25)',
            fontSize: 13, color: 'var(--ink)',
            whiteSpace: 'nowrap', pointerEvents: 'none',
          }}
        >
          <span style={{
            width: 26, height: 26, borderRadius: 999,
            display: 'grid', placeItems: 'center',
            color: 'white', fontSize: 13,
            background: f.grad, flexShrink: 0,
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4)',
          }}>
            {f.emoji}
          </span>
          <div>
            <div style={{ fontFamily: 'var(--body)', fontWeight: 600, fontSize: 13, lineHeight: 1 }}>{f.name}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{f.meta}</div>
          </div>
          <span className="hero-pulse-dot" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function HeroVideoScroll({ categories, businessCount, catCount }: HeroVideoScrollProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)
  const [loadPct, setLoadPct] = useState(0)
  const [visibleCards, setVisibleCards] = useState<boolean[]>(FLOATS.map(() => false))

  // Preload video y reproducirlo en loop (autoplay)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onProgress = () => {
      if (video.buffered.length > 0 && video.duration) {
        setLoadPct(video.buffered.end(video.buffered.length - 1) / video.duration)
      }
    }
    video.addEventListener('progress', onProgress)
    const onReady = () => {
      setVideoReady(true)
      setLoadPct(1)
      video.loop = true
      video.play().catch(() => {})
    }
    if (video.readyState >= 4) onReady()
    else video.addEventListener('canplaythrough', onReady)

    return () => {
      video.removeEventListener('progress', onProgress)
      video.removeEventListener('canplaythrough', onReady)
    }
  }, [])

  // Cards flotantes en bucle: aparecen una a una, luego se ocultan y reinician
  useEffect(() => {
    let i = 0
    // Mostrar la primera al cargar
    const showNext = () => {
      if (i >= FLOATS.length) {
        // Ciclo completo → reiniciar
        setVisibleCards(FLOATS.map(() => false))
        setTimeout(() => { i = 0; showNext() }, 1600)
        return
      }
      setVisibleCards(prev => prev.map((v, idx) => (idx === i ? true : v)))
      i++
      setTimeout(showNext, 2400)
    }
    const start = setTimeout(showNext, 900)
    return () => clearTimeout(start)
  }, [])

  return (
    <section
      className="relative h-screen overflow-hidden"
      style={{ background: 'linear-gradient(180deg,#FFF6E5 0%,#FFE9C7 60%,#FFD7A8 100%)' }}
    >
      {/* Video de fondo (loop) */}
      <video
        ref={videoRef}
        muted
        playsInline
        preload="auto"
        poster="/tourism/panoramica-lagos.jpg"
        tabIndex={-1}
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', filter: 'saturate(1.05) contrast(1.02)', zIndex: 1,
        }}
      >
        <source src="/assets/lagos-city-build.mp4" type="video/mp4" />
      </video>

      {/* Cinematic tint */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        background: `
          radial-gradient(ellipse 80% 60% at 50% 100%, rgba(31,41,55,0.55) 0%, rgba(31,41,55,0) 60%),
          radial-gradient(ellipse 100% 60% at 50% 0%, rgba(255,244,220,0.35) 0%, rgba(255,244,220,0) 60%)
        `,
      }} />

      {/* Loading overlay */}
      <div
        style={{
          position: 'absolute', inset: 0, zIndex: 5,
          display: 'grid', placeItems: 'center',
          background: 'linear-gradient(180deg,#FFF6E5 0%,#FFE9C7 60%,#FFD7A8 100%)',
          opacity: videoReady ? 0 : 1,
          pointerEvents: videoReady ? 'none' : 'auto',
          transition: 'opacity 0.6s ease',
        }}
      >
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
          padding: '28px 32px',
          background: 'rgba(255,253,248,0.86)',
          borderRadius: 20,
          boxShadow: '0 10px 28px -8px rgba(31,41,55,0.2)',
        }}>
          <div className="hero-spinner" />
          <span style={{ fontFamily: 'var(--display)', fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>
            Cargando Lagos<span className="hero-dots"><span>.</span><span>.</span><span>.</span></span>
          </span>
          <div style={{ width: 220, height: 4, borderRadius: 999, background: 'rgba(31,41,55,0.08)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--coral), var(--gold))',
              transformOrigin: 'left center',
              transform: `scaleX(${loadPct})`,
              transition: 'transform 0.25s ease',
            }} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 3,
        display: 'flex', flexDirection: 'column',
        padding: '110px 24px 56px',
      }}>
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', textAlign: 'center',
        }}>
          {/* Eyebrow */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '8px 14px 8px 8px',
            background: 'rgba(255,255,255,0.85)',
            color: 'var(--ink)', borderRadius: 999,
            fontSize: 13, fontWeight: 500,
            boxShadow: '0 2px 0 rgba(31,41,55,0.06), 0 10px 24px -10px rgba(31,41,55,0.2)',
            marginBottom: 22,
          }}>
            <span style={{
              width: 26, height: 26, borderRadius: 999,
              background: 'var(--coral)', color: 'white',
              display: 'grid', placeItems: 'center', fontSize: 14, flexShrink: 0,
            }}>✦</span>
            Hecho para Lagos de Moreno, Jalisco
          </span>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--display)', fontWeight: 700,
            fontSize: 'clamp(38px, 7vw, 92px)',
            lineHeight: 0.96, letterSpacing: '-0.035em',
            color: 'white', margin: '0 0 16px',
            textShadow: '0 4px 32px rgba(31,41,55,0.35)',
            maxWidth: '14ch',
          }}>
            Todo Lagos{' '}
            <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400, color: '#FFE7C2', letterSpacing: '-0.01em' }}>
              vive
            </em>
            <br />en un solo lugar
          </h1>

          <p style={{
            fontSize: 'clamp(14px, 1.4vw, 19px)',
            color: 'rgba(255,253,248,0.92)',
            maxWidth: '62ch',
            textShadow: '0 2px 16px rgba(31,41,55,0.4)',
            marginBottom: 28,
          }}>
            {businessCount}+ negocios · {catCount} categorías · Pueblo Mágico
          </p>

          {/* Search */}
          <div style={{ width: 'min(880px, 100%)', marginBottom: 20 }}>
            <SearchForm />
          </div>

          {/* Trust signals */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', justifyContent: 'center',
          }}>
            {[
              { dot: '#22C55E', label: 'Negocios abiertos ahora' },
              { dot: 'var(--gold)', label: '4.8 ★ promedio' },
              { dot: 'var(--coral)', label: 'Pueblo Mágico · Jalisco' },
            ].map((item, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  fontSize: 13, color: 'rgba(255,253,248,0.78)',
                  fontWeight: 500, letterSpacing: '0.01em',
                  textShadow: '0 1px 8px rgba(31,41,55,0.5)',
                  pointerEvents: 'none', userSelect: 'none',
                }}
              >
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: item.dot, flexShrink: 0,
                  boxShadow: `0 0 6px ${item.dot}`,
                }} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Floating cards — bucle (desktop only) */}
      {FLOATS.map((f, i) => (
        <FloatingCard key={i} f={f} visible={visibleCards[i]} delay={i * 0.9} />
      ))}

      {/* Scroll hint */}
      <div
        className="hidden md:flex"
        style={{
          position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
          zIndex: 4, flexDirection: 'column', alignItems: 'center', gap: 6,
          color: 'rgba(255,253,248,0.86)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
          pointerEvents: 'none',
        }}
      >
        <span>Descubre Lagos</span>
        <span className="hero-scroll-line" />
      </div>

      {/* Mobile CTA */}
      <div
        className="flex md:hidden"
        style={{
          position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          zIndex: 4, flexDirection: 'column', alignItems: 'center', gap: 10,
          pointerEvents: 'auto',
        }}
      >
        <Link
          href="/descubre"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px',
            background: 'var(--coral)',
            color: 'white', borderRadius: 999,
            fontSize: 15, fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(255,107,53,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          Explorar negocios
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
        <span style={{ fontSize: 11, color: 'rgba(255,253,248,0.6)', letterSpacing: '0.12em' }}>
          {businessCount}+ negocios en Lagos
        </span>
      </div>
    </section>
  )
}
