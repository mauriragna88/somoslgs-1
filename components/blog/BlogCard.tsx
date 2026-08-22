'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'

/* ═══════════════════════════════════════════════════════════
   BlogCard — card de blog premium con fotos y efectos
   - Imagen grande con zoom + overlay degradado al hover
   - Badge de categoría glass flotante sobre la imagen
   - Fecha con icono
   - Título que cambia de color, flecha "Leer más"
   - Tilt 3D suave al hover
   ═══════════════════════════════════════════════════════════ */

const EASE = [0.16, 1, 0.3, 1] as const

interface BlogCardProps {
  post: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    featured_image_url?: string | null
    category?: string | null
    published_at?: string | null
    display_image_url?: string | null
  }
  categoryLabel?: string
  index?: number
}

export default function BlogCard({ post, categoryLabel, index = 0 }: BlogCardProps) {
  const imageUrl = post.display_image_url || post.featured_image_url
  const cat = categoryLabel || post.category || 'Blog'

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: EASE, delay: Math.min(index * 0.08, 0.32) }}
      className="h-full"
      whileHover={{ y: -8 }}
    >
      <Link
        href={`/blog/${post.slug}`}
        className="group block h-full rounded-3xl overflow-hidden bg-white relative"
        style={{
          border: '1px solid rgba(31,41,55,0.06)',
          boxShadow: '0 8px 30px -8px rgba(31,41,55,0.12)',
          transition: 'box-shadow 400ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Hover shadow */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ boxShadow: '0 24px 60px -12px rgba(31,41,55,0.25), 0 8px 24px rgba(255,107,53,0.08)' }}
        />

        {/* Imagen */}
        <div className="relative h-52 overflow-hidden">
          {imageUrl ? (
            <motion.div
              className="absolute inset-0"
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <Image
                src={imageUrl}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover"
              />
            </motion.div>
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--coral), var(--gold))' }}>
              <span className="text-5xl opacity-60">📸</span>
            </div>
          )}

          {/* Overlay degradado inferior */}
          <div
            className="absolute inset-x-0 bottom-0 h-28 pointer-events-none transition-opacity duration-400"
            style={{
              background: 'linear-gradient(to top, rgba(15,15,15,0.55) 0%, rgba(15,15,15,0.15) 60%, transparent 100%)',
              opacity: 0.7,
            }}
          />

          {/* Badge categoría glass */}
          <div className="absolute top-3 left-3 z-10">
            <span
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold text-white"
              style={{
                background: 'rgba(15,23,42,0.45)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
              }}
            >
              {cat}
            </span>
          </div>

          {/* Fecha glass */}
          {post.published_at && (
            <div className="absolute bottom-3 right-3 z-10">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold text-white"
                style={{
                  background: 'rgba(15,23,42,0.4)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(post.published_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
          )}

          {/* Número editorial (efecto magazine) */}
          <div className="absolute bottom-3 left-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="text-4xl font-black text-white/90" style={{ fontFamily: 'var(--display)', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Contenido */}
        <div className="p-5">
          <h2
            className="font-extrabold text-lg leading-snug mb-2 line-clamp-2 transition-colors duration-300"
            style={{ color: 'var(--ink)', fontFamily: 'var(--display)' }}
          >
            {post.title}
          </h2>

          {post.excerpt && (
            <p className="text-sm line-clamp-2 mb-4" style={{ color: 'var(--muted)' }}>
              {post.excerpt}
            </p>
          )}

          <span
            className="inline-flex items-center gap-1.5 text-sm font-bold transition-all duration-300"
            style={{ color: 'var(--coral)' }}
          >
            Leer más
            <svg
              className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
    </motion.div>
  )
}
