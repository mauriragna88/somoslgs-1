'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  id: string
  product_id: string
  business_id: string
  business_name: string
  business_slug: string
  name: string
  price: number
  quantity: number
  image_url: string | null
  max_stock: number | null
  selected_options?: Record<string, string>
}

interface CartState {
  items: CartItem[]
  isOpen: boolean

  // Actions
  addItem: (item: Omit<CartItem, 'id' | 'quantity'>, quantity?: number) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  clearBusinessCart: (businessId: string) => void
  toggleCart: () => void
  openCart: () => void
  closeCart: () => void

  // Computed
  getItemCount: () => number
  getSubtotal: () => number
  getBusinessItems: (businessId: string) => CartItem[]
  getCurrentBusinessId: () => string | null
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item, quantity = 1) => {
        const items = get().items

        // Check if adding from a different business
        const currentBusinessId = get().getCurrentBusinessId()
        if (currentBusinessId && currentBusinessId !== item.business_id) {
          // Clear cart if switching businesses
          set({ items: [] })
        }

        // Check if item already exists (same product + same options)
        const optionsKey = item.selected_options
          ? JSON.stringify(item.selected_options)
          : ''

        const existingIndex = items.findIndex(
          i => i.product_id === item.product_id &&
               JSON.stringify(i.selected_options || {}) === (optionsKey || '{}')
        )

        if (existingIndex > -1) {
          // Update quantity with stock validation
          const newItems = [...items]
          const newQty = newItems[existingIndex].quantity + quantity
          const maxStock = newItems[existingIndex].max_stock
          newItems[existingIndex].quantity = maxStock !== null ? Math.min(newQty, maxStock) : newQty
          set({ items: newItems })
        } else {
          // Add new item
          const newItem: CartItem = {
            ...item,
            id: `${item.product_id}-${Date.now()}`,
            quantity,
          }
          set({ items: [...items, newItem] })
        }

        // Open cart drawer
        set({ isOpen: true })
      },

      removeItem: (itemId) => {
        set({ items: get().items.filter(item => item.id !== itemId) })
      },

      updateQuantity: (itemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }

        const newItems = get().items.map(item => {
          if (item.id !== itemId) return item
          const cappedQty = item.max_stock !== null ? Math.min(quantity, item.max_stock) : quantity
          return { ...item, quantity: cappedQty }
        })
        set({ items: newItems })
      },

      clearCart: () => {
        set({ items: [], isOpen: false })
      },

      clearBusinessCart: (businessId) => {
        set({
          items: get().items.filter(item => item.business_id !== businessId)
        })
      },

      toggleCart: () => {
        set({ isOpen: !get().isOpen })
      },

      openCart: () => {
        set({ isOpen: true })
      },

      closeCart: () => {
        set({ isOpen: false })
      },

      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      getSubtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + Math.round(item.price * item.quantity * 100) / 100,
          0
        )
      },

      getBusinessItems: (businessId) => {
        return get().items.filter(item => item.business_id === businessId)
      },

      getCurrentBusinessId: () => {
        const items = get().items
        return items.length > 0 ? items[0].business_id : null
      },
    }),
    {
      name: 'somoslagos-cart',
      partialize: (state) => ({ items: state.items }),
    }
  )
)
