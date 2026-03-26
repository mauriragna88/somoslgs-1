'use client'

import dynamic from 'next/dynamic'

const Inner = dynamic(() => import('./FeaturedHeaderInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[110px] bg-secondary rounded-xl animate-pulse" />
  ),
})

export default function FeaturedHeader() {
  return <Inner />
}
