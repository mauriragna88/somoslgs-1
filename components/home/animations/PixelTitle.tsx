'use client'

import dynamic from 'next/dynamic'
import useReducedMotionPreference from './useReducedMotionPreference'

const Inner = dynamic(() => import('./PixelTitleInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[1280/420] bg-pueblo-noche rounded-2xl animate-pulse" />
  ),
})

export default function PixelTitle() {
  const prefersReducedMotion = useReducedMotionPreference()

  if (prefersReducedMotion === null) {
    return <div className="w-full aspect-[1280/420] bg-pueblo-noche rounded-2xl" />
  }

  if (prefersReducedMotion) {
    return (
      <div className="w-full rounded-2xl border border-pueblo-barroco/20 bg-pueblo-noche p-8 text-center">
        <p className="text-4xl md:text-6xl font-black tracking-tight text-pueblo-crema">SomosLagos</p>
      </div>
    )
  }

  return <Inner />
}
