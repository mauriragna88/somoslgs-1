'use client'

import { useEffect, useRef } from 'react'
import { Player, PlayerRef } from '@remotion/player'
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  spring,
  Sequence,
} from 'remotion'

const TOTAL_FRAMES = 300
const FPS = 30

// ─── Floating stat card ──────────────────────────────────────────────
function StatCard({
  value,
  label,
  icon,
  color,
  from,
  x,
  y,
}: {
  value: string
  label: string
  icon: string
  color: string
  from: number
  x: number
  y: number
}) {
  const frame = useCurrentFrame()
  const progress = spring({
    frame: Math.max(0, frame - from),
    fps: FPS,
    config: { damping: 14, stiffness: 180, mass: 0.6 },
  })
  const scale = interpolate(progress, [0, 1], [0.4, 1])
  const opacity = interpolate(Math.max(0, frame - from), [0, 6], [0, 1], {
    extrapolateRight: 'clamp',
  })
  // Subtle float
  const floatY = Math.sin((frame + from * 7) * 0.04) * 5

  return (
    <g transform={`translate(${x}, ${y + floatY})`} opacity={opacity}>
      <g transform={`scale(${scale})`} style={{ transformOrigin: '0 0' }}>
        <rect
          x={-90}
          y={-44}
          width={180}
          height={88}
          rx={16}
          fill="rgba(255,255,255,0.06)"
          stroke={color}
          strokeWidth={1.2}
          strokeOpacity={0.4}
        />
        {/* Glow behind card */}
        <ellipse cx={0} cy={0} rx={80} ry={40} fill={color} fillOpacity={0.07} />
        <text textAnchor="middle" y={-12} fontSize={22} fontFamily="system-ui">
          {icon}
        </text>
        <text
          textAnchor="middle"
          y={12}
          fontSize={20}
          fontWeight={900}
          fill={color}
          fontFamily="system-ui, sans-serif"
        >
          {value}
        </text>
        <text
          textAnchor="middle"
          y={30}
          fontSize={10}
          fill="rgba(255,255,255,0.55)"
          fontFamily="system-ui, sans-serif"
          letterSpacing={1.5}
        >
          {label.toUpperCase()}
        </text>
      </g>
    </g>
  )
}

// ─── Orbiting ring ───────────────────────────────────────────────────
function OrbitRing({ frame, cx, cy, rx, ry, speed, opacity }: {
  frame: number; cx: number; cy: number
  rx: number; ry: number; speed: number; opacity: number
}) {
  const angle = (frame * speed * Math.PI) / 180
  const dotX = cx + rx * Math.cos(angle)
  const dotY = cy + ry * Math.sin(angle)
  return (
    <g opacity={opacity}>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="#0F766E" strokeWidth={0.8} strokeDasharray="4 8" />
      <circle cx={dotX} cy={dotY} r={4} fill="#99F6E4" />
    </g>
  )
}

// ─── Main composition ─────────────────────────────────────────────────
function AdShowcaseComposition() {
  const frame = useCurrentFrame()

  const bgOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })

  // Headline scramble (reuse chars approach)
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$'
  const HEADLINE = 'ANÚNCIATE'
  const SUB = 'EN SOMOSLAGOS'
  const HEADLINE_START = 10

  // CTA pulse
  const ctaOpacity = interpolate(frame, [180, 200], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const ctaPulse = 1 + Math.sin(Math.max(0, frame - 200) * 0.12) * 0.04

  // Scanning line
  const scanX = interpolate(frame % 120, [0, 120], [-100, 1380])
  const scanOpacity = interpolate(frame % 120, [0, 10, 110, 120], [0, 0.4, 0.4, 0])

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0A1929 0%, #0F172A 50%, #0D2438 100%)',
        overflow: 'hidden',
      }}
    >
      <svg width={1280} height={520} viewBox="0 0 1280 520" overflow="hidden" opacity={bgOpacity}>
        <defs>
          <radialGradient id="ad-center-glow" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#0F766E" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0F766E" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="ad-amber-glow" cx="50%" cy="90%" r="40%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background glows */}
        <ellipse cx={640} cy={240} rx={500} ry={280} fill="url(#ad-center-glow)" />
        <ellipse cx={640} cy={480} rx={400} ry={180} fill="url(#ad-amber-glow)" />

        {/* Grid lines (subtle) */}
        {[160, 320, 480, 640, 800, 960, 1120].map((x) => (
          <line key={x} x1={x} y1={0} x2={x} y2={520} stroke="#0F766E" strokeWidth={0.3} opacity={0.15} />
        ))}
        {[130, 260, 390].map((y) => (
          <line key={y} x1={0} y1={y} x2={1280} y2={y} stroke="#0F766E" strokeWidth={0.3} opacity={0.15} />
        ))}

        {/* Scanning light beam */}
        <line
          x1={scanX}
          y1={0}
          x2={scanX}
          y2={520}
          stroke="white"
          strokeWidth={40}
          opacity={scanOpacity}
          strokeLinecap="round"
          style={{ filter: 'blur(16px)' }}
        />

        {/* Orbit rings */}
        <OrbitRing frame={frame} cx={640} cy={230} rx={320} ry={100} speed={0.4} opacity={0.25} />
        <OrbitRing frame={frame} cx={640} cy={230} rx={430} ry={135} speed={-0.25} opacity={0.15} />

        {/* ── ANÚNCIATE ── */}
        <text
          x={640}
          y={170}
          textAnchor="middle"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize={108}
          fontWeight={900}
          letterSpacing={8}
          fill="white"
        >
          {HEADLINE.split('').map((char, i) => {
            const delay = HEADLINE_START + i * 6
            const elapsed = frame - delay
            const SCRAMBLE = 18
            if (elapsed < 0) return <tspan key={i} opacity={0}>{char}</tspan>
            if (elapsed >= SCRAMBLE) {
              const glowF = interpolate(elapsed - SCRAMBLE, [0, 8], [1, 0], { extrapolateRight: 'clamp' })
              return (
                <tspan key={i} fill="white" style={{ filter: glowF > 0.1 ? `drop-shadow(0 0 ${12 * glowF}px #99F6E4)` : undefined }}>
                  {char}
                </tspan>
              )
            }
            const charSeed = Math.floor((frame * (i + 1) * 13 + i * 29) % CHARS.length)
            const opacity = interpolate(elapsed, [0, 4], [0, 1], { extrapolateRight: 'clamp' })
            return <tspan key={i} fill="#99F6E4" opacity={opacity}>{CHARS[charSeed]}</tspan>
          })}
        </text>

        {/* Subtitle */}
        {(() => {
          const subOpacity = interpolate(frame, [80, 105], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const subY = interpolate(frame, [80, 105], [15, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          return (
            <text
              x={640}
              y={210 + subY}
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
              fontSize={18}
              fill="#99F6E4"
              letterSpacing={6}
              fontWeight={600}
              opacity={subOpacity}
            >
              {SUB}
            </text>
          )
        })()}

        {/* Separator */}
        {(() => {
          const w = interpolate(frame, [100, 130], [0, 320], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          const op = interpolate(frame, [100, 115], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
          return (
            <>
              <line x1={640 - w / 2} y1={228} x2={640 + w / 2} y2={228} stroke="#0F766E" strokeWidth={1} opacity={op} />
              <circle cx={640 - w / 2 - 5} cy={228} r={2.5} fill="#0F766E" opacity={op} />
              <circle cx={640 + w / 2 + 5} cy={228} r={2.5} fill="#0F766E" opacity={op} />
            </>
          )
        })()}

        {/* Stat cards — 4 floating */}
        <StatCard value="10K+" label="Vistas / mes" icon="👀" color="#99F6E4" from={120} x={220} y={340} />
        <StatCard value="176+" label="Negocios" icon="🏪" color="#F59E0B" from={135} x={480} y={340} />
        <StatCard value="$99" label="Desde / mes" icon="💰" color="#34D399" from={150} x={800} y={340} />
        <StatCard value="24/7" label="Visible" icon="📱" color="#A78BFA" from={165} x={1060} y={340} />

        {/* CTA button */}
        <g transform={`translate(640, 456) scale(${ctaPulse})`} opacity={ctaOpacity}>
          <rect x={-130} y={-24} width={260} height={48} rx={24} fill="#F59E0B" />
          <rect x={-130} y={-24} width={260} height={48} rx={24} fill="none" stroke="#F59E0B" strokeWidth={1.5} opacity={0.4} />
          <text
            textAnchor="middle"
            y={7}
            fontSize={15}
            fontWeight={800}
            fill="#0F172A"
            fontFamily="system-ui, sans-serif"
            letterSpacing={1}
          >
            CONTACTAR AHORA →
          </text>
        </g>

        {/* Bottom watermark */}
        <text
          x={640}
          y={506}
          textAnchor="middle"
          fontSize={10}
          fill="rgba(255,255,255,0.18)"
          fontFamily="system-ui, sans-serif"
          letterSpacing={3}
          opacity={ctaOpacity}
        >
          SOMOSLAGOS.COM.MX · PUBLICIDAD LOCAL
        </text>
      </svg>
    </AbsoluteFill>
  )
}

// ─── Export ───────────────────────────────────────────────────────────
export default function AdShowcaseInner() {
  const playerRef = useRef<PlayerRef>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    const player = playerRef.current
    if (!el || !player) return
    const observer = new IntersectionObserver(
      ([entry]) => { entry.isIntersecting ? player.play() : player.pause() },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
      <Player
        ref={playerRef}
        component={AdShowcaseComposition}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        compositionWidth={1280}
        compositionHeight={520}
        style={{ width: '100%' }}
        initiallyShowControls={false}
        loop
      />
    </div>
  )
}
