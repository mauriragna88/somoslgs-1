import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json([])
  }

  const supabase = createServiceClient()

  // Split query into words for smarter matching
  const words = query.toLowerCase().split(/\s+/).filter(w => w.length >= 2)

  // Build OR conditions: each word matches name, description, or category name
  // This allows "tacos pastor" to match a business with "tacos" in name and "pastor" in description
  const orConditions = words.map(word =>
    `name.ilike.%${word}%,description.ilike.%${word}%`
  ).join(',')

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
      category:categories(id, name, icon)
    `)
    .eq('is_active', true)
    .filter('category.name', 'ilike', `%${query}%`)
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
