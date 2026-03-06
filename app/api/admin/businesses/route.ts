import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const adminBusinessSchema = z.object({
  name: z.string().min(2, 'Nombre muy corto').max(100),
  slug: z.string().min(2).max(100),
  categoryId: z.string().uuid().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  address: z.string().min(5, 'Dirección muy corta').max(200),
  neighborhood: z.string().max(100).nullable().optional(),
  phone: z.string().regex(/^\d{10}$/, 'Teléfono debe tener 10 dígitos'),
  whatsapp: z.string().regex(/^\d{10}$/, 'WhatsApp debe tener 10 dígitos'),
  email: z.string().email().or(z.literal('')).nullable().optional(),
  businessType: z.enum(['productos', 'servicios', 'ambos']).default('productos'),
  businessHours: z.any().nullable().optional(),
  subscriptionTier: z.enum(['gratis', 'emprendedor', 'pro', 'avanzado']).default('gratis'),
  subscriptionDays: z.number().int().min(1).max(365).optional(),
  isFree: z.boolean().optional(),
})

const adminOwnerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Contraseña muy corta'),
  name: z.string().min(2, 'Nombre muy corto').max(100),
  phone: z.string().optional(),
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

    // Obtener y validar datos del request
    const body = await request.json()
    const { owner, business: rawBusiness } = body

    let business
    try {
      business = adminBusinessSchema.parse(rawBusiness)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
      }
      return NextResponse.json({ error: 'Datos del negocio inválidos' }, { status: 400 })
    }

    // Calcular fecha de expiración
    // Plan gratis = sin expiración (null)
    const isFree = business.isFree === true
    const isGratis = business.subscriptionTier === 'gratis'
    let expiresAt: Date | null = null

    if (!isGratis) {
      const days = Number(business.subscriptionDays) || 30
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + days)
    }

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
          business_type: business.businessType || 'productos',
          business_hours: business.businessHours || null,
          subscription_tier: business.subscriptionTier || 'gratis',
          subscription_status: 'active',
          subscription_started_at: new Date().toISOString(),
          subscription_expires_at: expiresAt ? expiresAt.toISOString() : null,
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
    let validatedOwner
    try {
      validatedOwner = adminOwnerSchema.parse(owner)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json({ error: err.errors[0].message }, { status: 400 })
      }
      return NextResponse.json({ error: 'Datos del dueño inválidos' }, { status: 400 })
    }

    // Paso 1: Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validatedOwner.email,
      password: validatedOwner.password,
      email_confirm: true,
      user_metadata: {
        full_name: validatedOwner.name,
        phone: validatedOwner.phone,
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
        email: validatedOwner.email,
        full_name: validatedOwner.name,
        phone: validatedOwner.phone || null,
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
          business_type: business.businessType || 'productos',
          business_hours: business.businessHours || null,
          subscription_tier: business.subscriptionTier || 'gratis',
          subscription_status: 'active',
          subscription_started_at: new Date().toISOString(),
          subscription_expires_at: expiresAt ? expiresAt.toISOString() : null,
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
        owner: { id: ownerId, email: validatedOwner.email, name: validatedOwner.name },
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
