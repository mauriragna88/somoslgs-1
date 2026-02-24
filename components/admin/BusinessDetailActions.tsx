'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import SubscriptionManager from './SubscriptionManager'

interface Business {
  id: string
  name: string
  subscription_tier: string
  subscription_status: string
  subscription_expires_at: string | null
  whatsapp?: string
  phone?: string
  owner?: {
    full_name: string
    email: string
    phone: string | null
  } | null
}

interface BusinessDetailActionsProps {
  business: Business
}

export default function BusinessDetailActions({ business }: BusinessDetailActionsProps) {
  const router = useRouter()
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleQuickUpgrade = async (tier: string) => {
    if (!confirm(`¿Cambiar a plan ${tier}?`)) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business.id,
          action: 'change_tier',
          tier,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al actualizar')
      }

      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAddDays = async (days: number) => {
    if (!confirm(`¿Agregar ${days} días de suscripción?`)) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business.id,
          action: 'add_days',
          days,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Error al actualizar')
      }

      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* Quick Days Buttons */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <span className="text-xs text-gray-500 px-2">+Días:</span>
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => handleAddDays(days)}
              disabled={loading}
              className="px-2 py-1 text-xs font-medium text-gray-700 hover:bg-white rounded transition-colors disabled:opacity-50"
            >
              {days}d
            </button>
          ))}
        </div>

        {/* Quick Plan Buttons */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <span className="text-xs text-gray-500 px-2">Plan:</span>
          {['gratis', 'pro', 'avanzado'].map((tier) => (
            <button
              key={tier}
              onClick={() => handleQuickUpgrade(tier)}
              disabled={loading || business.subscription_tier === tier}
              className={`px-2 py-1 text-xs font-medium rounded transition-colors disabled:opacity-50 ${
                business.subscription_tier === tier
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-white'
              }`}
            >
              {tier.charAt(0).toUpperCase() + tier.slice(1)}
            </button>
          ))}
        </div>

        {/* Full Manager Button */}
        <button
          onClick={() => setShowSubscriptionModal(true)}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors"
        >
          🎁 Gestionar
        </button>
      </div>

      {/* Subscription Modal */}
      {showSubscriptionModal && (
        <SubscriptionManager
          business={{
            ...business,
            subscription_status: business.subscription_status || 'active',
          }}
          onClose={() => {
            setShowSubscriptionModal(false)
            router.refresh()
          }}
        />
      )}
    </>
  )
}
