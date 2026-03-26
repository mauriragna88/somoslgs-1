'use client'

import { Player } from '@remotion/player'
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'

// ─── Config ──────────────────────────────────────────────────────────
const COLS = 4
const ROWS = 3
const FPS = 30
const ASSEMBLE_DONE = 68   // frame where last tile lands
const TOTAL_FRAMES = 110   // total composition length

export interface BannerRevealProps {
  imageUrl: string
  title: string
  description?: string | null
  linkUrl?: string | null
}

// ─── Single 3D tile ───────────────────────────────────────────────────
function Tile({
  col,
  row,
  imageUrl,
  from,
}: {
  col: number
  row: number
  imageUrl: string
  from: number
}) {
  const frame = useCurrentFrame()
  const { fps, width, height } = useVideoConfig()

  const tileW = width / COLS
  const tileH = height / ROWS

  const elapsed = Math.max(0, frame - from)
  const progress = spring({
    frame: elapsed,
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.7 },
  })

  const translateZ = interpolate(progress, [0, 1], [-380, 0])
  const rotateY = interpolate(progress, [0, 1], [col % 2 === 0 ? -25 : 25, 0])
  const rotateX = interpolate(progress, [0, 1], [row % 2 === 0 ? -18 : 18, 0])
  const scale = interpolate(progress, [0, 1], [0.55, 1])
  const opacity = interpolate(elapsed, [0, 8], [0, 1], { extrapolateRight: 'clamp' })

  return (
    <div
      style={{
        position: 'absolute',
        left: col * tileW,
        top: row * tileH,
        width: tileW,
        height: tileH,
        overflow: 'hidden',
        transform: `perspective(900px) translateZ(${translateZ}px) rotateY(${rotateY}deg) rotateX(${rotateX}deg) scale(${scale})`,
        opacity,
        // Subtle border between tiles during assembly
        boxShadow: progress < 0.95
          ? `0 0 0 1px rgba(153,246,228,${0.4 * (1 - progress)})`
          : 'none',
      }}
    >
      {/* Each tile shows its section of the full image */}
      <Img
        src={imageUrl}
        style={{
          position: 'absolute',
          width: width,
          height: height,
          left: -col * tileW,
          top: -row * tileH,
          objectFit: 'cover',
        }}
      />
      {/* Dark face shown during flight */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `rgba(15,23,42,${interpolate(progress, [0, 0.7, 1], [0.85, 0.3, 0])})`,
        }}
      />
    </div>
  )
}

// ─── Glint sweep ─────────────────────────────────────────────────────
function Glint() {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()

  const glintStart = ASSEMBLE_DONE + 4
  const x = interpolate(frame, [glintStart, glintStart + 22], [-80, width + 80], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const opacity = interpolate(
    frame,
    [glintStart, glintStart + 4, glintStart + 18, glintStart + 22],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: x,
        width: 60,
        height: height,
        background: 'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.18) 50%, transparent 100%)',
        transform: 'skewX(-12deg)',
        opacity,
        pointerEvents: 'none',
      }}
    />
  )
}

// ─── Text overlay ────────────────────────────────────────────────────
function TextOverlay({ title, description }: { title: string; description?: string | null }) {
  const frame = useCurrentFrame()

  const titleOpacity = interpolate(frame, [ASSEMBLE_DONE, ASSEMBLE_DONE + 16], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const titleY = interpolate(frame, [ASSEMBLE_DONE, ASSEMBLE_DONE + 16], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const descOpacity = interpolate(frame, [ASSEMBLE_DONE + 10, ASSEMBLE_DONE + 24], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: '20px 24px',
        background: 'linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.5) 70%, transparent 100%)',
      }}
    >
      <div
        style={{
          color: 'white',
          fontSize: 22,
          fontWeight: 800,
          fontFamily: 'system-ui, sans-serif',
          lineHeight: 1.2,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      {description && (
        <div
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 13,
            fontFamily: 'system-ui, sans-serif',
            opacity: descOpacity,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </div>
      )}
      <div
        style={{
          marginTop: 8,
          opacity: descOpacity,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: '#99F6E4',
          fontSize: 12,
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: 1,
        }}
      >
        CONOCER MÁS →
      </div>
    </div>
  )
}

// ─── Composition ─────────────────────────────────────────────────────
function BannerRevealComposition(props: Record<string, unknown>) {
  const { imageUrl, title, description } = props as unknown as BannerRevealProps
  const frame = useCurrentFrame()

  // Stagger tiles: diagonal wave top-left → bottom-right
  const getTileDelay = (col: number, row: number) => {
    return Math.round((col / (COLS - 1) + row / (ROWS - 1)) * 28)
  }

  // Subtle continuous parallax after assembly
  const parallaxPhase = Math.max(0, frame - ASSEMBLE_DONE)
  const tiltX = Math.sin(parallaxPhase * 0.025) * 2.5
  const tiltY = Math.cos(parallaxPhase * 0.018) * 1.8

  return (
    <AbsoluteFill style={{ background: '#0F172A', overflow: 'hidden' }}>
      {/* Assembled image with continuous 3D parallax */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `perspective(1200px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transition: 'transform 0.1s ease',
        }}
      >
        {/* Tiles */}
        {Array.from({ length: ROWS }).flatMap((_, row) =>
          Array.from({ length: COLS }).map((_, col) => (
            <Tile
              key={`${col}-${row}`}
              col={col}
              row={row}
              imageUrl={imageUrl}
              from={getTileDelay(col, row)}
            />
          ))
        )}
      </div>

      {/* Glint */}
      <Glint />

      {/* Text overlay */}
      {title && (
        <TextOverlay title={title} description={description} />
      )}

      {/* Top teal accent line */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #0F766E, #99F6E4, #F59E0B, #0F766E)',
          opacity: interpolate(frame, [ASSEMBLE_DONE, ASSEMBLE_DONE + 12], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      />
    </AbsoluteFill>
  )
}

// ─── Export wrapper ───────────────────────────────────────────────────
export default function BannerRevealInner(props: BannerRevealProps) {
  return (
    <Player
      component={BannerRevealComposition}
      inputProps={props}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      compositionWidth={800}
      compositionHeight={280}
      style={{ width: '100%', borderRadius: 16, overflow: 'hidden' }}
      initiallyShowControls={false}
      autoPlay
      loop={false}
    />
  )
}
