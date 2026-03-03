'use client'

import { useEffect } from 'react'

interface ViewTrackerProps {
  businessId: string
}

export default function ViewTracker({ businessId }: ViewTrackerProps) {
  useEffect(() => {
    // Fire-and-forget: track the view without blocking the page
    fetch(`/api/businesses/${businessId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => {
      // Silent fail - never affect UX
    })
  }, [businessId])

  return null
}
