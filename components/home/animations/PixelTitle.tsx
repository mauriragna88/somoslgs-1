'use client'

import dynamic from 'next/dynamic'

const Inner = dynamic(() => import('./PixelTitleInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[1280/420] bg-secondary rounded-2xl animate-pulse" />
  ),
})

export default function PixelTitle() {
  return <Inner />
}
