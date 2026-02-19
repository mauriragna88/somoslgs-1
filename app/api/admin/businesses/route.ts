import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  try {
    const supabaseServer = createServerClient()

    // Verificar que el usuario sea admin
    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { data: profile } = await supabaseServer
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
    }

    // Use admin client for mutations
    const supabase = getSupabaseAdmin()

    // Obtener datos del request
    const { owner, business } = await request.json()

    // Validaciones del negocio (siempre requeridas)
    if (!business.name || !business.phone || !business.whatsapp || !business.address) {
      return NextResponse.json({ error: 'Datos del negocio incompletos' }, { status: 400 })
    }

    // Calcular fecha de expiración
    const isFree = business.isFree === true
    const days = Number(business.subscriptionDays) || 30
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)

    // --- Flujo SIN dueño ---
    if (!owner || !owner.email) {
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .insert({
          owner_id: null,
          name: business.name,
          slug: business.slug,
          category_id: business.categoryId || null,
          description: business.description || null,
          address: business.address,
          neighborhood: business.neighborhood || null,
          phone: business.phone,
          whatsapp: business.whatsapp,
          email: business.email || null,
          subscription_tier: business.subscriptionTier || 'basico',
          subscription_status: 'active',
          subscription_started_at: new Date().toISOString(),
          subscription_expires_at: expiresAt.toISOString(),
          is_courtesy: isFree,
          is_active: true,
        })
        .select()
        .single()

      if (businessError) {
        console.error('Admin create business error:', businessError)
        return NextResponse.json(
          { error: 'Error al crear negocio' },
          { status: 500 }
        )
      }

      // Revalidate cached pages
      revalidatePath('/admin/negocios')
      revalidatePath('/')
      revalidatePath('/buscar')

      return NextResponse.json({
        success: true,
        business: businessData,
        owner: null,
      })
    }

    // --- Flujo CON dueño ---
    if (!owner.password || !owner.name) {
      return NextResponse.json({ error: 'Datos del dueño incompletos' }, { status: 400 })
    }

    // Paso 1: Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: owner.email,
      password: owner.password,
      email_confirm: true,
      user_metadata: {
        full_name: owner.name,
        phone: owner.phone,
      },
    })

    if (authError || !authData.user) {
      console.error('Admin create user error:', authError)
      const isEmailTaken = authError?.message?.includes('already') || authError?.message?.includes('exists')
      return NextResponse.json(
        { error: isEmailTaken ? 'Este email ya está registrado' : 'Error al crear el usuario' },
        { status: 400 }
      )
    }

    const ownerId = authData.user.id

    try {
      // Paso 2: Crear perfil en la tabla profiles
      const { error: profileError } = await supabase.from('profiles').insert({
        id: ownerId,
        email: owner.email,
        full_name: owner.name,
        phone: owner.phone || null,
        role: 'business_owner',
      })

      if (profileError) {
        console.error('Admin create profile error:', profileError)
        throw new Error('Error al crear perfil')
      }

      // Paso 3: Crear el negocio
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .insert({
          owner_id: ownerId,
          name: business.name,
          slug: business.slug,
          category_id: business.categoryId || null,
          description: business.description || null,
          address: business.address,
          neighborhood: business.neighborhood || null,
          phone: business.phone,
          whatsapp: business.whatsapp,
          email: business.email || null,
          subscription_tier: business.subscriptionTier || 'basico',
          subscription_status: 'active',
          subscription_started_at: new Date().toISOString(),
          subscription_expires_at: expiresAt.toISOString(),
          is_courtesy: isFree,
          is_active: true,
        })
        .select()
        .single()

      if (businessError) {
        console.error('Admin create business with owner error:', businessError)
        throw new Error('Error al crear negocio')
      }

      // Revalidate cached pages
      revalidatePath('/admin/negocios')
      revalidatePath('/dashboard')
      revalidatePath('/')
      revalidatePath('/buscar')

      return NextResponse.json({
        success: true,
        business: businessData,
        owner: { id: ownerId, email: owner.email, name: owner.name },
      })
    } catch (error: any) {
      // Si algo falla después de crear el usuario, intentar eliminarlo (rollback)
      try {
        await supabase.auth.admin.deleteUser(ownerId)
      } catch (rollbackError) {
        // Ignore rollback errors
      }

      console.error('Admin create business rollback:', error)
      return NextResponse.json(
        { error: 'Error al crear el negocio' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Admin businesses route error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
