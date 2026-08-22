'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { Zone } from '@/lib/tourism'

/* ═══════════════════════════════════════════════════════════
   DestinationTicketCard — card vertical tipo "ticket" premium
   Réplica fiel de la captura Dribbble (docs/ui-flight-cards-reference.md)
   ─ Estructura:
     1. Imagen casi cuadrada (sin título encima)
     2. Título grande NEGRO debajo
     3. Subtítulo gris pequeño (tipo "Economy")
     4. Fila compacta: 🏷️ "Gratis" · ✈️ "CÓDIGO" (estilo JFK/SFO)
     5. Botón píldora ancho "Explorar" con flecha
   ─ Animaciones: entrada escalonada, hover -8px, zoom 4%, botón blanco→negro
   ═══════════════════════════════════════════════════════════ */

const EASE = [0.22, 1, 0.36, 1] as const

interface DestinationTicketCardProps {
  zone: Zone
  index?: number
}

/* Genera un "código de aeropuerto" de 3 letras desde el id de la zona
   (ej: templo-calvario → "CAL", centro-historico → "CTR") */
function airportCode(id: string): string {
  const words = id.replace(/-/g, ' ').split(' ')
  if (words.length >= 3) {
    return (words[0][0] + words[1][0] + words[2][0]).toUpperCase()
  }
  return (id.replace(/[^a-z]/g, '').slice(0, 3)).toUpperCase()
}

/* Etiqueta tipo "Economy/Premium economy" según la zona */
function zoneTag(zone: Zone): string {
  const tag: Record<string, string> = {
    'templo-calvario': 'Mirador panorámico',
    'centro-historico': 'Patrimonio UNESCO',
    'puente-rio': 'Monumento histórico',
    'parroquia-asuncion': 'Barroco mexicano',
    'teatro-rosas-moreno': 'Escenario cultural',
    'museo-arte-sacro': 'Arte sacro',
    'presa-cuarenta': 'Naturaleza',
    'haciendas': 'Historia viva',
    'jardin-constituyentes': 'Vida local',
    'casa-cultura': 'Arte y talleres',
  }
  return tag[zone.id] || 'Pueblo Mágico'
}

export default function DestinationTicketCard({ zone, index = 0 }: DestinationTicketCardProps) {
  const [hovered, setHovered] = useState(false)
  const [faved, setFaved] = useState(false)

  const delay = Math.min(index * 100, 300)
  const code = airportCode(zone.id)

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.42, ease: EASE, delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="h-full"
    >
      {/* Card exterior — doble marco sutil + sombra difusa */}
      <motion.div
        className="relative rounded-[24px] p-[6px] h-full"
        style={{
          background: '#FFFFFF',
          border: '1px solid rgba(31,41,55,0.06)',
        }}
        animate={{
          y: hovered ? -8 : 0,
          boxShadow: hovered
            ? '0 24px 48px -12px rgba(31,41,55,0.18), 0 4px 12px rgba(31,41,55,0.06)'
            : '0 12px 32px -8px rgba(31,41,55,0.10), 0 2px 8px rgba(31,41,55,0.04)',
        }}
        transition={{ duration: 0.4, ease: EASE }}
      >
        {/* Marco interior */}
        <div className="relative rounded-[18px] p-[8px]" style={{ border: '1px solid rgba(31,41,55,0.05)' }}>
          {/* 1. Imagen casi cuadrada */}
          <div className="relative overflow-hidden rounded-[13px]" style={{ aspectRatio: '1 / 1' }}>
            <motion.div className="absolute inset-0" animate={{ scale: hovered ? 1.04 : 1 }} transition={{ duration: 0.6, ease: EASE }}>
              <Image
                src={zone.image}
                alt={zone.name}
                fill
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 22vw"
                className="object-cover"
              />
            </motion.div>

            {/* Overlay inferior sutil */}
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{
                height: '30%',
                background: 'linear-gradient(to top, rgba(15,15,15,0.28) 0%, transparent 100%)',
              }}
            />

            {/* Favorito glassmorphism */}
            <motion.button
              type="button"
              aria-label={faved ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              aria-pressed={faved}
              onClick={() => setFaved(v => !v)}
              className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.28)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.45)',
                boxShadow: '0 2px 10px rgba(31,41,55,0.12)',
              }}
              animate={{ scale: faved ? 1.08 : hovered ? 1.08 : 1 }}
              whileTap={{ scale: 0.92 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <motion.svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill={faved ? '#FF4D67' : 'none'}
                stroke={faved ? '#FF4D67' : '#FFFFFF'}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={faved ? { scale: [1, 1.25, 1.12] } : { scale: 1 }}
                transition={{ duration: 0.3, ease: EASE }}
                aria-hidden="true"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </motion.svg>
            </motion.button>
          </div>

          {/* 2. Título grande NEGRO debajo de la imagen */}
          <h3
            className="mt-3.5 px-1 font-extrabold leading-tight truncate"
            style={{
              fontFamily: 'var(--display)',
              fontSize: '1.35rem',
              letterSpacing: '-0.015em',
              color: '#111111',
            }}
          >
            {zone.name}
          </h3>

          {/* 3. Subtítulo gris pequeño (tipo "Economy") */}
          <p className="mt-0.5 px-1 text-[11px] font-semibold uppercase truncate" style={{ color: '#9CA3AF', letterSpacing: '0.12em' }}>
            {zoneTag(zone)}
          </p>

          {/* 4. Fila compacta: 🏷️ Gratis · ✈️ CÓDIGO */}
          <div className="flex items-center justify-between mt-3 px-1">
            <span className="inline-flex items-center gap-1.5 min-w-0">
              {/* Icono etiqueta */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <span className="text-sm font-extrabold truncate" style={{ color: '#111111' }}>
                Gratis
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 flex-shrink-0 ml-2">
              {/* Icono avión */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#6B7280" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              <span className="text-xs font-extrabold tracking-widest" style={{ color: '#6B7280' }}>
                {code}
              </span>
            </span>
          </div>

          {/* 5. Botón píldora ancho — blanco→negro con flecha */}
          <a
            href={
              zone.coordinates
                ? `https://www.google.com/maps/search/?api=1&query=${zone.coordinates.lat},${zone.coordinates.lng}`
                : '#actividades'
            }
            target={zone.coordinates ? '_blank' : undefined}
            rel={zone.coordinates ? 'noopener noreferrer' : undefined}
            onClick={
              zone.coordinates
                ? undefined
                : e => {
                    e.preventDefault()
                    document.getElementById('actividades')?.scrollIntoView({ behavior: 'smooth' })
                  }
            }
            className="relative w-full overflow-hidden rounded-full cursor-pointer mt-4 mb-1 flex items-center justify-center gap-2 text-sm font-bold"
            style={{
              height: 42,
              background: hovered ? '#111111' : '#FFFFFF',
              border: '1px solid #111111',
              color: hovered ? '#FFFFFF' : '#111111',
              transition: 'background 350ms cubic-bezier(0.22,1,0.36,1), color 350ms cubic-bezier(0.22,1,0.36,1)',
            }}
            aria-label={zone.coordinates ? `Cómo llegar a ${zone.name}` : `Ver más sobre ${zone.name}`}
          >
            {zone.coordinates ? 'Cómo llegar' : 'Explorar'}
            <svg
              width="15"
              height="15"
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
      </motion.div>
    </motion.article>
  )
}
