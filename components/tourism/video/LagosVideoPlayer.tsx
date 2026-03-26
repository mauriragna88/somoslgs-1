'use client'

import dynamic from 'next/dynamic'

// Carga diferida: Remotion usa APIs del browser
const LagosVideoInner = dynamic(() => import('./LagosVideoInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-gradient-to-br from-secondary to-primary rounded-2xl flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-medium opacity-70">Cargando video...</p>
      </div>
    </div>
  ),
})

export default function LagosVideoPlayer() {
  return <LagosVideoInner />
}
