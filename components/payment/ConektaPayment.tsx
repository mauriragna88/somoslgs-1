'use client'

import { useState } from 'react'

interface ConektaPaymentProps {
  business: {
    id: string
    name: string
    subscription_tier: string
  }
  amount: number
  onBack: () => void
}

export default function ConektaPayment({
  business,
  amount,
  onBack,
}: ConektaPaymentProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePayment = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/conekta/create-checkout', {
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
        throw new Error(data.error || 'Error al procesar el pago')
      }

      // Redirect to Conekta hosted checkout
      window.location.href = data.checkout_url
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error al procesar el pago'
      )
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
        <button
          onClick={onBack}
          className="text-white hover:text-gray-200 mb-4 flex items-center gap-2 text-sm"
        >
          ← Volver a métodos de pago
        </button>
        <h2 className="text-2xl font-bold">Pago con Tarjeta</h2>
        <p className="text-white/90 mt-1">Paga de forma segura con Conekta</p>
      </div>

      <div className="p-6">
        {/* Payment Summary */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">Plan:</span>
            <span className="font-bold text-gray-900 capitalize">
              {business.subscription_tier}
            </span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-600">Negocio:</span>
            <span className="font-bold text-gray-900">{business.name}</span>
          </div>
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <span className="text-gray-600">Total a pagar:</span>
            <span className="text-3xl font-bold text-primary">
              ${amount.toLocaleString('es-MX')}{' '}
              <span className="text-lg">MXN</span>
            </span>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="text-green-600">✓</span>
            <span>Tarjeta de crédito o débito (Visa, Mastercard, Amex)</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="text-green-600">✓</span>
            <span>Pago en OXXO (efectivo)</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="text-green-600">✓</span>
            <span>Transferencia SPEI</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="text-green-600">✓</span>
            <span>Activación inmediata al confirmar pago</span>
          </div>
          {amount >= 300 && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="text-green-600">✓</span>
              <span>Meses sin intereses disponibles</span>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Conectando con Conekta...
            </span>
          ) : (
            `Pagar $${amount.toLocaleString('es-MX')} MXN`
          )}
        </button>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
          <span>Pago seguro procesado por Conekta</span>
        </div>
      </div>
    </div>
  )
}
