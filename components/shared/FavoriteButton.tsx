'use client'

import { useState, useEffect } from 'react'
import { useFavoritesStore } from '@/lib/stores/favorites'
import { createClient } from '@/lib/supabase/client'

interface FavoriteButtonProps {
  businessId: string
  size?: 'sm' | 'md'
}

export default function FavoriteButton({ businessId, size = 'sm' }: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite, setFavorites } = useFavoritesStore()
  const [mounted, setMounted] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    const init = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      // Sync DB favorites into store (one-time on mount)
      try {
        const res = await fetch('/api/favorites')
        if (res.ok) {
          const ids: string[] = await res.json()
          setFavorites(ids)
        }
      } catch {
        // fallback to localStorage state
      }
    }
    init()
  }, [setFavorites])

  if (!mounted) return null

  const active = isFavorite(businessId)
  const iconSize = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'
  const btnSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10'

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return

    // Optimistic update
    toggleFavorite(businessId)

    if (!userId) return

    setLoading(true)
    try {
      await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId }),
      })
    } catch {
      // Revert optimistic update on error
      toggleFavorite(businessId)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
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
