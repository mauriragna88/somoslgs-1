import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://www.somoslagos.com.mx'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/buscar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/categorias`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/registro`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/registrar-negocio`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/descubre`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/marketplace`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/aviso-de-privacidad`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terminos`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Fetch all active businesses
  const { data: businesses } = await supabase
    .from('businesses')
    .select('slug, updated_at')
    .eq('is_active', true)

  const businessRoutes: MetadataRoute.Sitemap = (businesses || []).map(
    (business) => ({
      url: `${BASE_URL}/negocios/${business.slug}`,
      lastModified: business.updated_at
        ? new Date(business.updated_at)
        : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })
  )

  // Fetch all categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug')

  const categoryRoutes: MetadataRoute.Sitemap = (categories || []).map(
    (cat: any) => ({
      url: `${BASE_URL}/categorias/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })
  )

  // Fetch published blog posts
  const { data: blogPosts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at, published_at')
    .eq('status', 'published')

  const blogRoutes: MetadataRoute.Sitemap = (blogPosts || []).map(
    (post: any) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updated_at
        ? new Date(post.updated_at)
        : new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })
  )

  // Fetch active marketplace listings
  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select('id, updated_at')
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())

  const marketplaceRoutes: MetadataRoute.Sitemap = (listings || []).map(
    (listing: any) => ({
      url: `${BASE_URL}/marketplace/${listing.id}`,
      lastModified: listing.updated_at
        ? new Date(listing.updated_at)
        : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    })
  )

  return [...staticRoutes, ...businessRoutes, ...categoryRoutes, ...blogRoutes, ...marketplaceRoutes]
}
