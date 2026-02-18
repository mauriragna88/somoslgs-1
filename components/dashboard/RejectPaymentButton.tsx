'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface RejectPaymentButtonProps {
  orderId: string
}

export default function RejectPaymentButton({ orderId }: RejectPaymentButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState('')

  const handleReject = async () => {
    if (!reason.trim()) {
      toast.warning('Por favor indica el motivo del rechazo')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/orders/${orderId}/reject-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al rechazar pago')
      }

      toast.success('Pago rechazado correctamente')
      setShowModal(false)
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al rechazar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors"
      >
        Rechazar
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Rechazar Comprobante de Pago
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Indica el motivo del rechazo. El cliente sera notificado.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej: El comprobante no corresponde al monto, imagen ilegible, etc."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !reason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
