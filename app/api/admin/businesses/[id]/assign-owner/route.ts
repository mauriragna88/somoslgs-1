import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser, isAdmin } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { sendBusinessLinkedEmail } from '@/lib/email/send'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const createAndLinkSchema = z.object({
  action: z.literal('create_and_link'),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
})

const linkExistingSchema = z.object({
  action: z.literal('link_existing'),
  user_id: z.string().uuid(),
})

interface RouteParams {
  params: { id: string }
}

// GET: List users without businesses (available to be assigned as owners)
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

    // Get all owner_ids from businesses
    const { data: businesses } = await supabase
      .from('businesses')
      .select('owner_id')
      .not('owner_id', 'is', null)

    const ownerIds = (businesses || []).map(b => b.owner_id).filter(Boolean)

    // Get profiles that are NOT admins and NOT already business owners
    let query = supabase
      .from('profiles')
      .select('id, full_name, email, phone, role')
      .neq('role', 'admin')
      .order('full_name')

    const { data: profiles, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
    }

    // Filter out users who already own a business
    const availableUsers = (profiles || []).filter(p => !ownerIds.includes(p.id))

    return NextResponse.json({ users: availableUsers })
  } catch {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: RouteParams) {
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
    const body = await request.json()

    // Verify business exists
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, name, owner_id')
      .eq('id', params.id)
      .single()

    if (bizError || !business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    let ownerId: string
    let ownerInfo: { id: string; email: string; name: string }

    if (body.action === 'create_and_link') {
      const validated = createAndLinkSchema.parse(body)

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: validated.email,
        password: validated.password,
        email_confirm: true,
        user_metadata: {
          full_name: validated.name,
          phone: validated.phone,
        },
      })

      if (authError || !authData.user) {
        return NextResponse.json(
          { error: authError?.message || 'Error al crear usuario' },
          { status: 400 }
        )
      }

      ownerId = authData.user.id

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: ownerId,
        email: validated.email,
        full_name: validated.name,
        phone: validated.phone || null,
        role: 'business_owner',
      })

      if (profileError) {
        // Rollback: delete auth user
        try { await supabase.auth.admin.deleteUser(ownerId) } catch {}
        return NextResponse.json(
          { error: `Error al crear perfil: ${profileError.message}` },
          { status: 500 }
        )
      }

      ownerInfo = { id: ownerId, email: validated.email, name: validated.name }

    } else if (body.action === 'link_existing') {
      const validated = linkExistingSchema.parse(body)

      // Verify user exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', validated.user_id)
        .single()

      if (profileError || !profile) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
      }

      ownerId = profile.id
      ownerInfo = { id: profile.id, email: profile.email, name: profile.full_name }

      // Update user role to business_owner so they can access the dashboard
      await supabase
        .from('profiles')
        .update({ role: 'business_owner' })
        .eq('id', ownerId)

    } else {
      return NextResponse.json({ error: 'Acción no válida' }, { status: 400 })
    }

    // Update business with new owner
    const { error: updateError } = await supabase
      .from('businesses')
      .update({ owner_id: ownerId })
      .eq('id', params.id)

    if (updateError) {
      return NextResponse.json({ error: 'Error al asignar dueño' }, { status: 500 })
    }

    // Log the action
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'assign_owner',
        resource_type: 'business',
        resource_id: params.id,
        details: {
          business_name: business.name,
          previous_owner: business.owner_id,
          new_owner: ownerId,
          method: body.action,
        },
      })
    } catch {
      // Ignore logging errors
    }

    // Send email notifying the owner
    try {
      const { data: bizData } = await supabase
        .from('businesses')
        .select('subscription_tier')
        .eq('id', params.id)
        .single()

      await sendBusinessLinkedEmail({
        ownerName: ownerInfo.name,
        ownerEmail: ownerInfo.email,
        businessName: business.name,
        plan: bizData?.subscription_tier || 'basico',
      })
    } catch {
      // Don't fail the request if email fails
    }

    // Revalidate cached pages
    revalidatePath('/admin/negocios')
    revalidatePath('/dashboard')

    return NextResponse.json({
      success: true,
      owner: ownerInfo,
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
