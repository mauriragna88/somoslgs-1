/**
 * Conekta API v2 client for SomosLagos
 * Uses direct fetch calls - no SDK dependency needed
 * Supports per-business API keys for direct payment mode
 */

const CONEKTA_API_URL = 'https://api.conekta.io'
const CONEKTA_API_VERSION = 'application/vnd.conekta-v2.2.0+json'

/** Platform commission rate for managed payments */
export const PLATFORM_COMMISSION_RATE = 0.015 // 1.5%

/** Minimum order amount for card payments */
export const CARD_MINIMUM_AMOUNT = 100 // $100 MXN

function getAuthHeader(apiKey?: string): string {
  const key = apiKey || process.env.CONEKTA_PRIVATE_KEY
  if (!key) throw new Error('CONEKTA_PRIVATE_KEY no está configurada')
  return 'Basic ' + Buffer.from(key + ':').toString('base64')
}

interface ConektaCustomer {
  name: string
  email: string
  phone: string
}

interface ConektaLineItem {
  name: string
  unit_price: number // centavos (e.g., $100 MXN = 10000)
  quantity: number
}

interface CreateCheckoutParams {
  customer: ConektaCustomer
  lineItems: ConektaLineItem[]
  metadata: Record<string, string>
  successUrl: string
  failureUrl: string
  allowedPaymentMethods?: ('card' | 'cash' | 'bank_transfer')[]
  monthlyInstallmentsEnabled?: boolean
  /** Optional business-specific API key (for direct payment mode) */
  apiKey?: string
}

interface ConektaCheckoutResult {
  orderId: string
  checkoutUrl: string
  checkoutId: string
}

export async function createConektaCheckout(
  params: CreateCheckoutParams
): Promise<ConektaCheckoutResult> {
  const response = await fetch(`${CONEKTA_API_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: CONEKTA_API_VERSION,
      Authorization: getAuthHeader(params.apiKey),
    },
    body: JSON.stringify({
      currency: 'MXN',
      customer_info: {
        name: params.customer.name,
        email: params.customer.email,
        phone: params.customer.phone,
      },
      line_items: params.lineItems.map((item) => ({
        name: item.name,
        unit_price: item.unit_price,
        quantity: item.quantity,
      })),
      checkout: {
        type: 'HostedPayment',
        allowed_payment_methods: params.allowedPaymentMethods || [
          'card',
          'cash',
          'bank_transfer',
        ],
        success_url: params.successUrl,
        failure_url: params.failureUrl,
        monthly_installments_enabled:
          params.monthlyInstallmentsEnabled ?? false,
      },
      metadata: params.metadata,
    }),
  })

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Error desconocido' }))
    throw new Error(
      error.details?.[0]?.message ||
        error.message ||
        'Error al crear checkout de Conekta'
    )
  }

  const data = await response.json()

  return {
    orderId: data.id,
    checkoutUrl: data.checkout.url,
    checkoutId: data.checkout.id,
  }
}

/**
 * Verify a Conekta order by fetching it from the API
 * @param apiKey - Optional business-specific key for direct payment mode
 */
export async function getConektaOrder(orderId: string, apiKey?: string) {
  const response = await fetch(`${CONEKTA_API_URL}/orders/${orderId}`, {
    headers: {
      Accept: CONEKTA_API_VERSION,
      Authorization: getAuthHeader(apiKey),
    },
  })

  if (!response.ok) {
    throw new Error('Error al consultar orden de Conekta')
  }

  return response.json()
}

/**
 * Check if Conekta is properly configured
 */
export function isConektaConfigured(): boolean {
  return !!process.env.CONEKTA_PRIVATE_KEY
}
