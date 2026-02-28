import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser, isAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  phone: z.string().min(1).optional(),
  whatsapp: z.string().nullable().optional(),
  email: z.string().email().or(z.literal('')).nullable().optional(),
  address: z.string().min(1).optional(),
  neighborhood: z.string().nullable().optional(),
  category_id: z.string().uuid().or(z.literal('')).nullable().optional(),
  logo_url: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  is_active: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  business_hours: z.any().optional().nullable(),
  cover_url: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  facebook_url: z.string().nullable().optional(),
  instagram_url: z.string().nullable().optional(),
  tiktok_url: z.string().nullable().optional(),
})

interface RouteParams {
  params: { id: string }
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    }

    const supabase = getSupabaseAdmin()

    const { data: business, error } = await supabase
      .from('businesses')
      .select(`
        *,
        category:categories(id, name),
        owner:profiles!businesses_owner_id_fkey(id, full_name, email, phone)
      `)
      .eq('id', params.id)
      .single()

    if (error || !business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    return NextResponse.json(business)
  } catch (error: any) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    }

    const body = await request.json()
    const validated = updateSchema.parse(body)

    const supabase = getSupabaseAdmin()

    // Build update object
    const updateData: Record<string, any> = {}

    if (validated.name !== undefined) updateData.name = validated.name
    if (validated.description !== undefined) updateData.description = validated.description || null
    if (validated.phone !== undefined) updateData.phone = validated.phone
    if (validated.whatsapp !== undefined) updateData.whatsapp = validated.whatsapp || null
    if (validated.email !== undefined) updateData.email = validated.email || null
    if (validated.address !== undefined) updateData.address = validated.address
    if (validated.neighborhood !== undefined) updateData.neighborhood = validated.neighborhood || null
    if (validated.category_id !== undefined) updateData.category_id = validated.category_id || null
    if (validated.logo_url !== undefined) updateData.logo_url = validated.logo_url || null
    if (validated.latitude !== undefined) updateData.latitude = validated.latitude
    if (validated.longitude !== undefined) updateData.longitude = validated.longitude
    if (validated.is_active !== undefined) updateData.is_active = validated.is_active
    if (validated.is_featured !== undefined) updateData.is_featured = validated.is_featured
    if (validated.business_hours !== undefined) updateData.business_hours = validated.business_hours
    if (validated.cover_url !== undefined) updateData.cover_url = validated.cover_url || null
    if (validated.website !== undefined) updateData.website = validated.website || null
    if (validated.facebook_url !== undefined) updateData.facebook_url = validated.facebook_url || null
    if (validated.instagram_url !== undefined) updateData.instagram_url = validated.instagram_url || null
    if (validated.tiktok_url !== undefined) updateData.tiktok_url = validated.tiktok_url || null

    const { data: updated, error: updateError } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar negocio' }, { status: 500 })
    }

    // Log the action
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'edit_business',
        resource_type: 'business',
        resource_id: params.id,
        details: { updated_fields: Object.keys(updateData) },
      })
    } catch {
      // Ignore logging errors
    }

    // Revalidate cached pages
    revalidatePath('/admin/negocios')
    revalidatePath('/dashboard')
    if (updated?.slug) revalidatePath(`/negocios/${updated.slug}`)

    return NextResponse.json({ success: true, business: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    }

    const supabase = getSupabaseAdmin()

    // Verify business exists
    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('id, name, owner_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    // Cascade delete related records
    // Get order IDs first for sub-table cleanup
    const { data: orderIds } = await supabase.from('orders').select('id').eq('business_id', params.id)
    const ids = orderIds?.map((o: any) => o.id) || []
    if (ids.length > 0) {
      await supabase.from('order_items').delete().in('order_id', ids)
      await supabase.from('order_customers').delete().in('order_id', ids)
    }
    await supabase.from('orders').delete().eq('business_id', params.id)
    await supabase.from('products').delete().eq('business_id', params.id)
    await supabase.from('transactions').delete().eq('business_id', params.id)
    await supabase.from('business_photos').delete().eq('business_id', params.id)
    await supabase.from('reviews').delete().eq('business_id', params.id)
    await supabase.from('delivery_men').delete().eq('business_id', params.id)
    await supabase.from('subscriptions').delete().eq('business_id', params.id)
    await supabase.from('notifications').delete().eq('business_id', params.id)

    // Delete the business
    const { error: deleteError } = await supabase
      .from('businesses')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json({ error: 'Error al eliminar negocio: ' + deleteError.message }, { status: 500 })
    }

    // If the business had an owner, check if they have other businesses
    // If not, revert their role to customer
    if (business.owner_id) {
      const { data: otherBusinesses } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', business.owner_id)
        .limit(1)

      if (!otherBusinesses || otherBusinesses.length === 0) {
        await supabase
          .from('profiles')
          .update({ role: 'customer' })
          .eq('id', business.owner_id)
      }
    }

    // Log the action
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'delete_business',
        resource_type: 'business',
        resource_id: params.id,
        details: { business_name: business.name },
      })
    } catch {
      // Ignore logging errors
    }

    // Revalidate cached pages
    revalidatePath('/admin/negocios')
    revalidatePath('/dashboard')
    revalidatePath('/')
    revalidatePath('/buscar')

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
