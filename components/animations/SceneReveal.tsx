'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════
   SceneReveal — revelado cinematográfico "tipo historia"
   Cada sección entra como una escena: fade + slide + scale + blur
   Al salir se hunde con escala. Opcional: modo dramático (más
   oscuro y espectacular) para bloques destacados.

   - Entrada: opacity 0→1, y 80→0, scale 0.94→1, blur(8px)→0
   - Salida: y 0→40, opacity 1→0, scale 1→0.96
   - Modo dramático: filtro de oscurecimiento + zoom que enfatiza
   - Respeta prefers-reduced-motion
   ═══════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const

interface SceneRevealProps {
  children: ReactNode
  className?: string
  /* Desplazamiento de entrada (px) */
  entryY?: number
  /* Si es un bloque "dramático" (más oscuro/espectacular) */
  dramatic?: boolean
  /* Altura del desplazamiento de entrada */
  blur?: boolean
}

export default function SceneReveal({
  children,
  className = '',
  entryY = 80,
  dramatic = false,
  blur = true,
}: SceneRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  // Entrada (escena aparece)
  const enterOpacity = useTransform(scrollYProgress, [0, 0.22], [0, 1])
  const enterY = useTransform(scrollYProgress, [0, 0.22], [entryY, 0])
  const enterScale = useTransform(scrollYProgress, [0, 0.22], [0.94, 1])
  const enterBlur = useTransform(scrollYProgress, [0, 0.22], ['blur(8px)', 'blur(0px)'])

  // Salida (escena se hunde al salir)
  const exitOpacity = useTransform(scrollYProgress, [0.76, 1], [1, dramatic ? 0 : 0.5])
  const exitY = useTransform(scrollYProgress, [0.76, 1], [0, dramatic ? -60 : 40])
  const exitScale = useTransform(scrollYProgress, [0.76, 1], [1, 0.96])

  // Modo dramático: oscurecer + zoom de énfasis en la salida
  const dramaticFilter = useTransform(
    scrollYProgress,
    [0.55, 0.8, 1],
    dramatic ? ['brightness(1)', 'brightness(0.85) saturate(1.2)', 'brightness(0.5) saturate(1.3)'] : ['brightness(1)', 'brightness(1)', 'brightness(1)']
  )

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      className={className}
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
          scale: exitScale,
          filter: dramaticFilter,
          willChange: 'transform, opacity, filter',
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  )
}
