import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'

// POST: Express interest in a listing
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Inicia sesión para mostrar tu interés' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Verify listing exists and is active
  const { data: listing } = await supabase
    .from('marketplace_listings')
    .select('id, seller_id, status')
    .eq('id', params.id)
    .single()

  if (!listing || listing.status !== 'active') {
    return NextResponse.json({ error: 'Artículo no disponible' }, { status: 404 })
  }

  // Can't express interest in own listing
  if (listing.seller_id === user.id) {
    return NextResponse.json({ error: 'No puedes mostrar interés en tu propio artículo' }, { status: 400 })
  }

  // Parse optional message
  let message: string | null = null
  try {
    const body = await request.json()
    if (body.message && typeof body.message === 'string') {
      message = body.message.trim().slice(0, 500) || null
    }
  } catch {
    // No body is fine
  }

  // Upsert lead (unique constraint on listing_id + buyer_id)
  const { error } = await supabase
    .from('marketplace_leads')
    .upsert(
      {
        listing_id: params.id,
        buyer_id: user.id,
        message,
      },
      { onConflict: 'listing_id,buyer_id' }
    )

  if (error) {
    return NextResponse.json({ error: 'Error al registrar interés' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// GET: Get leads for a listing (owner only)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Verify ownership
  const { data: listing } = await supabase
    .from('marketplace_listings')
    .select('id, seller_id, is_featured, featured_until')
    .eq('id', params.id)
    .single()

  if (!listing) {
    return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 })
  }

  if (listing.seller_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  // Check if currently featured
  const isFeatured = listing.is_featured &&
    listing.featured_until &&
    new Date(listing.featured_until) > new Date()

  // Get leads with buyer info
  const { data: leads } = await supabase
    .from('marketplace_leads')
    .select('id, message, created_at, buyer:profiles!marketplace_leads_buyer_id_fkey(full_name, phone)')
    .eq('listing_id', params.id)
    .order('created_at', { ascending: false })

  // Censor buyer info if not featured
  const processedLeads = (leads || []).map((lead: any) => {
    if (isFeatured) {
      return lead
    }
    // Censor: show first letter + asterisks
    const name = lead.buyer?.full_name || 'Usuario'
    const parts = name.split(' ')
    const censored = parts.map((p: string) => p[0] + '****').join(' ')
    return {
      ...lead,
      buyer: {
        full_name: censored,
        phone: null,
      },
    }
  })

  return NextResponse.json({ data: processedLeads, is_featured: !!isFeatured })
}
