import type { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://www.somoslagos.com.mx'

// Priority by subscription tier — paid businesses deserve better placement in crawl budget
const TIER_PRIORITY: Record<string, number> = {
  avanzado: 0.9,
  pro: 0.8,
  emprendedor: 0.75,
  gratis: 0.65,
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // ── Static routes ──────────────────────────────────────────────────────────
  // Use fixed dates for pages that rarely change — crawlers shouldn't re-index
  // them daily just because the server time changed.
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/restaurantes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/taquerias`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/cafeterias`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/hoteles`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/bares`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/buscar`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/que-hacer-en-lagos-de-moreno`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/descubre`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/categorias`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/marketplace`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/planes`,
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/registrar-negocio`,
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'monthly',
      priority: 0.65,
    },
    {
      url: `${BASE_URL}/aviso-de-privacidad`,
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/terminos`,
      lastModified: new Date('2025-01-01'),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]

  // ── Businesses ─────────────────────────────────────────────────────────────
  const { data: businesses } = await supabase
    .from('businesses')
    .select('slug, updated_at, subscription_tier, logo_url, cover_url')
    .eq('is_active', true)

  const businessRoutes: MetadataRoute.Sitemap = (businesses || []).map(business => {
    const priority = TIER_PRIORITY[business.subscription_tier as string] ?? 0.65
    const images: string[] = []
    if (business.logo_url) images.push(business.logo_url as string)
    if (business.cover_url) images.push(business.cover_url as string)

    return {
      url: `${BASE_URL}/negocios/${business.slug}`,
      lastModified: business.updated_at ? new Date(business.updated_at as string) : new Date(),
      changeFrequency: 'weekly' as const,
      priority,
      ...(images.length > 0 && { images }),
    }
  })

  // ── Categories ─────────────────────────────────────────────────────────────
  const { data: categories } = await supabase
    .from('categories')
    .select('slug')
    .not('slug', 'like', '__hidden__%')

  const categoryRoutes: MetadataRoute.Sitemap = (categories || []).map((cat: any) => ({
    url: `${BASE_URL}/categorias/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }))

  // Keyword landing pages — these are the highest-SEO-value pages
  const keywordRoutes: MetadataRoute.Sitemap = (categories || [])
    .filter((cat: any) => !String(cat.slug).startsWith('__hidden__'))
    .map((cat: any) => ({
      url: `${BASE_URL}/${cat.slug}-en-lagos-de-moreno`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    }))

  // ── Blog posts ─────────────────────────────────────────────────────────────
  const { data: blogPosts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at')
    .eq('status', 'published')

  const blogRoutes: MetadataRoute.Sitemap = (blogPosts || []).map((post: any) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // ── Marketplace listings ────────────────────────────────────────────────────
  const { data: listings } = await supabase
    .from('marketplace_listings')
    .select('id, updated_at')
    .eq('status', 'active')
    .gte('expires_at', new Date().toISOString())

  const marketplaceRoutes: MetadataRoute.Sitemap = (listings || []).map((listing: any) => ({
    url: `${BASE_URL}/marketplace/${listing.id}`,
    lastModified: listing.updated_at ? new Date(listing.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  // ── Neighborhood pages (solo colonias con suficiente contenido) ─────────────
  const { data: neighborhoodData } = await supabase
    .from('businesses')
    .select('neighborhood')
    .eq('is_active', true)
    .not('neighborhood', 'is', null)

  const neighborhoodCounts: Record<string, number> = {}
  for (const b of (neighborhoodData || [])) {
    const n = (b.neighborhood || '').trim()
    if (n) neighborhoodCounts[n] = (neighborhoodCounts[n] ?? 0) + 1
  }

  // Solo indexar colonias con al menos 2 negocios (evita páginas flacas "rastreadas sin indexar")
  const uniqueNeighborhoods = Object.entries(neighborhoodCounts)
    .filter(([, count]) => count >= 2)
    .map(([name]) => name)

  const neighborhoodRoutes: MetadataRoute.Sitemap = uniqueNeighborhoods.map(colonia => ({
    url: `${BASE_URL}/negocios-en/${encodeURIComponent(colonia)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  return [
    ...staticRoutes,
    ...keywordRoutes,      // highest SEO value — first
    ...businessRoutes,
    ...categoryRoutes,
    ...neighborhoodRoutes,
    ...blogRoutes,
    ...marketplaceRoutes,
  ]
}
