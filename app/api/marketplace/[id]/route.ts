import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { moderateText } from '@/lib/moderation'

const updateSchema = z.object({
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(10).max(1000).optional(),
  price: z.number().min(0).optional(),
  price_type: z.enum(['fijo', 'negociable', 'gratis', 'intercambio']).optional(),
  condition: z.enum(['nuevo', 'seminuevo', 'usado']).optional(),
  category_id: z.string().uuid().nullable().optional(),
  images: z.array(z.string()).max(8).optional(),
  location: z.string().max(200).nullable().optional(),
  whatsapp: z.string().min(10).max(20).optional(),
  status: z.enum(['active', 'sold', 'reserved']).optional(),
})

// GET: Get listing detail + increment views
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*, category:marketplace_categories(*)')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Artículo no encontrado' }, { status: 404 })
  }

  // Increment views (fire and forget)
  supabase
    .from('marketplace_listings')
    .update({ views: (data.views || 0) + 1 })
    .eq('id', id)
    .then(() => {})

  return NextResponse.json({ data })
}

// PUT: Update listing (owner only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Verify ownership
  const { data: existing } = await supabase
    .from('marketplace_listings')
    .select('seller_id')
    .eq('id', id)
    .single()

  if (!existing || existing.seller_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const validated = updateSchema.parse(body)

    // Re-moderate if title or description changed
    if (validated.title || validated.description) {
      const { data: current } = await supabase
        .from('marketplace_listings')
        .select('title, description')
        .eq('id', id)
        .single()

      const title = validated.title || current?.title || ''
      const description = validated.description || current?.description || ''
      const moderation = moderateText(title, description)
      if (!moderation.ok) {
        return NextResponse.json({ error: moderation.reason }, { status: 400 })
      }
    }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (validated.title !== undefined) updateData.title = validated.title.trim()
    if (validated.description !== undefined) updateData.description = validated.description.trim()
    if (validated.price !== undefined) updateData.price = Math.round(validated.price * 100) / 100
    if (validated.price_type !== undefined) {
      updateData.price_type = validated.price_type
      if (validated.price_type === 'gratis') updateData.price = 0
    }
    if (validated.condition !== undefined) updateData.condition = validated.condition
    if (validated.category_id !== undefined) updateData.category_id = validated.category_id
    if (validated.images !== undefined) updateData.images = validated.images
    if (validated.location !== undefined) updateData.location = validated.location?.trim() || null
    if (validated.whatsapp !== undefined) updateData.whatsapp = validated.whatsapp.trim()
    if (validated.status !== undefined) updateData.status = validated.status

    const { data, error } = await supabase
      .from('marketplace_listings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

// DELETE: Soft delete (owner only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: existing } = await supabase
    .from('marketplace_listings')
    .select('seller_id')
    .eq('id', id)
    .single()

  if (!existing || existing.seller_id !== user.id) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { error } = await supabase
    .from('marketplace_listings')
    .update({ status: 'removed', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

