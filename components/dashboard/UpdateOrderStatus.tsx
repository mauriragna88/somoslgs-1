'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface UpdateOrderStatusProps {
  orderId: string
  currentStatus: string
  customerPhone?: string
  customerName?: string
  orderNumber?: string
  deliveryType?: string
  deliveryAddress?: string | null
}

const statusFlow: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivering', 'completed', 'cancelled'],
  delivering: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

const statusLabels: Record<string, { label: string; icon: string }> = {
  confirmed: { label: 'Confirmar', icon: '✅' },
  preparing: { label: 'Preparando', icon: '👨‍🍳' },
  ready: { label: 'Listo', icon: '📦' },
  delivering: { label: 'En Camino', icon: '🚗' },
  completed: { label: 'Completar', icon: '🎉' },
  cancelled: { label: 'Cancelar', icon: '❌' },
}

function getWhatsAppMessage(
  status: string,
  customerName: string,
  orderNumber: string,
  deliveryType?: string,
  deliveryAddress?: string | null
): string {
  const name = customerName || 'Cliente'
  switch (status) {
    case 'confirmed':
      return `Hola ${name}! 🎉\n\nTu pedido #${orderNumber} ha sido *confirmado*.\n\nEstamos preparandolo. Te avisaremos cuando este listo.\n\nGracias por tu preferencia!`
    case 'preparing':
      return `Hola ${name}! 👨‍🍳\n\nTu pedido #${orderNumber} esta siendo *preparado*.\n\nPronto estara listo!`
    case 'ready':
      return `Hola ${name}! 📦\n\nTu pedido #${orderNumber} esta *listo*.\n\n${deliveryType === 'delivery' ? 'Pronto estara en camino a tu direccion.' : 'Puedes pasar a recogerlo cuando gustes.'}\n\nGracias!`
    case 'delivering':
      return `Hola ${name}! 🚗\n\nTu pedido #${orderNumber} esta *en camino*.\n\n${deliveryAddress ? `Llegara pronto a: ${deliveryAddress}` : 'Llegara pronto a tu direccion.'}\n\nGracias por tu preferencia!`
    case 'completed':
      return `Hola ${name}! 🎉\n\nTu pedido #${orderNumber} ha sido *entregado*.\n\nGracias por tu preferencia! Esperamos verte pronto. ⭐`
    case 'cancelled':
      return `Hola ${name}, lamentamos informarte que tu pedido #${orderNumber} ha sido *cancelado*.\n\nSi tienes dudas, no dudes en contactarnos.`
    default:
      return ''
  }
}

function getWhatsAppLink(phone: string, message: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  const fullPhone = cleanPhone.startsWith('52') ? cleanPhone : `52${cleanPhone}`
  return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`
}

export default function UpdateOrderStatus({
  orderId,
  currentStatus,
  customerPhone,
  customerName,
  orderNumber,
  deliveryType,
  deliveryAddress,
}: UpdateOrderStatusProps) {
  const router = useRouter()
  const [updating, setUpdating] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  const availableStatuses = statusFlow[currentStatus] || []

  const handleStatusUpdate = async (newStatus: string, reason?: string) => {
    setUpdating(true)
    try {
      const body: Record<string, string> = { status: newStatus }
      if (reason) {
        body.rejection_reason = reason
      }

      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Error al actualizar')
      }

      const data = await response.json()

      // Open WhatsApp to notify customer
      const phone = customerPhone || data.customer?.phone
      const name = customerName || data.customer?.name || 'Cliente'
      const number = orderNumber || data.order?.order_number || ''

      if (phone && newStatus !== 'cancelled') {
        const message = getWhatsAppMessage(newStatus, name, number, deliveryType, deliveryAddress || data.customer?.delivery_address)
        if (message) {
          window.open(getWhatsAppLink(phone, message), '_blank')
        }
      }

      router.refresh()
      setShowCancelModal(false)
    } catch (error: any) {
      console.error('Error:', error)
      toast.error(error.message || 'Error al actualizar el estado del pedido')
    } finally {
      setUpdating(false)
    }
  }

  if (availableStatuses.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">
        {currentStatus === 'completed' ? 'Pedido completado' : 'Pedido cancelado'}
      </p>
    )
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {availableStatuses.map((status) => {
          const config = statusLabels[status]
          return (
            <button
              key={status}
              onClick={() => {
                if (status === 'cancelled') {
                  setShowCancelModal(true)
                } else {
                  handleStatusUpdate(status)
                }
              }}
              disabled={updating}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                status === 'cancelled'
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              {updating ? '...' : `${config?.icon || ''} ${config?.label || status}`}
            </button>
          )
        })}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4 w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Cancelar Pedido
            </h3>
            <p className="text-gray-600 mb-4">
              Por favor, indica el motivo de la cancelacion:
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Motivo de cancelacion..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary mb-4"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={() => handleStatusUpdate('cancelled', cancelReason)}
                disabled={updating}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {updating ? 'Cancelando...' : 'Confirmar Cancelacion'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={updating}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50 font-medium"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
