'use client'

import dynamic from 'next/dynamic'

const HomeVideoInner = dynamic(() => import('./HomeVideoInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-video bg-gradient-to-br from-secondary to-primary rounded-2xl flex items-center justify-center">
      <div className="text-center text-white">
        <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-medium opacity-60">Cargando...</p>
      </div>
    </div>
  ),
})

export default function HomeVideoPlayer() {
  return <HomeVideoInner />
}
