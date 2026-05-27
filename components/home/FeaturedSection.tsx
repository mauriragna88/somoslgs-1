'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import StarRating from '@/components/reviews/StarRating'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
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

function PremiumCard({ business, tab }: { business: Business; tab: TabId }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const dx = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2)
    const dy = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2)
    setTilt({ x: -dy * 7, y: dx * 7 })
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTilt({ x: 0, y: 0 })
    setHovered(false)
  }, [])

  const heroImage = business.business_photos?.[0]?.image_url || business.cover_url

  return (
    <div style={{ perspective: '1000px' }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="rounded-2xl overflow-hidden bg-white relative"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovered ? 1.02 : 1})`,
          transition: hovered ? 'transform 0.08s linear' : 'transform 0.5s ease-out',
          boxShadow: hovered
            ? '0 0 0 2px rgba(245,185,66,0.65), 0 24px 60px rgba(255,107,53,0.18), 0 8px 24px rgba(31,41,55,0.1)'
            : '0 2px 12px rgba(31,41,55,0.08)',
        }}
      >
        {/* Hero image */}
        <div className="relative h-52 overflow-hidden">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={business.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              style={{
                transform: hovered ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 0.5s ease-out',
              }}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.12), rgba(245,185,66,0.08))' }}>
              <span className="text-5xl opacity-20">🏪</span>
            </div>
          )}

          <div className="absolute top-3 left-3">
            <OpenClosedBadge businessHours={business.business_hours} />
          </div>
          {tab === 'nuevos' && business.created_at && (
            <div className="absolute top-3 right-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'var(--coral)' }}>
                ✨ {daysAgo(business.created_at)}
              </span>
            </div>
          )}
          {tab !== 'nuevos' && business.category && (
            <div className="absolute top-3 right-3">
              <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                {business.category.icon} {business.category.name}
              </span>
            </div>
          )}

          {/* Slide-up overlay on hover */}
          <div
            className="absolute inset-0 flex flex-col justify-end px-4 pb-4"
            style={{
              background: 'linear-gradient(to top, rgba(31,41,55,0.9) 0%, rgba(31,41,55,0.35) 55%, transparent 100%)',
              opacity: hovered ? 1 : 0,
              transform: hovered ? 'translateY(0)' : 'translateY(8px)',
              transition: 'opacity 0.28s ease, transform 0.28s ease',
              pointerEvents: hovered ? 'auto' : 'none',
            }}
          >
            {business.address && (
              <p className="text-white text-xs mb-2.5 flex items-center gap-1.5 line-clamp-1 opacity-90">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {business.address}
              </p>
            )}
            <Link
              href={`/negocios/${business.slug}`}
              className="block text-center py-2 rounded-xl text-sm font-bold text-white"
              style={{ background: 'var(--coral)' }}
            >
              Ver perfil →
            </Link>
          </div>
        </div>

        <div className="p-5">
          <h3 className="font-bold text-lg mb-1 truncate" style={{ color: 'var(--ink)' }}>
            {business.name}
          </h3>

          {business.total_reviews > 0 && (
            <div className="mb-3">
              <StarRating value={business.rating} count={business.total_reviews} size="sm" />
            </div>
          )}

          {business.description && (
            <p className="text-sm line-clamp-2 mb-4" style={{ color: 'var(--ink-soft)' }}>
              {business.description}
            </p>
          )}

          <Link
            href={`/negocios/${business.slug}`}
            className="block text-center py-2.5 rounded-xl text-sm font-semibold border-2 transition-all hover:opacity-80"
            style={{ borderColor: 'var(--coral)', color: 'var(--coral)' }}
          >
            Ver perfil
          </Link>
        </div>
      </div>
    </div>
  )
}

function BusinessGrid({ businesses, tab, loading }: {
  businesses: Business[]
  tab: TabId
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {businesses.map((business) => (
        <PremiumCard key={business.id} business={business} tab={tab} />
      ))}
    </div>
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
    <section className="py-20" style={{ background: '#F8F1E7' }}>
      <div className="container mx-auto px-4">
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
              Negocios que brillan
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
