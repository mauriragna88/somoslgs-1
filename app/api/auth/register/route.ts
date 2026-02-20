import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { checkRegisterRateLimit } from '@/lib/security'
import { sendWelcomeAccountEmail } from '@/lib/email/send'

// Schema de validación
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  phone: z.string().regex(/^\d{10}$/, 'El teléfono debe tener 10 dígitos').optional().or(z.literal('')),
})

export async function POST(request: Request) {
  try {
    // Rate limiting por IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rateLimit = checkRegisterRateLimit(ip)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Demasiados intentos de registro. Intenta de nuevo más tarde.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Crear cliente con service role para tener permisos completos
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: true, // Auto-confirmar email para desarrollo
      user_metadata: {
        full_name: validatedData.fullName,
        phone: validatedData.phone,
      }
    })

    if (authError) {

      if (authError.message.includes('already been registered') || (authError as any).code === 'user_already_exists') {
        return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 400 })
      }
      return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Error al crear usuario' }, { status: 500 })
    }

    // 2. Crear perfil en la tabla profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: validatedData.email,
        full_name: validatedData.fullName,
        phone: validatedData.phone || null,
        role: 'customer',
      })

    if (profileError) {

      // Si falla, eliminar el usuario de auth
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json({ error: 'Error al crear perfil' }, { status: 500 })
    }

    // Send welcome email
    try {
      await sendWelcomeAccountEmail({
        name: validatedData.fullName,
        email: validatedData.email,
      })
    } catch {
      // Don't fail registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: authData.user.id,
        email: authData.user.email,
      }
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }

    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
