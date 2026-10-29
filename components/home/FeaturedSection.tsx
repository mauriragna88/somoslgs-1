'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'framer-motion'
import BusinessCard from '@/components/shared/BusinessCard'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
import { StaggerGroup, StaggerItem } from '@/components/animations/StaggerGroup'
import type { BusinessHours } from '@/lib/constants'
import styles from './FeaturedSection.module.css'

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

const EASE = [0.22, 1, 0.36, 1] as const

/** Negocio que siempre encabeza la pestaña Destacados (por nombre o slug). */
const LEAD_KEYWORD = 'devogatec'

function pickImage(b: Business): string | null {
  return b.cover_url || b.business_photos?.[0]?.image_url || b.logo_url || null
}

function leadFirst(list: Business[]): Business[] {
  const idx = list.findIndex(b => `${b.name} ${b.slug}`.toLowerCase().includes(LEAD_KEYWORD))
  if (idx <= 0) return list
  return [list[idx], ...list.slice(0, idx), ...list.slice(idx + 1)]
}

function tiltHandlers(reduced: boolean | null) {
  if (reduced) return {}
  return {
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const el = e.currentTarget
      const r = el.getBoundingClientRect()
      el.style.setProperty('--ry', `${(((e.clientX - r.left) / r.width) * 2 - 1) * 4}deg`)
      el.style.setProperty('--rx', `${(((e.clientY - r.top) / r.height) * 2 - 1) * -4}deg`)
      el.style.setProperty('--gx', `${((e.clientX - r.left) / r.width) * 100}%`)
      el.style.setProperty('--gy', `${((e.clientY - r.top) / r.height) * 100}%`)
    },
    onPointerLeave: (e: React.PointerEvent<HTMLElement>) => {
      e.currentTarget.style.setProperty('--ry', '0deg')
      e.currentTarget.style.setProperty('--rx', '0deg')
    },
  }
}

function LeadCard({ business, reduced }: { business: Business; reduced: boolean | null }) {
  const image = pickImage(business)
  return (
    <Link href={`/negocios/${business.slug}`} className={styles.lead} {...tiltHandlers(reduced)}>
      {image ? (
        <Image src={image} alt="" fill sizes="(min-width: 1024px) 60vw, 100vw" className={styles.leadImg} />
      ) : (
        <span className={styles.leadFallback} aria-hidden="true">{business.name.charAt(0)}</span>
      )}
      <span className={styles.leadShade} aria-hidden="true" />
      <span className={styles.glow} aria-hidden="true" />
      <span className={styles.leadBody}>
        <span className={styles.badge}>Negocio destacado</span>
        <strong className={styles.leadName}>{business.name}</strong>
        <span className={styles.leadMeta}>
          {business.category?.name ?? 'Negocio local'}
          <OpenClosedBadge businessHours={business.business_hours} />
        </span>
        {business.description && <span className={styles.leadDesc}>{business.description}</span>}
        <span className={styles.leadCta}>
          Ver negocio <span aria-hidden="true">→</span>
        </span>
      </span>
    </Link>
  )
}

function SideCard({ business, reduced }: { business: Business; reduced: boolean | null }) {
  const image = pickImage(business)
  return (
    <Link href={`/negocios/${business.slug}`} className={styles.side} {...tiltHandlers(reduced)}>
      <span className={styles.sideThumb}>
        {image ? (
          <Image src={image} alt="" fill sizes="96px" className="object-cover" />
        ) : (
          <span className={styles.sideInitial} aria-hidden="true">{business.name.charAt(0)}</span>
        )}
      </span>
      <span className={styles.sideBody}>
        <strong>{business.name}</strong>
        <small>{business.category?.name ?? 'Negocio local'}</small>
        <OpenClosedBadge businessHours={business.business_hours} />
      </span>
      <span className={styles.sideArrow} aria-hidden="true">→</span>
    </Link>
  )
}

function FeaturedBento({ businesses, reduced }: { businesses: Business[]; reduced: boolean | null }) {
  const [lead, ...rest] = leadFirst(businesses)
  const side = rest.slice(0, 3)
  const item = (delay: number) => ({
    initial: reduced ? false : ({ opacity: 0, y: 28 } as const),
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.6, delay, ease: EASE },
  })

  return (
    <div className={styles.bento}>
      <motion.div className={styles.leadWrap} {...item(0)}>
        <LeadCard business={lead} reduced={reduced} />
      </motion.div>
      <div className={styles.sideCol}>
        {side.map((b, i) => (
          <motion.div key={b.id} {...item(0.12 + i * 0.1)}>
            <SideCard business={b} reduced={reduced} />
          </motion.div>
        ))}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" role="status" aria-label="Cargando negocios">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="aspect-[3/4] rounded-2xl animate-pulse" style={{ background: 'rgba(246,241,230,0.07)' }} />
        ))}
      </div>
    )
  }

  if (businesses.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{tab === 'abiertos' ? 'No encontramos negocios abiertos ahora' : 'Sin negocios nuevos aún'}</p>
        <small>{tab === 'abiertos' ? 'Intenta más tarde o busca por categoría' : 'Próximamente habrá más negocios aquí'}</small>
      </div>
    )
  }

  return (
    <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {businesses.map(business => (
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
  const reduced = useReducedMotion()
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

  const showBento = activeTab === 'destacados' && !loading && businesses.length >= 2

  return (
    <section className={styles.section} aria-labelledby="featured-title">
      <div className={styles.inner}>
        <div className={styles.head}>
          <div>
            <span className={styles.kicker}>Destacados</span>
            <h2 id="featured-title" className={styles.title}>
              Negocios que <em>brillan</em>
            </h2>
          </div>

          <div className={styles.tabs} role="tablist" aria-label="Filtrar negocios">
            {TABS.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => handleTab(tab.id)}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabOn : ''}`}
              >
                {tab.id === 'abiertos' && <span className={styles.live} aria-hidden="true" />}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {showBento ? (
          <FeaturedBento businesses={businesses} reduced={reduced} />
        ) : (
          <BusinessGrid businesses={businesses} tab={activeTab} loading={loading} />
        )}

        <div className={styles.more}>
          <Link href="/descubre" className={styles.moreLink}>
            Ver todos los negocios <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  )
}
