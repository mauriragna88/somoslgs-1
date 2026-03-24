'use client'

import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface Props {
  variant: 'hero' | 'footer'
}

export default function PWAInstallInline({ variant }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (navigator as any).standalone === true
    if (standalone) return

    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)
    if (ios) setShow(true)

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Sync dismiss between hero and footer instances
    const syncDismiss = () => setShow(false)
    window.addEventListener('pwa-dismissed', syncDismiss)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('pwa-dismissed', syncDismiss)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') handleDismiss()
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
    window.dispatchEvent(new Event('pwa-dismissed'))
  }

  if (!show) return null

  // ── Hero variant — compact strip, mobile only ──────────────────────────
  if (variant === 'hero') {
    return (
      <div className="md:hidden flex items-center justify-center gap-3 mt-4 px-4 py-2.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm text-white/80 w-fit mx-auto">
        <span className="text-base">📱</span>
        {isIOS ? (
          <span>
            Toca{' '}
            <svg className="w-3.5 h-3.5 inline text-accent mx-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            → &quot;Agregar a inicio&quot;
          </span>
        ) : (
          <button onClick={handleInstall} className="font-semibold text-accent hover:text-accent-light transition-colors">
            Instala la app gratis
          </button>
        )}
        <button onClick={handleDismiss} aria-label="Cerrar" className="text-white/40 hover:text-white/70 transition-colors leading-none">
          ✕
        </button>
      </div>
    )
  }

  // ── Footer variant — card with icon ───────────────────────────────────
  return (
    <div className="mb-8 flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-xl">📲</span>
        </div>
        <div>
          <p className="text-white font-semibold text-sm">Instala SomosLagos</p>
          {isIOS ? (
            <p className="text-slate-400 text-xs">
              Toca{' '}
              <svg className="w-3 h-3 inline text-blue-400 mx-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              → &quot;Agregar a pantalla de inicio&quot;
            </p>
          ) : (
            <p className="text-slate-400 text-xs">Accede como app desde tu pantalla de inicio</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {!isIOS && deferredPrompt && (
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold text-xs rounded-xl transition-colors"
          >
            Instalar
          </button>
        )}
        <button onClick={handleDismiss} aria-label="Cerrar" className="text-slate-500 hover:text-slate-300 transition-colors p-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
