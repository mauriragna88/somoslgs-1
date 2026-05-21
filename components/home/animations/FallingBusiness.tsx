'use client'

import dynamic from 'next/dynamic'
import useReducedMotionPreference from './useReducedMotionPreference'

const Inner = dynamic(() => import('./FallingBusinessInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-secondary rounded-2xl animate-pulse" />
  ),
})

export default function FallingBusiness() {
  const prefersReducedMotion = useReducedMotionPreference()

  if (prefersReducedMotion === null) {
    return <div className="w-full aspect-video bg-secondary rounded-2xl" />
  }

  if (prefersReducedMotion) {
    return (
      <div className="w-full aspect-video bg-secondary rounded-2xl border border-white/10 flex items-center justify-center p-6 text-center">
        <p className="text-white/70 text-sm">Negocios locales destacados en SomosLagos</p>
      </div>
    )
  }

  return <Inner />
}
