import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser, isAdmin } from '@/lib/supabase/server'
import { z } from 'zod'

const subscriptionUpdateSchema = z.object({
  business_id: z.string().uuid(),
  action: z.enum(['add_days', 'change_tier', 'suspend', 'activate', 'pause', 'resume', 'set_expiration']),
  days: z.number().int().min(1).max(365).optional(),
  tier: z.enum(['gratis', 'emprendedor', 'pro', 'avanzado']).optional(),
  expiration_date: z.string().optional(),
  notes: z.string().optional(),
})

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  try {
    // Verify admin
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    }

    const body = await request.json()
    const validatedData = subscriptionUpdateSchema.parse(body)

    const supabase = getSupabaseAdmin()

    // Get current business data
    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('id, name, subscription_tier, subscription_status, subscription_expires_at, owner_id')
      .eq('id', validatedData.business_id)
      .single()

    if (fetchError || !business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    const updateData: Record<string, any> = {}

    switch (validatedData.action) {
      case 'add_days':
        if (!validatedData.days) {
          return NextResponse.json({ error: 'Días requeridos' }, { status: 400 })
        }
        // Calculate new expiration date
        const currentExpires = business.subscription_expires_at
          ? new Date(business.subscription_expires_at)
          : new Date()

        // If already expired, start from today
        const baseDate = currentExpires < new Date() ? new Date() : currentExpires
        baseDate.setDate(baseDate.getDate() + validatedData.days)

        updateData.subscription_expires_at = baseDate.toISOString()
        updateData.subscription_status = 'active'
        break

      case 'change_tier':
        if (!validatedData.tier) {
          return NextResponse.json({ error: 'Plan requerido' }, { status: 400 })
        }
        updateData.subscription_tier = validatedData.tier

        // If no expiration date, set 30 days
        if (!business.subscription_expires_at) {
          const expires = new Date()
          expires.setDate(expires.getDate() + 30)
          updateData.subscription_expires_at = expires.toISOString()
        }
        updateData.subscription_status = 'active'
        break

      case 'suspend':
        updateData.subscription_status = 'suspended'
        break

      case 'activate':
        updateData.subscription_status = 'active'
        // If no expiration or expired, set 30 days
        if (!business.subscription_expires_at || new Date(business.subscription_expires_at) < new Date()) {
          const expires = new Date()
          expires.setDate(expires.getDate() + 30)
          updateData.subscription_expires_at = expires.toISOString()
        }
        break

      case 'pause':
        updateData.subscription_status = 'paused'
        break

      case 'resume':
        updateData.subscription_status = 'active'
        if (!business.subscription_expires_at || new Date(business.subscription_expires_at) < new Date()) {
          const expires = new Date()
          expires.setDate(expires.getDate() + 30)
          updateData.subscription_expires_at = expires.toISOString()
        }
        break

      case 'set_expiration':
        if (!validatedData.expiration_date) {
          return NextResponse.json({ error: 'Fecha requerida' }, { status: 400 })
        }
        updateData.subscription_expires_at = new Date(validatedData.expiration_date).toISOString()
        break
    }

    // Update business
    const { data: updatedBusiness, error: updateError } = await supabase
      .from('businesses')
      .update(updateData)
      .eq('id', validatedData.business_id)
      .select()
      .single()

    if (updateError) {

      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }

    // Log to subscription_history
    try {
      await supabase.from('subscription_history').insert({
        business_id: validatedData.business_id,
        admin_id: user.id,
        action: validatedData.action,
        previous_tier: business.subscription_tier,
        new_tier: updateData.subscription_tier || business.subscription_tier,
        previous_status: business.subscription_status,
        new_status: updateData.subscription_status || business.subscription_status,
        previous_expires_at: business.subscription_expires_at,
        new_expires_at: updateData.subscription_expires_at || business.subscription_expires_at,
        days_added: validatedData.days || null,
        notes: validatedData.notes || null,
      })
    } catch {
      // Ignore if table doesn't exist yet
    }

    // Log the action to admin_logs
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: `subscription_${validatedData.action}`,
        resource_type: 'business',
        resource_id: validatedData.business_id,
        details: {
          business_name: business.name,
          previous_tier: business.subscription_tier,
          previous_status: business.subscription_status,
          previous_expires: business.subscription_expires_at,
          new_data: updateData,
          notes: validatedData.notes,
        },
      })
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json({
      success: true,
      business: updatedBusiness,
      message: getSuccessMessage(validatedData.action, validatedData.days, validatedData.tier),
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

function getSuccessMessage(action: string, days?: number, tier?: string): string {
  switch (action) {
    case 'add_days':
      return `Se agregaron ${days} días a la suscripción`
    case 'change_tier':
      return `Plan actualizado a ${tier}`
    case 'suspend':
      return 'Suscripción suspendida'
    case 'activate':
      return 'Suscripción activada'
    case 'pause':
      return 'Suscripción pausada'
    case 'resume':
      return 'Suscripción reanudada'
    case 'set_expiration':
      return 'Fecha de expiración actualizada'
    default:
      return 'Actualización exitosa'
  }
}

// GET: Get businesses expiring soon
export async function GET(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const daysAhead = parseInt(searchParams.get('days') || '7')

    const supabase = getSupabaseAdmin()

    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)

    // Get businesses expiring within X days
    const { data: expiringBusinesses, error } = await supabase
      .from('businesses')
      .select(`
        id, name, slug, phone, whatsapp,
        subscription_tier, subscription_status, subscription_expires_at,
        owner:profiles!businesses_owner_id_fkey(full_name, email, phone)
      `)
      .eq('subscription_status', 'active')
      .lte('subscription_expires_at', futureDate.toISOString())
      .gte('subscription_expires_at', new Date().toISOString())
      .order('subscription_expires_at', { ascending: true })

    if (error) {

      return NextResponse.json({ error: 'Error al obtener negocios' }, { status: 500 })
    }

    // Get already expired businesses
    const { data: expiredBusinesses } = await supabase
      .from('businesses')
      .select(`
        id, name, slug, phone, whatsapp,
        subscription_tier, subscription_status, subscription_expires_at,
        owner:profiles!businesses_owner_id_fkey(full_name, email, phone)
      `)
      .eq('subscription_status', 'active')
      .lt('subscription_expires_at', new Date().toISOString())
      .order('subscription_expires_at', { ascending: false })
      .limit(20)

    return NextResponse.json({
      expiring: expiringBusinesses || [],
      expired: expiredBusinesses || [],
    })

  } catch (error) {

    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
