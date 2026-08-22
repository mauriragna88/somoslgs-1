'use client'

import { type ReactNode } from 'react'

/* ═══════════════════════════════════════════════════════════
   ScrollWrapper — optimización de scroll para 60fps
   - will-change-transform en el wrapper (evita reflow al animar)
   - Composición de capas: transform + opacity para animaciones GPU
   ═══════════════════════════════════════════════════════════ */

interface ScrollWrapperProps {
  children: ReactNode
  className?: string
}

export default function ScrollWrapper({ children, className = '' }: ScrollWrapperProps) {
  return (
    <div
      className={className}
      style={{
        willChange: 'transform',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {children}
    </div>
  )
}
