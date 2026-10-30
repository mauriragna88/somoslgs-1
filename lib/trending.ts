import { createPublicClient, createPublicServiceClient } from '@/lib/supabase/server'

export interface TrendingBusiness {
  id: string
  name: string
  slug: string
  logo_url: string | null
  total_views: number
  category: { name: string; slug: string; icon: string } | null
}

export interface TrendingCategory {
  name: string
  slug: string
  icon: string
  views: number
}

export interface Trending {
  businesses: TrendingBusiness[]
  categories: TrendingCategory[]
  searches: { term: string; count: number }[]
}

const MIN_SEARCH_REPEATS = 3
// Terminos que se pueden mostrar publicamente: solo texto corto, sin enlaces ni simbolos raros
const SAFE_TERM = /^[\p{L}\p{N} ]{2,40}$/u

/** Lo mas visitado y lo mas buscado, con datos reales. Se cachea junto con la home. */
export async function getTrending(revalidate = 3600): Promise<Trending> {
  const supabase = createPublicClient(revalidate)

  const { data } = await supabase
    .from('businesses')
    .select('id, name, slug, logo_url, total_views, category:categories(name, slug, icon)')
    .eq('is_active', true)
    .gt('total_views', 0)
    .order('total_views', { ascending: false })
    .limit(300)

  const rows = ((data ?? []) as unknown as TrendingBusiness[]).filter(b => b.total_views > 0)

  const byCategory = new Map<string, TrendingCategory>()
  for (const b of rows) {
    if (!b.category) continue
    const cur = byCategory.get(b.category.slug) ?? { ...b.category, views: 0 }
    cur.views += b.total_views
    byCategory.set(b.category.slug, cur)
  }

  let searches: Trending['searches'] = []
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: logged } = await createPublicServiceClient(revalidate)
      .from('search_queries')
      .select('term, results')
      .gte('created_at', since)
      .gt('results', 0)
      .limit(5000)
    const counts = new Map<string, number>()
    for (const r of (logged ?? []) as { term: string }[]) {
      if (!SAFE_TERM.test(r.term)) continue
      counts.set(r.term, (counts.get(r.term) ?? 0) + 1)
    }
    searches = [...counts.entries()]
      .filter(([, count]) => count >= MIN_SEARCH_REPEATS)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([term, count]) => ({ term, count }))
  } catch {
    // sin datos de busqueda todavia: la seccion se arma solo con visitas
  }

  return {
    businesses: rows.slice(0, 6),
    categories: [...byCategory.values()].sort((a, b) => b.views - a.views).slice(0, 6),
    searches,
  }
}
