'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface SliderBusiness {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  category: { name: string; icon: string } | null
  rating: number
  total_reviews: number
  business_photos: { image_url: string }[]
}

interface PremiumSliderProps {
  businesses: SliderBusiness[]
}

type TransitionState = 'idle' | 'exit' | 'enter'

export default function PremiumSlider({ businesses }: PremiumSliderProps) {
  const [current, setCurrent] = useState(0)
  const [transition, setTransition] = useState<TransitionState>('idle')
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [displayed, setDisplayed] = useState(0) // the index actually shown
  const pendingRef = useRef<number>(0)
  const total = businesses.length

  const goTo = useCallback((idx: number, dir: 'next' | 'prev') => {
    if (transition !== 'idle') return
    pendingRef.current = idx
    setDirection(dir)
    setTransition('exit')
  }, [transition])

  const next = useCallback(() => {
    goTo((current + 1) % total, 'next')
  }, [current, total, goTo])

  const prev = useCallback(() => {
    goTo((current - 1 + total) % total, 'prev')
  }, [current, total, goTo])

  // Transition state machine
  useEffect(() => {
    if (transition === 'exit') {
      const t = setTimeout(() => {
        setCurrent(pendingRef.current)
        setDisplayed(pendingRef.current)
        setTransition('enter')
      }, 380)
      return () => clearTimeout(t)
    }
    if (transition === 'enter') {
      const t = setTimeout(() => setTransition('idle'), 420)
      return () => clearTimeout(t)
    }
  }, [transition])

  // Auto-rotate every 5s
  useEffect(() => {
    if (total <= 1) return
    const timer = setInterval(next, 5500)
    return () => clearInterval(timer)
  }, [next, total])

  if (total === 0) return null

  const biz = businesses[displayed]
  const heroImage = biz.cover_url || biz.business_photos?.[0]?.image_url
  const photos = biz.business_photos || []

  // CSS transform values per transition state + direction
  const getImageTransform = () => {
    if (transition === 'exit') {
      return direction === 'next'
        ? 'perspective(1200px) rotateY(-15deg) translateX(-8%) scale(0.92)'
        : 'perspective(1200px) rotateY(15deg) translateX(8%) scale(0.92)'
    }
    if (transition === 'enter') {
      return 'perspective(1200px) rotateY(0deg) translateX(0) scale(1)'
    }
    return 'perspective(1200px) rotateY(0deg) translateX(0) scale(1)'
  }

  const getImageOpacity = () => {
    if (transition === 'exit') return 0
    if (transition === 'enter') return 1
    return 1
  }

  const getEnterInitial = () => {
    if (transition === 'enter') {
      return direction === 'next'
        ? 'perspective(1200px) rotateY(15deg) translateX(8%) scale(0.92)'
        : 'perspective(1200px) rotateY(-15deg) translateX(-8%) scale(0.92)'
    }
    return undefined
  }

  const contentTransition = transition === 'exit'
    ? { opacity: 0, transform: `translateY(${direction === 'next' ? '12px' : '-12px'})` }
    : transition === 'enter'
    ? { opacity: 1, transform: 'translateY(0)' }
    : { opacity: 1, transform: 'translateY(0)' }

  return (
    <>
      <style>{`
        @keyframes sl-enter-next {
          from { opacity: 0; transform: perspective(1200px) rotateY(15deg) translateX(8%) scale(0.92); }
          to   { opacity: 1; transform: perspective(1200px) rotateY(0deg) translateX(0) scale(1); }
        }
        @keyframes sl-enter-prev {
          from { opacity: 0; transform: perspective(1200px) rotateY(-15deg) translateX(-8%) scale(0.92); }
          to   { opacity: 1; transform: perspective(1200px) rotateY(0deg) translateX(0) scale(1); }
        }
        @keyframes sl-exit-next {
          from { opacity: 1; transform: perspective(1200px) rotateY(0deg) translateX(0) scale(1); }
          to   { opacity: 0; transform: perspective(1200px) rotateY(-15deg) translateX(-8%) scale(0.92); }
        }
        @keyframes sl-exit-prev {
          from { opacity: 1; transform: perspective(1200px) rotateY(0deg) translateX(0) scale(1); }
          to   { opacity: 0; transform: perspective(1200px) rotateY(15deg) translateX(8%) scale(0.92); }
        }
        @keyframes sl-content-in {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sl-content-out {
          from { opacity: 1; transform: translateY(0); }
          to   { opacity: 0; transform: translateY(-10px); }
        }
        .sl-img-exit-next  { animation: sl-exit-next  380ms cubic-bezier(.4,0,.2,1) forwards; }
        .sl-img-exit-prev  { animation: sl-exit-prev  380ms cubic-bezier(.4,0,.2,1) forwards; }
        .sl-img-enter-next { animation: sl-enter-next 420ms cubic-bezier(.2,0,.2,1) forwards; }
        .sl-img-enter-prev { animation: sl-enter-prev 420ms cubic-bezier(.2,0,.2,1) forwards; }
        .sl-content-out    { animation: sl-content-out 280ms ease forwards; }
        .sl-content-in     { animation: sl-content-in  380ms ease 60ms forwards; opacity: 0; }
      `}</style>

      <div className="relative rounded-3xl overflow-hidden border-2 border-pueblo-barroco/40 shadow-pueblo bg-pueblo-noche" style={{ perspective: '1200px' }}>

        {/* Background hero */}
        <div className="relative h-72 sm:h-80 md:h-96 overflow-hidden">
          {heroImage ? (
            <div
              className={`absolute inset-0 ${
                transition === 'exit'
                  ? direction === 'next' ? 'sl-img-exit-next' : 'sl-img-exit-prev'
                  : transition === 'enter'
                  ? direction === 'next' ? 'sl-img-enter-next' : 'sl-img-enter-prev'
                  : ''
              }`}
            >
              <Image
                src={heroImage}
                alt={biz.name}
                fill
                sizes="100vw"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pueblo-noche via-pueblo-noche/70 to-pueblo-noche/30" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-pueblo-noche via-pueblo-noche/90 to-pueblo-cantera/40" />
          )}

          {/* Slide number indicator */}
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 bg-pueblo-noche/60 backdrop-blur-sm rounded-full px-3 py-1 border border-pueblo-barroco/30">
            <span className="text-pueblo-barroco font-bold text-sm">{current + 1}</span>
            <span className="text-pueblo-crema/40 text-xs">/</span>
            <span className="text-pueblo-crema/60 text-xs">{total}</span>
          </div>

          {/* Content overlay */}
          <div
            className={`absolute inset-0 flex flex-col justify-end p-6 md:p-10 ${
              transition === 'exit' ? 'sl-content-out' : transition === 'enter' ? 'sl-content-in' : ''
            }`}
          >
            {/* Badge */}
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-pueblo-barroco text-pueblo-noche text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Verificado
              </span>
              {biz.category && (
                <span className="text-pueblo-canteraLight/80 text-sm">{biz.category.icon} {biz.category.name}</span>
              )}
            </div>

            {/* Logo + Name */}
            <div className="flex items-center gap-4 mb-3">
              {biz.logo_url && (
                <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-pueblo-barroco/50 relative bg-white shadow-xl">
                  <Image src={biz.logo_url} alt={biz.name} fill sizes="64px" className="object-cover" />
                </div>
              )}
              <h3 className="text-2xl md:text-3xl font-extrabold text-pueblo-crema leading-tight">
                {biz.name}
              </h3>
            </div>

            {/* Description */}
            {biz.description && (
              <p className="text-pueblo-canteraLight/80 text-sm md:text-base line-clamp-2 max-w-2xl mb-4">
                {biz.description}
              </p>
            )}

            {/* Mini gallery + CTA */}
            <div className="flex items-end justify-between gap-4">
              {photos.length > 1 && (
                <div className="hidden sm:flex gap-2">
                  {photos.slice(0, 4).map((p, i) => (
                    <div key={i} className="relative w-16 h-12 rounded-lg overflow-hidden bg-pueblo-noche/30 flex-shrink-0 ring-1 ring-pueblo-barroco/30">
                      <Image src={p.image_url} alt="" fill sizes="64px" className="object-cover" />
                    </div>
                  ))}
                  {photos.length > 4 && (
                    <div className="w-16 h-12 rounded-lg bg-pueblo-noche/30 flex items-center justify-center ring-1 ring-pueblo-barroco/30">
                      <span className="text-xs font-semibold text-pueblo-crema/80">+{photos.length - 4}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4">
                {biz.total_reviews > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-pueblo-barroco text-lg font-bold">{biz.rating.toFixed(1)}</span>
                    <svg className="w-5 h-5 text-pueblo-barroco" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-pueblo-crema/60 text-sm">({biz.total_reviews})</span>
                  </div>
                )}
                <Link
                  href={`/negocios/${biz.slug}`}
                  className="bg-pueblo-barroco hover:bg-pueblo-terracotta text-pueblo-noche px-6 py-2.5 rounded-full font-bold text-sm shadow-lg transition-all hover:scale-105"
                >
                  Ver Negocio
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar (replaces accent bar — animates per slide interval) */}
        <div className="h-1 bg-pueblo-noche/40 overflow-hidden">
          <div
            key={current}
            className="h-full bg-gradient-to-r from-pueblo-barroco via-pueblo-cantera to-pueblo-barroco"
            style={{
              animation: total > 1 ? 'sl-progress 5.5s linear forwards' : 'none',
              width: '100%',
              transformOrigin: 'left',
            }}
          />
        </div>
        <style>{`
          @keyframes sl-progress {
            from { transform: scaleX(0); }
            to   { transform: scaleX(1); }
          }
        `}</style>

        {/* Navigation arrows */}
        {total > 1 && (
          <>
            <button
              onClick={(e) => { e.preventDefault(); prev() }}
              className="absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 bg-pueblo-noche/50 hover:bg-pueblo-noche/80 backdrop-blur-sm rounded-full flex items-center justify-center text-pueblo-crema transition-all hover:scale-110 active:scale-95 z-10 border border-pueblo-barroco/20"
              aria-label="Anterior"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.preventDefault(); next() }}
              className="absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 bg-pueblo-noche/50 hover:bg-pueblo-noche/80 backdrop-blur-sm rounded-full flex items-center justify-center text-pueblo-crema transition-all hover:scale-110 active:scale-95 z-10 border border-pueblo-barroco/20"
              aria-label="Siguiente"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {businesses.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); goTo(i, i > current ? 'next' : 'prev') }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === current ? 'bg-pueblo-barroco w-6' : 'bg-pueblo-crema/40 hover:bg-pueblo-crema/60 w-2.5'
                  }`}
                  aria-label={`Ir a negocio ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
