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

interface BannerDisplayProps {
  placement: BannerPlacement
  className?: string
}

export default function BannerDisplay({ placement, className = '' }: BannerDisplayProps) {
  const [banner, setBanner] = useState<BannerData | null>(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) return null

  if (banner) {
    const isImageOnly = banner.display_mode === 'image_only'

    const content = isImageOnly ? (
      /* ─── MODO: SOLO IMAGEN ─── */
      <div className={`relative group ${className}`}>
        {/* Etiqueta Publicidad arriba */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="h-px flex-1 bg-gray-200"></div>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-1">Publicidad</span>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>

        <div className="relative w-full overflow-hidden rounded-2xl shadow-sm group-hover:shadow-lg transition-shadow border border-gray-100">
          <div className="relative w-full" style={{ aspectRatio: '4/1', minHeight: 70, maxHeight: 160 }}>
            <Image
              src={banner.image_url}
              alt={banner.title}
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover"
            />
          </div>
          {/* Gradient sutil abajo para legibilidad */}
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>
        </div>
      </div>
    ) : (
      /* ─── MODO: IMAGEN + TEXTO ─── */
      <div className={`relative ${className}`}>
        {/* Etiqueta Publicidad arriba */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="h-px flex-1 bg-gray-200"></div>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-1">Publicidad</span>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50/80 shadow-sm hover:shadow-lg transition-all group">
          <div className="flex flex-col sm:flex-row">
            {/* Imagen con marco pro */}
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
              {/* Borde decorativo diagonal en desktop */}
              <div className="hidden sm:block absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-white to-transparent"></div>
            </div>

            {/* Contenido de texto */}
            <div className="flex-1 p-4 sm:p-5 flex flex-col justify-center">
              <h3 className="font-bold text-secondary text-base sm:text-lg leading-tight mb-1 group-hover:text-primary transition-colors">
                {banner.title}
              </h3>
              {banner.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                  {banner.description}
                </p>
              )}
              {banner.link_url && (
                <span className="inline-flex items-center gap-1.5 text-sm text-primary font-semibold group-hover:gap-2 transition-all">
                  Conocer mas
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              )}
            </div>
          </div>

          {/* Linea decorativa superior con gradiente de marca */}
          <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-60"></div>
        </div>
      </div>
    )

    if (banner.link_url) {
      return (
        <a
          href={banner.link_url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => trackEvent(banner.id, 'click')}
          className="block"
        >
          {content}
        </a>
      )
    }

    return content
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

  return null
}
