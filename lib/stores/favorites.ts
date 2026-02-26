'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FavoritesState {
  favorites: string[] // business IDs
  isFavorite: (id: string) => boolean
  toggleFavorite: (id: string) => void
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      isFavorite: (id: string) => get().favorites.includes(id),
      toggleFavorite: (id: string) => {
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((fav) => fav !== id)
            : [...state.favorites, id],
        }))
      },
    }),
    {
      name: 'somoslagos-favorites',
    }
  )
)
