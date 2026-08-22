'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import BusinessCard from '@/components/shared/BusinessCard'
import BannerDisplay from '@/components/ads/BannerDisplay'
import { StaggerGroup, StaggerItem } from '@/components/animations/StaggerGroup'
import type { BusinessHours } from '@/lib/constants'

const SearchResultsMap = dynamic(() => import('./SearchResultsMap'), {
  ssr: false,
  loading: () => (
    <div
      className="w-full rounded-2xl flex items-center justify-center"
      style={{ height: 500, background: 'rgba(31,41,55,0.04)', border: '1px solid rgba(31,41,55,0.08)' }}
    >
      <p style={{ color: 'var(--muted)', fontFamily: 'var(--body)' }}>Cargando mapa…</p>
    </div>
  ),
})

interface Business {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  phone: string | null
  address: string | null
  neighborhood: string | null
  is_active: boolean
  subscription_tier: string
  is_featured: boolean
  business_hours: BusinessHours | null
  rating: number
  total_reviews: number
  latitude: number | null
  longitude: number | null
  category: { id: string; name: string; icon: string } | null
}

interface SearchViewToggleProps {
  businesses: Business[]
  query: string
}

export default function SearchViewToggle({ businesses, query }: SearchViewToggleProps) {
  const [view, setView] = useState<'lista' | 'mapa'>('lista')
  const withCoords = businesses.filter((b) => b.latitude != null && b.longitude != null)

  return (
    <div>
      {/* Count + toggle */}
      <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <p style={{ color: 'var(--muted)', fontFamily: 'var(--body)' }}>
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{businesses.length}</span>
          {' '}negocio{businesses.length !== 1 ? 's' : ''} encontrado{businesses.length !== 1 ? 's' : ''}
          {query && (
            <span>
              {' '}para <strong style={{ color: 'var(--ink)' }}>&ldquo;{query}&rdquo;</strong>
            </span>
          )}
        </p>

        <div
          className="flex gap-1 rounded-xl p-1"
          style={{ background: 'rgba(31,41,55,0.06)' }}
        >
          <button
            onClick={() => setView('lista')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors"
            style={
              view === 'lista'
                ? { background: 'var(--coral)', color: '#fff', boxShadow: '0 2px 8px rgba(255,107,53,0.25)' }
                : { color: 'var(--ink-soft)' }
            }
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            Lista
          </button>
          <button
            onClick={() => setView('mapa')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors"
            style={
              view === 'mapa'
                ? { background: 'var(--coral)', color: '#fff', boxShadow: '0 2px 8px rgba(255,107,53,0.25)' }
                : { color: 'var(--ink-soft)' }
            }
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
            </svg>
            Mapa
            {withCoords.length > 0 && (
              <span
                className="ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={
                  view === 'mapa'
                    ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
                    : { background: 'rgba(255,107,53,0.12)', color: 'var(--coral)' }
                }
              >
                {withCoords.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {view === 'lista' ? (
        <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {businesses.map((business, index) => (
            <React.Fragment key={business.id}>
              {index > 0 && index % 8 === 0 && (
                <StaggerItem className="col-span-full">
                  <div
                    className="rounded-2xl overflow-hidden relative"
                    style={{ background: 'var(--ivory)', border: '1px solid rgba(31,41,55,0.08)' }}
                  >
                    <div
                      className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded text-xs font-medium"
                      style={{ background: 'rgba(31,41,55,0.07)', color: 'var(--muted)' }}
                    >
                      Patrocinado
                    </div>
                    <BannerDisplay placement="search_inline" />
                  </div>
                </StaggerItem>
              )}
              <StaggerItem className="h-full">
                <BusinessCard business={business} />
              </StaggerItem>
            </React.Fragment>
          ))}
        </StaggerGroup>
      ) : (
        <SearchResultsMap businesses={businesses} />
      )}
    </div>
  )
}
