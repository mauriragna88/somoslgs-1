'use client'

import dynamic from 'next/dynamic'
import useReducedMotionPreference from './useReducedMotionPreference'

const Inner = dynamic(() => import('./AdShowcaseInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[1280/520] bg-pueblo-noche rounded-2xl animate-pulse" />
  ),
})

export default function AdShowcase() {
  const prefersReducedMotion = useReducedMotionPreference()

  if (prefersReducedMotion === null) {
    return <div className="w-full aspect-[1280/520] bg-pueblo-noche rounded-2xl" />
  }

  if (prefersReducedMotion) {
    return (
      <div className="w-full rounded-2xl border border-pueblo-barroco/20 bg-pueblo-noche p-8 text-center">
        <p className="text-2xl md:text-4xl font-bold text-pueblo-crema">Publicidad local para negocios de Lagos</p>
        <p className="mt-3 text-sm text-pueblo-canteraLight/60">Anuncios visibles dentro de SomosLagos.</p>
      </div>
    )
  }

  return <Inner />
}
