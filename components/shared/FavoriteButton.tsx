'use client'

import { useState, useEffect } from 'react'
import { useFavoritesStore } from '@/lib/stores/favorites'

interface FavoriteButtonProps {
  businessId: string
  size?: 'sm' | 'md'
}

export default function FavoriteButton({ businessId, size = 'sm' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavoritesStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const active = isFavorite(businessId)
  const iconSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
  const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite(businessId)
      }}
      aria-label={active ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      className={`${btnSize} rounded-full flex items-center justify-center transition-all ${
        active
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-white/90 text-gray-400 hover:text-red-400 hover:bg-white'
      } shadow-sm backdrop-blur-sm`}
    >
      <svg
        className={`${iconSize} transition-transform ${active ? 'scale-110' : ''}`}
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  )
}
