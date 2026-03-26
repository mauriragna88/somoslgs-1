'use client'

import dynamic from 'next/dynamic'
import type { BannerRevealProps } from './BannerRevealInner'

const Inner = dynamic(() => import('./BannerRevealInner'), {
  ssr: false,
  loading: () => null,
})

export default function BannerReveal(props: BannerRevealProps) {
  return <Inner {...props} />
}
