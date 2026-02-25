'use client'

import { useEffect, useRef } from 'react'

interface AdSenseSlotProps {
  slot: string
  format?: string
  className?: string
}

export default function AdSenseSlot({ slot, format = 'auto', className = '' }: AdSenseSlotProps) {
  const adRef = useRef<HTMLDivElement>(null)
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID

  useEffect(() => {
    if (!adsenseId || !adRef.current) return

    try {
      const adsbygoogle = (window as any).adsbygoogle || []
      adsbygoogle.push({})
    } catch {
      // AdSense not loaded
    }
  }, [adsenseId])

  if (!adsenseId) return null

  return (
    <div ref={adRef} className={className}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={adsenseId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  )
}
