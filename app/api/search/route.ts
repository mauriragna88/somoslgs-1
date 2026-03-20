import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sanitizeSearchQuery } from '@/lib/security'
import { stemSpanish } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  const supabase = createServiceClient()

  const sanitized = sanitizeSearchQuery(query)
  if (!sanitized || sanitized.length < 2) {
    return NextResponse.json([])
  }

  const words = sanitized.toLowerCase().split(/\s+/).filter(w => w.length >= 2)
  if (words.length === 0) {
    return NextResponse.json([])
  }

  // Build OR conditions: search name, description, address, neighborhood
  const orConditions = words.map(word => {
    const stem = stemSpanish(word)
    return [
      `name.ilike.%${stem}%`,
      `description.ilike.%${stem}%`,
      `address.ilike.%${stem}%`,
      `neighborhood.ilike.%${stem}%`,
    ].join(',')
  }).join(',')

  const { data: businesses, error } = await supabase
    .from('businesses')
    .select(`
      id,
      name,
      slug,
      description,
      logo_url,
      address,
      neighborhood,
      subscription_tier,
      is_featured,
      rating,
      total_reviews,
      category:categories(id, name, icon)
    `)
    .eq('is_active', true)
    .or(orConditions)
    .order('is_featured', { ascending: false })
    .order('subscription_tier', { ascending: false })
    .order('name')
    .limit(12)

  if (error) {
    return NextResponse.json([], { status: 500 })
  }

  // Also search by category name
  const { data: categoryMatches } = await supabase
    .from('businesses')
    .select(`
      id,
      name,
      slug,
      description,
      logo_url,
      address,
      neighborhood,
      subscription_tier,
      is_featured,
      rating,
      total_reviews,
      category:categories(id, name, icon)
    `)
    .eq('is_active', true)
    .filter('category.name', 'ilike', `%${stemSpanish(sanitized)}%`)
    .order('is_featured', { ascending: false })
    .limit(5)

  // Merge results, avoiding duplicates
  const allResults = [...(businesses || [])]
  const existingIds = new Set(allResults.map(b => b.id))

  if (categoryMatches) {
    for (const biz of categoryMatches) {
      if (!existingIds.has(biz.id)) {
        allResults.push(biz)
      }
    }
  }

  // Sort: exact name match first, then starts-with, then rest
  const queryLower = sanitized.toLowerCase()
  const sorted = allResults.sort((a, b) => {
    const aName = a.name.toLowerCase()
    const bName = b.name.toLowerCase()
    const aExact = aName === queryLower ? 0 : aName.startsWith(queryLower) ? 1 : 2
    const bExact = bName === queryLower ? 0 : bName.startsWith(queryLower) ? 1 : 2
    if (aExact !== bExact) return aExact - bExact
    // Featured first within same relevance
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1
    return 0
  })

  return NextResponse.json(sorted.slice(0, 8))
}
