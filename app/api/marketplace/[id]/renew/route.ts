import { NextResponse } from 'next/server'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { MARKETPLACE_LISTING_DAYS } from '@/lib/constants'

// POST: Renew listing for another 30 days
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: listing } = await supabase
    .from('marketplace_listings')
    .select('seller_id, expires_at, status')
    .eq('id', id)
    .single()

  if (!listing || listing.seller_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  if (listing.status === 'removed') {
    return NextResponse.json({ error: 'Este artículo fue eliminado' }, { status: 400 })
  }

  // Only allow renewal if < 7 days remaining
  const daysLeft = listing.expires_at
    ? Math.ceil((new Date(listing.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0

  if (daysLeft > 7) {
    return NextResponse.json(
      { error: `Puedes renovar cuando falten menos de 7 días. Faltan ${daysLeft} días.` },
      { status: 400 }
    )
  }

  const newExpiry = new Date()
  newExpiry.setDate(newExpiry.getDate() + MARKETPLACE_LISTING_DAYS)

  const { data, error } = await supabase
    .from('marketplace_listings')
    .update({
      expires_at: newExpiry.toISOString(),
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Error al renovar' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

