import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase/server'
import { encryptIfPresent } from '@/lib/encryption'
import { z } from 'zod'

const businessUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  phone: z.string().min(10).optional(),
  whatsapp: z.string().min(10).optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().min(5).optional(),
  category_id: z.string().uuid().optional().nullable().or(z.literal('')),
  logo_url: z.string().url().optional().nullable().or(z.literal('')),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  // Datos bancarios para recibir pagos
  bank_name: z.string().max(50).optional().nullable(),
  bank_account_holder: z.string().max(100).optional().nullable(),
  bank_account_number: z.string().max(20).optional().nullable(),
  bank_clabe: z.string().length(18).optional().nullable().or(z.literal('')),
  // Configuración de pagos con tarjeta
  payment_mode: z.enum(['platform', 'direct']).optional(),
  conekta_private_key: z.string().max(200).optional().nullable().or(z.literal('')),
  // MercadoPago
  mercadopago_access_token: z.string().max(200).optional().nullable().or(z.literal('')),
  active_payment_gateways: z.array(z.enum(['conekta', 'mercadopago'])).optional(),
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

    const { data: business, error } = await supabase
      .from('businesses')
      .select(`
        *,
        category:categories(id, name, icon),
        owner:profiles!businesses_owner_id_fkey(full_name, email, phone)
      `)
      .eq('id', params.id)
      .single()

    if (error || !business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    return NextResponse.json({ business })
  } catch (error) {
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = businessUpdateSchema.parse(body)

    const supabase = getSupabaseAdmin()

    // Verify ownership
    const { data: business, error: fetchError } = await supabase
      .from('businesses')
      .select('owner_id')
      .eq('id', params.id)
      .single()

    if (fetchError || !business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    if (business.owner_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso para editar este negocio' }, { status: 403 })
    }

    // Normalize empty strings to null for nullable fields
    const cleanData = { ...validatedData } as Record<string, any>
    const nullableFields = ['category_id', 'logo_url', 'email', 'bank_name', 'bank_account_holder', 'bank_account_number', 'bank_clabe', 'conekta_private_key', 'mercadopago_access_token']
    for (const field of nullableFields) {
      if (field in cleanData && cleanData[field] === '') {
        cleanData[field] = null
      }
    }

    // Encrypt sensitive API keys before storing
    if (cleanData.conekta_private_key && cleanData.conekta_private_key !== null) {
      cleanData.conekta_private_key = encryptIfPresent(cleanData.conekta_private_key)
    }
    if (cleanData.mercadopago_access_token && cleanData.mercadopago_access_token !== null) {
      cleanData.mercadopago_access_token = encryptIfPresent(cleanData.mercadopago_access_token)
    }

    // Update business
    const { data: updatedBusiness, error: updateError } = await supabase
      .from('businesses')
      .update({
        ...cleanData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar' }, { status: 500 })
    }

    return NextResponse.json({ success: true, business: updatedBusiness })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
