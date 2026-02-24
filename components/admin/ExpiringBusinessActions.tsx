'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import SubscriptionManager from './SubscriptionManager'
import QuickWhatsApp from './QuickWhatsApp'

interface ExpiringBusinessActionsProps {
  businessId: string
  businessName: string
  phone?: string | null
  ownerName?: string | null
  daysRemaining: number | null
}

export default function ExpiringBusinessActions({
  businessId,
  businessName,
  phone,
  ownerName,
  daysRemaining,
}: ExpiringBusinessActionsProps) {
  const router = useRouter()
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [quickAdding, setQuickAdding] = useState(false)

  // Quick add 30 days
  const handleQuickAdd30Days = async () => {
    setQuickAdding(true)
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          action: 'add_days',
          days: 30,
        }),
      })

      if (!response.ok) {
        throw new Error('Error al agregar días')
      }

      router.refresh()
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error al agregar dias')
    } finally {
      setQuickAdding(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-1">
        {/* Quick add 30 days */}
        <button
          onClick={handleQuickAdd30Days}
          disabled={quickAdding}
          className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors disabled:opacity-50"
          title="Agregar 30 días"
        >
          {quickAdding ? '...' : '🎁'}
        </button>

        {/* Open subscription manager */}
        <button
          onClick={() => setShowSubscriptionModal(true)}
          className="p-2 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors"
          title="Gestionar suscripción"
        >
          ⚙️
        </button>

        {/* WhatsApp */}
        {phone && (
          <button
            onClick={() => setShowWhatsAppModal(true)}
            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
            title="Enviar WhatsApp"
          >
            💬
          </button>
        )}
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <SubscriptionManager
          business={{
            id: businessId,
            name: businessName,
            subscription_tier: 'gratis', // Will be fetched by modal if needed
            subscription_status: 'active',
            subscription_expires_at: null,
            whatsapp: phone || undefined,
          }}
          onClose={() => setShowSubscriptionModal(false)}
        />
      )}

      {/* WhatsApp Modal */}
      {showWhatsAppModal && phone && (
        <QuickWhatsApp
          phone={phone}
          businessName={businessName}
          ownerName={ownerName || undefined}
          daysRemaining={daysRemaining}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}
    </>
  )
}
