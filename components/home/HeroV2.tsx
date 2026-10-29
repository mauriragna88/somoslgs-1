'use client'

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import SearchForm from '@/components/home/SearchForm'

interface Category { id: string; name: string; icon: string; slug: string }

export default function HeroV2({ categories, businessCount, catCount }: { categories: Category[]; businessCount: number; catCount: number }) {
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const imageY = useTransform(scrollYProgress, [0, .18], ['0%', reduced ? '0%' : '10%'])
  const contentY = useTransform(scrollYProgress, [0, .18], ['0%', reduced ? '0%' : '-8%'])
  const shortcuts = categories.slice(0, 3)

  return (
    <section className="sl-hero" aria-labelledby="sl-hero-title">
      <motion.div className="sl-hero-media" style={{ y: imageY }}>
        <Image src="/lagos-hero.jpg" alt="Templo de El Calvario en Lagos de Moreno, Jalisco" fill priority sizes="100vw" className="object-cover" />
      </motion.div>
      <div className="sl-hero-shade" aria-hidden="true" />
      <motion.div className="sl-hero-content" style={{ y: contentY }}>
        <p className="sl-eyebrow">Lagos de Moreno · Jalisco</p>
        <h1 id="sl-hero-title">Lagos se vive<br /><em>aquí afuera.</em></h1>
        <p className="sl-hero-lede">Encuentra dónde comer, qué conocer<br className="hidden sm:block" /> y a quién llamar. Elige tu próximo lugar.</p>
        <div className="sl-hero-search"><SearchForm /></div>
        <nav className="sl-hero-shortcuts" aria-label="Atajos de exploración">
          {shortcuts.map(category => <Link key={category.id} href={`/categorias/${category.slug}`}>{category.name}</Link>)}
          <Link href="/descubre">Ver negocios</Link>
        </nav>
        <p className="sl-hero-proof">{businessCount}+ negocios · {catCount} categorías · Pueblo Mágico</p>
      </motion.div>
      <Link href="/descubre" className="sl-hero-card" aria-label="Descubrir negocios locales">
        <span className="sl-hero-card-kicker">Un negocio por conocer</span><strong>Descubre Lagos</strong><small>Negocios · experiencias · lugares</small><span aria-hidden="true">→</span>
      </Link>
      <div className="sl-hero-foot"><span>El Calvario · Lagos de Moreno, Jalisco</span><Link href="#sl-discovery">De la ciudad a tu próximo lugar ↓</Link></div>
    </section>
  )
}
