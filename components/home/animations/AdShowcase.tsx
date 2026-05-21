'use client'

import dynamic from 'next/dynamic'
import useReducedMotionPreference from './useReducedMotionPreference'

const Inner = dynamic(() => import('./AdShowcaseInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[1280/520] bg-secondary rounded-2xl animate-pulse" />
  ),
})

export default function AdShowcase() {
  const prefersReducedMotion = useReducedMotionPreference()

  if (prefersReducedMotion === null) {
    return <div className="w-full aspect-[1280/520] bg-secondary rounded-2xl" />
  }

  if (prefersReducedMotion) {
    return (
      <div className="w-full rounded-2xl border border-white/10 bg-secondary p-8 text-center">
        <p className="text-2xl md:text-4xl font-bold text-white">Publicidad local para negocios de Lagos</p>
        <p className="mt-3 text-sm text-white/60">Anuncios visibles dentro de SomosLagos.</p>
      </div>
    )
  }

  return <Inner />
}
