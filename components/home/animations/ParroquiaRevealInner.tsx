'use client'

import { useEffect, useRef } from 'react'
import { Player, PlayerRef } from '@remotion/player'
import {
  AbsoluteFill,
  Img,
  interpolate,
  useCurrentFrame,
} from 'remotion'

// ─── Composición ──────────────────────────────────────────────────
const COLS = 18
const ROWS = 10
const TOTAL_FRAMES = 210

function getRevealFrame(col: number, row: number): number {
  // Onda diagonal de arriba-izquierda a abajo-derecha
  const progress = (col / (COLS - 1) + row / (ROWS - 1)) / 2
  return progress * 170
}

function ParroquiaComposition() {
  const frame = useCurrentFrame()

  const textOpacity = interpolate(frame, [165, 195], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const textY = interpolate(frame, [165, 195], [18, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill style={{ background: '#1E293B' }}>
      {/* Imagen de la parroquia */}
      <AbsoluteFill>
        <Img
          src="/tourism/parroquia-asuncion.jpg"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.75) 100%)',
          }}
        />
      </AbsoluteFill>

      {/* Grid de cuadros que se descubren */}
      <AbsoluteFill
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {Array.from({ length: ROWS }).map((_, row) =>
          Array.from({ length: COLS }).map((_, col) => {
            const revealAt = getRevealFrame(col, row)
            const opacity = interpolate(
              frame,
              [revealAt, revealAt + 16],
              [1, 0],
              { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
            )
            return (
              <div
                key={`${col}-${row}`}
                style={{
                  background: '#1E293B',
                  opacity,
                  borderRight: '1px solid rgba(15,118,110,0.25)',
                  borderBottom: '1px solid rgba(15,118,110,0.25)',
                }}
              />
            )
          })
        )}
      </AbsoluteFill>

      {/* Texto al final */}
      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '44px',
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        <div
          style={{
            textAlign: 'center',
            color: 'white',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              fontSize: 12,
              letterSpacing: 4,
              color: '#99F6E4',
              marginBottom: 10,
              textTransform: 'uppercase',
              fontWeight: 700,
            }}
          >
            ✦ Patrimonio de la Humanidad · UNESCO 2010 ✦
          </div>
          <div style={{ fontSize: 38, fontWeight: 900, marginBottom: 6 }}>
            Parroquia de la Asunción
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
            Lagos de Moreno, Jalisco · Pueblo Mágico
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

// ─── Scroll Controller ────────────────────────────────────────────
export default function ParroquiaRevealInner() {
  const playerRef = useRef<PlayerRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !playerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const wh = window.innerHeight
      const start = wh * 0.9
      const end = wh * -0.3
      const progress = (start - rect.top) / (start - end)
      const clamped = Math.max(0, Math.min(1, progress))
      const frame = Math.floor(clamped * (TOTAL_FRAMES - 1))
      playerRef.current.pause()
      playerRef.current.seekTo(frame)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div ref={containerRef} className="w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
      <Player
        ref={playerRef}
        component={ParroquiaComposition}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        compositionWidth={1280}
        compositionHeight={720}
        style={{ width: '100%' }}
        initiallyShowControls={false}
      />
    </div>
  )
}
