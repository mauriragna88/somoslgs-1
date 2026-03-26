'use client'

import { useEffect, useRef } from 'react'
import { Player, PlayerRef } from '@remotion/player'
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

// ─── Config ───────────────────────────────────────────────────────────
const COLS = 5
const ROWS = 3
const FPS = 30
const HOLD_FRAMES = 8          // tiles stay solid before flying
const STAGGER = 3.5            // frames between each tile's start
const TILE_DURATION = 28       // frames for one tile to fly away
const TOTAL_FRAMES = Math.ceil(HOLD_FRAMES + (COLS + ROWS - 2) * STAGGER + TILE_DURATION + 10)

export interface BannerRevealProps {
  onComplete?: () => void
}

// ─── Tile that flies away in 3D ───────────────────────────────────────
function FlyAwayTile({ col, row }: { col: number; row: number }) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()

  const tileW = width / COLS
  const tileH = height / ROWS

  // Diagonal stagger: top-left first
  const delay = HOLD_FRAMES + (col / (COLS - 1) + row / (ROWS - 1)) * ((COLS + ROWS - 2) * STAGGER) / 2

  const progress = spring({
    frame: Math.max(0, frame - delay),
    fps,
    config: { damping: 10, stiffness: 180, mass: 0.55 },
  })

  // Each tile flies in a slightly different direction for variety
  const angle = ((col * ROWS + row) / (COLS * ROWS)) * Math.PI * 2
  const spreadX = (col - (COLS - 1) / 2) * 180 + Math.cos(angle) * 60
  const spreadY = -Math.abs(row - (ROWS - 1) / 2) * 120 - 200 + Math.sin(angle) * 40

  const translateX = interpolate(progress, [0, 1], [0, spreadX])
  const translateY = interpolate(progress, [0, 1], [0, spreadY])
  const translateZ = interpolate(progress, [0, 1], [0, 350])
  const rotateZ = interpolate(progress, [0, 1], [0, col % 2 === 0 ? 55 : -55])
  const rotateX = interpolate(progress, [0, 1], [0, row % 2 === 0 ? -30 : 30])
  const opacity = interpolate(progress, [0, 0.55, 1], [1, 0.7, 0])

  // Tile color: alternating dark teal shades for depth
  const shade = (col + row) % 2 === 0 ? '#0F766E' : '#0D5E58'
  const borderLight = (col + row) % 3 === 0 ? 'rgba(153,246,228,0.25)' : 'rgba(153,246,228,0.08)'

  return (
    <div
      style={{
        position: 'absolute',
        left: col * tileW,
        top: row * tileH,
        width: tileW,
        height: tileH,
        background: `linear-gradient(135deg, ${shade}, #0A1929)`,
        border: `1px solid ${borderLight}`,
        transform: `perspective(900px) translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateZ(${rotateZ}deg) rotateX(${rotateX}deg)`,
        opacity,
        transformStyle: 'preserve-3d',
        backfaceVisibility: 'hidden',
      }}
    >
      {/* Subtle inner highlight */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(153,246,228,0.12) 0%, transparent 60%)',
        }}
      />
    </div>
  )
}

// ─── Composition (only tiles, no image) ───────────────────────────────
function TileRevealComposition() {
  return (
    <AbsoluteFill style={{ background: 'transparent', overflow: 'hidden' }}>
      {Array.from({ length: ROWS }).flatMap((_, row) =>
        Array.from({ length: COLS }).map((_, col) => (
          <FlyAwayTile key={`${col}-${row}`} col={col} row={row} />
        ))
      )}
    </AbsoluteFill>
  )
}

// ─── Overlay wrapper ──────────────────────────────────────────────────
export default function BannerRevealInner({ onComplete }: BannerRevealProps) {
  const playerRef = useRef<PlayerRef>(null)

  useEffect(() => {
    const durationMs = (TOTAL_FRAMES / FPS) * 1000
    const t = setTimeout(() => onComplete?.(), durationMs)
    return () => clearTimeout(t)
  }, [onComplete])

  return (
    <div className="absolute inset-0 z-10 pointer-events-none" style={{ overflow: 'hidden' }}>
      <Player
        ref={playerRef}
        component={TileRevealComposition}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        compositionWidth={500}
        compositionHeight={200}
        style={{ width: '100%', height: '100%' }}
        initiallyShowControls={false}
        autoPlay
        loop={false}
      />
    </div>
  )
}
