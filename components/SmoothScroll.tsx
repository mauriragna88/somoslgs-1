'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import Lenis from 'lenis'

/* ═══════════════════════════════════════════════════════════
   SmoothScroll — Lenis ultra-smooth scroll para la web pública
   - Respeta prefers-reduced-motion (no inicializa si se reduce)
   - Anchor links con comportamiento suave por defecto
   ═══════════════════════════════════════════════════════════ */

export default function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    // No activar smooth scroll si el usuario prefiere menos movimiento
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    })
    lenisRef.current = lenis

    let rafId: number
    const raf = (time: number) => {
      lenis.raf(time)
      rafId = requestAnimationFrame(raf)
    }
    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  return <>{children}</>
}
