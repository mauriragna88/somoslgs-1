import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/server'
import type { BlogPost } from '@/types/database.types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export const revalidate = 1800

const CATEGORY_LABELS: Record<string, string> = {
  'general': 'General',
  'guias-locales': 'Guias Locales',
  'tips': 'Tips',
  'noticias': 'Noticias',
  'negocios-destacados': 'Negocios Destacados',
}

interface PageProps {
  params: { slug: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createServiceClient()
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, featured_image_url')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (!post) return { title: 'Post no encontrado' }

  return {
    title: post.title,
    description: post.excerpt || `Lee ${post.title} en el blog de SomosLagos`,
    openGraph: {
      title: `${post.title} | Blog SomosLagos`,
      description: post.excerpt || `Lee ${post.title} en el blog de SomosLagos`,
      url: `https://www.somoslagos.com.mx/blog/${params.slug}`,
      type: 'article',
      images: post.featured_image_url ? [{ url: post.featured_image_url, width: 1200, height: 630 }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || undefined,
      images: post.featured_image_url ? [post.featured_image_url] : undefined,
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const supabase = createServiceClient()

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single()

  if (!post) notFound()

  const blogPost = post as BlogPost

  // Increment view count (fire and forget)
  supabase
    .from('blog_posts')
    .update({ view_count: (blogPost.view_count || 0) + 1 })
    .eq('id', blogPost.id)
    .then()

  // Fetch related posts
  const { data: relatedPosts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, featured_image_url, category, published_at')
    .eq('status', 'published')
    .eq('category', blogPost.category)
    .neq('id', blogPost.id)
    .order('published_at', { ascending: false })
    .limit(3)

  const related = (relatedPosts as BlogPost[]) || []

  // JSON-LD
  const blogPostingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: blogPost.title,
    description: blogPost.excerpt || undefined,
    image: blogPost.featured_image_url || undefined,
    datePublished: blogPost.published_at,
    dateModified: blogPost.updated_at,
    url: `https://www.somoslagos.com.mx/blog/${blogPost.slug}`,
    publisher: {
      '@type': 'Organization',
      name: 'SomosLagos',
      url: 'https://www.somoslagos.com.mx',
      logo: 'https://www.somoslagos.com.mx/logo.png',
    },
  }

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `${blogPost.title} - https://www.somoslagos.com.mx/blog/${blogPost.slug}`
  )}`

  return (
    <main className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }}
      />

      {/* Featured Image */}
      {blogPost.featured_image_url && (
        <div className="relative h-64 md:h-96 bg-gray-100">
          <Image
            src={blogPost.featured_image_url}
            alt={blogPost.title}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      <article className="container mx-auto px-4 py-10 max-w-3xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
          <Link href="/" className="hover:text-primary">Inicio</Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-primary">Blog</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{blogPost.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
              {CATEGORY_LABELS[blogPost.category] || blogPost.category}
            </span>
            {blogPost.published_at && (
              <time className="text-sm text-gray-400" dateTime={blogPost.published_at}>
                {new Date(blogPost.published_at).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </time>
            )}
            <span className="text-sm text-gray-400">{blogPost.view_count} vistas</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-secondary leading-tight mb-4">
            {blogPost.title}
          </h1>
          {blogPost.excerpt && (
            <p className="text-lg text-gray-500">{blogPost.excerpt}</p>
          )}
        </header>

        {/* Content */}
        <div className="prose prose-lg max-w-none prose-headings:text-secondary prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {blogPost.content}
          </ReactMarkdown>
        </div>

        {/* Share */}
        <div className="mt-10 pt-8 border-t border-gray-100 flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500">Compartir:</span>
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
        </div>
      </article>

      {/* Related Posts */}
      {related.length > 0 && (
        <section className="bg-gray-50 py-12">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-xl font-bold text-secondary mb-6">Articulos relacionados</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {related.map((rp) => (
                <Link
                  key={rp.id}
                  href={`/blog/${rp.slug}`}
                  className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all"
                >
                  {rp.featured_image_url ? (
                    <div className="relative h-32 bg-gray-100">
                      <Image
                        src={rp.featured_image_url}
                        alt={rp.title}
                        fill
                        sizes="250px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <span className="text-3xl opacity-40">✍️</span>
                    </div>
                  )}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm text-secondary group-hover:text-primary transition-colors line-clamp-2">
                      {rp.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
