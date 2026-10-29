'use client'

import { useEffect } from 'react'

export default function PWARegister() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    // En desarrollo el SW cachea JS viejo y rompe el hot reload: solo en producción
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))
      caches?.keys().then(keys => keys.forEach(k => caches.delete(k)))
      return
    }
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Silent fail - SW registration is not critical
    })
  }, [])

  return null
}
