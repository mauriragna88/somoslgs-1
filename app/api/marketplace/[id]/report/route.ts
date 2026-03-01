import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { checkReportRateLimit, getClientIP } from '@/lib/security'

const reportSchema = z.object({
  reason: z.enum(['spam', 'fraude', 'contenido_inapropiado', 'articulo_prohibido', 'otro']),
  details: z.string().max(500).optional(),
})

// POST: Report a listing
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  // Rate limiting
  const ip = getClientIP(request)
  const rateLimit = checkReportRateLimit(`report:${ip}`)
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Demasiados reportes. Intenta más tarde.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const validated = reportSchema.parse(body)

    const supabase = createServiceClient()

    // Check listing exists
    const { data: listing } = await supabase
      .from('marketplace_listings')
      .select('id, seller_id')
      .eq('id', params.id)
      .single()

    if (!listing) {
      return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 })
    }

    // Can't report your own listing
    if (listing.seller_id === user.id) {
      return NextResponse.json({ error: 'No puedes reportar tu propio artículo' }, { status: 400 })
    }

    // Check if already reported by this user
    const { data: existing } = await supabase
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('item_type', 'marketplace_listing')
      .eq('item_id', params.id)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Ya reportaste este artículo' }, { status: 400 })
    }

    const { error } = await supabase
      .from('reports')
      .insert({
        reporter_id: user.id,
        item_type: 'marketplace_listing',
        item_id: params.id,
        reason: validated.reason,
        details: validated.details?.trim() || null,
      })

    if (error) {
      return NextResponse.json({ error: 'Error al enviar reporte' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
