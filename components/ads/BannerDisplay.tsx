'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import type { BannerPlacement } from '@/lib/constants'
import AdSenseSlot from './AdSenseSlot'
import BannerReveal from './BannerReveal'

// ─── 3D Block Reveal Overlay ─────────────────────────────────────────
const COLS = 6
const ROWS = 3
const BLOCK_DURATION = 420 // ms per block animation
const STAGGER = 75 // ms between blocks (diagonal wave)

function BlockRevealOverlay({ onDone }: { onDone: () => void }) {
  const doneRef = useRef(false)
  const totalDelay = (COLS + ROWS - 2) * STAGGER + BLOCK_DURATION

  useEffect(() => {
    const t = setTimeout(() => {
      if (!doneRef.current) { doneRef.current = true; onDone() }
    }, totalDelay + 80)
    return () => clearTimeout(t)
  }, [onDone, totalDelay])

  return (
    <>
      <style>{`
        @keyframes block3d-reveal {
          0%   { transform: perspective(500px) rotateY(0deg) scaleX(1); opacity: 1; }
          40%  { transform: perspective(500px) rotateY(45deg) scaleX(0.7); opacity: 0.8; }
          100% { transform: perspective(500px) rotateY(90deg) scaleX(0); opacity: 0; }
        }
      `}</style>
      <div
        className="absolute inset-0 z-10 overflow-hidden pointer-events-none"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {Array.from({ length: ROWS }).flatMap((_, row) =>
          Array.from({ length: COLS }).map((_, col) => (
            <div
              key={`${row}-${col}`}
              style={{
                background: `linear-gradient(135deg, #0F766E, #0D5E58)`,
                borderRight: '1px solid rgba(153,246,228,0.15)',
                borderBottom: '1px solid rgba(153,246,228,0.15)',
                transformOrigin: 'left center',
                animation: `block3d-reveal ${BLOCK_DURATION}ms ease-in forwards`,
                animationDelay: `${(col + row) * STAGGER}ms`,
              }}
            />
          ))
        )}
      </div>
    </>
  )
}

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

// Tiers con plan de pago (pueden cerrar banners completamente)
const PAID_TIERS = ['emprendedor', 'pro', 'avanzado', 'chatbot']

interface BannerDisplayProps {
  placement: BannerPlacement
  className?: string
  userTier?: string
  /** Force horizontal layout even for sidebar placements (useful for mobile inline) */
  forceHorizontal?: boolean
}

export default function BannerDisplay({ placement, className = '', userTier, forceHorizontal = false }: BannerDisplayProps) {
  const [banner, setBanner] = useState<BannerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [showBlockReveal, setShowBlockReveal] = useState(false)

  const isVertical = !forceHorizontal && VERTICAL_PLACEMENTS.includes(placement)
  const canClose = userTier ? PAID_TIERS.includes(userTier) : false

  // Restore minimized state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`banner-min-${placement}`)
      if (stored === 'true') setMinimized(true)
    } catch {}
  }, [placement])

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
          setShowBlockReveal(true)
          trackEvent(data[0].id, 'impression')
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [placement, trackEvent])

  const handleMinimize = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setMinimized(true)
    try { localStorage.setItem(`banner-min-${placement}`, 'true') } catch {}
  }

  const handleExpand = () => {
    setMinimized(false)
    try { localStorage.removeItem(`banner-min-${placement}`) } catch {}
  }

  const handleClose = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDismissed(true)
  }

  if (loading || dismissed) return null

  if (banner) {
    // Minimized state — small floating button
    if (minimized && isVertical) {
      return (
        <div className={`${className}`}>
          <button
            onClick={handleExpand}
            className="w-10 h-10 rounded-full bg-primary/90 hover:bg-primary text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-110 mx-auto"
            aria-label="Ver publicidad"
            title="Ver publicidad"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </button>
        </div>
      )
    }

    // Action button: minimize (free) or close (paid)
    const actionButton = isVertical ? (
      canClose ? (
        <button
          onClick={handleClose}
          className="absolute top-1 right-1 z-20 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          aria-label="Cerrar publicidad"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : (
        <button
          onClick={handleMinimize}
          className="absolute top-1 right-1 z-20 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          aria-label="Minimizar publicidad"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )
    ) : (
      <button
        onClick={handleClose}
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
            {actionButton}
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

    // ─── MODO HORIZONTAL (centro) — Remotion 3D Tile Reveal ───
    return (
      <div className={`relative ${className}`}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="h-px flex-1 bg-gray-200"></div>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-1">Publicidad</span>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>
        <div className="relative">
          {actionButton}
          {banner.link_url ? (
            <a
              href={banner.link_url}
              {...(banner.link_url.startsWith('/') || banner.link_url.includes('somoslagos.com.mx')
                ? {}
                : { target: '_blank', rel: 'noopener noreferrer sponsored' })}
              onClick={() => trackEvent(banner.id, 'click')}
              className="block"
            >
              <BannerReveal
                imageUrl={banner.image_url}
                title={banner.display_mode === 'image_text' ? banner.title : ''}
                description={banner.display_mode === 'image_text' ? banner.description : null}
                linkUrl={banner.link_url}
              />
            </a>
          ) : (
            <BannerReveal
              imageUrl={banner.image_url}
              title={banner.display_mode === 'image_text' ? banner.title : ''}
              description={banner.display_mode === 'image_text' ? banner.description : null}
              linkUrl={null}
            />
          )}
        </div>
      </div>
    )
  }

  // ─── Minimized state for fallback/CTA (no banner loaded) ───
  if (minimized && isVertical) {
    return (
      <div className={`${className}`}>
        <button
          onClick={handleExpand}
          className="w-10 h-10 rounded-full bg-primary/90 hover:bg-primary text-white shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-110 mx-auto"
          aria-label="Ver publicidad"
          title="Ver publicidad"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        </button>
      </div>
    )
  }

  // Boton minimizar/cerrar para fallbacks
  const fallbackActionButton = isVertical ? (
    canClose ? (
      <button
        onClick={handleClose}
        className="absolute top-1 right-1 z-20 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        aria-label="Cerrar publicidad"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    ) : (
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMinimize(e); }}
        className="absolute top-1 right-1 z-20 w-6 h-6 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
        aria-label="Minimizar publicidad"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    )
  ) : null

  // Fallback to AdSense if configured
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID
  if (adsenseId) {
    return (
      <div className={`relative ${className}`}>
        {fallbackActionButton}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="h-px flex-1 bg-gray-200"></div>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-1">Publicidad</span>
          <div className="h-px flex-1 bg-gray-200"></div>
        </div>
        <AdSenseSlot slot={placement} />
      </div>
    )
  }

  // Sin banner ni AdSense → no renderizar nada (sin espacio vacío ni CTAs de precio)
  return null
}
