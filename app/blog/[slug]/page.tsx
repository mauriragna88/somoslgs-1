import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/server'
import type { BlogPost } from '@/types/database.types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
// rehype-sanitize is applied to strip dangerous HTML/scripts from user-provided blog markdown
// defaultSchema allows safe structural elements while blocking scripts, event handlers, etc.
import ReadingProgress from '@/components/blog/ReadingProgress'
import { resolveBlogImage } from '@/lib/blog-image-fallbacks'

export const revalidate = 1800

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  'general':             { label: 'General',             color: 'text-gray-700',    bg: 'bg-gray-100',    icon: '📝' },
  'guias-locales':       { label: 'Guía Local',          color: 'text-primary',     bg: 'bg-primary/10',  icon: '🗺️' },
  'tips':                { label: 'Tips',                 color: 'text-accent-dark', bg: 'bg-accent/10',   icon: '💡' },
  'noticias':            { label: 'Noticias',             color: 'text-blue-700',    bg: 'bg-blue-50',     icon: '📰' },
  'negocios-destacados': { label: 'Negocios Destacados', color: 'text-purple-700',  bg: 'bg-purple-50',   icon: '⭐' },
}

// Extract h2/h3 headings for TOC
function extractHeadings(md: string): { id: string; text: string; level: number }[] {
  const lines = md.split('\n')
  return lines
    .filter(l => l.startsWith('## ') || l.startsWith('### '))
    .map(l => {
      const level = l.startsWith('### ') ? 3 : 2
      const text = l.replace(/^#{2,3}\s+/, '').replace(/[^\w\s\u00C0-\u024F]/g, '').trim()
      const id = text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
      return { id, text: l.replace(/^#{2,3}\s+/, '').trim(), level }
    })
    .slice(0, 20)
}

// Reading time estimate
function readingTime(content: string): number {
  return Math.max(1, Math.ceil(content.split(/\s+/).length / 200))
}

interface PageProps { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = createServiceClient()
  const [{ data: post }, { data: postOrder }] = await Promise.all([
    supabase
      .from('blog_posts').select('title, excerpt, featured_image_url')
      .eq('slug', slug).eq('status', 'published').single(),
    supabase
      .from('blog_posts').select('slug')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
  ])
  if (!post) return { title: 'Post no encontrado' }
  const postIndex = (postOrder || []).findIndex((entry: { slug: string }) => entry.slug === slug)
  const postImage = resolveBlogImage(post.featured_image_url, postIndex)
  return {
    title: post.title,
    description: post.excerpt || `Lee ${post.title} en el blog de SomosLagos`,
    alternates: {
      canonical: `https://www.somoslagos.com.mx/blog/${slug}`,
    },
    openGraph: {
      title: `${post.title} | Blog SomosLagos`,
      description: post.excerpt || '',
      url: `https://www.somoslagos.com.mx/blog/${slug}`,
      type: 'article',
      images: postImage ? [{ url: postImage, width: 1200, height: 630 }] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = createServiceClient()
  const [{ data: post }, { data: publishedPosts }] = await Promise.all([
    supabase
      .from('blog_posts').select('*')
      .eq('slug', slug).eq('status', 'published').single(),
    supabase
      .from('blog_posts').select('slug, featured_image_url')
      .eq('status', 'published')
      .order('published_at', { ascending: false }),
  ])
  if (!post) notFound()

  const blogPost = post as BlogPost
  const postIndexMap = new Map((publishedPosts || []).map((entry: { slug: string }, index: number) => [entry.slug, index]))
  const currentPostImage = resolveBlogImage(blogPost.featured_image_url, postIndexMap.get(blogPost.slug) ?? -1)

  supabase.from('blog_posts')
    .update({ view_count: (blogPost.view_count || 0) + 1 })
    .eq('id', blogPost.id).then()

  const { data: relatedPosts } = await supabase
    .from('blog_posts').select('id, title, slug, excerpt, featured_image_url, category, published_at')
    .eq('status', 'published').eq('category', blogPost.category)
    .neq('id', blogPost.id).order('published_at', { ascending: false }).limit(3)

  const related = (relatedPosts as BlogPost[]) || []
  const cat = CATEGORY_META[blogPost.category] || CATEGORY_META['general']
  const toc = extractHeadings(blogPost.content || '')
  const mins = readingTime(blogPost.content || '')

  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    `${blogPost.title} - https://www.somoslagos.com.mx/blog/${blogPost.slug}`
  )}`
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(blogPost.title)}&url=${encodeURIComponent(`https://www.somoslagos.com.mx/blog/${blogPost.slug}`)}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://www.somoslagos.com.mx/blog/${blogPost.slug}`)}`

  const blogPostingJsonLd = {
    '@context': 'https://schema.org', '@type': 'BlogPosting',
    headline: blogPost.title, description: blogPost.excerpt || undefined,
    image: currentPostImage || undefined,
    datePublished: blogPost.published_at, dateModified: blogPost.updated_at,
    url: `https://www.somoslagos.com.mx/blog/${blogPost.slug}`,
    publisher: { '@type': 'Organization', name: 'SomosLagos', url: 'https://www.somoslagos.com.mx' },
  }

  return (
    <main className="min-h-screen bg-white">
      <ReadingProgress />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }} />

      {/* ── HERO ────────────────────────────────────────────────── */}
      <div className="relative min-h-[70vh] flex items-end overflow-hidden">
        {/* Background */}
        {currentPostImage ? (
          <>
            <Image src={currentPostImage} alt={blogPost.title} fill sizes="100vw" className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
          </>
        ) : (
          <>
            {/* Animated gradient hero */}
            <div className="absolute inset-0 bg-gradient-to-br from-secondary via-primary/90 to-secondary/80" />
            {/* Decorative grid */}
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 48px,rgba(255,255,255,.15) 48px,rgba(255,255,255,.15) 49px),repeating-linear-gradient(90deg,transparent,transparent 48px,rgba(255,255,255,.15) 48px,rgba(255,255,255,.15) 49px)',
            }} />
            {/* Big emoji decoration */}
            <div className="absolute inset-0 flex items-center justify-center opacity-8 pointer-events-none select-none">
              <span className="text-[220px] leading-none blur-sm">
                {blogPost.category === 'guias-locales' ? '🗺️' : blogPost.category === 'noticias' ? '📰' : '✍️'}
              </span>
            </div>
            {/* Floating emoji particles */}
            {[
              { e: '🌮', x: '8%',  y: '20%', size: '3xl', delay: '0s'   },
              { e: '🍔', x: '85%', y: '15%', size: '2xl', delay: '0.4s' },
              { e: '🍺', x: '15%', y: '70%', size: '2xl', delay: '0.8s' },
              { e: '☕', x: '78%', y: '65%', size: '3xl', delay: '0.2s' },
              { e: '🥩', x: '45%', y: '12%', size: 'xl',  delay: '1s'   },
              { e: '🍣', x: '92%', y: '45%', size: 'xl',  delay: '0.6s' },
            ].map((p, i) => (
              <div key={i} className={`absolute text-${p.size} opacity-20 animate-float pointer-events-none select-none`}
                style={{ left: p.x, top: p.y, animationDelay: p.delay, filter: 'blur(1px)' }}>
                {p.e}
              </div>
            ))}
          </>
        )}

        {/* Hero content */}
        <div className="relative container mx-auto px-4 max-w-4xl pb-14 pt-32">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/50 mb-6">
            <Link href="/" className="hover:text-white/80 transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-white/80 transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-white/70 truncate max-w-[200px]">{blogPost.title}</span>
          </nav>

          {/* Category + reading time */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent text-secondary text-xs font-bold rounded-full shadow-lg">
              <span>{cat.icon}</span> {cat.label}
            </span>
            <span className="text-white/60 text-sm flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {mins} min de lectura
            </span>
            {blogPost.view_count > 0 && (
              <span className="text-white/60 text-sm flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                {blogPost.view_count.toLocaleString()} vistas
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight mb-5 drop-shadow-lg">
            {blogPost.title}
          </h1>

          {/* Excerpt */}
          {blogPost.excerpt && (
            <p className="text-lg text-white/80 max-w-2xl leading-relaxed mb-6">
              {blogPost.excerpt}
            </p>
          )}

          {/* Date + share quick */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">SL</div>
              <div>
                <p className="text-white font-semibold text-sm">SomosLagos</p>
                {blogPost.published_at && (
                  <time className="text-white/60 text-xs" dateTime={blogPost.published_at}>
                    {new Date(blogPost.published_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </time>
                )}
              </div>
            </div>
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/90 hover:bg-green-500 backdrop-blur-sm text-white rounded-full text-sm font-semibold transition-all hover:scale-105 shadow-lg">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Compartir
            </a>
          </div>
        </div>
      </div>

      {/* ── BODY: TOC + CONTENT ───────────────────────────────────── */}
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex gap-10 items-start">

          {/* ── TOC sidebar (desktop) ── */}
          {toc.length > 2 && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-8 bg-gray-50 rounded-2xl border border-gray-100 p-5 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Contenido</p>
                <nav className="space-y-1">
                  {toc.map((item) => (
                    <a
                      key={item.id}
                      href={`#${item.id}`}
                      className={`block text-sm leading-snug py-1.5 transition-colors hover:text-primary ${
                        item.level === 2
                          ? 'text-gray-700 font-semibold border-l-2 border-transparent hover:border-primary pl-3'
                          : 'text-gray-500 pl-6 border-l-2 border-transparent hover:border-primary/40'
                      }`}
                    >
                      {item.text}
                    </a>
                  ))}
                </nav>
                {/* CTA within TOC */}
                <div className="mt-6 p-3 bg-primary/8 rounded-xl border border-primary/15">
                  <p className="text-xs text-primary font-semibold mb-2">¿Tienes un negocio?</p>
                  <Link href="/registrar-negocio" className="text-xs text-primary hover:underline font-medium">
                    Regístralo gratis →
                  </Link>
                </div>
              </div>
            </aside>
          )}

          {/* ── Article ── */}
          <article className="flex-1 min-w-0">
            {/* Decorative top accent */}
            <div className="h-1 w-20 bg-gradient-to-r from-primary to-accent rounded-full mb-8" />

            {/* Content with custom markdown styling */}
            <div className="prose prose-lg max-w-none
              prose-headings:font-extrabold
              prose-h1:text-4xl prose-h1:text-secondary
              prose-h2:text-2xl prose-h2:text-secondary prose-h2:mt-12 prose-h2:mb-4
              prose-h3:text-lg prose-h3:text-secondary prose-h3:mt-8 prose-h3:mb-2
              prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-4
              prose-strong:text-secondary prose-strong:font-bold
              prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-a:font-medium
              prose-ul:my-4 prose-ul:space-y-2 prose-li:text-gray-600 prose-li:marker:text-primary
              prose-hr:my-10 prose-hr:border-gray-100
              prose-blockquote:border-l-4 prose-blockquote:border-accent prose-blockquote:bg-accent/5 prose-blockquote:rounded-r-xl prose-blockquote:py-3 prose-blockquote:not-italic
              prose-img:rounded-2xl prose-img:shadow-lg
              prose-code:text-primary prose-code:bg-primary/8 prose-code:rounded prose-code:px-1.5">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                  // Custom h2: big colored section header with ID for TOC
                  h2: ({ children }) => {
                    const text = String(children)
                    const id = text.replace(/[^\w\s\u00C0-\u024F]/g, '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
                    return (
                      <h2 id={id} className="scroll-mt-20 flex items-center gap-3 text-2xl font-extrabold text-secondary mt-12 mb-4 pb-3 border-b-2 border-gray-100">
                        <span className="text-2xl">{text.codePointAt(0) && text.codePointAt(0)! > 0x2000 ? Array.from(text)[0] : ''}</span>
                        <span>{text.codePointAt(0) && text.codePointAt(0)! > 0x2000 ? text.slice(Array.from(text)[0].length).trimStart() : text}</span>
                      </h2>
                    )
                  },
                  // Custom h3: restaurant/business name with accent left border
                  h3: ({ children }) => {
                    const text = String(children)
                    const id = text.replace(/[^\w\s\u00C0-\u024F]/g, '').trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
                    return (
                      <h3 id={id} className="scroll-mt-20 text-lg font-bold text-secondary mt-8 mb-2 pl-4 border-l-4 border-primary/60 bg-primary/4 py-2 rounded-r-lg">
                        {children}
                      </h3>
                    )
                  },
                  // Custom hr: decorative divider
                  hr: () => (
                    <div className="my-10 flex items-center gap-4">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                      <span className="text-gray-300 text-xl">✦</span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    </div>
                  ),
                  // Custom blockquote: tip/highlight box
                  blockquote: ({ children }) => (
                    <div className="my-6 p-5 bg-accent/8 border border-accent/20 rounded-2xl flex gap-3">
                      <span className="text-2xl flex-shrink-0 mt-0.5">💡</span>
                      <div className="text-gray-700 leading-relaxed [&>p]:mb-0 [&>p]:text-gray-700">{children}</div>
                    </div>
                  ),
                  // Paragraphs — detect tip patterns
                  p: ({ children }) => {
                    const text = String(children)
                    // Bold first sentence as lead paragraph for first p
                    return <p className="text-gray-600 leading-relaxed mb-4">{children}</p>
                  },
                }}
              >
                {blogPost.content}
              </ReactMarkdown>
            </div>

            {/* Tags */}
            {blogPost.tags && blogPost.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2">
                {blogPost.tags.map((tag: string) => (
                  <span key={tag} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full font-medium hover:bg-primary/10 hover:text-primary transition-colors">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* ── Share bar ── */}
            <div className="mt-12 p-6 bg-gradient-to-br from-secondary to-primary/90 rounded-2xl">
              <p className="text-white font-bold text-lg mb-1">¿Te fue útil este artículo?</p>
              <p className="text-white/70 text-sm mb-5">Compártelo con tus amigos en Lagos de Moreno</p>
              <div className="flex flex-wrap gap-3">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-full font-semibold text-sm transition-all hover:scale-105 shadow-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  WhatsApp
                </a>
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold text-sm transition-all hover:scale-105 shadow-lg">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  Facebook
                </a>
                <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 bg-black hover:bg-gray-900 text-white rounded-full font-semibold text-sm transition-all hover:scale-105 shadow-lg">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg>
                  X / Twitter
                </a>
              </div>
            </div>

            {/* ── CTA register ── */}
            <div className="mt-8 p-6 border-2 border-dashed border-primary/30 rounded-2xl text-center bg-primary/3">
              <p className="text-2xl mb-2">🏪</p>
              <p className="font-bold text-secondary mb-1">¿Tienes un negocio en Lagos de Moreno?</p>
              <p className="text-sm text-gray-500 mb-4">Regístralo gratis en SomosLagos y llega a miles de clientes locales</p>
              <Link href="/registrar-negocio"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-primary/20">
                Registrar mi negocio — GRATIS
              </Link>
            </div>
          </article>
        </div>
      </div>

      {/* ── RELATED POSTS ────────────────────────────────────────── */}
      {related.length > 0 && (
        <section className="bg-gray-50 py-16 border-t border-gray-100">
          <div className="container mx-auto px-4 max-w-5xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="h-1 w-8 bg-gradient-to-r from-primary to-accent rounded-full" />
              <h2 className="text-xl font-extrabold text-secondary">Más artículos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {related.map((rp) => (
                <Link key={rp.id} href={`/blog/${rp.slug}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                  {resolveBlogImage(rp.featured_image_url, postIndexMap.get(rp.slug) ?? -1) ? (
                    <div className="relative h-44 overflow-hidden">
                      <Image src={resolveBlogImage(rp.featured_image_url, postIndexMap.get(rp.slug) ?? -1) || '/tourism/teatro-rosas-moreno.jpg'} alt={rp.title} fill sizes="400px"
                        className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  ) : (
                    <div className="h-44 bg-gradient-to-br from-primary/15 via-secondary/10 to-accent/15 flex items-center justify-center relative overflow-hidden">
                      <span className="text-6xl opacity-30 group-hover:scale-110 transition-transform duration-500">
                        {(CATEGORY_META[rp.category] || CATEGORY_META['general']).icon}
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-t from-secondary/20 to-transparent" />
                    </div>
                  )}
                  <div className="p-4">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full mb-2 inline-block ${(CATEGORY_META[rp.category] || CATEGORY_META['general']).bg} ${(CATEGORY_META[rp.category] || CATEGORY_META['general']).color}`}>
                      {(CATEGORY_META[rp.category] || CATEGORY_META['general']).label}
                    </span>
                    <h3 className="font-bold text-secondary group-hover:text-primary transition-colors line-clamp-2 mt-1 leading-snug">
                      {rp.title}
                    </h3>
                    {rp.excerpt && (
                      <p className="text-gray-500 text-sm mt-1.5 line-clamp-2">{rp.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back to blog */}
      <div className="py-8 text-center border-t border-gray-100">
        <Link href="/blog" className="inline-flex items-center gap-2 text-primary hover:underline font-semibold">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Ver todos los artículos
        </Link>
      </div>
    </main>
  )
}
