'use client'

import dynamic from 'next/dynamic'

const Inner = dynamic(() => import('./ParroquiaRevealInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-secondary rounded-2xl animate-pulse" />
  ),
})

export default function ParroquiaReveal() {
  return <Inner />
}
