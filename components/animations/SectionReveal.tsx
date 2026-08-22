'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useScroll, useTransform, useReducedMotion } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════
   SectionReveal — transición inter-sección estilo Outcrowd
   (sticky scale & parallax, efecto de capas apiladas)

   Comportamiento (contenedor en scroll normal, no sticky):
   - Al bajar, la sección que sale: scale 1 → 0.95, opacidad 1 → 0.4
   - La sección que entra: scale 0.92 → 1, y: 60px → 0px
   - Se siente como capas que se apilan (stacking effect)
   - Usa useScroll con target ref → animación vinculada al scroll
   - Respeta prefers-reduced-motion (sin animación si el usuario la pide)
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
}

export default function SectionReveal({
  children,
  className = '',
  entryY = 60,
  exitScale = 0.95,
  amount = 0.35,
}: SectionRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()

  // Vinculado al scroll de la sección: 0 = arriba, 1 = abajo
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })

  // Sección que entra (aparece en viewport): scale up 0.92→1, y 60→0
  const enterScale = useTransform(scrollYProgress, [0, 0.35], [0.92, 1])
  const enterY = useTransform(scrollYProgress, [0, 0.35], [entryY, 0])

  // Sección que sale (sale de viewport): scale 1→0.95, opacity 1→0.4
  const exitScaleSpring = useTransform(scrollYProgress, [0.75, 1], [1, exitScale])
  const exitOpacity = useTransform(scrollYProgress, [0.75, 1], [1, 0.4])

  // Composición final (entrada + salida)
  const scale = useTransform(
    [enterScale, exitScaleSpring],
    (values: number[]) => values[0] * values[1]
  )

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{
        scale,
        y: enterY,
        opacity: exitOpacity,
        transformOrigin: 'center top',
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </motion.div>
  )
}
