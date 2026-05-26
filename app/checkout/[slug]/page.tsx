import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isConektaConfigured } from '@/lib/conekta'
import { isMercadoPagoConfigured } from '@/lib/mercadopago'
import CheckoutForm from '@/components/checkout/CheckoutForm'

interface PageProps {
  params: { slug: string }
}

interface CheckoutBusiness {
  id: string
  name: string
  slug: string
  whatsapp: string | null
  address: string | null
  bank_name: string | null
  bank_account_holder: string | null
  bank_account_number: string | null
  bank_clabe: string | null
  payment_mode: string | null
  conekta_private_key: string | null
  mercadopago_access_token: string | null
  active_payment_gateways: string[] | null
}

export default async function CheckoutPage({ params }: PageProps) {
  const supabase = createClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, slug, whatsapp, address, bank_name, bank_account_holder, bank_account_number, bank_clabe, payment_mode, conekta_private_key, mercadopago_access_token, active_payment_gateways')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single() as { data: CheckoutBusiness | null }

  if (!business) {
    notFound()
  }

  const gateways = business.active_payment_gateways || []

  // Conekta: enabled if gateway is active AND (platform has key OR business has own key)
  const conektaGatewayActive = gateways.includes('conekta')
  const businessHasConektaKey = business.payment_mode === 'direct' && !!business.conekta_private_key
  const conektaEnabled = conektaGatewayActive
    ? (isConektaConfigured() || businessHasConektaKey)
    : (isConektaConfigured() || businessHasConektaKey) // backwards compat: if no gateways configured, use old logic

  // MercadoPago: enabled if gateway is active AND (platform has key OR business has own key)
  const mercadoPagoGatewayActive = gateways.includes('mercadopago')
  const businessHasMPKey = business.payment_mode === 'direct' && !!business.mercadopago_access_token
  const mercadoPagoEnabled = mercadoPagoGatewayActive && (isMercadoPagoConfigured() || businessHasMPKey)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900">Completar Pedido</h1>
          <p className="text-gray-600">
            Pedido de <span className="font-medium" style={{ color: 'var(--coral)' }}>{business.name}</span>
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <CheckoutForm
          business={{
            id: business.id,
            name: business.name,
            slug: business.slug,
            whatsapp: business.whatsapp,
            address: business.address,
            bankData: {
              bank_name: business.bank_name,
              bank_account_holder: business.bank_account_holder,
              bank_account_number: business.bank_account_number,
              bank_clabe: business.bank_clabe,
            },
          }}
          conektaEnabled={conektaEnabled}
          mercadoPagoEnabled={mercadoPagoEnabled}
        />
      </div>
    </main>
  )
}
