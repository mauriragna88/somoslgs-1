'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TransferPayment from './TransferPayment'
import ConektaPayment from './ConektaPayment'

interface PaymentFormProps {
  business: {
    id: string
    name: string
    subscription_tier: string
  }
  amount: number
  bankDetails: {
    name: string
    holder: string
    account: string
    clabe: string
  }
}

export default function PaymentForm({ business, amount, bankDetails }: PaymentFormProps) {
  const router = useRouter()
  const [paymentMethod, setPaymentMethod] = useState<'transfer' | 'conekta' | 'agreement' | null>(null)
  const [agreementLoading, setAgreementLoading] = useState(false)
  const [agreementDone, setAgreementDone] = useState(false)

  const handleAgreement = async () => {
    setAgreementLoading(true)
    try {
      const res = await fetch('/api/payments/agreement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business.id,
          amount,
          subscription_tier: business.subscription_tier,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Error al registrar el acuerdo')
        return
      }
      setAgreementDone(true)
    } catch {
      alert('Error de conexion')
    } finally {
      setAgreementLoading(false)
    }
  }

  return (
    <div>
      {agreementDone ? (
        /* Confirmacion de acuerdo */
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-8 text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-5xl">🤝</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Acuerdo Registrado
          </h2>
          <p className="text-gray-700 mb-4">
            Tu solicitud de pago por acuerdo ha sido registrada. Nos pondremos en contacto contigo
            para coordinar el pago en persona.
          </p>
          <div className="bg-white rounded-lg p-4 mt-6 text-left max-w-md mx-auto">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Plan:</strong> <span className="capitalize">{business.subscription_tier}</span>
            </p>
            <p className="text-sm text-gray-600">
              <strong>Monto:</strong> ${amount.toLocaleString('es-MX')} MXN
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-6 px-6 py-2 text-white font-semibold rounded-lg transition-colors" style={{ background: 'var(--coral)' }}
          >
            Ir al Dashboard
          </button>
        </div>
      ) : !paymentMethod ? (
        /* Seleccion de metodo de pago */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Opcion 1: Transferencia Bancaria */}
          <button
            onClick={() => setPaymentMethod('transfer')}
            className="bg-white rounded-xl border-2 border-gray-200 hover:border-[#FF6B35] hover:shadow-lg transition-all p-4 sm:p-6 md:p-8 text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🏦</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Transferencia Bancaria
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Realiza una transferencia SPEI desde tu banco y sube el comprobante
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Sin comisiones adicionales
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Aprobacion en 24-48 horas
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Seguro y confiable
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Total a pagar:</span>
                <span className="text-2xl font-bold" style={{ color: 'var(--coral)' }}>
                  ${amount.toLocaleString('es-MX')} <span className="text-sm">MXN</span>
                </span>
              </div>
            </div>
          </button>

          {/* Opcion 2: Pago con Tarjeta (Conekta) */}
          <button
            onClick={() => setPaymentMethod('conekta')}
            className="bg-white rounded-xl border-2 border-gray-200 hover:border-[#FF6B35] hover:shadow-lg transition-all p-4 sm:p-6 md:p-8 text-left relative overflow-hidden"
          >
            <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
              INSTANTANEO
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">💳</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Pago con Tarjeta
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Paga con tarjeta, OXXO o SPEI a traves de Conekta
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Activacion inmediata
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Tarjeta, OXXO o SPEI
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    100% seguro
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Total a pagar:</span>
                <span className="text-2xl font-bold" style={{ color: 'var(--coral)' }}>
                  ${amount.toLocaleString('es-MX')} <span className="text-sm">MXN</span>
                </span>
              </div>
            </div>
          </button>

          {/* Opcion 3: Acordar pago en persona */}
          <button
            onClick={() => setPaymentMethod('agreement')}
            className="bg-white rounded-xl border-2 border-gray-200 hover:border-amber-400 hover:shadow-lg transition-all p-4 sm:p-6 md:p-8 text-left"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">🤝</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Acordar
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Coordina el pago en persona con nuestro equipo
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Pago en efectivo o en persona
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Te contactamos para coordinar
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    Trato directo y personalizado
                  </li>
                </ul>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 text-sm">Total a pagar:</span>
                <span className="text-2xl font-bold" style={{ color: 'var(--coral)' }}>
                  ${amount.toLocaleString('es-MX')} <span className="text-sm">MXN</span>
                </span>
              </div>
            </div>
          </button>
        </div>
      ) : paymentMethod === 'agreement' ? (
        /* Confirmacion de acuerdo */
        <div className="bg-white rounded-xl border-2 border-gray-200 p-8 max-w-lg mx-auto">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-5xl">🤝</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Acordar Pago</h3>
            <p className="text-gray-600 text-sm">
              Al confirmar, registraremos tu interes y nos pondremos en contacto contigo para coordinar el pago.
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Negocio:</span>
              <span className="text-sm font-medium text-gray-900">{business.name}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Plan:</span>
              <span className="text-sm font-medium text-gray-900 capitalize">{business.subscription_tier}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Monto:</span>
              <span className="text-sm font-bold" style={{ color: 'var(--coral)' }}>${amount.toLocaleString('es-MX')} MXN</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setPaymentMethod(null)}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors"
            >
              Volver
            </button>
            <button
              onClick={handleAgreement}
              disabled={agreementLoading}
              className="flex-1 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              {agreementLoading ? 'Registrando...' : 'Confirmar Acuerdo'}
            </button>
          </div>
        </div>
      ) : paymentMethod === 'transfer' ? (
        /* Formulario de transferencia */
        <TransferPayment
          business={business}
          amount={amount}
          bankDetails={bankDetails}
          onBack={() => setPaymentMethod(null)}
        />
      ) : (
        /* Pago con Conekta */
        <ConektaPayment
          business={business}
          amount={amount}
          onBack={() => setPaymentMethod(null)}
        />
      )}
    </div>
  )
}
