import { Metadata } from 'next'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import type { BlogPost } from '@/types/database.types'
import { resolveBlogImage } from '@/lib/blog-image-fallbacks'
import BlogCard from '@/components/blog/BlogCard'
import { StaggerGroup, StaggerItem } from '@/components/animations/StaggerGroup'
import SectionReveal from '@/components/animations/SectionReveal'

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
      <SectionReveal entryY={30} amount={0.5}>
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
      </SectionReveal>

      {/* Posts Grid */}
      <SectionReveal>
      <section className="container mx-auto px-4 py-12">
        {blogPosts.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-5xl block mb-4">✍️</span>
            <p className="text-gray-500 text-lg mb-2">Aún no hay artículos publicados</p>
            <p className="text-gray-400">Pronto tendremos guías, tips y noticias sobre Lagos de Moreno</p>
          </div>
        ) : (
          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {blogPosts.map((post, index) => (
              <StaggerItem key={post.id} className="h-full">
                <BlogCard
                  post={post}
                  categoryLabel={CATEGORY_LABELS[post.category] || post.category || 'Blog'}
                  index={index}
                />
              </StaggerItem>
            ))}
          </StaggerGroup>
        )}
      </section>
      </SectionReveal>
    </main>
  )
}
