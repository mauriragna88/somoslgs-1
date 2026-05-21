'use client'

import { useEffect, useRef } from 'react'
import { Player, PlayerRef } from '@remotion/player'
import { AbsoluteFill, useCurrentFrame, interpolate, spring } from 'remotion'

const TOTAL_FRAMES = 240
const FPS = 30

// Pueblo Magico palette
const PUEBLO = {
  noche: '#2C1810',
  barroco: '#D4A843',
  cantera: '#C4745E',
  terracotta: '#8B5E3C',
  crema: '#FDF6EE',
  canteraLight: '#F1D2C7',
  agave: '#5B8C3E',
} as const

// ─── Sparkle ─────────────────────────────────────────────────────────
function Sparkle({ x, y, delay, size = 4 }: { x: number; y: number; delay: number; size?: number }) {
  const frame = useCurrentFrame()
  const cycle = 60
  const t = ((frame - delay) % cycle + cycle) % cycle
  const opacity = interpolate(t, [0, 10, 40, 60], [0, 1, 0.6, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const scale = interpolate(t, [0, 10, 40], [0.2, 1.2, 0.8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity={opacity}>
      <polygon
        points={`0,${-size} ${size * 0.3},${-size * 0.3} ${size},0 ${size * 0.3},${size * 0.3} 0,${size} ${-size * 0.3},${size * 0.3} ${-size},0 ${-size * 0.3},${-size * 0.3}`}
        fill={PUEBLO.barroco}
      />
    </g>
  )
}

// ─── Neon letter ─────────────────────────────────────────────────────
function NeonLetter({ char, x, index, startAt }: { char: string; x: number; index: number; startAt: number }) {
  const frame = useCurrentFrame()
  const elapsed = Math.max(0, frame - startAt - index * 5)
  const progress = spring({ frame: elapsed, fps: FPS, config: { damping: 12, stiffness: 220, mass: 0.4 } })
  const y = interpolate(progress, [0, 1], [-30, 0])
  const opacity = interpolate(elapsed, [0, 5], [0, 1], { extrapolateRight: 'clamp' })

  // Flicker on letter 0 and 5 after they land
  const landedAt = startAt + index * 5 + 12
  const flickerT = frame - landedAt
  const flickerActive = flickerT > 0 && flickerT < 8 && (index === 0 || index === 5)
  const flickerOpacity = flickerActive ? (flickerT % 2 === 0 ? 0.5 : 1) : 1

  const isHighlight = [1, 3, 7, 9].includes(index) // D, E, S, D (of DESTACADOS)
  const fill = isHighlight ? PUEBLO.barroco : PUEBLO.crema
  const glowColor = isHighlight ? PUEBLO.barroco : PUEBLO.cantera

  return (
    <g transform={`translate(${x}, ${y})`} opacity={opacity * flickerOpacity}>
      {/* Glow shadow */}
      <text
        textAnchor="middle"
        y={0}
        fontSize={72}
        fontWeight={900}
        fontFamily="system-ui, -apple-system, sans-serif"
        fill={glowColor}
        opacity={0.35}
        style={{ filter: `blur(8px)` }}
      >
        {char}
      </text>
      {/* Main letter */}
      <text
        textAnchor="middle"
        y={0}
        fontSize={72}
        fontWeight={900}
        fontFamily="system-ui, -apple-system, sans-serif"
        fill={fill}
      >
        {char}
      </text>
    </g>
  )
}

// ─── Composition ──────────────────────────────────────────────────────
function FeaturedHeaderComposition() {
  const frame = useCurrentFrame()

  const WORD1 = 'NEGOCIOS'
  const WORD2 = 'DESTACADOS'
  const W1_START = 10
  const W2_START = 60

  // Word 1 letter positions (centered around 640)
  const w1LetterW = 78
  const w1Total = WORD1.length * w1LetterW
  const w1StartX = 640 - w1Total / 2 + w1LetterW / 2

  // Word 2 letter positions
  const w2LetterW = 68
  const w2Total = WORD2.length * w2LetterW
  const w2StartX = 640 - w2Total / 2 + w2LetterW / 2

  // Badge "★ LOS MEJORES ★" appears after everything lands
  const badgeOpacity = interpolate(frame, [155, 175], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const badgeY = interpolate(frame, [155, 175], [10, 0], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  // Sweep line that passes over after reveal
  const sweepStart = 160
  const sweepX = interpolate(frame, [sweepStart, sweepStart + 50], [-100, 1380], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })
  const sweepOp = frame >= sweepStart && frame <= sweepStart + 50
    ? interpolate(frame, [sweepStart, sweepStart + 5, sweepStart + 45, sweepStart + 50], [0, 1, 1, 0])
    : 0

  // Ambient glow pulse
  const glowPulse = 0.12 + Math.sin(frame * 0.05) * 0.04

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${PUEBLO.noche} 0%, #3D2418 100%)` }}>
      <svg width={1280} height={220} viewBox="0 0 1280 220" overflow="hidden">
        <defs>
          <radialGradient id="fh-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={PUEBLO.cantera} stopOpacity={glowPulse} />
            <stop offset="100%" stopColor={PUEBLO.cantera} stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx={640} cy={110} rx={480} ry={160} fill="url(#fh-glow)" />

        {/* Horizontal base lines */}
        <line x1={0} y1={195} x2={1280} y2={195} stroke={PUEBLO.cantera} strokeWidth={0.5} opacity={0.2} />
        <line x1={0} y1={25} x2={1280} y2={25} stroke={PUEBLO.cantera} strokeWidth={0.5} opacity={0.2} />

        {/* ── NEGOCIOS ── row 1 */}
        <g transform="translate(0, 90)">
          {WORD1.split('').map((ch, i) => (
            <NeonLetter
              key={i}
              char={ch}
              x={w1StartX + i * w1LetterW}
              index={i}
              startAt={W1_START}
            />
          ))}
        </g>

        {/* ── DESTACADOS ── row 2 */}
        <g transform="translate(0, 165)">
          {WORD2.split('').map((ch, i) => (
            <NeonLetter
              key={i}
              char={ch}
              x={w2StartX + i * w2LetterW}
              index={i}
              startAt={W2_START}
            />
          ))}
        </g>

        {/* Sparkles */}
        <Sparkle x={180} y={90} delay={80} size={5} />
        <Sparkle x={340} y={55} delay={95} size={3.5} />
        <Sparkle x={640} y={42} delay={110} size={6} />
        <Sparkle x={940} y={55} delay={125} size={3.5} />
        <Sparkle x={1100} y={90} delay={90} size={5} />
        <Sparkle x={260} y={155} delay={140} size={3} />
        <Sparkle x={1020} y={155} delay={148} size={3} />

        {/* "Los mejores de Lagos" badge */}
        <g transform={`translate(640, ${175 + badgeY})`} opacity={badgeOpacity}>
          <text
            textAnchor="middle"
            fontSize={11}
            fill={PUEBLO.barroco}
            fontFamily="system-ui, sans-serif"
            letterSpacing={3.5}
            fontWeight={700}
          >
            ★  LOS MEJORES DE LAGOS DE MORENO  ★
          </text>
        </g>

        {/* Sweep light */}
        <line
          x1={sweepX}
          y1={0}
          x2={sweepX}
          y2={220}
          stroke="white"
          strokeWidth={50}
          opacity={sweepOp * 0.15}
          style={{ filter: 'blur(20px)' }}
        />
      </svg>
    </AbsoluteFill>
  )
}

// ─── Export ───────────────────────────────────────────────────────────
export default function FeaturedHeaderInner() {
  const playerRef = useRef<PlayerRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    const player = playerRef.current
    if (!el || !player) return
    const observer = new IntersectionObserver(
      ([entry]) => { entry.isIntersecting ? player.play() : player.pause() },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="w-full rounded-xl overflow-hidden">
      <Player
        ref={playerRef}
        component={FeaturedHeaderComposition}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        compositionWidth={1280}
        compositionHeight={220}
        style={{ width: '100%' }}
        initiallyShowControls={false}
        loop
      />
    </div>
  )
}
