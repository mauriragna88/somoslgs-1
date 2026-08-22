'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import FavoriteButton from '@/components/shared/FavoriteButton'
import StarRating from '@/components/reviews/StarRating'
import { isBusinessOpen } from '@/lib/constants'
import type { BusinessHours } from '@/lib/constants'

/* ═══════════════════════════════════════════════════════════
   BusinessCard v2 — glassmorphism + ambient elevation
   - rounded-2xl, backdrop-blur, borde translúcido
   - Tilt 3D suave (rotateX/rotateY con perspectiva)
   - Micro-zoom de imagen (scale-105)
   - Badge "Abierto Ahora" con punto verde pulsante
   - Badge rating flotante sobre la imagen (★ 4.8)
   - Acciones rápidas slide-up en hover: WhatsApp / Cómo llegar
   - Entrada con whileInView stagger (fade-in + scale-up)
   ═══════════════════════════════════════════════════════════ */

const WA_SVG = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 0 1 8.413 3.488 11.82 11.82 0 0 1 3.48 8.414c-.003 6.557-5.337 11.891-11.893 11.891a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.711.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
)

const PIN_SVG = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

interface BusinessCardProps {
  business: {
    id: string
    name: string
    slug: string
    description: string | null
    logo_url: string | null
    address: string | null
    neighborhood?: string | null
    phone?: string | null
    subscription_tier: string
    is_featured: boolean
    business_hours: BusinessHours | null
    rating: number
    total_reviews: number
    category: { id?: string; name: string; icon: string } | null
    cover_url?: string | null
    business_photos?: { image_url: string }[]
  }
  showCategory?: boolean
  variant?: 'auto' | 'avanzado' | 'pro' | 'compact'
  index?: number
}

function getDisplayImage(business: BusinessCardProps['business']): string | null {
  if (business.cover_url) return business.cover_url
  if (business.business_photos && business.business_photos.length > 0) return business.business_photos[0].image_url
  return null
}

function getTierVariant(tier: string, variant?: string): 'avanzado' | 'pro' | 'compact' {
  if (variant === 'avanzado') return 'avanzado'
  if (variant === 'pro') return 'pro'
  if (variant === 'compact') return 'compact'
  if (tier === 'avanzado') return 'avanzado'
  if (tier === 'pro') return 'pro'
  return 'compact'
}

function hasCompleteBusinessHours(hours: BusinessHours | null): hours is BusinessHours {
  return Boolean(hours?.monday && hours.saturday && hours.sunday)
}

/* ── Tilt 3D wrapper (Framer Motion) ── */
function Tilt3D({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const rotateX = useMotionValue(0)
  const rotateY = useMotionValue(0)

  const springX = useSpring(rotateX, { stiffness: 180, damping: 18, mass: 0.5 })
  const springY = useSpring(rotateY, { stiffness: 180, damping: 18, mass: 0.5 })

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    rotateY.set(px * 7)   // ±3.5°
    rotateX.set(-py * 7)  // ±3.5°
  }

  const handleLeave = () => {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={className}
      style={{ perspective: 1000 }}
    >
      <motion.div style={{ rotateX: springX, rotateY: springY, transformStyle: 'preserve-3d' }}>
        {children}
      </motion.div>
    </motion.div>
  )
}

/* ── Rating badge flotante sobre imagen ── */
function RatingBadge({ rating, count }: { rating: number; count: number }) {
  if (count === 0) return null
  return (
    <span
      className="absolute top-3 left-3 z-10 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold text-white"
      style={{
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.25)',
        boxShadow: '0 2px 10px rgba(31,41,55,0.2)',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 20 20" fill="#F5B942" aria-hidden="true">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      {rating.toFixed(1)}
    </span>
  )
}

/* ── Abierto ahora — chip verde discreto, solo si está abierto ── */
function OpenNowBadge({ businessHours }: { businessHours: BusinessHours | null }) {
  if (!hasCompleteBusinessHours(businessHours)) return null
  try {
    if (!isBusinessOpen(businessHours)) return null // No mostrar nada si está cerrado
  } catch {
    return null
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[10px] font-bold text-green-700 px-2 py-1 rounded-full"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: '1px solid rgba(34,197,94,0.35)',
        boxShadow: '0 2px 8px rgba(31,41,55,0.12)',
        letterSpacing: '0.02em',
      }}
    >
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
      </span>
      Abierto ahora
    </span>
  )
}

/* ── Hover quick actions (slide-up) ── */
function QuickActions({ phone, address, name }: { phone?: string | null; address?: string | null; name: string }) {
  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address} Lagos de Moreno Jalisco`)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} Lagos de Moreno Jalisco`)}`

  return (
    <div className="absolute inset-x-3 bottom-3 z-10 flex gap-2">
      {phone && (
        <a
          href={`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola, vi tu negocio en SomosLagos y me interesa saber más`)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-full text-[13px] font-bold text-white shadow-lg transition-transform hover:scale-[1.03]"
          style={{ background: '#25D366' }}
        >
          {WA_SVG} WhatsApp
        </a>
      )}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-full text-[13px] font-bold shadow-lg transition-transform hover:scale-[1.03]"
        style={{ background: 'rgba(255,255,255,0.92)', color: '#111111' }}
      >
        {PIN_SVG} Cómo llegar
      </a>
    </div>
  )
}

/* ── Variante principal: card ticket premium (estilo Dribbble) ── */
function MediaCard({ business, showCategory }: { business: BusinessCardProps['business']; showCategory: boolean }) {
  const router = useRouter()
  const heroImage = getDisplayImage(business)
  const [hovered, setHovered] = useState(false)

  /* Código de 3 letras estilo aeropuerto desde el slug del negocio */
  const bizCode = (business.slug || business.name)
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 3)
    .toUpperCase() || 'LAG'

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="h-full"
    >
      <Tilt3D className="h-full">
        {/* Card exterior — doble marco sutil tipo ticket */}
        <div
          className="relative rounded-[24px] p-[6px] cursor-pointer h-full"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(31,41,55,0.06)',
            boxShadow: hovered
              ? '0 24px 48px -12px rgba(31,41,55,0.18), 0 4px 12px rgba(31,41,55,0.06)'
              : '0 12px 32px -8px rgba(31,41,55,0.10), 0 2px 8px rgba(31,41,55,0.04)',
            transition: 'box-shadow 400ms cubic-bezier(0.22,1,0.36,1)',
          }}
          onClick={() => router.push(`/negocios/${business.slug}`)}
        >
          {/* Marco interior */}
          <div className="relative rounded-[18px] p-[8px] h-full" style={{ border: '1px solid rgba(31,41,55,0.05)' }}>
            {/* 1. Imagen casi cuadrada */}
            <div className="relative overflow-hidden rounded-[13px]" style={{ aspectRatio: '1 / 1' }}>
              {heroImage ? (
                <motion.div className="absolute inset-0" animate={{ scale: hovered ? 1.04 : 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
                  <Image
                    src={heroImage}
                    alt={business.name}
                    fill
                    sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw"
                    className="object-cover"
                  />
                </motion.div>
              ) : business.logo_url ? (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--coral), var(--gold))' }}>
                  <div className="w-20 h-20 rounded-2xl overflow-hidden relative shadow-lg">
                    <Image src={business.logo_url} alt={business.name} fill sizes="80px" className="object-cover" />
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--coral), var(--gold))' }}>
                  <span className="text-4xl text-white font-bold opacity-80">{business.name[0]}</span>
                </div>
              )}

              {/* Overlay inferior sutil */}
              <div
                className="absolute inset-x-0 bottom-0 pointer-events-none"
                style={{
                  height: '32%',
                  background: 'linear-gradient(to top, rgba(15,15,15,0.30) 0%, transparent 100%)',
                }}
              />

              {/* Badge tier */}
              <span
                className="absolute top-2.5 left-2.5 z-10 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
                style={{
                  background: business.subscription_tier === 'avanzado'
                    ? 'linear-gradient(to right, var(--gold), var(--terracotta))'
                    : 'rgba(20,184,166,0.92)',
                  color: '#111111',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                {business.subscription_tier === 'avanzado' ? '✦ Premium' : 'Pro'}
              </span>

              {/* Favorito glassmorphism */}
              <div className="absolute top-2.5 right-2.5 z-10" onClick={e => e.stopPropagation()}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(255,255,255,0.28)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.45)',
                    boxShadow: '0 2px 10px rgba(31,41,55,0.12)',
                  }}
                >
                  <FavoriteButton businessId={business.id} />
                </div>
              </div>

              <RatingBadge rating={business.rating} count={business.total_reviews} />

              {/* Abierto ahora — chip inferior izquierdo */}
              {hasCompleteBusinessHours(business.business_hours) && (
                <div className="absolute bottom-2.5 left-2.5 z-10" onClick={e => e.stopPropagation()}>
                  <OpenNowBadge businessHours={business.business_hours} />
                </div>
              )}

              {/* Quick actions slide-up */}
              <motion.div
                initial={false}
                animate={{ y: hovered ? 0 : 12, opacity: hovered ? 1 : 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-x-0 bottom-0"
              >
                <QuickActions phone={business.phone} address={business.address} name={business.name} />
              </motion.div>
            </div>

            {/* 2. Título grande NEGRO */}
            <h3
              className="mt-3 px-1 font-extrabold leading-tight truncate"
              style={{
                fontFamily: 'var(--display)',
                fontSize: '1.15rem',
                letterSpacing: '-0.015em',
                color: '#111111',
              }}
            >
              {business.name}
            </h3>

            {/* 3. Subtítulo gris pequeño (categoría) */}
            <p className="mt-0.5 px-1 text-[10px] font-semibold uppercase truncate" style={{ color: '#9CA3AF', letterSpacing: '0.12em' }}>
              {showCategory && business.category ? `${business.category.icon} ${business.category.name}` : (business.neighborhood || 'Lagos de Moreno')}
            </p>

            {/* 4. Fila compacta: 🏷️ rating/reseñas · ✈️ CÓDIGO */}
            <div className="flex items-center justify-between mt-2.5 px-1">
              <span className="inline-flex items-center gap-1 min-w-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                  <line x1="7" y1="7" x2="7.01" y2="7" />
                </svg>
                <span className="text-sm font-extrabold truncate" style={{ color: '#111111' }}>
                  {business.total_reviews > 0 ? `${business.rating.toFixed(1)} ★` : 'Nuevo'}
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 flex-shrink-0 ml-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#6B7280" aria-hidden="true" style={{ flexShrink: 0 }}>
                  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
                <span className="text-[11px] font-extrabold tracking-widest" style={{ color: '#6B7280' }}>
                  {bizCode}
                </span>
              </span>
            </div>

            {/* 5. Botón píldora ancho — blanco→negro con flecha */}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.name} ${business.address || ''} Lagos de Moreno Jalisco`)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="relative w-full overflow-hidden rounded-full cursor-pointer mt-3.5 mb-1 flex items-center justify-center gap-2 text-[13px] font-bold"
              style={{
                height: 40,
                background: hovered ? '#111111' : '#FFFFFF',
                border: '1px solid #111111',
                color: hovered ? '#FFFFFF' : '#111111',
                transition: 'background 350ms cubic-bezier(0.22,1,0.36,1), color 350ms cubic-bezier(0.22,1,0.36,1)',
              }}
            >
              Ver negocio
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: hovered ? 'translateX(3px)' : 'translateX(0)',
                  transition: 'transform 350ms cubic-bezier(0.22,1,0.36,1)',
                }}
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </Tilt3D>
    </motion.article>
  )
}

/* ── Variante compacta — glass ligero sin imagen ── */
function CompactGlassCard({ business, showCategory }: { business: BusinessCardProps['business']; showCategory: boolean }) {
  const router = useRouter()

  return (
    <motion.article
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div
        className="relative rounded-2xl p-4 cursor-pointer h-full"
        style={{
          background: 'rgba(255,255,255,0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(31,41,55,0.07)',
          boxShadow: '0 6px 24px -8px rgba(31,41,55,0.10)',
          transition: 'transform 350ms cubic-bezier(0.22,1,0.36,1), box-shadow 350ms cubic-bezier(0.22,1,0.36,1)',
        }}
        onClick={() => router.push(`/negocios/${business.slug}`)}
      >
        <div className="flex items-center gap-3">
          {business.logo_url ? (
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative ring-1" style={{ '--tw-ring-color': 'rgba(31,41,55,0.1)' } as React.CSSProperties}>
              <Image src={business.logo_url} alt={business.name} fill sizes="48px" className="object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--coral), var(--gold))' }}>
              <span className="text-lg text-white font-bold">{business.name[0].toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[17px] leading-tight tracking-tight truncate" style={{ color: 'var(--ink)', fontFamily: 'var(--display)' }}>
              {business.name}
            </h3>
            {showCategory && business.category && (
              <div className="text-[11px] font-semibold mt-0.5 truncate" style={{ color: 'var(--coral)' }}>
                {business.category.icon} {business.category.name}
              </div>
            )}
          </div>
          <div onClick={e => e.stopPropagation()} className="flex-shrink-0">
            <FavoriteButton businessId={business.id} />
          </div>
        </div>

        {business.description && (
          <p className="text-[13px] line-clamp-2 mt-2" style={{ color: 'var(--muted)' }}>{business.description}</p>
        )}

        {(business.neighborhood || business.address) && (
          <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: 'var(--ink-soft)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {business.neighborhood && <span className="truncate">{business.neighborhood}</span>}
            {business.neighborhood && business.address && <span className="opacity-40">·</span>}
            {business.address && <span className="truncate max-w-[160px]">{business.address}</span>}
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5">
            <StarRating value={business.rating} size="sm" />
            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
              {business.total_reviews > 0 ? `${business.total_reviews} reseñas` : ''}
            </span>
          </div>
          {hasCompleteBusinessHours(business.business_hours) && (
            <OpenNowBadge businessHours={business.business_hours} />
          )}
        </div>

        {/* Acciones rápidas compactas */}
        <div className="flex gap-2 mt-3">
          {business.phone && (
            <a
              href={`https://wa.me/${business.phone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-full text-xs font-bold text-white transition-transform hover:scale-[1.02]"
              style={{ background: '#25D366' }}
            >
              {WA_SVG} WhatsApp
            </a>
          )}
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${business.name} ${business.address || ''} Lagos de Moreno Jalisco`)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-full text-xs font-bold transition-transform hover:scale-[1.02]"
            style={{ background: 'var(--ink)', color: 'white' }}
          >
            {PIN_SVG} Cómo llegar
          </a>
        </div>
      </div>
    </motion.article>
  )
}

export default function BusinessCard({ business, showCategory = true, variant, index = 0 }: BusinessCardProps) {
  const tierVariant = getTierVariant(business.subscription_tier, variant)
  if (tierVariant === 'compact') return <CompactGlassCard business={business} showCategory={showCategory} />
  return <MediaCard business={business} showCategory={showCategory} />
}
