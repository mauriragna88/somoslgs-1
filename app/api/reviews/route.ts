import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getUser, createServiceClient } from '@/lib/supabase/server'
import { checkRateLimit, getClientIP } from '@/lib/security'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const businessId = searchParams.get('business_id')
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const limit = parseInt(searchParams.get('limit') || '10', 10)

  if (!businessId) {
    return NextResponse.json([], { status: 400 })
  }

  const supabase = createServiceClient()

  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, business_id, user_id, rating, comment, response, responded_at, created_at, profile:profiles(full_name, avatar_url)')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return NextResponse.json(reviews || [])
}

const reviewSchema = z.object({
  business_id: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional().nullable(),
})

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'Debes iniciar sesion para dejar tu opinion' }, { status: 401 })
    }

    // Rate limiting: 10 reviews per hour
    const ip = getClientIP(request)
    const rateCheck = checkRateLimit(`review:${ip}`, 10, 3600000)
    if (!rateCheck.allowed) {
      return NextResponse.json({ error: 'Demasiadas opiniones. Intenta más tarde.' }, { status: 429 })
    }

    const body = await request.json()
    const data = reviewSchema.parse(body)

    const supabase = createServiceClient()

    // Insert review
    const { data: review, error } = await supabase
      .from('reviews')
      .insert({
        business_id: data.business_id,
        user_id: user.id,
        rating: data.rating,
        comment: data.comment || null,
        order_id: null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Ya dejaste tu opinion en este negocio' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Error al guardar tu opinion' }, { status: 500 })
    }

    // Recalculate average rating and total reviews
    const { data: stats } = await supabase
      .from('reviews')
      .select('rating')
      .eq('business_id', data.business_id)

    if (stats && stats.length > 0) {
      const total = stats.length
      const avg = Math.round((stats.reduce((sum, r) => sum + r.rating, 0) / total) * 10) / 10

      await supabase
        .from('businesses')
        .update({ rating: avg, total_reviews: total })
        .eq('id', data.business_id)
    }

    return NextResponse.json({ success: true, review }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
