'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'

const chapters = [
  { label: 'La ciudad', title: 'Primero, mira hacia arriba.', image: '/tourism/parroquia-asuncion.jpg', alt: 'Parroquia de la Asunción en Lagos de Moreno' },
  { label: 'El descubrimiento', title: 'Después, sigue el antojo.', image: '/tourism/callelagos1.jpg', alt: 'Calle del centro histórico de Lagos de Moreno' },
  { label: 'La ficha', title: 'Ya tienes tu próximo lugar.', image: '/tourism/jardin-constituyentes.jpg', alt: 'Jardín Constituyentes de Lagos de Moreno' },
]

export default function CityStoryV2() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })

  return (
    <section ref={ref} className="sl-city-story" aria-labelledby="sl-city-story-title">
      <div className="sl-city-story-intro"><p className="sl-eyebrow">Un lugar lleva a otro</p><h2 id="sl-city-story-title">Una ciudad.<br />Muchas maneras<br /><em>de vivirla.</em></h2><p>De la cantera de la Parroquia a los comercios de Lagos.</p></div>
      <div className="sl-city-story-sequence" aria-label="Recorrido visual por Lagos">
        {chapters.map((chapter, index) => <StoryChapter key={chapter.label} chapter={chapter} index={index} progress={scrollYProgress} reduced={!!reduced} />)}
      </div>
      <div className="sl-city-story-footer"><p>Recorrido editorial: no representa distancias ni una ruta geográfica.</p><Link href="/descubre">Descubrir Lagos →</Link></div>
    </section>
  )
}

function StoryChapter({ chapter, index, progress, reduced }: { chapter: typeof chapters[number]; index: number; progress: ReturnType<typeof useScroll>['scrollYProgress']; reduced: boolean }) {
  const start = index * .22 + .18
  const opacity = useTransform(progress, [start, start + .12, start + .25], reduced ? [1, 1, 1] : [0.25, 1, index === 2 ? 1 : .35])
  const y = useTransform(progress, [start, start + .12], reduced ? [0, 0] : [28, 0])
  const scale = useTransform(progress, [start, start + .12], reduced ? [1, 1] : [.97, 1])
  return <motion.article className="sl-story-chapter" style={{ opacity, y, scale }}><div className="sl-story-image"><Image src={chapter.image} alt={chapter.alt} fill sizes="(max-width: 767px) 100vw, 48vw" /></div><div className="sl-story-copy"><span>{String(index + 1).padStart(2, '0')} · {chapter.label}</span><h3>{chapter.title}</h3>{index === 2 && <Link href="/buscar">Ver negocios locales →</Link>}</div></motion.article>
}
