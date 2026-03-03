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

  // Sanitize and split query into words for smarter matching
  const sanitized = sanitizeSearchQuery(query)
  if (!sanitized || sanitized.length < 2) {
    return NextResponse.json([])
  }
  const words = sanitized.toLowerCase().split(/\s+/).filter(w => w.length >= 2)
  if (words.length === 0) {
    return NextResponse.json([])
  }

  // Build OR conditions: stem each word for plural/singular matching
  const orConditions = words.map(word => {
    const stem = stemSpanish(word)
    return `name.ilike.%${stem}%,description.ilike.%${stem}%`
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
    .limit(8)

  if (error) {
    return NextResponse.json([], { status: 500 })
  }

  // Also search by category name for results that may not match above
  const { data: categoryMatches } = await supabase
    .from('businesses')
    .select(`
      id,
      name,
      slug,
      description,
      logo_url,
      address,
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
  const allResults = businesses || []
  const existingIds = new Set(allResults.map(b => b.id))

  if (categoryMatches) {
    for (const biz of categoryMatches) {
      if (!existingIds.has(biz.id)) {
        allResults.push(biz)
      }
    }
  }

  // Return max 8 results
  return NextResponse.json(allResults.slice(0, 8))
}
