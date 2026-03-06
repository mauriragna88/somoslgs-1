'use client'

import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import type { BannerPlacement } from '@/lib/constants'
import AdSenseSlot from './AdSenseSlot'

interface BannerData {
  id: string
  title: string
  description: string | null
  display_mode: 'image_only' | 'image_text'
  image_url: string
  link_url: string | null
}

// Placements laterales → se renderizan en vertical
const VERTICAL_PLACEMENTS: BannerPlacement[] = [
  'home_left', 'home_right',
  'search_sidebar', 'business_sidebar',
  'marketplace_sidebar'
]

interface BannerDisplayProps {
  placement: BannerPlacement
  className?: string
}

export default function BannerDisplay({ placement, className = '' }: BannerDisplayProps) {
  const [banner, setBanner] = useState<BannerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  const isVertical = VERTICAL_PLACEMENTS.includes(placement)

  const trackEvent = useCallback((bannerId: string, type: 'impression' | 'click') => {
    fetch('/api/banners/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bannerId, type }),
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetch(`/api/banners?placement=${placement}`)
      .then(res => res.json())
      .then((data: BannerData[]) => {
        if (data && data.length > 0) {
          setBanner(data[0])
          trackEvent(data[0].id, 'impression')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [placement, trackEvent])

  if (loading || dismissed) return null

  if (banner) {
    const closeButton = (
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setDismissed(true)
        }}
        className="absolute top-1 right-1 z-20 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        aria-label="Cerrar publicidad"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )

    // Determina si el link es interno (mismo sitio) o externo
    const isInternal = banner.link_url?.startsWith('/') || banner.link_url?.includes('somoslagos.com.mx')
    const linkProps = banner.link_url ? {
      href: banner.link_url,
      ...(isInternal ? {} : { target: '_blank' as const, rel: 'noopener noreferrer sponsored' }),
    } : null

    // Wrapper: si hay link, envuelve en <a>; si no, solo un div
    const wrapWithLink = (children: React.ReactNode) => {
      if (linkProps) {
        return (
          <a
            {...linkProps}
            onClick={() => trackEvent(banner.id, 'click')}
            className="block cursor-pointer"
          >
            {children}
          </a>
        )
      }
      return <>{children}</>
    }

    // ─── MODO VERTICAL (laterales) ───
    if (isVertical) {
      return wrapWithLink(
        <div className={`relative group ${className}`}>
          <span className="text-[9px] font-medium text-gray-400 uppercase tracking-wider block text-center mb-1">Publicidad</span>
          <div className="relative w-full overflow-hidden rounded-xl shadow-sm group-hover:shadow-md transition-shadow border border-gray-100">
            {closeButton}
            <div className="relative w-full" style={{ aspectRatio: '2/3', minHeight: 160 }}>
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                sizes="160px"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      )
    }

    // ─── MODO HORIZONTAL (centro) ───
    const isImageOnly = banner.display_mode === 'image_only'

    if (isImageOnly) {
      return wrapWithLink(
        <div className={`relative group ${className}`}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <div className="h-px flex-1 bg-gray-200"></div>
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-1">Publicidad</span>
            <div className="h-px flex-1 bg-gray-200"></div>
          </div>

          <div className="relative w-full overflow-hidden rounded-2xl shadow-sm group-hover:shadow-lg transition-shadow border border-gray-100">
            {closeButton}
            <div className="relative w-full" style={{ aspectRatio: '4/1', minHeight: 70, maxHeight: 160 }}>
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover"
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
          </div>
        </div>
      )
    }

    // ─── MODO IMAGEN + TEXTO (centro) ───
    return wrapWithLink(
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="h-px flex-1 bg-gray-200"></div>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-1">Publicidad</span>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/80 shadow-sm hover:shadow-lg transition-all group relative">
          {closeButton}
          <div className="flex flex-col sm:flex-row">
            <div className="relative w-full sm:w-36 md:w-44 flex-shrink-0">
              <div className="relative h-36 sm:h-full min-h-[120px]">
                <Image
                  src={banner.image_url}
                  alt={banner.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 176px"
                  className="object-cover"
                />
              </div>
              <div className="hidden sm:block absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-white to-transparent"></div>
            </div>

            <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center">
              <h3 className="font-bold text-secondary text-base sm:text-lg leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-1">
                {banner.title}
              </h3>
              {banner.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                  {banner.description}
                </p>
              )}
              <span className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold group-hover:gap-2 transition-all">
                Conocer mas
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </div>
          </div>

          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-60"></div>
        </div>
      </div>
    )
  }

  // Fallback to AdSense if configured
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID
  if (adsenseId) {
    return (
      <div className={className}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="h-px flex-1 bg-gray-200"></div>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-1">Publicidad</span>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>
        <AdSenseSlot slot={placement} />
      </div>
    )
  }

  // CTA: Anuncia aqui (cuando no hay banner ni AdSense)
  // Solo mostrar en placements principales, no en inline
  if (placement === 'search_inline') return null

  return (
    <div className={className}>
      <a
        href="https://wa.me/523474101382?text=Hola%2C%20me%20interesa%20anunciar%20mi%20negocio%20en%20SomosLagos"
        target="_blank"
        rel="noopener noreferrer"
        className="block overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gradient-to-br from-gray-50 to-white hover:border-primary/40 hover:shadow-sm transition-all group"
      >
        <div className="px-6 py-5 text-center">
          <p className="text-sm font-semibold text-gray-700 group-hover:text-primary transition-colors">
            📣 Anuncia tu negocio aqui
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Desde <span className="font-bold text-primary">$17 al dia</span> — miles de personas en Lagos te veran
          </p>
        </div>
      </a>
    </div>
  )
}
