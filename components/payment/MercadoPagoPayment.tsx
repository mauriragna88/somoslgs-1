'use client'

import { useState } from 'react'

interface MercadoPagoPaymentProps {
  business: {
    id: string
    name: string
    subscription_tier: string
  }
  amount: number
  onBack: () => void
}

export default function MercadoPagoPayment({ business, amount, onBack }: MercadoPagoPaymentProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePay = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/mercadopago/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'subscription',
          business_id: business.id,
          tier: business.subscription_tier,
          amount,
          months: 1,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear checkout de MercadoPago')
      }

      window.location.href = data.init_point
    } catch (err: any) {
      setError(err.message || 'Error al procesar el pago')
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-[#009ee3] to-[#0077b6] text-white p-6">
        <button
          onClick={onBack}
          className="text-white hover:text-gray-200 mb-4 flex items-center gap-2 text-sm"
        >
          ← Volver a metodos de pago
        </button>
        <h2 className="text-2xl font-bold">Pago con Mercado Pago</h2>
        <p className="text-white/90 mt-1">Paga de forma segura con tarjeta, OXXO o SPEI</p>
      </div>

      <div className="p-8 text-center">
        <p className="text-gray-600 mb-6">
          Seras redirigido a Mercado Pago para completar tu pago de forma segura.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          onClick={handlePay}
          disabled={loading}
          className="w-full py-4 bg-[#009ee3] hover:bg-[#0077b6] text-white text-lg font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? 'Redirigiendo...' : `Pagar con Mercado Pago`}
        </button>
      </div>
    </div>
  )
}
