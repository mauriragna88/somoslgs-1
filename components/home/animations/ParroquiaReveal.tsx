'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import useReducedMotionPreference from './useReducedMotionPreference'

const Inner = dynamic(() => import('./ParroquiaRevealInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-secondary rounded-2xl animate-pulse" />
  ),
})

export default function ParroquiaReveal() {
  const prefersReducedMotion = useReducedMotionPreference()

  if (prefersReducedMotion === null) {
    return <div className="w-full aspect-video bg-secondary rounded-2xl" />
  }

  if (prefersReducedMotion) {
    return (
      <div className="relative w-full aspect-video overflow-hidden rounded-2xl bg-secondary">
        <Image
          src="/tourism/parroquia-asuncion.jpg"
          alt="Parroquia de la Asuncion en Lagos de Moreno"
          fill
          sizes="(max-width: 768px) 100vw, 1024px"
          className="object-cover"
        />
      </div>
    )
  }

  return <Inner />
}
