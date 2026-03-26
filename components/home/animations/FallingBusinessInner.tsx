'use client'

import { Player } from '@remotion/player'
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion'

// ─── Datos de negocios de muestra ────────────────────────────────
const BUSINESSES = [
  {
    emoji: '🌮',
    name: "Tacos Checo's",
    category: 'Taquerías',
    rating: 4.8,
    address: 'San Miguel, Lagos de Moreno',
    color: '#EF4444',
    light: '#FEF2F2',
    slug: 'tacos-checos',
  },
  {
    emoji: '🍕',
    name: 'BIZZO',
    category: 'Pizzerías',
    rating: 4.6,
    address: 'Centro, Lagos de Moreno',
    color: '#F59E0B',
    light: '#FFFBEB',
    slug: 'bizzo',
  },
  {
    emoji: '🍺',
    name: 'Cervecería Xiconaque',
    category: 'Bares y Cantinas',
    rating: 4.7,
    address: 'Centro Histórico, Lagos de Moreno',
    color: '#0F766E',
    light: '#F0FDFA',
    slug: 'cerveceria-xiconaque',
  },
]

const CYCLE = 185  // frames por negocio (~6.2 s)
const TOTAL = BUSINESSES.length * CYCLE

// ─── Elemento que cae con rebote ─────────────────────────────────
function FallingEl({
  children,
  from,
  style,
}: {
  children: React.ReactNode
  from: number
  style?: React.CSSProperties
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const progress = spring({
    frame: Math.max(0, frame - from),
    fps,
    config: { damping: 13, stiffness: 200, mass: 0.5 },
  })

  const translateY = interpolate(progress, [0, 1], [-140, 0])
  const rotate = interpolate(progress, [0, 0.6, 1], [-6, 2, 0])
  const opacity = interpolate(frame, [from, from + 6], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <div
      style={{
        ...style,
        transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
        opacity,
      }}
    >
      {children}
    </div>
  )
}

// ─── Tarjeta de negocio ───────────────────────────────────────────
function BusinessCard({
  biz,
  isLast,
}: {
  biz: (typeof BUSINESSES)[0]
  isLast: boolean
}) {
  const frame = useCurrentFrame()

  const cardOpacity = interpolate(
    frame,
    [0, 12, CYCLE - 22, CYCLE - 2],
    [0, 1, 1, isLast ? 1 : 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  const stars = Math.round(biz.rating)

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        opacity: cardOpacity,
      }}
    >
      {/* Fondo decorativo */}
      <div
        style={{
          position: 'absolute',
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: biz.color + '15',
          filter: 'blur(80px)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* Tarjeta */}
      <div
        style={{
          width: 340,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 28,
          padding: '40px 36px',
          position: 'relative',
        }}
      >
        {/* Emoji/Logo */}
        <FallingEl from={8} style={{ textAlign: 'center', marginBottom: 22 }}>
          <div
            style={{
              width: 76,
              height: 76,
              background: biz.color + '25',
              border: `2px solid ${biz.color}50`,
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 38,
              margin: '0 auto',
            }}
          >
            {biz.emoji}
          </div>
        </FallingEl>

        {/* Nombre */}
        <FallingEl from={22} style={{ textAlign: 'center', marginBottom: 14 }}>
          <div
            style={{
              color: 'white',
              fontSize: 26,
              fontWeight: 900,
              fontFamily: 'system-ui, sans-serif',
              lineHeight: 1.2,
            }}
          >
            {biz.name}
          </div>
        </FallingEl>

        {/* Badge categoría */}
        <FallingEl from={38} style={{ textAlign: 'center', marginBottom: 18 }}>
          <span
            style={{
              background: biz.color + '28',
              border: `1.5px solid ${biz.color}55`,
              color: biz.color === '#0F766E' ? '#5EEAD4' : biz.color,
              borderRadius: 20,
              padding: '5px 16px',
              fontSize: 13,
              fontWeight: 700,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            {biz.category}
          </span>
        </FallingEl>

        {/* Estrellas */}
        <FallingEl from={52} style={{ textAlign: 'center', marginBottom: 14 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
            }}
          >
            {[...Array(5)].map((_, i) => (
              <span
                key={i}
                style={{
                  fontSize: 22,
                  color: i < stars ? '#F59E0B' : 'rgba(255,255,255,0.15)',
                }}
              >
                ★
              </span>
            ))}
            <span
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 14,
                marginLeft: 8,
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 700,
              }}
            >
              {biz.rating}
            </span>
          </div>
        </FallingEl>

        {/* Dirección */}
        <FallingEl from={66} style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              color: 'rgba(255,255,255,0.45)',
              fontSize: 13,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            📍 {biz.address}
          </div>
        </FallingEl>

        {/* Botón CTA */}
        <FallingEl from={80} style={{ textAlign: 'center' }}>
          <div
            style={{
              background: `linear-gradient(135deg, ${biz.color}, ${biz.color}cc)`,
              color: 'white',
              borderRadius: 50,
              padding: '13px 30px',
              fontSize: 14,
              fontWeight: 800,
              fontFamily: 'system-ui, sans-serif',
              display: 'inline-block',
              boxShadow: `0 8px 24px ${biz.color}40`,
            }}
          >
            Ver Negocio →
          </div>
        </FallingEl>
      </div>

      {/* Label "en SomosLagos" */}
      <div
        style={{
          position: 'absolute',
          bottom: 28,
          right: 0,
          left: 0,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.2)',
          fontSize: 12,
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: 2,
          opacity: interpolate(frame, [90, 110], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        SOMOSLAGOS.COM.MX
      </div>
    </AbsoluteFill>
  )
}

// ─── Composición ──────────────────────────────────────────────────
function FallingComposition() {
  return (
    <AbsoluteFill style={{ background: '#0F172A' }}>
      {BUSINESSES.map((biz, i) => (
        <Sequence
          key={biz.name}
          from={i * CYCLE}
          durationInFrames={CYCLE + (i < BUSINESSES.length - 1 ? 20 : 0)}
        >
          <BusinessCard biz={biz} isLast={i === BUSINESSES.length - 1} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}

// ─── Player ───────────────────────────────────────────────────────
export default function FallingBusinessInner() {
  return (
    <div className="w-full rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
      <Player
        component={FallingComposition}
        durationInFrames={TOTAL}
        fps={30}
        compositionWidth={1280}
        compositionHeight={720}
        style={{ width: '100%' }}
        autoPlay
        loop
        controls={false}
        showVolumeControls={false}
      />
    </div>
  )
}
