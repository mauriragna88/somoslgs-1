'use client'
import { useEffect, useRef, useState } from 'react'
import SearchForm from '@/components/home/SearchForm'

interface Category { id: string; name: string; icon: string; slug: string }
interface HeroVideoScrollProps {
  categories: Category[]
  businessCount: number
  catCount: number
}

const PROGRESS_STEPS = [
  { threshold: 0.15, label: 'Busca tu negocio favorito' },
  { threshold: 0.35, label: 'Conecta directo por WhatsApp' },
  { threshold: 0.55, label: 'Pide productos al instante' },
  { threshold: 0.75, label: 'Descubre lo mejor de Lagos' },
]

const FLOAT_CARDS = [
  { name: 'Taquería El Güero', cat: 'Comida', rating: 4.9, delay: 0.2 },
  { name: 'Farmacia San Juan', cat: 'Salud', rating: 4.7, delay: 0.35 },
  { name: 'Hotel Colonial', cat: 'Hospedaje', rating: 4.8, delay: 0.5 },
  { name: 'Ferretería López', cat: 'Servicios', rating: 4.6, delay: 0.65 },
  { name: 'Panadería La Fe', cat: 'Comida', rating: 5.0, delay: 0.8 },
]

export default function HeroVideoScroll({ categories, businessCount, catCount }: HeroVideoScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const rafRef = useRef<number>(0)
  const [progress, setProgress] = useState(0)
  const [videoReady, setVideoReady] = useState(false)
  const [visibleFloats, setVisibleFloats] = useState(0)

  // Video load: set src directly, play+pause to make it seekable
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onReady = () => {
      video.play()
        .then(() => { video.pause(); setVideoReady(true) })
        .catch(() => setVideoReady(true))
    }

    video.addEventListener('loadedmetadata', onReady, { once: true })
    video.src = '/assets/lagos-city-build.mp4'
    video.load()

    return () => {
      video.removeEventListener('loadedmetadata', onReady)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Scroll sync
  useEffect(() => {
    const container = containerRef.current
    const video = videoRef.current
    if (!container || !video) return
    let targetTime = 0
    let currentTime = 0

    const onScroll = () => {
      const rect = container.getBoundingClientRect()
      const total = container.offsetHeight - window.innerHeight
      const scrolled = Math.max(0, -rect.top)
      const prog = Math.min(1, scrolled / total)
      setProgress(prog)
      // reveal floats
      setVisibleFloats(Math.floor(prog * FLOAT_CARDS.length * 1.4))
      targetTime = prog * (video.duration || 11)
    }

    const animate = () => {
      currentTime += (targetTime - currentTime) * 0.08
      if (video && Math.abs(currentTime - video.currentTime) > 0.01) {
        video.currentTime = currentTime
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [videoReady])

  const activeStep = PROGRESS_STEPS.filter(s => progress >= s.threshold).length - 1

  return (
    <div ref={containerRef} style={{ height: '480vh' }} className="relative">
      {/* Sticky pin */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Video background */}
        <video
          ref={videoRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          autoPlay
          loop
          preload="auto"
          style={{ filter: 'brightness(0.75)' }}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-transparent to-transparent opacity-70" />

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
          {/* Eyebrow */}
          <span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest mb-6 text-white/80"
            style={{ background: 'rgba(255,107,53,0.25)', border: '1px solid rgba(255,107,53,0.4)' }}
          >
            📍 Lagos de Moreno, Jalisco
          </span>

          {/* Headline */}
          <h1
            className="text-5xl md:text-7xl font-bold text-white mb-4 leading-none tracking-tight max-w-4xl"
            style={{ fontFamily: 'var(--display)' }}
          >
            Descubre el alma de{' '}
            <span style={{ color: 'var(--coral)' }}>Lagos</span>
          </h1>
          <p className="text-white/70 text-lg md:text-xl mb-8 max-w-xl" style={{ fontFamily: 'var(--body)' }}>
            {businessCount}+ negocios locales · {catCount} categorías · Pueblo Mágico
          </p>

          {/* Search */}
          <div className="w-full max-w-2xl mb-8">
            <SearchForm />
          </div>

          {/* Category chips */}
          <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
            {categories.slice(0, 8).map(cat => (
              <a
                key={cat.id}
                href={`/categorias/${cat.slug}`}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium text-white/90 transition-all hover:text-white hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </a>
            ))}
          </div>
        </div>

        {/* Progress steps */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-3 hidden md:flex">
          {PROGRESS_STEPS.map((step, i) => (
            <div key={i} className={`flex items-center gap-2 transition-all duration-500 ${i <= activeStep ? 'opacity-100' : 'opacity-30'}`}>
              <div
                className="w-2 h-2 rounded-full transition-all"
                style={{
                  background: i <= activeStep ? 'var(--coral)' : 'rgba(255,255,255,0.4)',
                  boxShadow: i === activeStep ? '0 0 8px var(--coral)' : 'none',
                }}
              />
              <span className="text-[11px] text-white/80 font-medium whitespace-nowrap hidden xl:block">{step.label}</span>
            </div>
          ))}
        </div>

        {/* Floating business cards */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden hidden lg:block">
          {FLOAT_CARDS.map((card, i) => (
            <div
              key={i}
              className={`absolute transition-all duration-700 ${i < visibleFloats ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{
                left: `${8 + i * 16}%`,
                top: `${25 + (i % 2) * 30}%`,
                transitionDelay: `${card.delay}s`,
              }}
            >
              <div
                className="px-4 py-3 rounded-2xl text-sm font-medium"
                style={{ background: 'rgba(255,253,248,0.95)', boxShadow: 'var(--shadow-card)', backdropFilter: 'blur(12px)', minWidth: '160px' }}
              >
                <p className="font-semibold text-[13px]" style={{ color: 'var(--ink)' }}>{card.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{card.cat}</span>
                  <span className="text-[11px] font-bold" style={{ color: 'var(--coral)' }}>★ {card.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="text-[11px] text-white/50 uppercase tracking-widest">Desliza</span>
          <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
        </div>
      </div>
    </div>
  )
}
