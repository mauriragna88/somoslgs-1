'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import BusinessCard from '@/components/shared/BusinessCard'
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
  neighborhood?: string | null
  phone?: string | null
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

function BusinessGrid({ businesses, tab, loading }: {
  businesses: Business[]
  tab: TabId
  loading: boolean
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="aspect-[3/4] rounded-2xl animate-pulse" style={{ background: 'rgba(31,41,55,0.07)' }} />
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
    <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {businesses.map((business) => (
        <StaggerItem key={business.id} className="h-full">
          <BusinessCard business={business} />
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
