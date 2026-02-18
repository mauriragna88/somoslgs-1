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

interface TransactionWithBusiness {
  id: string
  status: string
  businesses: { owner_id: string }
}

const uploadProofSchema = z.object({
  proof_url: z.string().url(),
  proof_notes: z.string().optional(),
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const transactionId = params.id
    if (!transactionId) {
      return NextResponse.json({ error: 'ID de transacción requerido' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = uploadProofSchema.parse(body)

    const supabase = getSupabaseAdmin()

    // Get the transaction and verify ownership
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*, businesses!inner(owner_id)')
      .eq('id', transactionId)
      .single() as { data: TransactionWithBusiness | null; error: any }

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Transacción no encontrada' }, { status: 404 })
    }

    // Verify user owns this business
    if (transaction.businesses.owner_id !== user.id) {
      return NextResponse.json({ error: 'No tienes permiso' }, { status: 403 })
    }

    // Verify transaction is in awaiting_proof status
    if (transaction.status !== 'awaiting_proof') {
      return NextResponse.json({
        error: 'Esta transacción no está esperando comprobante'
      }, { status: 400 })
    }

    // Update transaction with proof and change status to pending (awaiting admin approval)
    const { data: updatedTransaction, error: updateError } = await supabase
      .from('transactions')
      .update({
        proof_url: validatedData.proof_url,
        proof_notes: validatedData.proof_notes,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar la transacción' }, { status: 500 })
    }

    // Send email notification to admin
    try {
      const { data: txFull } = await supabase
        .from('transactions')
        .select('amount, subscription_tier, business_id')
        .eq('id', transactionId)
        .single()

      if (txFull) {
        const { data: biz } = await supabase
          .from('businesses')
          .select('name')
          .eq('id', txFull.business_id)
          .single()

        const { data: ownerProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .single()

        await sendPaymentReceivedToAdmin({
          businessName: biz?.name || 'Sin nombre',
          ownerName: ownerProfile?.full_name || 'Sin nombre',
          amount: txFull.amount,
          plan: txFull.subscription_tier,
          paymentMethod: 'transfer',
        })
      }
    } catch {
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      message: 'Comprobante enviado correctamente. Te notificaremos cuando sea aprobado.'
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 })
  }
}
