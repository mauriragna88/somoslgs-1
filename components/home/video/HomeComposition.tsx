'use client'

import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Img,
} from 'remotion'

// ─── Tiempos ─────────────────────────────────────────────────────
const FPS = 30
const INTRO_F   = 60   // 2 s
const SCENE_F   = 90   // 3 s por imagen (más rápido que Qué Hacer)
const FADE_F    = 20   // fade entre imágenes
const STATS_F   = 120  // 4 s stats
const OUTRO_F   = 90   // 3 s CTA

// 5 imágenes — diferentes a Qué Hacer, más "vida de ciudad"
const IMAGES = [
  { src: '/tourism/centro-historico.jpg',      label: 'Centro Histórico'          },
  { src: '/tourism/danza-matachines.jpg',      label: 'Cultura y Tradiciones'     },
  { src: '/tourism/centro-historico.jpg',      label: 'Gastronomía Local'         },
  { src: '/tourism/casa-cultura.jpg',          label: 'Artesanías y Comercio'     },
  { src: '/tourism/dia-muertos.jpg',           label: 'Fiestas y Eventos'         },
]

export const HOME_VIDEO_DURATION =
  INTRO_F + IMAGES.length * SCENE_F + STATS_F + OUTRO_F

// ─── Intro ───────────────────────────────────────────────────────
function IntroScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const logoScale  = spring({ frame: frame - 5, fps, config: { damping: 18, stiffness: 90 } })
  const tagOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: 'clamp' })
  const titleY     = interpolate(frame, [15, 45], [20, 0], { extrapolateRight: 'clamp' })
  const titleOp    = interpolate(frame, [15, 45], [0, 1],  { extrapolateRight: 'clamp' })
  const outOp      = interpolate(frame, [48, 60], [1, 0],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0D5E58 0%, #1E293B 60%, #0F172A 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: outOp,
      }}
    >
      {/* Círculo de logo */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 20,
          background: 'rgba(255,255,255,0.1)',
          border: '1.5px solid rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          transform: `scale(${logoScale})`,
        }}
      >
        <span style={{ fontSize: 40 }}>🏙️</span>
      </div>

      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, textAlign: 'center' }}>
        <div style={{
          color: 'white',
          fontSize: 56,
          fontWeight: 900,
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: -1,
          lineHeight: 1.1,
        }}>
          <span style={{ color: '#99F6E4' }}>Somos</span>Lagos
        </div>
        <div style={{ opacity: tagOpacity, color: 'rgba(255,255,255,0.55)', fontSize: 16, marginTop: 12, fontFamily: 'system-ui, sans-serif', letterSpacing: 1 }}>
          La plataforma digital de Lagos de Moreno
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ─── Imagen rápida con Ken Burns ─────────────────────────────────
function FastImageScene({ src, label }: { src: string; label: string }) {
  const frame = useCurrentFrame()

  const opacity = interpolate(
    frame,
    [0, FADE_F, SCENE_F - FADE_F, SCENE_F],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  const scale = interpolate(frame, [0, SCENE_F], [1, 1.08], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
  })

  const labelOp = interpolate(frame, [20, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const labelY  = interpolate(frame, [20, 50], [8, 0],  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity }}>
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <Img
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
          }}
        />
        <AbsoluteFill style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, transparent 40%, rgba(0,0,0,0.65) 100%)',
        }} />
      </AbsoluteFill>

      {/* Label */}
      <AbsoluteFill style={{ display: 'flex', alignItems: 'flex-end', padding: '36px 44px' }}>
        <div style={{ opacity: labelOp, transform: `translateY(${labelY}px)`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 3, height: 20, background: '#F59E0B', borderRadius: 2 }} />
          <span style={{ color: 'white', fontSize: 16, fontWeight: 600, fontFamily: 'system-ui, sans-serif', textShadow: '0 1px 4px rgba(0,0,0,0.5)', letterSpacing: 0.3 }}>
            {label}
          </span>
        </div>
      </AbsoluteFill>

      {/* Watermark */}
      <AbsoluteFill style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '36px 44px', opacity: labelOp * 0.6 }}>
        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 700, fontFamily: 'system-ui, sans-serif', letterSpacing: 1 }}>
          SomosLagos
        </span>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

// ─── Stats animados ───────────────────────────────────────────────
function StatsScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const bg = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: 'clamp' })

  const s1 = spring({ frame: frame - 10, fps, config: { damping: 16, stiffness: 70 } })
  const s2 = spring({ frame: frame - 30, fps, config: { damping: 16, stiffness: 70 } })
  const s3 = spring({ frame: frame - 50, fps, config: { damping: 16, stiffness: 70 } })
  const s4 = spring({ frame: frame - 68, fps, config: { damping: 16, stiffness: 70 } })

  const msgOp = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: 'clamp' })

  const stats = [
    { value: '176+', label: 'Negocios Locales', icon: '🏪', s: s1 },
    { value: '52+',  label: 'Categorías',        icon: '📂', s: s2 },
    { value: '28',   label: 'Colonias',           icon: '📍', s: s3 },
    { value: '100%', label: 'Gratis',             icon: '✨', s: s4 },
  ]

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0F766E 0%, #0D5E58 50%, #1E293B 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: bg,
      }}
    >
      <div style={{
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 4,
        textTransform: 'uppercase',
        fontFamily: 'system-ui, sans-serif',
        marginBottom: 36,
      }}>
        ✦ En números ✦
      </div>

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        {stats.map(({ value, label, icon, s }) => (
          <div
            key={label}
            style={{
              textAlign: 'center',
              opacity: s,
              transform: `scale(${s}) translateY(${(1 - s) * 20}px)`,
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 20,
              padding: '24px 28px',
              minWidth: 130,
            }}
          >
            <div style={{ fontSize: 30, marginBottom: 8 }}>{icon}</div>
            <div style={{
              fontSize: 42,
              fontWeight: 900,
              color: '#F59E0B',
              fontFamily: 'system-ui, sans-serif',
              lineHeight: 1,
            }}>
              {value}
            </div>
            <div style={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: 12,
              marginTop: 8,
              fontFamily: 'system-ui, sans-serif',
              letterSpacing: 0.5,
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 40,
        opacity: msgOp,
        color: '#99F6E4',
        fontSize: 16,
        fontFamily: 'system-ui, sans-serif',
        fontWeight: 600,
        letterSpacing: 0.5,
      }}>
        Todo en un solo lugar →
      </div>
    </AbsoluteFill>
  )
}

// ─── Outro CTA ───────────────────────────────────────────────────
function OutroScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const appear = spring({ frame, fps, config: { damping: 20, stiffness: 50 } })
  const btnOp  = interpolate(frame, [45, 70], [0, 1], { extrapolateRight: 'clamp' })
  const btnY   = interpolate(frame, [45, 70], [10, 0], { extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1E293B 0%, #0F766E 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: appear,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: 12,
          letterSpacing: 4,
          textTransform: 'uppercase',
          fontFamily: 'system-ui, sans-serif',
          marginBottom: 20,
        }}>
          Descubre · Conecta · Apoya
        </div>

        <div style={{
          color: 'white',
          fontSize: 50,
          fontWeight: 900,
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: -1,
          marginBottom: 12,
        }}>
          <span style={{ color: '#99F6E4' }}>Somos</span>Lagos
        </div>

        <div style={{
          color: 'rgba(255,255,255,0.55)',
          fontSize: 17,
          fontFamily: 'system-ui, sans-serif',
          marginBottom: 40,
        }}>
          Encuentra negocios locales en Lagos de Moreno
        </div>

        <div
          style={{
            opacity: btnOp,
            transform: `translateY(${btnY}px)`,
            background: '#F59E0B',
            color: '#1E293B',
            borderRadius: 50,
            padding: '14px 36px',
            fontSize: 15,
            fontWeight: 800,
            fontFamily: 'system-ui, sans-serif',
            display: 'inline-block',
            letterSpacing: 0.3,
          }}
        >
          Registra tu Negocio GRATIS
        </div>

        <div style={{
          color: 'rgba(255,255,255,0.35)',
          fontSize: 13,
          fontFamily: 'system-ui, sans-serif',
          marginTop: 28,
          letterSpacing: 1,
        }}>
          www.somoslagos.com.mx
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ─── Composición principal ────────────────────────────────────────
export function HomeComposition() {
  const imagesStart = INTRO_F
  const statsStart  = INTRO_F + IMAGES.length * SCENE_F
  const outroStart  = statsStart + STATS_F

  return (
    <AbsoluteFill style={{ background: '#000', fontFamily: 'system-ui, sans-serif' }}>
      <Sequence from={0} durationInFrames={INTRO_F}>
        <IntroScene />
      </Sequence>

      {IMAGES.map((img, i) => (
        <Sequence
          key={img.src}
          from={imagesStart + i * SCENE_F}
          durationInFrames={SCENE_F + FADE_F}
        >
          <FastImageScene src={img.src} label={img.label} />
        </Sequence>
      ))}

      <Sequence from={statsStart} durationInFrames={STATS_F}>
        <StatsScene />
      </Sequence>

      <Sequence from={outroStart} durationInFrames={OUTRO_F}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  )
}
