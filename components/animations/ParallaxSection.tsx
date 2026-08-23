'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════
   ParallaxSection — fondo con parallax tipo "historia"
   La imagen/fondo de la sección se mueve a distinta velocidad
   que el contenido (efecto de profundidad cinematográfico).

   Uso:
     <ParallaxSection image="/tourism/panoramica-lagos.jpg" overlay="dark">
       {contenido}
     </ParallaxSection>
   ═══════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const

interface ParallaxSectionProps {
  children: ReactNode
  className?: string
  /* Imagen de fondo (opcional). Con parallax en Y */
  image?: string
  /* Tono del overlay: light | dark | none */
  overlay?: 'none' | 'light' | 'dark'
  /* Altura extra del fondo para el parallax (px) */
  bleed?: number
  minHeight?: string
}

export default function ParallaxSection({
  children,
  className = '',
  image,
  overlay = 'none',
  bleed = 120,
  minHeight = '420px',
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  // El fondo se desplaza en sentido inverso al scroll (parallax)
  const bgY = useTransform(scrollYProgress, [0, 1], [`-${bleed / 2}px`, `${bleed / 2}px`])
  const bgScale = useTransform(scrollYProgress, [0, 0.5, 1], [1.15, 1.05, 1.15])

  const overlayStyle =
    overlay === 'dark'
      ? 'linear-gradient(180deg, rgba(6,15,30,0.55) 0%, rgba(6,15,30,0.75) 100%)'
      : overlay === 'light'
        ? 'linear-gradient(180deg, rgba(251,240,229,0.7) 0%, rgba(251,240,229,0.4) 100%)'
        : 'none'

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{ minHeight }}
    >
      {/* Fondo con parallax */}
      {image && (
        <motion.div
          className="absolute inset-0 z-0"
          style={{
            y: bgY,
            scale: bgScale,
            willChange: 'transform',
          }}
        >
          <img src={image} alt="" aria-hidden className="w-full h-full object-cover" />
          {overlayStyle !== 'none' && (
            <div className="absolute inset-0" style={{ background: overlayStyle }} />
          )}
        </motion.div>
      )}

      {/* Contenido sobre el parallax */}
      <div className={`relative z-10 ${image ? '' : ''}`}>
        {children}
      </div>
    </div>
  )
}
