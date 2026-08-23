import { NextResponse } from 'next/server'
import { isAdmin, createServiceClient } from '@/lib/supabase/server'
import { sanitizeSearchQuery } from '@/lib/security'

// GET: List marketplace listings for admin (with reports)
export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const tab = searchParams.get('tab') || 'reported'
  const search = searchParams.get('q') || ''

  const supabase = createServiceClient()

  if (tab === 'reported') {
    // Get reports with listing details
    let query = supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey(full_name)
      `)
      .eq('item_type', 'marketplace_listing')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    const { data: reports, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Error al obtener reportes' }, { status: 500 })
    }

    // Get listing details for each report
    const listingIds = Array.from(new Set((reports || []).map(r => r.item_id)))
    let listings: Record<string, any> = {}

    if (listingIds.length > 0) {
      const { data: listingsData } = await supabase
        .from('marketplace_listings')
        .select('*')
        .in('id', listingIds)

      if (listingsData) {
        listings = Object.fromEntries(listingsData.map(l => [l.id, l]))
      }
    }

    const enrichedReports = (reports || []).map(r => ({
      ...r,
      listing: listings[r.item_id] || null,
    }))

    return NextResponse.json({ data: enrichedReports })
  }

  // All listings tab
  let query = supabase
    .from('marketplace_listings')
    .select('*, category:marketplace_categories(*)')
    .order('created_at', { ascending: false })

  if (search) {
    const sanitized = sanitizeSearchQuery(search)
    if (sanitized.length >= 2) {
      query = query.or(`title.ilike.%${sanitized}%,description.ilike.%${sanitized}%`)
    }
  }

  const { data, error } = await query.limit(100)

  if (error) {
    return NextResponse.json({ error: 'Error al obtener artículos' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
