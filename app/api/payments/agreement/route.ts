import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase/server'
import { z } from 'zod'
import { sendAgreementToAdmin } from '@/lib/email/send'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const agreementSchema = z.object({
  business_id: z.string().uuid(),
  amount: z.number().positive(),
  subscription_tier: z.enum(['pro', 'avanzado']),
})

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = agreementSchema.parse(body)

    const supabase = getSupabaseAdmin()

    // Verify user owns this business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('owner_id, name')
      .eq('id', validatedData.business_id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 })
    }

    if (business.owner_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 })
    }

    // Check if there's already a pending transaction
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('id, status')
      .eq('business_id', validatedData.business_id)
      .in('status', ['pending', 'awaiting_proof'])
      .single()

    if (existingTransaction) {
      return NextResponse.json({
        error: 'Ya tienes un pago pendiente. Revisa tu dashboard.'
      }, { status: 400 })
    }

    // Create transaction with agreement payment method
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        business_id: validatedData.business_id,
        user_id: user.id,
        amount: validatedData.amount,
        currency: 'MXN',
        subscription_tier: validatedData.subscription_tier,
        subscription_months: 1,
        payment_method: 'agreement',
        status: 'pending',
      })
      .select()
      .single()

    if (transactionError) {
      return NextResponse.json({ error: 'Error al registrar el acuerdo' }, { status: 500 })
    }

    // Notify admin
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('full_name, phone, email')
      .eq('id', user.id)
      .single()

    try {
      await sendAgreementToAdmin({
        businessName: business.name,
        ownerName: ownerProfile?.full_name || 'Sin nombre',
        ownerPhone: ownerProfile?.phone || '',
        ownerEmail: ownerProfile?.email || user.email || '',
        amount: validatedData.amount,
        plan: validatedData.subscription_tier,
      })
    } catch {
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Acuerdo registrado. Nos pondremos en contacto contigo.'
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
