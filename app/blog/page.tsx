import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { createServiceClient } from '@/lib/supabase/server'
import type { BlogPost } from '@/types/database.types'
import { resolveBlogImage } from '@/lib/blog-image-fallbacks'

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

export default async function BlogPage() {
  const supabase = createServiceClient()

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  const blogPosts = ((posts as BlogPost[]) || []).map((post, index) => ({
    ...post,
    display_image_url: resolveBlogImage(post.featured_image_url, index),
  }))

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 py-12 md:py-16 text-center">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4">Blog</span>
          <h1 className="text-3xl md:text-4xl font-bold text-secondary mb-3">
            Blog de SomosLagos
          </h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Guias, tips y noticias sobre negocios y vida en Lagos de Moreno
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="container mx-auto px-4 py-12">
        {blogPosts.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">✍️</span>
            <p className="text-gray-500 text-lg mb-2">Aún no hay artículos publicados</p>
            <p className="text-gray-400">Pronto tendremos guías, tips y noticias sobre Lagos de Moreno</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {blogPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                {/* Image */}
                {post.display_image_url ? (
                  <div className="relative h-48 bg-gray-100">
                    <Image
                      src={post.display_image_url}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                    <span className="text-5xl opacity-40">✍️</span>
                  </div>
                )}

                <div className="p-5">
                  {/* Category + Date */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                      {CATEGORY_LABELS[post.category] || post.category}
                    </span>
                    {post.published_at && (
                      <span className="text-xs text-gray-400">
                        {new Date(post.published_at).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="font-bold text-secondary group-hover:text-primary transition-colors mb-2 line-clamp-2">
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  {post.excerpt && (
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                  )}

                  <span className="text-sm text-primary font-semibold">
                    Leer mas →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
