import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/server'
import type { BlogPost } from '@/types/database.types'

export const revalidate = 1800

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Articulos, guias y noticias sobre negocios y vida en Lagos de Moreno, Jalisco.',
  openGraph: {
    title: 'Blog | SomosLagos',
    description: 'Articulos, guias y noticias sobre Lagos de Moreno.',
    url: 'https://www.somoslagos.com.mx/blog',
  },
}

const CATEGORY_LABELS: Record<string, string> = {
  'general': 'General',
  'guias-locales': 'Guias Locales',
  'tips': 'Tips',
  'noticias': 'Noticias',
  'negocios-destacados': 'Negocios Destacados',
}

const LOCAL_BLOG_IMAGE = '/blog/lagos-pueblo-magico.jpg'

function resolveBlogImageUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) return imageUrl

  return imageUrl.includes('images.unsplash.com') ? LOCAL_BLOG_IMAGE : imageUrl
}

export default async function BlogPage() {
  const supabase = createServiceClient()

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const blogPosts = ((posts as BlogPost[]) || []).map((post) => ({
    ...post,
    featured_image_url: resolveBlogImageUrl(post.featured_image_url),
  }))

  const [featuredPost, ...restPosts] = blogPosts

  return (
    <main className="min-h-screen pueblo-shell">
      {/* ── HERO HEADER ─────────────────────────────────────────── */}
      <section className="container mx-auto px-4 pt-14 pb-10 text-center">
        <span className="pueblo-eyebrow">Blog · Lagos de Moreno</span>
        <h1 className="mt-4 text-4xl md:text-5xl font-[family-name:var(--font-display)] font-bold text-[var(--ink)] leading-tight">
          Historias del{' '}
          <span className="font-[family-name:var(--font-serif)] italic text-[var(--coral)]">
            Pueblo Mágico
          </span>
        </h1>
        <p className="mt-3 text-[var(--ink-soft)] max-w-lg mx-auto text-base">
          Guías, tips y noticias sobre negocios y vida en Lagos de Moreno
        </p>
        <div className="pueblo-divider mt-8 max-w-xs mx-auto" />
      </section>

      {/* ── FEATURED POST ───────────────────────────────────────── */}
      {featuredPost && (
        <section className="container mx-auto px-4 mb-12">
          <Link
            href={`/blog/${featuredPost.slug}`}
            className="pueblo-blog-hero block group max-w-5xl mx-auto"
          >
            {featuredPost.featured_image_url ? (
              <Image
                src={featuredPost.featured_image_url}
                alt={featuredPost.title}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--coral)] via-[var(--gold)] to-[var(--ink)]" />
            )}
            {/* gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
            {/* content */}
            <div className="absolute bottom-0 left-0 right-0 p-8">
              <span className="pueblo-category-pill mb-3 inline-block">
                {CATEGORY_LABELS[featuredPost.category] || featuredPost.category}
              </span>
              <h2 className="text-2xl md:text-4xl font-[family-name:var(--font-display)] font-bold text-white leading-snug line-clamp-2 drop-shadow-lg">
                {featuredPost.title}
              </h2>
              {featuredPost.excerpt && (
                <p className="mt-2 text-white/75 text-sm md:text-base line-clamp-2 max-w-2xl">
                  {featuredPost.excerpt}
                </p>
              )}
              {featuredPost.published_at && (
                <p className="mt-3 text-white/50 text-xs">
                  {new Date(featuredPost.published_at).toLocaleDateString('es-MX', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </Link>
        </section>
      )}

      {/* ── POSTS GRID ──────────────────────────────────────────── */}
      <section className="container mx-auto px-4 pb-16">
        {blogPosts.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-[var(--hairline-soft)] flex items-center justify-center mx-auto mb-5">
              <svg className="w-9 h-9 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p className="text-[var(--ink)] font-semibold text-lg mb-1 font-[family-name:var(--font-display)]">Próximamente</p>
            <p className="text-[var(--muted)] text-sm">Estamos preparando artículos increíbles para ti</p>
          </div>
        ) : (
          <>
            {restPosts.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-8 max-w-5xl mx-auto">
                  <div className="h-px flex-1 bg-[var(--hairline)]" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">Más artículos</span>
                  <div className="h-px flex-1 bg-[var(--hairline)]" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {restPosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="pueblo-card group flex flex-col overflow-hidden hover:-translate-y-1 transition-all duration-300"
                      style={{ boxShadow: 'var(--shadow-card)' }}
                    >
                      {/* Image */}
                      {post.featured_image_url ? (
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src={post.featured_image_url}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="aspect-[4/3] bg-gradient-to-br from-[var(--coral)]/15 to-[var(--gold)]/15 flex items-center justify-center">
                          <svg className="w-12 h-12 text-[var(--coral)]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                      )}

                      <div className="p-5 flex flex-col flex-1">
                        {/* Category + Date */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="pueblo-category-pill">
                            {CATEGORY_LABELS[post.category] || post.category}
                          </span>
                          {post.published_at && (
                            <span className="text-xs text-[var(--muted)]">
                              {new Date(post.published_at).toLocaleDateString('es-MX', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h2 className="font-[family-name:var(--font-display)] font-bold text-[var(--ink)] group-hover:text-[var(--coral)] transition-colors mb-2 line-clamp-2 leading-snug">
                          {post.title}
                        </h2>

                        {/* Excerpt */}
                        {post.excerpt && (
                          <p className="text-sm text-[var(--muted)] line-clamp-2 mb-4 leading-relaxed flex-1">
                            {post.excerpt}
                          </p>
                        )}

                        <span className="text-sm text-[var(--coral)] font-semibold mt-auto">
                          Leer más →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </section>
    </main>
  )
}
