'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface PaymentApprovalCardProps {
  transaction: any
}

export default function PaymentApprovalCard({ transaction }: PaymentApprovalCardProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const handleApprove = async () => {
    if (!confirm('¿Confirmas que deseas aprobar este pago? Esto activará automáticamente la suscripción del negocio.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/payments/${transaction.id}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Error al aprobar el pago')
      }

      toast.success('Pago aprobado! El negocio ha sido activado.')
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al aprobar el pago')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.warning('Debes proporcionar una razon de rechazo')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/payments/${transaction.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      })

      if (!response.ok) {
        throw new Error('Error al rechazar el pago')
      }

      toast.success('Pago rechazado. Se notificara al usuario.')
      setShowRejectModal(false)
      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al rechazar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-md border-2 border-yellow-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {/* @ts-ignore */}
                <h3 className="text-xl font-bold text-gray-900">{transaction.businesses?.name}</h3>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                  PENDIENTE
                </span>
              </div>
              {/* @ts-ignore */}
              <p className="text-gray-600">Dueño: {transaction.profiles?.full_name}</p>
              {/* @ts-ignore */}
              <p className="text-sm text-gray-500">{transaction.profiles?.email}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[#FF6B35]">
                ${transaction.amount.toLocaleString('es-MX')}
              </p>
              <p className="text-sm text-gray-600">MXN</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Plan Seleccionado</p>
              <p className="font-semibold text-gray-900 capitalize">
                {transaction.subscription_tier}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {transaction.subscription_months} mes(es)
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Fecha de Envío</p>
              <p className="font-semibold text-gray-900">
                {new Date(transaction.created_at).toLocaleDateString('es-MX', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(transaction.created_at).toLocaleTimeString('es-MX', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          {transaction.proof_notes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-xs text-blue-700 font-medium mb-1">Notas del cliente:</p>
              <p className="text-sm text-blue-900">{transaction.proof_notes}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            {transaction.proof_url && (
              <a
                href={transaction.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold text-center transition-colors"
              >
                📄 Ver Comprobante
              </a>
            )}
            <button
              onClick={() => setShowRejectModal(true)}
              disabled={loading}
              className="px-6 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-semibold rounded-lg transition-colors disabled:opacity-50"
            >
              ✗ Rechazar
            </button>
            <button
              onClick={handleApprove}
              disabled={loading}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Procesando...' : '✓ Aprobar Pago'}
            </button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Rechazar Comprobante de Pago
            </h3>
            <p className="text-gray-600 mb-4">
              Proporciona una razón del rechazo. Esto se enviará al usuario para que pueda corregir el problema.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              placeholder="Ej: El comprobante no corresponde al monto indicado..."
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !rejectReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg disabled:opacity-50"
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
