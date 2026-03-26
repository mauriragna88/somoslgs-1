'use client'

import dynamic from 'next/dynamic'

const Inner = dynamic(() => import('./FallingBusinessInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-secondary rounded-2xl animate-pulse" />
  ),
})

export default function FallingBusiness() {
  return <Inner />
}
