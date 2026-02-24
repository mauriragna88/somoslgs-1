export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'
import PaymentForm from '@/components/payment/PaymentForm'
import UploadProofSection from '@/components/payment/UploadProofSection'

interface Business {
  id: string
  name: string
  subscription_tier: string
  is_active: boolean
  status: string
}

interface Transaction {
  id: string
  amount: number
  subscription_tier: string
  payment_method: string
  created_at: string
  status: 'pending' | 'awaiting_proof' | 'approved' | 'rejected'
}

export default async function PagoPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()

  // Get user's businesses (only needed fields)
  const { data: allBusinesses } = await supabase
    .from('businesses')
    .select('id, name, subscription_tier, is_active, status')
    .eq('owner_id', user.id) as { data: Business[] | null }

  // Get selected business from cookies
  const cookieStore = await cookies()
  const selectedBusinessId = cookieStore.get('selected_business_id')?.value

  // Use selected business or first one
  const business = selectedBusinessId
    ? allBusinesses?.find(b => b.id === selectedBusinessId) || allBusinesses?.[0]
    : allBusinesses?.[0]

  if (!business) {
    redirect('/dashboard')
  }

  const typedBusiness = business as Business

  // Check if business is already active
  if (typedBusiness.is_active && typedBusiness.status === 'active') {
    redirect('/dashboard?payment=already-active')
  }

  // Get pending or awaiting_proof transactions for this business
  const { data: pendingTransaction } = await supabase
    .from('transactions')
    .select('id, amount, subscription_tier, payment_method, created_at, status')
    .eq('business_id', typedBusiness.id)
    .in('status', ['pending', 'awaiting_proof'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const typedTransaction = pendingTransaction as Transaction | null

  // Get bank details from environment
  const bankDetails = {
    name: process.env.BANK_NAME || 'BBVA',
    holder: process.env.BANK_ACCOUNT_HOLDER || 'Nombre del Titular',
    account: process.env.BANK_ACCOUNT_NUMBER || '1234567890',
    clabe: process.env.BANK_CLABE || '012345678901234567',
  }

  // Calculate amount based on plan (precios accesibles para Lagos de Moreno)
  const planPrices: Record<string, number> = {
    pro: 100,
    avanzado: 180,
  }

  const amount = planPrices[typedBusiness.subscription_tier] || 99

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Completa el Pago de tu Suscripción
        </h1>
        <p className="text-gray-600">
          Último paso para activar tu negocio en el directorio
        </p>
      </div>

      {typedTransaction?.status === 'awaiting_proof' ? (
        /* Transacción esperando comprobante */
        <UploadProofSection
          transaction={typedTransaction}
          business={typedBusiness}
          bankDetails={bankDetails}
        />
      ) : typedTransaction?.status === 'pending' ? (
        /* Ya tiene un pago pendiente de aprobacion */
        <div className={`${typedTransaction.payment_method === 'agreement' ? 'bg-amber-50 border-amber-200' : 'bg-yellow-50 border-yellow-200'} border-2 rounded-xl p-8 text-center`}>
          <div className={`w-20 h-20 ${typedTransaction.payment_method === 'agreement' ? 'bg-amber-100' : 'bg-yellow-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <span className="text-5xl">{typedTransaction.payment_method === 'agreement' ? '🤝' : '⏳'}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {typedTransaction.payment_method === 'agreement' ? 'Acuerdo de Pago Registrado' : 'Pago en Revision'}
          </h2>
          <p className="text-gray-700 mb-4">
            {typedTransaction.payment_method === 'agreement'
              ? 'Tu solicitud de pago por acuerdo esta registrada. Nos pondremos en contacto contigo para coordinar el pago en persona.'
              : 'Tu comprobante de pago esta siendo verificado por nuestro equipo. Te notificaremos por email cuando sea aprobado.'}
          </p>
          <div className="bg-white rounded-lg p-4 mt-6 text-left max-w-md mx-auto">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Monto:</strong> ${typedTransaction.amount.toLocaleString('es-MX')} MXN
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Plan:</strong> <span className="capitalize">{typedTransaction.subscription_tier}</span>
            </p>
            <p className="text-sm text-gray-600">
              <strong>Enviado:</strong> {new Date(typedTransaction.created_at).toLocaleDateString('es-MX', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            ¿Necesitas ayuda? Contáctanos: {process.env.ADMIN_EMAIL || 'admin@directoriolagos.com'}
          </p>
        </div>
      ) : (
        /* Mostrar opciones de pago */
        <PaymentForm
          business={typedBusiness}
          amount={amount}
          bankDetails={bankDetails}
        />
      )}
    </div>
  )
}
