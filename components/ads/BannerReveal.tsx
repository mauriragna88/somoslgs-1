'use client'

import dynamic from 'next/dynamic'
import type { BannerRevealProps } from './BannerRevealInner'

const Inner = dynamic(() => import('./BannerRevealInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-2xl bg-secondary animate-pulse" style={{ aspectRatio: '800/280' }} />
  ),
})

export default function BannerReveal(props: BannerRevealProps) {
  return <Inner {...props} />
}
