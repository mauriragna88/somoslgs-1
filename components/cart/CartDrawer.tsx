'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/lib/stores/cart'
import { formatCurrency } from '@/lib/utils'

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    getSubtotal,
    getItemCount,
    clearCart,
  } = useCartStore()

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [closeCart])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const subtotal = getSubtotal()
  const itemCount = getItemCount()
  const businessSlug = items[0]?.business_slug

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">
            Tu Carrito ({itemCount})
          </h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Business name */}
        {items.length > 0 && (
          <div className="px-4 py-2 bg-gray-50 border-b">
            <p className="text-sm text-gray-600">
              Pedido de <span className="font-medium text-gray-900">{items[0].business_name}</span>
            </p>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🛒</div>
              <p className="text-gray-500">Tu carrito está vacío</p>
              <button
                onClick={closeCart}
                className="mt-4 text-primary hover:underline"
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 bg-gray-50 rounded-lg p-3">
                  {/* Image */}
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.name}
                      width={80}
                      height={80}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">📦</span>
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                    <p className="text-primary font-bold">{formatCurrency(item.price)}</p>

                    {/* Options */}
                    {item.selected_options && Object.keys(item.selected_options).length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {Object.entries(item.selected_options).map(([key, val]) => (
                          <span key={key}>{key}: {val} </span>
                        ))}
                      </p>
                    )}

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white border rounded-lg hover:bg-gray-100"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center bg-white border rounded-lg hover:bg-gray-100"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-red-500 hover:text-red-700 text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-lg">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
            </div>

            <p className="text-xs text-gray-500">
              * Costo de envío se calcula en el checkout
            </p>

            {/* Actions */}
            <div className="space-y-2">
              <Link
                href={`/checkout/${businessSlug}`}
                onClick={closeCart}
                className="block w-full py-3 bg-primary hover:bg-primary-dark text-white text-center font-bold rounded-lg transition-colors"
              >
                Proceder al Pago
              </Link>
              <button
                onClick={clearCart}
                className="w-full py-2 text-gray-500 hover:text-red-500 text-sm transition-colors"
              >
                Vaciar carrito
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
