import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getUser } from '@/lib/supabase/server'
import { z } from 'zod'
import { sendPaymentReceivedToAdmin } from '@/lib/email/send'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

const transferSchema = z.object({
  business_id: z.string().uuid(),
  amount: z.number().positive(),
  subscription_tier: z.enum(['basico', 'ventas', 'delivery', 'premium']),
  proof_url: z.string().url().optional(),
  proof_notes: z.string().optional(),
  subscription_months: z.number().int().positive().default(1),
  status: z.enum(['pending', 'awaiting_proof']).optional(),
})

export async function POST(request: Request) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = transferSchema.parse(body)

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

    // Determine status based on whether proof is provided
    const transactionStatus = validatedData.status === 'awaiting_proof' || !validatedData.proof_url
      ? 'awaiting_proof'
      : 'pending'

    // Check if there's already a pending or awaiting_proof transaction
    const { data: existingTransaction } = await supabase
      .from('transactions')
      .select('id, status')
      .eq('business_id', validatedData.business_id)
      .in('status', ['pending', 'awaiting_proof'])
      .single()

    if (existingTransaction) {
      if (existingTransaction.status === 'awaiting_proof') {
        return NextResponse.json({
          error: 'Ya tienes un pago pre-registrado. Ve a tu dashboard para subir el comprobante.'
        }, { status: 400 })
      }
      return NextResponse.json({
        error: 'Ya tienes un pago pendiente de aprobación'
      }, { status: 400 })
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        business_id: validatedData.business_id,
        user_id: user.id,
        amount: validatedData.amount,
        currency: 'MXN',
        subscription_tier: validatedData.subscription_tier,
        subscription_months: validatedData.subscription_months,
        payment_method: 'transfer',
        status: transactionStatus,
        proof_url: validatedData.proof_url || null,
        proof_notes: validatedData.proof_notes,
      })
      .select()
      .single()

    if (transactionError) {
      return NextResponse.json({ error: 'Error al registrar el pago' }, { status: 500 })
    }

    // Send email notification to admin when proof is submitted
    if (transactionStatus === 'pending') {
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()

      try {
        await sendPaymentReceivedToAdmin({
          businessName: business.name,
          ownerName: ownerProfile?.full_name || 'Sin nombre',
          amount: validatedData.amount,
          plan: validatedData.subscription_tier,
          paymentMethod: 'transfer',
        })
      } catch {
        // Don't fail the request if email fails
      }
    }

    const message = transactionStatus === 'awaiting_proof'
      ? 'Pago pre-registrado. Tienes 48 horas para subir tu comprobante.'
      : 'Comprobante enviado correctamente. Te notificaremos cuando sea aprobado.'

    return NextResponse.json({
      success: true,
      transaction,
      message
    }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
