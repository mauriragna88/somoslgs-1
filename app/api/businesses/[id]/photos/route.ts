import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser, isAdmin } from '@/lib/supabase/server'
import { z } from 'zod'
import { GALLERY_PHOTO_LIMITS, type SubscriptionTier } from '@/lib/constants'

const photoCreateSchema = z.object({
  image_url: z.string().url(),
  storage_path: z.string().min(1),
})

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseAdmin()

    const { data: photos, error } = await supabase
      .from('business_photos')
      .select('*')
      .eq('business_id', params.id)
      .order('display_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Error al obtener fotos' }, { status: 500 })
    }

    return NextResponse.json({ photos: photos || [] })
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = photoCreateSchema.parse(body)

    const supabase = getSupabaseAdmin()

    // Verify ownership and get subscription tier
    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('owner_id, subscription_tier')
      .eq('id', params.id)
      .single()

    if (fetchError || !business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    const userIsAdmin = await isAdmin()
    if (business.owner_id !== user.id && !userIsAdmin) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 })
    }

    // Check photo limit (admins get 25)
    const tier = business.subscription_tier as SubscriptionTier
    const limit = userIsAdmin ? 25 : (GALLERY_PHOTO_LIMITS[tier] || 10)

    const { count } = await supabase
      .from('business_photos')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', params.id)

    if ((count || 0) >= limit) {
      return NextResponse.json(
        { error: `Has alcanzado el limite de ${limit} fotos` },
        { status: 400 }
      )
    }

    // Get next display_order
    const { data: lastPhoto } = await supabase
      .from('business_photos')
      .select('display_order')
      .eq('business_id', params.id)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (lastPhoto?.display_order ?? -1) + 1

    // Insert photo record
    const { data: photo, error: insertError } = await supabase
      .from('business_photos')
      .insert({
        business_id: params.id,
        image_url: validatedData.image_url,
        storage_path: validatedData.storage_path,
        display_order: nextOrder,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: 'Error al guardar la foto' }, { status: 500 })
    }

    return NextResponse.json({ photo }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
