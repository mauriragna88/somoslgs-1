import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { businessId, businessName, phone, email } = body as {
      businessId: string
      businessName: string
      phone: string
      email?: string
    }

    // Validacion basica
    if (!businessId || !phone || phone.trim().length < 7) {
      return NextResponse.json(
        { error: 'Datos invalidos. Telefono requerido.' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar que el negocio existe y no esta reclamado
    const { data: business, error: bizError } = await supabase
      .from('businesses')
      .select('id, name, is_claimed, claim_status')
      .eq('id', businessId)
      .single()

    if (bizError || !business) {
      return NextResponse.json(
        { error: 'Negocio no encontrado.' },
        { status: 404 }
      )
    }

    if ((business as { is_claimed: boolean }).is_claimed) {
      return NextResponse.json(
        { error: 'Este negocio ya fue reclamado.' },
        { status: 409 }
      )
    }

    // Verificar si ya existe una solicitud pendiente
    const { data: existing } = await supabase
      .from('business_claims')
      .select('id, status')
      .eq('business_id', businessId)
      .eq('status', 'pending')
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Ya existe una solicitud pendiente para este negocio.' },
        { status: 409 }
      )
    }

    // Crear la solicitud
    const { error: insertError } = await supabase
      .from('business_claims')
      .insert({
        business_id: businessId,
        claimant_name: businessName,
        claimant_phone: phone.trim(),
        claimant_email: email?.trim() || null,
        status: 'pending',
      } as never) as { error: any }

    if (insertError) {
      console.error('Claim insert error:', insertError.message)
      return NextResponse.json(
        { error: 'Error al crear solicitud.' },
        { status: 500 }
      )
    }

    // Actualizar el negocio con info de contacto (claim fields via migration)
    const updateResult = await (supabase as never as {
      from: (t: string) => {
        update: (v: Record<string, unknown>) => {
          eq: (c: string, v: string) => Promise<{ error: unknown }>
        }
      }
    }).from('businesses').update({
      claim_phone: phone.trim(),
      claim_email: email?.trim() || null,
      claim_status: 'pending',
      updated_at: new Date().toISOString(),
    }).eq('id', businessId)
    const updateError = updateResult?.error
    if (updateError) console.error('Update claim fields failed (expected if migration not yet applied):', updateError)

    return NextResponse.json({ success: true, message: 'Solicitud enviada' })
  } catch (err) {
    console.error('Claim API error:', err)
    return NextResponse.json(
      { error: 'Error interno del servidor.' },
      { status: 500 }
    )
  }
}
