'use client'

import { useState, useEffect } from 'react'
import { isBusinessOpen } from '@/lib/constants'
import type { BusinessHours } from '@/lib/constants'

interface OpenClosedBadgeProps {
  businessHours: BusinessHours | null | undefined
  size?: 'sm' | 'md'
}

export default function OpenClosedBadge({ businessHours, size = 'sm' }: OpenClosedBadgeProps) {
  const [isOpen, setIsOpen] = useState<boolean | null>(null)

  useEffect(() => {
    setIsOpen(isBusinessOpen(businessHours))

    // Actualizar cada 60 segundos
    const interval = setInterval(() => {
      setIsOpen(isBusinessOpen(businessHours))
    }, 60_000)

    return () => clearInterval(interval)
  }, [businessHours])

  // No renderizar si no hay horarios o aun no se calculo
  if (isOpen === null) return null

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1 text-sm'

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full ${sizeClasses} ${
        isOpen
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
      {isOpen ? 'Abierto' : 'Cerrado'}
    </span>
  )
}
