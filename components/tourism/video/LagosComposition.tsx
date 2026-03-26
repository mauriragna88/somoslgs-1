'use client'

import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Img,
  Audio,
} from 'remotion'

// ─── Escenas y tiempos ───────────────────────────────────────────
const INTRO_FRAMES  = 90   // 3 s
const SCENE_FRAMES  = 150  // 5 s por imagen
const FADE_FRAMES   = 30   // 1 s de crossfade
const OUTRO_FRAMES  = 120  // 4 s

const IMAGES = [
  { src: '/tourism/panoramica-lagos.jpg',      label: 'Lagos de Moreno, Jalisco'       },
  { src: '/tourism/parroquia-asuncion.jpg',    label: 'Parroquia de la Asunción'       },
  { src: '/tourism/templo-calvario.jpg',       label: 'Templo del Calvario'            },
  { src: '/tourism/jardin-constituyentes.jpg', label: 'Jardín de los Constituyentes'   },
  { src: '/tourism/palacio-municipal.jpg',     label: 'Palacio Municipal'              },
  { src: '/tourism/gastronomia.jpg',           label: 'Gastronomía Local'              },
  { src: '/tourism/puente-panoramica.jpg',     label: 'Puente Panorámico'              },
]

// ─── Escena: Intro ───────────────────────────────────────────────
function IntroScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const logoScale = spring({ frame: frame - 5, fps, config: { damping: 18, stiffness: 80 } })
  const titleOpacity = interpolate(frame, [20, 50], [0, 1], { extrapolateRight: 'clamp' })
  const titleY = interpolate(frame, [20, 50], [24, 0], { extrapolateRight: 'clamp' })
  const subtitleOpacity = interpolate(frame, [50, 75], [0, 1], { extrapolateRight: 'clamp' })
  const outOpacity = interpolate(frame, [75, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0F766E 0%, #0D5E58 50%, #1E293B 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: outOpacity,
      }}
    >
      {/* Badge Pueblo Mágico */}
      <div
        style={{
          color: '#99F6E4',
          fontSize: 13,
          fontWeight: 800,
          letterSpacing: 5,
          textTransform: 'uppercase',
          marginBottom: 20,
          opacity: subtitleOpacity,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        ✦ Pueblo Mágico de Jalisco ✦
      </div>

      {/* Título principal */}
      <div
        style={{
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            color: 'white',
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 1.05,
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: -1,
          }}
        >
          Lagos de
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            lineHeight: 1.05,
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: -1,
            background: 'linear-gradient(90deg, #99F6E4, #F59E0B)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Moreno
        </div>
      </div>

      {/* Subtítulo */}
      <div
        style={{
          color: 'rgba(255,255,255,0.65)',
          fontSize: 18,
          marginTop: 24,
          opacity: subtitleOpacity,
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: 1,
        }}
      >
        Jalisco, México
      </div>
    </AbsoluteFill>
  )
}

// ─── Escena: Imagen con Ken Burns ────────────────────────────────
function ImageScene({ src, label }: { src: string; label: string }) {
  const frame = useCurrentFrame()

  // Fade in / out
  const opacity = interpolate(
    frame,
    [0, FADE_FRAMES, SCENE_FRAMES - FADE_FRAMES, SCENE_FRAMES],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  )

  // Ken Burns: zoom lento
  const scale = interpolate(frame, [0, SCENE_FRAMES], [1, 1.1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Pan sutil
  const translateX = interpolate(frame, [0, SCENE_FRAMES], [0, -1.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const translateY = interpolate(frame, [0, SCENE_FRAMES], [0, -0.5], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  // Label: slide-up fade-in
  const labelOpacity = interpolate(frame, [30, 65], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const labelY = interpolate(frame, [30, 65], [12, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  return (
    <AbsoluteFill style={{ opacity }}>
      {/* Imagen con Ken Burns */}
      <AbsoluteFill style={{ overflow: 'hidden' }}>
        <Img
          src={src}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
            transformOrigin: 'center center',
          }}
        />
        {/* Gradiente: oscuro abajo para el texto */}
        <AbsoluteFill
          style={{
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, transparent 35%, transparent 55%, rgba(0,0,0,0.75) 100%)',
          }}
        />
      </AbsoluteFill>

      {/* Label de ubicación */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          padding: '44px 48px',
        }}
      >
        <div
          style={{
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 3,
              height: 22,
              background: '#F59E0B',
              borderRadius: 2,
            }}
          />
          <span
            style={{
              color: 'white',
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: 0.5,
              fontFamily: 'system-ui, sans-serif',
              textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            }}
          >
            {label}
          </span>
        </div>
      </AbsoluteFill>

      {/* Watermark SomosLagos */}
      <AbsoluteFill
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-end',
          padding: '44px 48px',
          opacity: labelOpacity * 0.7,
        }}
      >
        <span
          style={{
            color: 'rgba(255,255,255,0.8)',
            fontSize: 13,
            fontWeight: 700,
            fontFamily: 'system-ui, sans-serif',
            letterSpacing: 1,
          }}
        >
          SomosLagos
        </span>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

// ─── Escena: Outro / CTA ─────────────────────────────────────────
function OutroScene() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const fadeIn = spring({ frame, fps, config: { damping: 20, stiffness: 60 } })
  const stat1 = spring({ frame: frame - 15, fps, config: { damping: 18 } })
  const stat2 = spring({ frame: frame - 30, fps, config: { damping: 18 } })
  const stat3 = spring({ frame: frame - 45, fps, config: { damping: 18 } })
  const ctaOpacity = interpolate(frame, [60, 90], [0, 1], { extrapolateRight: 'clamp' })

  const stats = [
    { value: '176+', label: 'Negocios', delay: stat1 },
    { value: '52+',  label: 'Categorías', delay: stat2 },
    { value: '100%', label: 'Gratis',    delay: stat3 },
  ]

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0F766E 0%, #0D5E58 40%, #1E293B 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: fadeIn,
      }}
    >
      {/* Logo / Marca */}
      <div
        style={{
          color: 'white',
          fontSize: 46,
          fontWeight: 900,
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: -1,
          marginBottom: 8,
        }}
      >
        <span style={{ color: '#99F6E4' }}>Somos</span>Lagos
      </div>
      <div
        style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: 16,
          fontFamily: 'system-ui, sans-serif',
          marginBottom: 48,
          letterSpacing: 0.5,
        }}
      >
        La plataforma digital de Lagos de Moreno
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 48, marginBottom: 48 }}>
        {stats.map(({ value, label, delay }) => (
          <div key={label} style={{ textAlign: 'center', opacity: delay, transform: `scale(${delay})` }}>
            <div
              style={{
                fontSize: 44,
                fontWeight: 900,
                color: '#F59E0B',
                fontFamily: 'system-ui, sans-serif',
                lineHeight: 1,
              }}
            >
              {value}
            </div>
            <div
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: 13,
                marginTop: 6,
                fontFamily: 'system-ui, sans-serif',
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}
            >
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div
        style={{
          opacity: ctaOpacity,
          background: 'rgba(255,255,255,0.1)',
          border: '1.5px solid rgba(255,255,255,0.2)',
          borderRadius: 50,
          padding: '12px 32px',
          color: 'white',
          fontSize: 16,
          fontWeight: 700,
          fontFamily: 'system-ui, sans-serif',
          letterSpacing: 0.5,
        }}
      >
        www.somoslagos.com.mx
      </div>
    </AbsoluteFill>
  )
}

// ─── Composición principal ────────────────────────────────────────
export function LagosComposition() {
  return (
    <AbsoluteFill style={{ background: '#000', fontFamily: 'system-ui, sans-serif' }}>
      {/* Música de fondo — pon tu archivo en public/sounds/background.mp3 */}
      <Audio src="/sounds/background.mp3" volume={0.35} />
      {/* Intro */}
      <Sequence from={0} durationInFrames={INTRO_FRAMES}>
        <IntroScene />
      </Sequence>

      {/* Imágenes */}
      {IMAGES.map((img, i) => (
        <Sequence
          key={img.src}
          from={INTRO_FRAMES + i * SCENE_FRAMES}
          durationInFrames={SCENE_FRAMES + FADE_FRAMES}
        >
          <ImageScene src={img.src} label={img.label} />
        </Sequence>
      ))}

      {/* Outro */}
      <Sequence
        from={INTRO_FRAMES + IMAGES.length * SCENE_FRAMES}
        durationInFrames={OUTRO_FRAMES}
      >
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  )
}

// Duración total exportada para el Player
export const LAGOS_VIDEO_DURATION = INTRO_FRAMES + IMAGES.length * SCENE_FRAMES + OUTRO_FRAMES
