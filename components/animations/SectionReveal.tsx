'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════
   SectionReveal — revelado cinematográfico "tipo historia"
   Cada sección entra como una escena (fade + slide + scale +
   blur) y se hunde al salir. En bloques clave (dramatic) la
   salida oscurece y hace zoom para enfatizar.

   - Entrada: opacity 0→1, y 80→0, scale 0.94→1, blur(8px)→0
   - Salida: se hunde (y 0→40, scale 1→0.96, opacity→0.4)
   - dramatic: la sección se oscurece y hace zoom al cerrar
     (efecto espectacular para CTAs y momentos clave)
   - Respeta prefers-reduced-motion
   ═══════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const

interface SectionRevealProps {
  children: ReactNode
  className?: string
  /* Desplazamiento vertical de entrada (px) */
  entryY?: number
  /* Escala mínima de la sección que sale */
  exitScale?: number
  /* Cuánto del scroll de la sección se usa para el efecto (0-1) */
  amount?: number
  /* Modo dramático (oscurece + zoom al salir) */
  dramatic?: boolean
  /* Aplica blur en la entrada */
  blur?: boolean
}

export default function SectionReveal({
  children,
  className = '',
  entryY = 80,
  exitScale = 0.96,
  amount = 0.22,
  dramatic = false,
  blur = true,
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  // Entrada: la escena aparece en viewport
  const enterOpacity = useTransform(scrollYProgress, [0, amount], [0, 1])
  const enterY = useTransform(scrollYProgress, [0, amount], [entryY, 0])
  const enterScale = useTransform(scrollYProgress, [0, amount], [0.94, 1])
  const enterBlur = useTransform(scrollYProgress, [0, amount], ['blur(8px)', 'blur(0px)'])

  // Salida: la escena se hunde al salir de viewport
  const exitOpacity = useTransform(scrollYProgress, [0.72, 1], [1, dramatic ? 0 : 0.4])
  const exitY = useTransform(scrollYProgress, [0.72, 1], [0, dramatic ? -70 : 50])
  const exitScaleSpring = useTransform(scrollYProgress, [0.72, 1], [1, exitScale])

  // Modo dramático: oscurecer + realce de color al cerrar
  const dramaticFilter = useTransform(
    scrollYProgress,
    [0.55, 0.8, 1],
    dramatic
      ? ['brightness(1) saturate(1)', 'brightness(0.8) saturate(1.25)', 'brightness(0.4) saturate(1.4)']
      : ['brightness(1)', 'brightness(1)', 'brightness(1)']
  )

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ willChange: 'transform, opacity, filter' }}
    >
      <motion.div
        style={{
          opacity: enterOpacity,
          y: enterY,
          scale: enterScale,
          filter: blur ? enterBlur : undefined,
          transformOrigin: 'center top',
          willChange: 'transform, opacity, filter',
        }}
      >
        <motion.div
          style={{
            opacity: exitOpacity,
            y: exitY,
            scale: exitScaleSpring,
            filter: dramaticFilter,
            willChange: 'transform, opacity, filter',
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
