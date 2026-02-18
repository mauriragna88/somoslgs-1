'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export interface Business {
  id: string
  name: string
  logo_url: string | null
  subscription_tier?: string
  is_active?: boolean
}

interface BusinessContextType {
  selectedBusinessId: string | null
  businesses: Business[]
  selectedBusiness: Business | null
  setSelectedBusinessId: (id: string) => void
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

interface BusinessProviderProps {
  children: ReactNode
  businesses: Business[]
  initialBusinessId: string | null
}

export function BusinessProvider({ children, businesses, initialBusinessId }: BusinessProviderProps) {
  const router = useRouter()
  const [selectedBusinessId, setSelectedBusinessIdState] = useState<string | null>(
    initialBusinessId || (businesses.length > 0 ? businesses[0].id : null)
  )

  const selectedBusiness = businesses.find(b => b.id === selectedBusinessId) || null

  const setSelectedBusinessId = useCallback(async (id: string) => {
    setSelectedBusinessIdState(id)

    // Set cookie for server-side access
    document.cookie = `selected_business_id=${id}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`

    // Refresh the page to reload server components with new business
    router.refresh()
  }, [router])

  return (
    <BusinessContext.Provider value={{
      selectedBusinessId,
      businesses,
      selectedBusiness,
      setSelectedBusinessId,
    }}>
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusinessContext() {
  const context = useContext(BusinessContext)
  if (context === undefined) {
    throw new Error('useBusinessContext must be used within a BusinessProvider')
  }
  return context
}

// Server-side utility to get selected business ID from cookies
export function getSelectedBusinessIdFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=')
    acc[key] = value
    return acc
  }, {} as Record<string, string>)

  return cookies['selected_business_id'] || null
}
