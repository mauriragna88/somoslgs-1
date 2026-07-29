'use client'

import { useEffect, useRef } from 'react'

interface LocalPageClickTrackerProps {
  localPageId: string
  businessId: string
  children: React.ReactNode
}

export default function LocalPageClickTracker({
  localPageId,
  businessId,
  children,
}: LocalPageClickTrackerProps) {
  const trackedRef = useRef(false)

  const logClick = async () => {
    if (trackedRef.current) return
    trackedRef.current = true
    try {
      await fetch('/api/local-pages/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          localPageId,
          businessId,
          clickType: 'profile_view',
        }),
      })
    } catch {
      // Silenciar errores de tracking
    }
  }

  useEffect(() => {
    // Log a view cuando aparece en viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            logClick()
            observer.disconnect()
          }
        })
      },
      { threshold: 0.3 }
    )

    const el = document.getElementById(`biz-${businessId}`)
    if (el) observer.observe(el)

    return () => observer.disconnect()
  }, [businessId, localPageId])

  return <div id={`biz-${businessId}`}>{children}</div>
}
