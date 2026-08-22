'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import type { Zone } from '@/lib/tourism'

/* ═══════════════════════════════════════════════════════════
   DestinationTicketCard — card vertical tipo "ticket" premium
   Referencia: docs/ui-flight-cards-reference.md
   - Entrada escalonada: fade + translateY(20px), 0/100/200ms
   - Hover: elevación -8px + zoom imagen 4%
   - Botón píldora blanco→negro con flecha deslizante
   - Favorito glassmorphism con heart-pop
   - Curva: cubic-bezier(0.22, 1, 0.36, 1) · respeta reduced-motion
   ═══════════════════════════════════════════════════════════ */

const EASE = [0.22, 1, 0.36, 1] as const

interface DestinationTicketCardProps {
  zone: Zone
  index?: number
}

export default function DestinationTicketCard({ zone, index = 0 }: DestinationTicketCardProps) {
  const [hovered, setHovered] = useState(false)
  const [faved, setFaved] = useState(false)

  const delay = Math.min(index * 100, 300)

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.42, ease: EASE, delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card exterior — doble marco sutil + sombra difusa */}
      <motion.div
        className="relative rounded-[28px] p-[7px]"
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
        <div className="relative rounded-[21px] p-[9px]" style={{ border: '1px solid rgba(31,41,55,0.05)' }}>
          {/* Imagen superior casi cuadrada */}
          <div className="relative overflow-hidden rounded-[15px]" style={{ aspectRatio: '1 / 1' }}>
            <motion.div
              className="absolute inset-0"
              animate={{ scale: hovered ? 1.04 : 1 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <Image
                src={zone.image}
                alt={zone.name}
                fill
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 30vw"
                className="object-cover"
              />
            </motion.div>

            {/* Overlay degradado inferior para lectura del título */}
            <div
              className="absolute inset-x-0 bottom-0 pointer-events-none"
              style={{
                height: '45%',
                background: 'linear-gradient(to top, rgba(15,15,15,0.48) 0%, rgba(15,15,15,0.14) 55%, transparent 100%)',
              }}
            />

            {/* Favorito glassmorphism — esquina superior derecha */}
            <motion.button
              type="button"
              aria-label={faved ? 'Quitar de favoritos' : 'Agregar a favoritos'}
              aria-pressed={faved}
              onClick={() => setFaved(v => !v)}
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
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
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill={faved ? '#FF4D67' : 'none'}
                stroke={faved ? '#FF4D67' : '#FFFFFF'}
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                animate={
                  faved
                    ? { scale: [1, 1.25, 1.12] }
                    : { scale: 1 }
                }
                transition={{ duration: 0.3, ease: EASE }}
                aria-hidden="true"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </motion.svg>
            </motion.button>

            {/* Título superpuesto en el límite inferior de la imagen */}
            <div className="absolute inset-x-0 bottom-0 p-4">
              <h3
                className="text-white font-extrabold leading-tight truncate"
                style={{
                  fontFamily: 'var(--display)',
                  fontSize: '1.3rem',
                  letterSpacing: '-0.01em',
                  textShadow: '0 1px 8px rgba(0,0,0,0.35)',
                }}
              >
                {zone.name}
              </h3>
            </div>
          </div>

          {/* Subtítulo gris pequeño */}
          <p
            className="mt-3 px-1 text-[11px] font-semibold uppercase truncate"
            style={{ color: '#9CA3AF', letterSpacing: '0.14em' }}
          >
            Pueblo Mágico · Lagos de Moreno
          </p>

          {/* Fila compacta: etiqueta + tipo / avión + zona */}
          <div className="flex items-center justify-between mt-2 px-1">
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
              <span className="text-sm font-bold truncate" style={{ color: '#111111' }}>
                {zone.icon} Imperdible
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 flex-shrink-0 ml-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#6B7280" aria-hidden="true" style={{ flexShrink: 0 }}>
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
              </svg>
              <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>
                {zone.coordinates ? 'Con mapa' : 'Centro'}
              </span>
            </span>
          </div>

          {/* Botón píldora inferior — blanco→negro con flecha */}
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
              height: 44,
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
