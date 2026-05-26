'use client'

import dynamic from 'next/dynamic'
import useReducedMotionPreference from './useReducedMotionPreference'

const Inner = dynamic(() => import('./FallingBusinessInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video rounded-2xl animate-pulse" style={{ background: 'var(--ink)' }} />
  ),
})

export default function FallingBusiness() {
  const prefersReducedMotion = useReducedMotionPreference()

  if (prefersReducedMotion === null) {
    return <div className="w-full aspect-video bg-pueblo-noche rounded-2xl" />
  }

  if (prefersReducedMotion) {
    return (
      <div className="w-full aspect-video rounded-2xl border border-pueblo-barroco/20 bg-pueblo-noche flex items-center justify-center p-6 text-center">
        <p className="text-pueblo-crema/70 text-sm">Negocios locales destacados en SomosLagos</p>
      </div>
    )
  }

  return <Inner />
}
