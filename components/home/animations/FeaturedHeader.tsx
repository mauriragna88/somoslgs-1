'use client'

import dynamic from 'next/dynamic'
import useReducedMotionPreference from './useReducedMotionPreference'

const Inner = dynamic(() => import('./FeaturedHeaderInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[110px] bg-pueblo-noche rounded-xl animate-pulse" />
  ),
})

export default function FeaturedHeader() {
  const prefersReducedMotion = useReducedMotionPreference()

  if (prefersReducedMotion === null) {
    return <div className="w-full h-[110px] bg-pueblo-noche rounded-xl" />
  }

  if (prefersReducedMotion) {
    return (
      <div className="rounded-xl bg-pueblo-noche p-6 text-center border border-pueblo-barroco/20">
        <p className="text-3xl md:text-4xl font-black text-pueblo-crema">Negocios destacados</p>
        <p className="mt-2 text-sm text-pueblo-canteraLight/70">Lo mejor de Lagos de Moreno en un solo lugar</p>
      </div>
    )
  }

  return <Inner />
}
