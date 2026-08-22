'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import StarRating from '@/components/reviews/StarRating'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, type MotionStyle } from 'framer-motion'
import { StaggerGroup, StaggerItem } from '@/components/animations/StaggerGroup'
import type { BusinessHours } from '@/lib/constants'

interface Business {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  address: string | null
  subscription_tier: string
  is_featured: boolean
  business_hours: BusinessHours | null
  rating: number
  total_reviews: number
  created_at?: string
  category: { name: string; icon: string } | null
  business_photos: { image_url: string }[]
}

const TABS = [
  { id: 'destacados', label: 'Destacados' },
  { id: 'abiertos', label: 'Abiertos ahora' },
  { id: 'nuevos', label: 'Nuevos' },
] as const

type TabId = typeof TABS[number]['id']

function daysAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'Hoy'
  if (diff === 1) return 'Ayer'
  if (diff < 7) return `Hace ${diff} días`
  if (diff < 30) return `Hace ${Math.floor(diff / 7)} sem.`
  return `Hace ${Math.floor(diff / 30)} mes.`
}

/* ═══════════════════════════════════════════════════════════
   PremiumCard v3 — impacto alto estilo Godly/Lapa.ninja
   - Spotlight radial que sigue el cursor (mouse position)
   - Tilt 3D real con springs (rotateX/rotateY)
   - Borde con gradiente animado (conic-gradient rotatorio)
   - Zoom cinematográfico + overlay en imagen
   - Glow de marca al hover
   ═══════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const

function PremiumCard({ business, tab, index }: { business: Business; tab: TabId; index: number }) {
  const [hovered, setHovered] = useState(false)
  const prefersReduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const heroImage = business.business_photos?.[0]?.image_url || business.cover_url

  // Posición del mouse para spotlight
  const mx = useMotionValue(50)
  const my = useMotionValue(50)

  // Tilt 3D con springs suaves
  const rotateX = useSpring(useTransform(my, [0, 100], [8, -8]), { stiffness: 160, damping: 20, mass: 0.5 })
  const rotateY = useSpring(useTransform(mx, [0, 100], [-10, 10]), { stiffness: 160, damping: 20, mass: 0.5 })

  const spotlightX = useTransform(mx, v => `${v}%`)
  const spotlightY = useTransform(my, v => `${v}%`)

  // Background del spotlight (radial que sigue al cursor)
  const spotlightBg = useTransform(
    [spotlightX, spotlightY],
    ([x, y]) => `radial-gradient(320px circle at ${x} ${y}, rgba(255,255,255,0.28) 0%, transparent 65%)`
  )

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = ((e.clientX - rect.left) / rect.width) * 100
    const py = ((e.clientY - rect.top) / rect.height) * 100
    mx.set(px)
    my.set(py)
  }

  const handleLeave = () => {
    setHovered(false)
    mx.set(50)
    my.set(50)
  }

  const cardStyle: MotionStyle = prefersReduced
    ? {}
    : {
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.6, ease: EASE, delay: Math.min(index * 0.1, 0.4) }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      className="relative h-full"
      style={{ perspective: 1000 }}
    >
      {/* Borde con gradiente animado (conic) que rota al hover */}
      <div
        className="absolute -inset-px rounded-[22px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: hovered
            ? 'conic-gradient(from var(--angle, 0deg), transparent 0%, rgba(255,107,53,0.7) 12%, rgba(245,185,66,0.9) 25%, transparent 40%, transparent 60%, rgba(34,184,207,0.5) 75%, transparent 90%)'
            : 'transparent',
          animation: hovered ? 'spin-border 4s linear infinite' : 'none',
          zIndex: 2,
        }}
      />

      {/* Contenedor de la card */}
      <motion.div
        animate={{ y: hovered ? -10 : 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="relative h-full rounded-[20px] overflow-hidden bg-white"
        style={{
          ...cardStyle,
          boxShadow: hovered
            ? '0 30px 70px -15px rgba(31,41,55,0.35), 0 0 40px rgba(255,107,53,0.12)'
            : '0 8px 30px -8px rgba(31,41,55,0.12), 0 2px 8px rgba(31,41,55,0.04)',
          transition: 'box-shadow 0.4s ease',
          zIndex: 1,
        }}
      >
        <Link href={`/negocios/${business.slug}`} className="block h-full">
          {/* Spotlight que sigue el cursor */}
          <motion.div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background: spotlightBg,
              opacity: hovered ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          />

          {/* Imagen cinematográfica */}
          <div className="relative overflow-hidden" style={{ height: 220 }}>
            {heroImage ? (
              <motion.div
                className="absolute inset-0"
                animate={{ scale: hovered ? 1.12 : 1 }}
                transition={{ duration: 0.9, ease: EASE }}
              >
                <Image
                  src={heroImage}
                  alt={business.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                />
              </motion.div>
            ) : (
              <div className="h-full w-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.12), rgba(245,185,66,0.08))' }}>
                <span className="text-5xl opacity-20">🏪</span>
              </div>
            )}

            {/* Overlay gradiente inferior (siempre sutil, más fuerte al hover) */}
            <div
              className="absolute inset-x-0 bottom-0 h-28 pointer-events-none transition-opacity duration-500"
              style={{
                background: 'linear-gradient(to top, rgba(18,22,32,0.75) 0%, rgba(18,22,32,0.2) 60%, transparent 100%)',
                opacity: hovered ? 1 : 0.45,
              }}
            />

            <div className="absolute top-3 left-3 z-10">
              <OpenClosedBadge businessHours={business.business_hours} />
            </div>

            {tab === 'nuevos' && business.created_at && (
              <div className="absolute top-3 right-3 z-10">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'var(--coral)' }}>
                  ✨ {daysAgo(business.created_at)}
                </span>
              </div>
            )}
            {tab !== 'nuevos' && business.category && (
              <div className="absolute top-3 right-3 z-10">
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                  style={{ background: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(4px)' }}>
                  {business.category.icon} {business.category.name}
                </span>
              </div>
            )}

            {/* Dirección en base de imagen al hover */}
            <div
              className="absolute inset-x-0 bottom-0 px-3.5 pb-3 pt-8 z-10"
              style={{
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.35s ease',
              }}
            >
              {business.address && (
                <p className="text-[11px] flex items-center gap-1 line-clamp-1" style={{ color: 'rgba(255,255,255,0.82)' }}>
                  <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {business.address}
                </p>
              )}
            </div>
          </div>

          {/* Contenido */}
          <div className="p-5">
            <h3 className="font-black text-lg leading-snug mb-1.5 truncate" style={{ color: 'var(--ink)' }}>
              {business.name}
            </h3>
            {business.total_reviews > 0 && (
              <div className="mb-2">
                <StarRating value={business.rating} count={business.total_reviews} size="sm" />
              </div>
            )}
            {business.description && (
              <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--muted)' }}>
                {business.description}
              </p>
            )}

            {/* CTA sutil que aparece al hover */}
            <div
              className="flex items-center gap-1.5 text-xs font-bold transition-all duration-300"
              style={{ color: 'var(--coral)', opacity: hovered ? 1 : 0, transform: hovered ? 'translateX(0)' : 'translateX(-6px)' }}
            >
              Ver negocio
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </Link>
      </motion.div>
    </motion.div>
  )
}

function BusinessGrid({ businesses, tab, loading }: {
  businesses: Business[]
  tab: TabId
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl overflow-hidden bg-white animate-pulse" style={{ boxShadow: '0 2px 12px rgba(31,41,55,0.08)' }}>
            <div className="h-52 bg-gray-100" />
            <div className="p-5 space-y-3">
              <div className="h-5 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
              <div className="h-3 bg-gray-100 rounded w-full" />
              <div className="h-10 bg-gray-100 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,107,53,0.08)' }}>
          <span className="text-4xl">
            {tab === 'abiertos' ? '🕐' : '✨'}
          </span>
        </div>
        <p className="font-semibold mb-1" style={{ color: 'var(--ink)' }}>
          {tab === 'abiertos' ? 'No encontramos negocios abiertos ahora' : 'Sin negocios nuevos aún'}
        </p>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {tab === 'abiertos' ? 'Intenta más tarde o busca por categoría' : 'Próximamente habrá más negocios aquí'}
        </p>
      </div>
    )
  }

  return (
    <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {businesses.map((business, i) => (
        <StaggerItem key={business.id} className="h-full">
          <PremiumCard business={business} tab={tab} index={i} />
        </StaggerItem>
      ))}
    </StaggerGroup>
  )
}

interface Props {
  initialBusinesses: Business[]
}

export default function FeaturedSection({ initialBusinesses }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('destacados')
  const [businesses, setBusinesses] = useState<Business[]>(initialBusinesses)
  const [loading, setLoading] = useState(false)
  const [cache, setCache] = useState<Partial<Record<TabId, Business[]>>>({
    destacados: initialBusinesses,
  })

  const handleTab = useCallback(async (tab: TabId) => {
    if (tab === activeTab) return
    setActiveTab(tab)

    if (cache[tab]) {
      setBusinesses(cache[tab]!)
      return
    }

    setLoading(true)
    try {
      const endpoint = tab === 'abiertos' ? '/api/businesses/open-now' : '/api/businesses/newest'
      const res = await fetch(endpoint)
      const data: Business[] = await res.json()
      setBusinesses(data)
      setCache(prev => ({ ...prev, [tab]: data }))
    } catch {
      setBusinesses([])
    } finally {
      setLoading(false)
    }
  }, [activeTab, cache])

  return (
    <section className="py-20 relative overflow-hidden" style={{ background: '#F8F1E7' }}>
      {/* Blobs decorativos de fondo */}
      <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(255,107,53,0.08)' }} />
      <div className="absolute -bottom-24 -right-16 w-80 h-80 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(245,185,66,0.12)' }} />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-4">
          <div>
            <span
              className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-3"
              style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}
            >
              Destacados
            </span>
            <h2
              className="text-4xl md:text-5xl font-black"
              style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
            >
              Negocios que <span style={{ color: 'var(--coral)' }}>brillan</span>
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTab(tab.id)}
                className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
                style={{
                  background: activeTab === tab.id ? 'var(--coral)' : 'rgba(31,41,55,0.07)',
                  color: activeTab === tab.id ? 'white' : 'var(--ink-soft)',
                }}
              >
                {tab.id === 'abiertos' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 align-middle" />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <BusinessGrid businesses={businesses} tab={activeTab} loading={loading} />

        <div className="text-center mt-10">
          <Link
            href="/descubre"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm border-2 transition-all hover:opacity-80"
            style={{ borderColor: 'var(--coral)', color: 'var(--coral)' }}
          >
            Ver todos los negocios
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
