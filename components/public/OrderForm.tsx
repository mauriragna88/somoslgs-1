'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface Product {
  id: string
  name: string
  price: number
  images?: string[]
}

interface CartItem {
  product: Product
  quantity: number
}

interface OrderFormProps {
  businessId: string
  businessName: string
  businessWhatsapp: string | null
  products: Product[]
  canReceiveOrders: boolean
}

export default function OrderForm({
  businessId,
  businessName,
  businessWhatsapp,
  products,
  canReceiveOrders,
}: OrderFormProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string; whatsapp: string } | null>(null)

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_type: 'pickup' as 'pickup' | 'delivery',
    delivery_address: '',
    notes: '',
    payment_method: 'cash' as 'cash' | 'card' | 'transfer',
  })

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const orderData = {
        business_id: businessId,
        items: cart.map((item) => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price,
          subtotal: item.product.price * item.quantity,
        })),
        ...formData,
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear el pedido')
      }

      setOrderSuccess({
        orderNumber: data.order.order_number,
        whatsapp: data.order.business_whatsapp,
      })
      setCart([])
      setShowOrderForm(false)
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  // If business can't receive orders, just show WhatsApp buttons
  if (!canReceiveOrders) {
    return null
  }

  return (
    <>
      {/* Floating Cart Button */}
      {cartCount > 0 && !showCart && !showOrderForm && !orderSuccess && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-primary hover:bg-primary-dark text-white px-6 py-4 rounded-full shadow-lg flex items-center gap-3 z-40 transition-all hover:scale-105"
        >
          <span className="text-2xl">🛒</span>
          <span className="font-bold">{cartCount} productos</span>
          <span className="font-bold">{formatCurrency(cartTotal)}</span>
        </button>
      )}

      {/* Add to Cart Buttons (rendered in product cards) */}
      <div className="hidden" id="cart-actions">
        {products.map((product) => (
          <button
            key={product.id}
            data-product-id={product.id}
            onClick={() => addToCart(product)}
          >
            Agregar
          </button>
        ))}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold">Tu Carrito</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Tu carrito está vacío
                </p>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-primary font-bold">
                          {formatCurrency(item.product.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-8 h-8 bg-primary text-white rounded-full hover:bg-primary-dark"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <div className="flex justify-between mb-4">
                  <span className="font-bold">Total:</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(cartTotal)}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowCart(false)
                    setShowOrderForm(true)
                  }}
                  className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
                >
                  Continuar Pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold">Completar Pedido</h2>
              <button
                onClick={() => setShowOrderForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.customer_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (opcional)
                </label>
                <input
                  type="email"
                  value={formData.customer_email}
                  onChange={(e) =>
                    setFormData({ ...formData, customer_email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de entrega *
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="delivery_type"
                      value="pickup"
                      checked={formData.delivery_type === 'pickup'}
                      onChange={() =>
                        setFormData({ ...formData, delivery_type: 'pickup' })
                      }
                      className="text-primary"
                    />
                    <span>🏪 Recoger en tienda</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="delivery_type"
                      value="delivery"
                      checked={formData.delivery_type === 'delivery'}
                      onChange={() =>
                        setFormData({ ...formData, delivery_type: 'delivery' })
                      }
                      className="text-primary"
                    />
                    <span>🚚 Envío a domicilio</span>
                  </label>
                </div>
              </div>

              {formData.delivery_type === 'delivery' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección de entrega *
                  </label>
                  <textarea
                    required
                    value={formData.delivery_address}
                    onChange={(e) =>
                      setFormData({ ...formData, delivery_address: e.target.value })
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Instrucciones especiales..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Método de pago
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_method: e.target.value as 'cash' | 'card' | 'transfer',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="cash">💵 Efectivo</option>
                  <option value="card">💳 Tarjeta</option>
                  <option value="transfer">📱 Transferencia</option>
                </select>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-bold mb-2">Resumen del Pedido</h3>
                <div className="space-y-1 text-sm">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex justify-between">
                      <span>
                        {item.quantity}x {item.product.name}
                      </span>
                      <span>
                        {formatCurrency(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                  <div className="border-t pt-2 mt-2 font-bold flex justify-between">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(cartTotal)}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Procesando...' : 'Confirmar Pedido'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              ¡Pedido Recibido!
            </h2>
            <p className="text-gray-600 mb-2">
              Tu número de pedido es:
            </p>
            <p className="text-2xl font-bold text-primary mb-6">
              {orderSuccess.orderNumber}
            </p>
            <p className="text-sm text-gray-500 mb-6">
              El negocio recibirá tu pedido y te contactará pronto
            </p>
            <div className="space-y-3">
              {orderSuccess.whatsapp && (
                <a
                  href={`https://wa.me/52${orderSuccess.whatsapp}?text=Hola! Acabo de hacer el pedido ${orderSuccess.orderNumber}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
                >
                  💬 Contactar por WhatsApp
                </a>
              )}
              <button
                onClick={() => setOrderSuccess(null)}
                className="block w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Export helper to add product to cart from outside
export function useAddToCart() {
  return (product: Product) => {
    // Dispatch custom event that OrderForm listens to
    window.dispatchEvent(new CustomEvent('add-to-cart', { detail: product }))
  }
}
