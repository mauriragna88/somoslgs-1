'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface OrderActionsProps {
  orderId: string
  currentStatus: string
  customerPhone?: string
  customerName?: string
  orderNumber: string
  deliveryType: string
  deliveryAddress?: string | null
}

const statusFlow = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivering', 'completed', 'cancelled'],
  delivering: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

const statusLabels: Record<string, { label: string; icon: string; color: string }> = {
  confirmed: { label: 'Confirmar Pedido', icon: '✅', color: 'bg-blue-500 hover:bg-blue-600' },
  preparing: { label: 'Preparando', icon: '👨‍🍳', color: 'bg-orange-500 hover:bg-orange-600' },
  ready: { label: 'Listo para Entregar', icon: '📦', color: 'bg-green-500 hover:bg-green-600' },
  delivering: { label: 'En Camino', icon: '🚗', color: 'bg-purple-500 hover:bg-purple-600' },
  completed: { label: 'Completar', icon: '🎉', color: 'bg-green-600 hover:bg-green-700' },
  cancelled: { label: 'Cancelar', icon: '❌', color: 'bg-red-500 hover:bg-red-600' },
}

export default function OrderActions({
  orderId,
  currentStatus,
  customerPhone,
  customerName,
  orderNumber,
  deliveryType,
  deliveryAddress,
}: OrderActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const availableStatuses = statusFlow[currentStatus as keyof typeof statusFlow] || []

  const updateStatus = async (newStatus: string, rejectionReason?: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          rejection_reason: rejectionReason,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el pedido')
      }

      // Show WhatsApp notification option after status change
      if (customerPhone && newStatus !== 'cancelled') {
        const message = getWhatsAppMessage(newStatus)
        if (message && confirm('¿Deseas notificar al cliente por WhatsApp?')) {
          window.open(getWhatsAppLink(message), '_blank')
        }
      }

      router.refresh()
    } catch (error) {
      toast.error('Error al actualizar el pedido')
    } finally {
      setLoading(false)
      setShowCancelModal(false)
    }
  }

  const getWhatsAppMessage = (status: string): string => {
    const name = customerName || 'Cliente'
    switch (status) {
      case 'confirmed':
        return `¡Hola ${name}! 🎉\n\nTu pedido #${orderNumber} ha sido *confirmado*.\n\nEstamos preparándolo. Te avisaremos cuando esté listo.\n\n¡Gracias por tu preferencia!`
      case 'preparing':
        return `¡Hola ${name}! 👨‍🍳\n\nTu pedido #${orderNumber} está siendo *preparado*.\n\n¡Pronto estará listo!`
      case 'ready':
        return `¡Hola ${name}! 📦\n\nTu pedido #${orderNumber} está *listo*.\n\n${deliveryType === 'delivery' ? 'Pronto estará en camino a tu dirección.' : 'Puedes pasar a recogerlo cuando gustes.'}\n\n¡Gracias!`
      case 'delivering':
        return `¡Hola ${name}! 🚗\n\nTu pedido #${orderNumber} está *en camino*.\n\n${deliveryAddress ? `Llegará pronto a: ${deliveryAddress}` : 'Llegará pronto a tu dirección.'}\n\n¡Gracias por tu preferencia!`
      case 'completed':
        return `¡Hola ${name}! 🎉\n\nTu pedido #${orderNumber} ha sido *entregado*.\n\n¡Gracias por tu preferencia! Esperamos verte pronto. ⭐`
      default:
        return ''
    }
  }

  const getWhatsAppLink = (message: string): string => {
    const cleanPhone = customerPhone?.replace(/\D/g, '') || ''
    const fullPhone = cleanPhone.startsWith('52') ? cleanPhone : `52${cleanPhone}`
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
  }

  const handleCancel = () => {
    if (!cancelReason.trim()) {
      toast.warning('Por favor ingresa una razon para cancelar')
      return
    }
    updateStatus('cancelled', cancelReason)
  }

  if (currentStatus === 'completed' || currentStatus === 'cancelled') {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">⚡ Acciones</h2>
        <p className="text-gray-500 text-center py-4">
          Este pedido ya ha sido {currentStatus === 'completed' ? 'completado' : 'cancelado'}.
        </p>
        {customerPhone && (
          <a
            href={getWhatsAppLink(`Hola ${customerName || ''}, sobre tu pedido #${orderNumber}...`)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-4 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            💬 Contactar por WhatsApp
          </a>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">⚡ Acciones</h2>
        <div className="space-y-3">
          {availableStatuses.map((status) => {
            const config = statusLabels[status]
            if (!config) return null

            if (status === 'cancelled') {
              return (
                <button
                  key={status}
                  onClick={() => setShowCancelModal(true)}
                  disabled={loading}
                  className="w-full py-3 border-2 border-red-500 text-red-500 hover:bg-red-50 font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {config.icon} {config.label}
                </button>
              )
            }

            return (
              <button
                key={status}
                onClick={() => updateStatus(status)}
                disabled={loading}
                className={`w-full py-3 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 ${config.color}`}
              >
                {loading ? '⏳ Procesando...' : `${config.icon} ${config.label}`}
              </button>
            )
          })}

          {/* WhatsApp Button */}
          {customerPhone && (
            <a
              href={getWhatsAppLink(getWhatsAppMessage(currentStatus) || `Hola ${customerName || ''}, sobre tu pedido #${orderNumber}...`)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
            >
              💬 Enviar WhatsApp
            </a>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">❌ Cancelar Pedido</h3>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de cancelar el pedido #{orderNumber}? Esta acción no se puede deshacer.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Razón de la cancelación..."
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Volver
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl disabled:opacity-50"
              >
                {loading ? 'Cancelando...' : 'Confirmar Cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
