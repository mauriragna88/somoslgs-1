'use client'

import { useState, useEffect, useCallback } from 'react'
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

export default function PremiumSlider({ businesses }: PremiumSliderProps) {
  const [current, setCurrent] = useState(0)
  const total = businesses.length

  const next = useCallback(() => {
    setCurrent(prev => (prev + 1) % total)
  }, [total])

  const prev = useCallback(() => {
    setCurrent(prev => (prev - 1 + total) % total)
  }, [total])

  // Auto-rotate every 5s
  useEffect(() => {
    if (total <= 1) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [next, total])

  if (total === 0) return null

  const biz = businesses[current]
  const heroImage = biz.cover_url || biz.business_photos?.[0]?.image_url
  const photos = biz.business_photos || []

  return (
    <div className="relative rounded-3xl overflow-hidden border-2 border-accent/40 shadow-2xl shadow-accent/10 bg-secondary">
      {/* Background hero */}
      <div className="relative h-72 sm:h-80 md:h-96">
        {heroImage ? (
          <>
            <Image
              src={heroImage}
              alt={biz.name}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-secondary via-secondary/60 to-secondary/20" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/90 to-primary/60" />
        )}

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
          {/* Badge */}
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-accent text-secondary text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Negocio Verificado
            </span>
            {biz.category && (
              <span className="text-white/80 text-sm">{biz.category.icon} {biz.category.name}</span>
            )}
          </div>

          {/* Logo + Name */}
          <div className="flex items-center gap-4 mb-3">
            {biz.logo_url && (
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-accent/50 relative bg-white shadow-xl">
                <Image src={biz.logo_url} alt={biz.name} fill sizes="64px" className="object-cover" />
              </div>
            )}
            <h3 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
              {biz.name}
            </h3>
          </div>

          {/* Description */}
          {biz.description && (
            <p className="text-white/80 text-sm md:text-base line-clamp-2 max-w-2xl mb-4">
              {biz.description}
            </p>
          )}

          {/* Mini gallery + CTA */}
          <div className="flex items-end justify-between gap-4">
            {/* Photos preview */}
            {photos.length > 1 && (
              <div className="hidden sm:flex gap-2">
                {photos.slice(0, 4).map((p, i) => (
                  <div key={i} className="relative w-16 h-12 rounded-lg overflow-hidden bg-white/10 flex-shrink-0 ring-1 ring-white/20">
                    <Image src={p.image_url} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                ))}
                {photos.length > 4 && (
                  <div className="w-16 h-12 rounded-lg bg-white/10 flex items-center justify-center ring-1 ring-white/20">
                    <span className="text-xs font-semibold text-white/80">+{photos.length - 4}</span>
                  </div>
                )}
              </div>
            )}

            {/* Rating + CTA */}
            <div className="flex items-center gap-4">
              {biz.total_reviews > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-accent text-lg font-bold">{biz.rating.toFixed(1)}</span>
                  <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-white/60 text-sm">({biz.total_reviews})</span>
                </div>
              )}
              <Link
                href={`/negocios/${biz.slug}`}
                className="bg-accent hover:bg-accent-dark text-secondary px-6 py-2.5 rounded-full font-bold text-sm shadow-lg transition-all hover:scale-105"
              >
                Ver Negocio
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Accent bar */}
      <div className="h-1.5 bg-gradient-to-r from-accent via-primary to-accent" />

      {/* Navigation arrows */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev() }}
            className="absolute top-1/2 left-3 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
            aria-label="Anterior"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next() }}
            className="absolute top-1/2 right-3 -translate-y-1/2 w-10 h-10 bg-black/30 hover:bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
            aria-label="Siguiente"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {businesses.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.preventDefault(); setCurrent(i) }}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === current ? 'bg-accent w-6' : 'bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Ir a negocio ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
