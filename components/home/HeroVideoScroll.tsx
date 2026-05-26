'use client'
import { useEffect, useRef, useState } from 'react'
import SearchForm from '@/components/home/SearchForm'
import Link from 'next/link'

interface Category { id: string; name: string; icon: string; slug: string }
interface HeroVideoScrollProps {
  categories: Category[]
  businessCount: number
  catCount: number
}

const FLOATS = [
  { emoji: '🌮', name: 'Las Antojadas', meta: 'Tacos · Centro', grad: 'linear-gradient(135deg,var(--coral),var(--gold))', appear: 0.15, pos: { top: '28%', left: '24px' } },
  { emoji: '🏨', name: 'Casa Cantera', meta: 'Hotel · 4.8 ★', grad: 'linear-gradient(135deg,#22B8CF,#2F80ED)', appear: 0.30, pos: { top: '42%', right: '24px' } },
  { emoji: '🍦', name: 'Neverías Don Pancho', meta: 'Postres · 4.9 ★', grad: 'linear-gradient(135deg,#22C55E,#22B8CF)', appear: 0.50, pos: { bottom: '28%', left: '24px' } },
  { emoji: '💇‍♀️', name: 'Estudio Bugambilia', meta: 'Belleza · Centro', grad: 'linear-gradient(135deg,#D946EF,var(--coral))', appear: 0.68, pos: { bottom: '14%', right: '24px' } },
  { emoji: '☕', name: 'Café Cantera 1563', meta: 'Brunch · Galeana', grad: 'linear-gradient(135deg,var(--gold),#C86B4A)', appear: 0.82, pos: { top: '60%', left: '24px' } },
]

const STEPS = ['Plaza', 'Comercios', 'Servicios', 'Conectados']

export default function HeroVideoScroll({ categories, businessCount, catCount }: HeroVideoScrollProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [progress, setProgress] = useState(0)
  const [videoReady, setVideoReady] = useState(false)
  const [loadPct, setLoadPct] = useState(0)

  // mutable state for the rAF loop — never causes re-renders
  const state = useRef({ currentTime: 0, targetTime: 0, seeking: false, pendingSeek: null as number | null, duration: 1, ready: false })

  useEffect(() => {
    const video = videoRef.current
    const section = sectionRef.current
    if (!video || !section) return
    const s = state.current

    // 1. Buffer the video via direct src — avoids blob: CSP restrictions
    async function preload() {
      if (!video) return
      video.src = '/assets/lagos-city-build.mp4'
      video.preload = 'auto'

      // Track download progress via buffered ranges
      const onProgress = () => {
        if (video.buffered.length > 0 && video.duration) {
          setLoadPct(video.buffered.end(video.buffered.length - 1) / video.duration)
        }
      }
      video.addEventListener('progress', onProgress)

      await new Promise<void>(resolve => {
        if (video.readyState >= 4) { resolve(); return }
        const onReady = () => { video.removeEventListener('canplaythrough', onReady); resolve() }
        video.addEventListener('canplaythrough', onReady)
      })

      video.removeEventListener('progress', onProgress)
      s.duration = video.duration || 1
      s.ready = true
      setVideoReady(true)
      setLoadPct(1)
      // iOS needs play()+pause() to unlock currentTime seeks
      const p = video.play()
      if (p) p.then(() => video.pause()).catch(() => {})
    }
    preload()

    // 2. Scroll → target time
    function updateTarget() {
      const rect = section.getBoundingClientRect()
      const totalScroll = section.offsetHeight - window.innerHeight
      const p = Math.max(0, Math.min(1, (-rect.top) / totalScroll))
      setProgress(p)
      s.targetTime = p * Math.max(0, s.duration - 0.08)
    }
    window.addEventListener('scroll', updateTarget, { passive: true })
    window.addEventListener('resize', updateTarget)
    updateTarget()

    // 3. rAF: lerp currentTime toward target
    let rafId: number
    function tick() {
      rafId = requestAnimationFrame(tick)
      if (!s.ready) return
      const diff = s.targetTime - s.currentTime
      if (Math.abs(diff) < 0.005) return
      s.currentTime += diff * 0.22
      if (!s.seeking) {
        try { s.seeking = true; video.currentTime = s.currentTime } catch { s.seeking = false }
      } else {
        s.pendingSeek = s.currentTime
      }
    }
    rafId = requestAnimationFrame(tick)

    video.addEventListener('seeking', () => { s.seeking = true })
    video.addEventListener('seeked', () => {
      s.seeking = false
      if (s.pendingSeek !== null) {
        const t = s.pendingSeek; s.pendingSeek = null
        try { s.seeking = true; video.currentTime = t } catch { s.seeking = false }
      }
    })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', updateTarget)
      window.removeEventListener('resize', updateTarget)
    }
  }, [])

  const activeStep = Math.min(STEPS.length - 1, Math.floor(progress * STEPS.length))

  return (
    /* Outer section: 480vh gives scroll space. NO overflow:hidden here — sticky won't work with it. */
    <section
      ref={sectionRef}
      style={{ position: 'relative', height: '480vh', background: 'var(--ivory)' }}
    >
      {/* Sticky viewport — pinned at top, always 100vh tall */}
      <div
        style={{
          position: 'sticky', top: 0, height: '100vh', overflow: 'hidden',
          background: 'linear-gradient(180deg,#FFF6E5 0%,#FFE9C7 60%,#FFD7A8 100%)',
        }}
      >
        {/* Video — controlled ONLY by scroll, never autoplay */}
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
        />

        {/* Cinematic tint — dark at bottom, warm at top */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          background: `
            radial-gradient(ellipse 80% 60% at 50% 100%, rgba(31,41,55,0.55) 0%, rgba(31,41,55,0) 60%),
            radial-gradient(ellipse 100% 60% at 50% 0%, rgba(255,244,220,0.35) 0%, rgba(255,244,220,0) 60%)
          `,
        }} />

        {/* Loading overlay — hides once video is ready */}
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
              fontSize: 'clamp(48px, 7vw, 104px)',
              lineHeight: 0.96, letterSpacing: '-0.035em',
              color: 'white', margin: '0 0 22px',
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
              fontSize: 'clamp(16px, 1.4vw, 19px)',
              color: 'rgba(255,253,248,0.92)',
              maxWidth: '62ch',
              textShadow: '0 2px 16px rgba(31,41,55,0.4)',
              marginBottom: 36,
            }}>
              {businessCount}+ negocios locales · {catCount} categorías · Pueblo Mágico
            </p>

            {/* Search */}
            <div style={{ width: 'min(880px, 100%)', marginBottom: 18 }}>
              <SearchForm />
            </div>

            {/* Category chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 720 }}>
              {categories.slice(0, 8).map(cat => (
                <Link
                  key={cat.id}
                  href={`/categorias/${cat.slug}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px',
                    background: 'rgba(255,255,255,0.86)',
                    color: 'var(--ink-soft)', borderRadius: 999,
                    fontSize: 13, fontWeight: 500,
                    border: '1px solid rgba(255,255,255,0.7)',
                    textDecoration: 'none',
                    transition: 'background 0.2s, transform 0.2s',
                  }}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Floating business cards — appear at specific scroll progress */}
        {FLOATS.map((f, i) => (
          <div
            key={i}
            style={{
              position: 'absolute', zIndex: 4,
              ...f.pos,
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '7px 14px 7px 7px',
              background: 'rgba(255,253,248,0.92)',
              backdropFilter: 'blur(14px) saturate(160%)',
              WebkitBackdropFilter: 'blur(14px) saturate(160%)',
              borderRadius: 999,
              border: '1px solid rgba(255,253,248,0.55)',
              boxShadow: '0 4px 14px -4px rgba(31,41,55,0.18), 0 12px 30px -16px rgba(31,41,55,0.25)',
              fontSize: 13, color: 'var(--ink)',
              opacity: progress >= f.appear ? 1 : 0,
              transform: progress >= f.appear ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.96)',
              transition: 'opacity 0.6s cubic-bezier(.2,.7,.2,1), transform 0.6s cubic-bezier(.2,.7,.2,1)',
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
          </div>
        ))}

        {/* Progress steps — right side, desktop only */}
        <div
          className="hidden md:flex"
          style={{
            position: 'absolute', zIndex: 4,
            right: 28, top: '50%', transform: 'translateY(-50%)',
            flexDirection: 'column', gap: 14,
            color: 'rgba(255,253,248,0.95)',
            fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
          }}
        >
          {STEPS.map((step, i) => (
            <div key={step} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              opacity: i <= activeStep ? 1 : 0.35,
              transition: 'opacity 0.4s',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: 999, flexShrink: 0,
                background: i <= activeStep ? 'var(--coral)' : 'rgba(255,253,248,0.4)',
                transition: 'background 0.4s',
              }} />
              {step}
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div style={{
          position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)',
          zIndex: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          color: 'rgba(255,253,248,0.86)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase',
          pointerEvents: 'none',
        }}>
          <span>Scroll para descubrir</span>
          <span className="hero-scroll-line" />
        </div>
      </div>
    </section>
  )
}
