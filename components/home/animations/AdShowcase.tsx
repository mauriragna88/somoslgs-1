'use client'

import dynamic from 'next/dynamic'

const Inner = dynamic(() => import('./AdShowcaseInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[1280/520] bg-secondary rounded-2xl animate-pulse" />
  ),
})

export default function AdShowcase() {
  return <Inner />
}
