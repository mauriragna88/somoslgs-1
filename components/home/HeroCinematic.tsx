'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import SearchForm from '@/components/home/SearchForm'
import OpenClosedBadge from '@/components/shared/OpenClosedBadge'
import type { BusinessHours } from '@/lib/constants'
import styles from './HeroCinematic.module.css'

const HeroParticles = dynamic(() => import('@/components/home/hero/HeroParticles'), { ssr: false })

export interface HeroCategory {
  id: string
  name: string
  slug: string
}

export interface HeroSpotlight {
  id: string
  name: string
  slug: string
  category: string | null
  image: string | null
  hours: BusinessHours | null
}

interface HeroCinematicProps {
  categories: HeroCategory[]
  spotlight: HeroSpotlight[]
  businessCount: number
  catCount: number
}

const WORDS_TOP = ['Todo', 'Lagos']
const EASE = [0.22, 1, 0.36, 1] as const

function canUseWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function HeroCinematic({ categories, spotlight, businessCount, catCount }: HeroCinematicProps) {
  const reduced = useReducedMotion()
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const [inView, setInView] = useState(true)
  const [videoReady, setVideoReady] = useState(false)
  const [videoFailed, setVideoFailed] = useState(false)
  const [scene, setScene] = useState<'off' | 'loading' | 'ready'>('off')
  const [finePointer, setFinePointer] = useState(false)

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] })
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', reduced ? '0%' : '-14%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, reduced ? 1 : 0])
  const mediaScale = useTransform(scrollYProgress, [0, 1], [1.06, reduced ? 1.06 : 1.22])

  // Pausa video + WebGL cuando el hero sale de pantalla
  useEffect(() => {
    const node = sectionRef.current
    if (!node) return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 })
    io.observe(node)
    return () => io.disconnect()
  }, [])

  // Video: solo si el usuario no pidio menos movimiento ni ahorro de datos
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
    const slow = conn?.saveData || conn?.effectiveType === 'slow-2g' || conn?.effectiveType === '2g' || conn?.effectiveType === '3g'
    if (reduced || slow) {
      setVideoFailed(true)
      return
    }
    if (inView) {
      video.play().catch(() => setVideoFailed(true))
    } else {
      video.pause()
    }
  }, [inView, reduced])

  // Escena WebGL: solo escritorio con puntero fino, sin reduced-motion y con GPU
  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine) and (min-width: 900px)').matches
    setFinePointer(fine)
    if (reduced || !fine || !canUseWebGL() || (navigator.hardwareConcurrency ?? 4) < 4) return
    const start = () => setScene('loading')
    const t = globalThis.setTimeout(start, 900)
    return () => globalThis.clearTimeout(t)
  }, [reduced])

  // Parallax por capas con el cursor (suavizado con lerp, solo mientras es visible)
  useEffect(() => {
    const node = sectionRef.current
    if (!node || reduced || !finePointer) return
    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let raf = 0

    const onMove = (e: PointerEvent) => {
      const r = node.getBoundingClientRect()
      target.x = ((e.clientX - r.left) / r.width) * 2 - 1
      target.y = ((e.clientY - r.top) / r.height) * 2 - 1
      node.style.setProperty('--mx', `${e.clientX - r.left}px`)
      node.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    const onLeave = () => {
      target.x = 0
      target.y = 0
    }
    const tick = () => {
      current.x += (target.x - current.x) * 0.07
      current.y += (target.y - current.y) * 0.07
      pointer.current = { x: current.x, y: current.y }
      node.style.setProperty('--px', current.x.toFixed(4))
      node.style.setProperty('--py', current.y.toFixed(4))
      raf = requestAnimationFrame(tick)
    }
    if (inView) raf = requestAnimationFrame(tick)
    node.addEventListener('pointermove', onMove)
    node.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      node.removeEventListener('pointermove', onMove)
      node.removeEventListener('pointerleave', onLeave)
    }
  }, [reduced, finePointer, inView])

  const onCardMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (reduced) return
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty('--ry', `${(((e.clientX - r.left) / r.width) * 2 - 1) * 7}deg`)
    el.style.setProperty('--rx', `${(((e.clientY - r.top) / r.height) * 2 - 1) * -7}deg`)
  }
  const onCardLeave = (e: React.PointerEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.setProperty('--ry', '0deg')
    e.currentTarget.style.setProperty('--rx', '0deg')
  }

  const reveal = (delay: number) => ({
    initial: reduced ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE },
  })

  return (
    <section ref={sectionRef} className={styles.hero} aria-labelledby="hc-title">
      {/* Capa 0: fondo (foto con grade nocturno como respaldo + video) */}
      <motion.div className={styles.media} style={{ scale: mediaScale }}>
        <div className={styles.mediaShift}>
          <Image
            src="/tourism/calvario-panoramica.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className={styles.fallbackImg}
          />
          {!videoFailed && (
            <video
              ref={videoRef}
              className={`${styles.video} ${videoReady ? styles.videoOn : ''}`}
              muted
              loop
              playsInline
              preload="auto"
              autoPlay
              aria-hidden="true"
              tabIndex={-1}
              onCanPlay={() => setVideoReady(true)}
              onError={() => setVideoFailed(true)}
            >
              <source src="/assets/lagos-city-build.mp4" type="video/mp4" />
            </video>
          )}
        </div>
      </motion.div>
      <div className={styles.grade} aria-hidden="true" />
      <div className={styles.spot} aria-hidden="true" />

      {/* Capa 1: particulas WebGL */}
      {scene !== 'off' && (
        <div className={`${styles.scene} ${scene === 'ready' ? styles.sceneOn : ''}`} aria-hidden="true">
          <HeroParticles pointer={pointer} active={inView} onReady={() => setScene('ready')} />
        </div>
      )}

      {/* Capa 2: contenido */}
      <motion.div className={styles.content} style={{ y: contentY, opacity: contentOpacity }}>
        <motion.p className={styles.eyebrow} {...reveal(0.05)}>
          <span className={styles.pulse} aria-hidden="true" />
          Lagos de Moreno · Jalisco · Pueblo Mágico
        </motion.p>

        <h1 id="hc-title" className={styles.title}>
          <span className={styles.line}>
            {WORDS_TOP.map((word, i) => (
              <span key={word} className={styles.mask}>
                <motion.span
                  className={styles.word}
                  initial={reduced ? false : { y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 0.7, delay: 0.15 + i * 0.09, ease: EASE }}
                >
                  {word}
                </motion.span>
              </span>
            ))}
          </span>
          <span className={styles.line}>
            <span className={styles.mask}>
              <motion.em
                className={`${styles.word} ${styles.accent}`}
                initial={reduced ? false : { y: '110%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.8, delay: 0.38, ease: EASE }}
              >
                vive
              </motion.em>
            </span>
            <span className={styles.mask}>
              <motion.span
                className={styles.word}
                initial={reduced ? false : { y: '110%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 0.7, delay: 0.47, ease: EASE }}
              >
                aquí.
              </motion.span>
            </span>
          </span>
        </h1>

        <motion.p className={styles.lede} {...reveal(0.65)}>
          {businessCount}+ negocios locales para comer, conocer y contratar.
          Busca y llega directo, sin intermediarios.
        </motion.p>

        <motion.div className={styles.search} {...reveal(0.78)}>
          <SearchForm />
        </motion.div>

        <motion.nav className={styles.chips} aria-label="Atajos de exploración" {...reveal(0.9)}>
          {categories.slice(0, 4).map(category => (
            <Link key={category.id} href={`/categorias/${category.slug}`} className={styles.chip}>
              {category.name}
            </Link>
          ))}
          <Link href="/registrar-negocio" className={`${styles.chip} ${styles.chipStrong}`}>
            Registrar mi negocio
          </Link>
        </motion.nav>
      </motion.div>

      {/* Capa 3: tarjetas vivas con datos reales */}
      {spotlight.length > 0 && (
        <ul className={styles.cards} aria-label="Negocios para conocer">
          {spotlight.slice(0, 3).map((biz, i) => (
            <motion.li
              key={biz.id}
              className={styles.cardItem}
              style={{ ['--i' as string]: i }}
              initial={reduced ? false : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 1 + i * 0.12, ease: EASE }}
            >
              <Link
                href={`/negocios/${biz.slug}`}
                className={styles.card}
                onPointerMove={onCardMove}
                onPointerLeave={onCardLeave}
              >
                <span className={styles.cardThumb}>
                  {biz.image ? (
                    <Image src={biz.image} alt="" fill sizes="64px" className="object-cover" />
                  ) : (
                    <span className={styles.cardInitial} aria-hidden="true">{biz.name.charAt(0)}</span>
                  )}
                </span>
                <span className={styles.cardBody}>
                  <strong>{biz.name}</strong>
                  <small>{biz.category ?? 'Negocio local'}</small>
                  <OpenClosedBadge businessHours={biz.hours} />
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}

      <div className={styles.foot}>
        <span>{catCount} categorías · {businessCount}+ negocios</span>
        <Link href="#sl-discovery" className={styles.cue}>
          Descubre Lagos <span aria-hidden="true">↓</span>
        </Link>
      </div>
    </section>
  )
}
