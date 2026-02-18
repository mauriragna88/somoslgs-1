import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase/server'
import { z } from 'zod'
import { slugify } from '@/lib/utils'
import { sendWelcomeEmail } from '@/lib/email/send'

const businessSchema = z.object({
  name: z.string().min(3).max(100),
  category_id: z.string().uuid(),
  description: z.string().min(20),
  address: z.string().min(10),
  phone: z.string().regex(/^\d{10}$/),
  whatsapp: z.string().regex(/^\d{10}$/).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  subscription_tier: z.enum(['basico', 'ventas', 'delivery', 'premium']),
  logo_url: z.string().url().optional().or(z.literal('')),
  admin_free_activation: z.boolean().optional(),
})

export async function POST(request: Request) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()

    const validatedData = businessSchema.parse(body)

    // Usar service role para tener permisos completos
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar si el usuario tiene un perfil válido
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({
        error: 'No se encontró el perfil del usuario. Por favor, contacta soporte.'
      }, { status: 400 })
    }

    // Server-side verification: only admins can use free activation
    const isAdminFree = validatedData.admin_free_activation === true && profile.role === 'admin'

    // Generate unique slug
    let slug = slugify(validatedData.name)
    let slugExists = true
    let counter = 0

    while (slugExists) {
      const testSlug = counter === 0 ? slug : `${slug}-${counter}`
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', testSlug)
        .single()

      if (!data) {
        slug = testSlug
        slugExists = false
      } else {
        counter++
      }
    }

    // Create business
    const now = new Date().toISOString()
    const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .insert({
        owner_id: user.id,
        name: validatedData.name,
        slug,
        category_id: validatedData.category_id,
        description: validatedData.description,
        address: validatedData.address,
        city: 'Lagos de Moreno',
        state: 'Jalisco',
        phone: validatedData.phone,
        whatsapp: validatedData.whatsapp || validatedData.phone,
        email: validatedData.email || null,
        logo_url: validatedData.logo_url || null,
        subscription_tier: validatedData.subscription_tier,
        ...(isAdminFree
          ? {
              subscription_status: 'active',
              is_active: true,
              subscription_started_at: now,
              subscription_expires_at: oneYearLater,
            }
          : {
              subscription_status: 'inactive',
              is_active: false,
            }),
      })
      .select()
      .single()

    if (businessError) {
      console.error('Business register error:', businessError)
      return NextResponse.json({
        error: 'Error al crear el negocio'
      }, { status: 500 })
    }

    // Update user role to business_owner (skip for admins to preserve admin role)
    if (profile.role !== 'admin') {
      await supabase
        .from('profiles')
        .update({ role: 'business_owner' })
        .eq('id', user.id)
    }

    // Send welcome email
    try {
      await sendWelcomeEmail({
        ownerName: profile.full_name,
        ownerEmail: user.email || '',
        businessName: validatedData.name,
        plan: validatedData.subscription_tier,
      })
    } catch {
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      business,
      message: 'Negocio registrado exitosamente. Estamos revisando tu solicitud y te contactaremos pronto con las instrucciones de pago.'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Business register error:', error)
    return NextResponse.json({
      error: 'Error del servidor'
    }, { status: 500 })
  }
}
