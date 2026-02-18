'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface VerifyPaymentButtonProps {
  orderId: string
}

export default function VerifyPaymentButton({ orderId }: VerifyPaymentButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    if (!confirm('¿Confirmas que has verificado el comprobante de pago?')) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/orders/${orderId}/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al verificar pago')
      }

      toast.success('Pago verificado correctamente')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al verificar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleVerify}
      disabled={loading}
      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
    >
      {loading ? '...' : '✓ Verificar Pago'}
    </button>
  )
}
