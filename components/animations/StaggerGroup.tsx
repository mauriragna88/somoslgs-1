'use client'

import { type ReactNode } from 'react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════
   StaggerGroup + StaggerItem — aparición escalonada de tarjetas
   (estilo Outcrowd: fade-in + y:40px→0, desfase 0.1-0.15s)

   Uso:
     <StaggerGroup>
       <StaggerItem>…card…</StaggerItem>
       <StaggerItem>…card…</StaggerItem>
     </StaggerGroup>
   ═══════════════════════════════════════════════════════════ */

export const STAGGER_EASE = [0.16, 1, 0.3, 1] as const

interface StaggerGroupProps {
  children: ReactNode
  className?: string
  /* Desfase entre cada tarjeta (s) */
  stagger?: number
  /* Retraso inicial antes de empezar (s) */
  delay?: number
}

export function StaggerGroup({
  children,
  className = '',
  stagger = 0.12,
  delay = 0,
}: StaggerGroupProps) {
  const prefersReduced = useReducedMotion()

  const containerVariants: Variants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: stagger,
        delayChildren: delay,
      },
    },
  }

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
    >
      {children}
    </motion.div>
  )
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
}

export function StaggerItem({ children, className = '' }: StaggerItemProps) {
  const prefersReduced = useReducedMotion()

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 40 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.55,
        ease: STAGGER_EASE,
      },
    },
  }

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      className={className}
      variants={itemVariants}
      style={{ willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  )
}
