'use client'

import { useEffect, useRef } from 'react'
import { Player, PlayerRef } from '@remotion/player'
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from 'remotion'

// ─── Config ─────────────────────────────────────────────────────────
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&!'
const TITLE = 'SOMOSLAGOS'
const TOTAL_FRAMES = 220

// ─── Matrix Rain ────────────────────────────────────────────────────
const RAIN_COLS = [60, 160, 280, 420, 560, 680, 800, 940, 1060, 1180]

function MatrixRain() {
  const frame = useCurrentFrame()

  return (
    <>
      {RAIN_COLS.map((x, i) => {
        const speed = 3.5 + (i % 3) * 1.8
        const offset = i * 137
        const y = ((frame * speed + offset) % 900) - 100
        const seedA = Math.floor((frame + offset) / 2) % CHARS.length
        const seedB = Math.floor((frame + offset + 7) / 2) % CHARS.length
        const seedC = Math.floor((frame + offset + 14) / 2) % CHARS.length
        const opacity =
          interpolate(frame, [0, 30], [0, 1], {
            extrapolateRight: 'clamp',
            extrapolateLeft: 'clamp',
          }) * (0.08 + (i % 4) * 0.04)

        return (
          <g key={i} style={{ opacity, fontFamily: 'monospace' }}>
            <text x={x} y={y} fill="#0F766E" fontSize={14} fontWeight={700}>
              {CHARS[seedA]}
            </text>
            <text x={x} y={y + 20} fill="#0F766E" fontSize={14} fontWeight={700} opacity={0.6}>
              {CHARS[seedB]}
            </text>
            <text x={x} y={y + 40} fill="#0F766E" fontSize={14} fontWeight={700} opacity={0.3}>
              {CHARS[seedC]}
            </text>
          </g>
        )
      })}
    </>
  )
}

// ─── Single scrambling character ────────────────────────────────────
function ScrambledChar({
  target,
  index,
  total,
}: {
  target: string
  index: number
  total: number
}) {
  const frame = useCurrentFrame()
  const START = 15
  const LETTER_DELAY = 7
  const SCRAMBLE_DURATION = 20

  const delay = START + index * LETTER_DELAY
  const elapsed = frame - delay

  if (elapsed < 0) {
    return <tspan opacity={0}>{target === ' ' ? '\u00A0' : target}</tspan>
  }

  if (elapsed >= SCRAMBLE_DURATION) {
    const glowPeak = elapsed - SCRAMBLE_DURATION
    const glowOpacity = interpolate(glowPeak, [0, 8], [1, 0], {
      extrapolateRight: 'clamp',
    })
    return (
      <tspan
        fill="white"
        style={{
          filter: glowOpacity > 0.1 ? `drop-shadow(0 0 ${14 * glowOpacity}px #99F6E4)` : undefined,
        }}
      >
        {target === ' ' ? '\u00A0' : target}
      </tspan>
    )
  }

  const opacity = interpolate(elapsed, [0, 4], [0, 1], { extrapolateRight: 'clamp' })
  const charSeed = (frame * (index + 1) * 17 + index * 31) % CHARS.length
  const scrambled = target === ' ' ? '\u00A0' : CHARS[Math.floor(charSeed)]

  return (
    <tspan fill="#99F6E4" opacity={opacity}>
      {scrambled}
    </tspan>
  )
}

// ─── Stats row ───────────────────────────────────────────────────────
function StatItem({
  value,
  label,
  x,
  startFrame,
}: {
  value: string
  label: string
  x: number
  startFrame: number
}) {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [startFrame, startFrame + 18], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const translateY = interpolate(frame, [startFrame, startFrame + 18], [14, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <g transform={`translate(${x}, ${translateY})`} opacity={opacity}>
      <text
        textAnchor="middle"
        fill="#F59E0B"
        fontSize={32}
        fontWeight={900}
        fontFamily="system-ui, sans-serif"
        y={0}
      >
        {value}
      </text>
      <text
        textAnchor="middle"
        fill="rgba(255,255,255,0.55)"
        fontSize={12}
        fontFamily="system-ui, sans-serif"
        letterSpacing={3}
        y={20}
      >
        {label}
      </text>
    </g>
  )
}

// ─── Composition ────────────────────────────────────────────────────
function PixelTitleComposition() {
  const frame = useCurrentFrame()

  const lineWidth = interpolate(frame, [130, 155], [0, 480], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const lineOpacity = interpolate(frame, [130, 145], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const dotOpacity = interpolate(frame, [155, 170], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Subtle pulse on the glow after full reveal
  const revealDone = TITLE.length * 7 + 15 + 20 + 10
  const pulsePhase = Math.max(0, frame - revealDone)
  const glowSize = 180 + Math.sin(pulsePhase * 0.06) * 30

  // Glitch offset — fires once at frame ~170
  const glitchActive = frame >= 168 && frame <= 172
  const glitchX = glitchActive ? (frame % 2 === 0 ? 4 : -3) : 0

  return (
    <AbsoluteFill style={{ background: 'linear-gradient(135deg, #0F172A 0%, #0A1929 60%, #0F172A 100%)' }}>
      <svg width={1280} height={420} viewBox="0 0 1280 420" overflow="hidden">
        {/* Background glow orb */}
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0F766E" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0F766E" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="amber-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx={640} cy={190} rx={glowSize} ry={glowSize * 0.55} fill="url(#glow)" />
        <ellipse cx={640} cy={340} rx={300} ry={120} fill="url(#amber-glow)" />

        {/* Matrix rain */}
        <MatrixRain />

        {/* ── SOMOS LAGOS ── big scramble title */}
        <text
          x={640 + glitchX}
          y={200}
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize={118}
          fontWeight={900}
          letterSpacing={10}
        >
          {TITLE.split('').map((char, i) => (
            <ScrambledChar key={i} target={char} index={i} total={TITLE.length} />
          ))}
        </text>

        {/* Glitch duplicate (slightly offset, teal tinted) */}
        {glitchActive && (
          <text
            x={640 - glitchX * 2}
            y={200}
            textAnchor="middle"
            fontFamily="system-ui, -apple-system, sans-serif"
            fontSize={118}
            fontWeight={900}
            letterSpacing={10}
            fill="#99F6E4"
            opacity={0.35}
          >
            {TITLE}
          </text>
        )}

        {/* Separator line (grows from center) */}
        <line
          x1={640 - lineWidth / 2}
          y1={232}
          x2={640 + lineWidth / 2}
          y2={232}
          stroke="url(#lineGrad)"
          strokeWidth={1.5}
          opacity={lineOpacity}
        />
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0F766E" stopOpacity="0" />
            <stop offset="50%" stopColor="#0F766E" stopOpacity="1" />
            <stop offset="100%" stopColor="#0F766E" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Dot dividers */}
        <circle cx={640 - lineWidth / 2 - 6} cy={232} r={3} fill="#0F766E" opacity={dotOpacity} />
        <circle cx={640 + lineWidth / 2 + 6} cy={232} r={3} fill="#0F766E" opacity={dotOpacity} />

        {/* Stats */}
        <StatItem value="176+" label="NEGOCIOS" x={420} startFrame={160} />
        <StatItem value="20+" label="CATEGORÍAS" x={640} startFrame={168} />
        <StatItem value="1" label="CIUDAD" x={860} startFrame={176} />
      </svg>
    </AbsoluteFill>
  )
}

// ─── Wrapper con IntersectionObserver ───────────────────────────────
export default function PixelTitleInner() {
  const playerRef = useRef<PlayerRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    const player = playerRef.current
    if (!el || !player) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          player.play()
        } else {
          player.pause()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
      <Player
        ref={playerRef}
        component={PixelTitleComposition}
        durationInFrames={TOTAL_FRAMES}
        fps={30}
        compositionWidth={1280}
        compositionHeight={420}
        style={{ width: '100%' }}
        initiallyShowControls={false}
        loop
      />
    </div>
  )
}
