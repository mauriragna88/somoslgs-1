'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { StaggerGroup, StaggerItem } from '@/components/animations/StaggerGroup'

/* ═══════════════════════════════════════════════════════════
   CategoryGrid — sección "¿Qué buscas hoy?" rediseñada
   - Tarjetas grandes con gradientes vivos por categoría
   - Sin emojis viejos: icono SVG + glow de color al hover
   - Stagger + tilt suave + barra de progreso decorativa
   ═══════════════════════════════════════════════════════════ */

interface Category {
  id: string
  name: string
  icon: string
  slug: string
}

interface CategoryGridProps {
  categories: Category[]
}

/* Gradientes vivos por categoría (fallback por color coral/gold) */
function categoryGradient(slug: string): { from: string; to: string; glow: string } {
  const map: Record<string, { from: string; to: string; glow: string }> = {
    'comida': { from: '#FF6B35', to: '#F5B942', glow: 'rgba(255,107,53,0.35)' },
    'comer': { from: '#FF6B35', to: '#F5B942', glow: 'rgba(255,107,53,0.35)' },
    'restaurantes': { from: '#FF6B35', to: '#F5B942', glow: 'rgba(255,107,53,0.35)' },
    'compras': { from: '#F5B942', to: '#EAB308', glow: 'rgba(245,185,66,0.35)' },
    'comprar': { from: '#F5B942', to: '#EAB308', glow: 'rgba(245,185,66,0.35)' },
    'servicios': { from: '#22C55E', to: '#0D9488', glow: 'rgba(34,197,94,0.3)' },
    'salud': { from: '#10B981', to: '#059669', glow: 'rgba(16,185,129,0.3)' },
    'belleza': { from: '#EC4899', to: '#F472B6', glow: 'rgba(236,72,153,0.3)' },
    'hospedaje': { from: '#0D9488', to: '#0891B2', glow: 'rgba(13,148,136,0.3)' },
    'turismo': { from: '#C86B4A', to: '#F5B942', glow: 'rgba(200,107,74,0.3)' },
    'entretenimiento': { from: '#6366F1', to: '#8B5CF6', glow: 'rgba(99,102,241,0.3)' },
  }
  for (const key of Object.keys(map)) {
    if (slug.toLowerCase().includes(key)) return map[key]
  }
  return { from: '#FF6B35', to: '#F5B942', glow: 'rgba(255,107,53,0.3)' }
}

/* Icono SVG genérico elegante según categoría */
function CategoryIcon({ slug }: { slug: string }) {
  const s = slug.toLowerCase()
  const isFood = s.includes('com') || s.includes('rest') || s.includes('taquer')
  const isShop = s.includes('comp') || s.includes('tiend') || s.includes('merc')
  const isService = s.includes('serv')
  const isHealth = s.includes('salud') || s.includes('medic') || s.includes('farma')
  const isBeauty = s.includes('belle') || s.includes('estet') || s.includes('spa')
  const isLodging = s.includes('hosped') || s.includes('hotel')
  const isTourism = s.includes('tur') || s.includes('viaj')
  const isFun = s.includes('entreten') || s.includes('bar') || s.includes('noche')

  if (isFood) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2" />
        <path d="M7 2v20" />
        <path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7" />
      </svg>
    )
  }
  if (isShop) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    )
  }
  if (isHealth) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    )
  }
  if (isBeauty) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a5 5 0 015 5v4a5 5 0 01-10 0V7a5 5 0 015-5z" />
        <path d="M8 16v4a2 2 0 002 2h4a2 2 0 002-2v-4" />
      </svg>
    )
  }
  if (isLodging) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18" />
        <path d="M5 21V7a2 2 0 012-2h10a2 2 0 012 2v14" />
        <path d="M9 7v4" />
        <path d="M15 7v4" />
        <path d="M9 21v-4a1 1 0 011-1h4a1 1 0 011 1v4" />
      </svg>
    )
  }
  if (isTourism) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
      </svg>
    )
  }
  if (isFun) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 21a9 9 0 110-18 9 9 0 010 18z" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  }
  if (isService) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    )
  }
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <StaggerGroup className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {categories.map((cat) => {
        const { from, to, glow } = categoryGradient(cat.slug)
        return (
          <StaggerItem key={cat.id} className="h-full">
            <motion.div
              whileHover={{ y: -6, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative h-full group cursor-pointer"
            >
              <Link
                href={`/categorias/${cat.slug}`}
                className="relative block rounded-2xl p-5 h-full overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${from}14 0%, ${to}0D 55%, transparent 100%)`,
                  border: '1px solid rgba(31,41,55,0.07)',
                  boxShadow: '0 4px 20px rgba(31,41,55,0.05)',
                }}
              >
                {/* Glow interno que aparece al hover */}
                <div
                  className="absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: glow }}
                />

                {/* Acento superior con gradiente */}
                <div
                  className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: `linear-gradient(90deg, ${from}, ${to})` }}
                />

                {/* Icono en círculo con gradiente */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{
                    background: `linear-gradient(135deg, ${from}, ${to})`,
                    boxShadow: `0 6px 20px ${glow}`,
                  }}
                >
                  <CategoryIcon slug={cat.slug} />
                </div>

                {/* Nombre */}
                <h3 className="font-extrabold text-[15px] leading-tight mb-1" style={{ color: 'var(--ink)', fontFamily: 'var(--display)' }}>
                  {cat.name}
                </h3>

                {/* Flecha que aparece al hover */}
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{ color: from }}
                >
                  Explorar
                  <svg className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </Link>
            </motion.div>
          </StaggerItem>
        )
      })}
    </StaggerGroup>
  )
}
