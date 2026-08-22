'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import StarRating from '@/components/reviews/StarRating'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
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

function PremiumCard({ business, tab }: { business: Business; tab: TabId }) {
  const [hovered, setHovered] = useState(false)
  const heroImage = business.business_photos?.[0]?.image_url || business.cover_url

  return (
    <Link
      href={`/negocios/${business.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="block rounded-2xl overflow-hidden bg-white relative"
      style={{
        transform: hovered
          ? 'perspective(900px) rotateX(-9deg) scale(1.05) translateY(-8px)'
          : 'perspective(900px) rotateX(0deg) scale(1) translateY(0)',
        transition: 'transform 0.45s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s ease',
        boxShadow: hovered
          ? '0 0 0 2px rgba(245,185,66,0.6), 0 24px 52px rgba(31,41,55,0.24), 0 48px 88px rgba(255,107,53,0.1)'
          : '0 1px 4px rgba(31,41,55,0.06), 0 6px 20px rgba(31,41,55,0.08)',
        cursor: 'pointer',
        textDecoration: 'none',
      }}
    >
      {/* Shine sweep — cruza al hover como tarjeta holográfica */}
      <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden rounded-2xl" aria-hidden="true">
        <div
          style={{
            position: 'absolute',
            top: 0,
            height: '100%',
            width: '45%',
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.28), transparent)',
            transform: `skewX(-18deg) translateX(${hovered ? '370%' : '-100%'})`,
            transition: hovered ? 'transform 0.65s ease' : 'transform 0s',
          }}
        />
      </div>

      {/* Accent line coral → gold */}
      <div style={{ height: 3, background: 'linear-gradient(90deg, var(--coral), var(--gold))' }} />

      {/* Hero image */}
      <div className="relative overflow-hidden" style={{ height: 204 }}>
        {heroImage ? (
          <Image
            src={heroImage}
            alt={business.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            style={{
              transform: hovered ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 0.55s ease',
            }}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.12), rgba(245,185,66,0.08))' }}>
            <span className="text-5xl opacity-20">🏪</span>
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 z-10">
          <OpenClosedBadge businessHours={business.business_hours} />
        </div>
        {tab === 'nuevos' && business.created_at && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'var(--coral)' }}>
              ✨ {daysAgo(business.created_at)}
            </span>
          </div>
        )}
        {tab !== 'nuevos' && business.category && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold text-white"
              style={{ background: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(4px)' }}>
              {business.category.icon} {business.category.name}
            </span>
          </div>
        )}

        {/* Dirección aparece en la base de la imagen al hover */}
        <div
          className="absolute inset-x-0 bottom-0 px-3.5 pb-3 pt-8 z-10"
          style={{
            background: 'linear-gradient(to top, rgba(18,22,32,0.85) 0%, transparent 100%)',
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

      {/* Content — sin botón, el click es toda la tarjeta */}
      <div className="p-4">
        <h3 className="font-black text-base leading-snug mb-1 truncate" style={{ color: 'var(--ink)' }}>
          {business.name}
        </h3>
        {business.total_reviews > 0 && (
          <div className="mb-2">
            <StarRating value={business.rating} count={business.total_reviews} size="sm" />
          </div>
        )}
        {business.description && (
          <p className="text-xs line-clamp-2" style={{ color: 'var(--muted)' }}>
            {business.description}
          </p>
        )}
      </div>
    </Link>
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
    <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {businesses.map((business) => (
        <StaggerItem key={business.id} className="h-full">
          <PremiumCard business={business} tab={tab} />
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
