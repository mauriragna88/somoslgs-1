'use client'
import SearchForm from '@/components/home/SearchForm'
import Link from 'next/link'
import Image from 'next/image'

interface Category { id: string; name: string; icon: string; slug: string }
interface HeroVideoScrollProps {
  categories: Category[]
  businessCount: number
  catCount: number
}

export default function HeroVideoScroll({ categories, businessCount, catCount }: HeroVideoScrollProps) {
  return (
    <section className="relative h-screen min-h-[600px] overflow-hidden">
      {/* Hero background image */}
      <Image
        src="/tourism/panoramica-lagos.jpg"
        alt="Lagos de Moreno, Jalisco — Pueblo Mágico"
        fill
        sizes="100vw"
        className="object-cover"
        priority
        style={{ filter: 'brightness(0.6)' }}
      />

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--ink)] via-[var(--ink)]/20 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
        {/* Eyebrow */}
        <span
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-widest mb-6 text-white/80"
          style={{ background: 'rgba(255,107,53,0.25)', border: '1px solid rgba(255,107,53,0.4)' }}
        >
          📍 Lagos de Moreno, Jalisco
        </span>

        {/* Headline */}
        <h1
          className="text-5xl md:text-7xl font-bold text-white mb-4 leading-none tracking-tight max-w-4xl"
          style={{ fontFamily: 'var(--display)' }}
        >
          Descubre el alma de{' '}
          <span style={{ color: 'var(--coral)' }}>Lagos</span>
        </h1>

        <p className="text-white/70 text-lg md:text-xl mb-8 max-w-xl" style={{ fontFamily: 'var(--body)' }}>
          {businessCount}+ negocios locales · {catCount} categorías · Pueblo Mágico
        </p>

        {/* Search */}
        <div className="w-full max-w-2xl mb-8">
          <SearchForm />
        </div>

        {/* Category chips */}
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
          {categories.slice(0, 8).map(cat => (
            <Link
              key={cat.id}
              href={`/categorias/${cat.slug}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium text-white/90 transition-all hover:text-white hover:scale-105"
              style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <span className="text-[11px] text-white/50 uppercase tracking-widest">Desliza</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/40 to-transparent animate-pulse" />
      </div>
    </section>
  )
}
