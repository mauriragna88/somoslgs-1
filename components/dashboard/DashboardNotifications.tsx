'use client'

import { useEffect, useState } from 'react'
import OrderNotifications from './OrderNotifications'

interface Business {
  id: string
  name: string
  whatsapp?: string
}

interface DashboardNotificationsProps {
  businesses: Business[]
}

export default function DashboardNotifications({ businesses }: DashboardNotificationsProps) {
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)

  useEffect(() => {
    // Get selected business from cookie
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return null
    }

    const businessId = getCookie('selected_business_id')

    if (businessId && businesses.some(b => b.id === businessId)) {
      setSelectedBusinessId(businessId)
      setSelectedBusiness(businesses.find(b => b.id === businessId) || null)
    } else if (businesses.length > 0) {
      setSelectedBusinessId(businesses[0].id)
      setSelectedBusiness(businesses[0])
    }
  }, [businesses])

  // Listen for cookie changes (when user switches business)
  useEffect(() => {
    const interval = setInterval(() => {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
        return null
      }

      const businessId = getCookie('selected_business_id') ?? null
      if (businessId !== selectedBusinessId) {
        setSelectedBusinessId(businessId)
        setSelectedBusiness(businesses.find(b => b.id === businessId) || null)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [selectedBusinessId, businesses])

  if (!selectedBusinessId || !selectedBusiness) {
    return null
  }

  return (
    <OrderNotifications
      businessId={selectedBusinessId}
      businessWhatsApp={selectedBusiness.whatsapp}
    />
  )
}
