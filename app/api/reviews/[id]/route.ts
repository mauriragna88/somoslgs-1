import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getUser, createServiceClient } from '@/lib/supabase/server'

const responseSchema = z.object({
  response: z.string().min(1).max(500),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const data = responseSchema.parse(body)

    const supabase = createServiceClient()

    // Get the review to find the business
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, business_id')
      .eq('id', id)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Opinion no encontrada' }, { status: 404 })
    }

    // Verify user is the business owner
    const { data: business } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', review.business_id)
      .single()

    if (!business || business.owner_id !== user.id) {
      return NextResponse.json({ error: 'Solo el dueno del negocio puede responder' }, { status: 403 })
    }

    // Update review with response
    const { data: updated, error: updateError } = await supabase
      .from('reviews')
      .update({
        response: data.response,
        responded_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Error al guardar la respuesta' }, { status: 500 })
    }

    return NextResponse.json({ success: true, review: updated })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

