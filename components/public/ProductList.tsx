'use client'

import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'
import { useCartStore } from '@/lib/stores/cart'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  images: string[] | null
  image_url: string | null
  stock: number | null
}

interface ProductListProps {
  products: Product[]
  businessId: string
  businessName: string
  businessSlug: string
  businessWhatsapp: string | null
  canReceiveOrders: boolean
}

export default function ProductList({
  products,
  businessId,
  businessName,
  businessSlug,
  businessWhatsapp,
  canReceiveOrders,
}: ProductListProps) {
  const { items, addItem, updateQuantity, removeItem } = useCartStore()

  const getQuantity = (productId: string) => {
    const item = items.find(i => i.product_id === productId && i.business_id === businessId)
    return item?.quantity || 0
  }

  const handleAdd = (product: Product) => {
    const imageUrl = product.image_url || (product.images && product.images[0]) || null
    addItem({
      product_id: product.id,
      business_id: businessId,
      business_name: businessName,
      business_slug: businessSlug,
      name: product.name,
      price: product.price,
      image_url: imageUrl,
      max_stock: product.stock,
    })
  }

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const item = items.find(i => i.product_id === productId && i.business_id === businessId)
    if (!item) return

    const newQty = item.quantity + delta
    if (newQty <= 0) {
      removeItem(item.id)
    } else {
      updateQuantity(item.id, newQty)
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product) => {
        const quantity = getQuantity(product.id)
        const imageUrl = product.image_url || (product.images && product.images[0]) || null

        return (
          <div
            key={product.id}
            className="group bg-white rounded-2xl border-2 border-gray-100 overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all duration-300"
          >
            {/* Product Image - compact */}
            <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={product.name}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl">📦</span>
                  </div>
                </div>
              )}
              {/* Price badge overlay */}
              <div className="absolute bottom-2 left-2">
                <span className="inline-block px-2.5 py-1 bg-white/95 backdrop-blur-sm text-primary font-bold text-sm rounded-full shadow-sm">
                  {formatCurrency(product.price)}
                </span>
              </div>
            </div>

            {/* Product Info - compact */}
            <div className="p-3">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 line-clamp-2">
                {product.name}
              </h3>
              {product.description && (
                <p className="text-xs text-gray-500 mb-2.5 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* Action Button */}
              {canReceiveOrders ? (
                quantity > 0 ? (
                  <div className="flex items-center justify-between bg-primary/5 rounded-xl px-2 py-1.5">
                    <button
                      onClick={() => handleUpdateQuantity(product.id, -1)}
                      className="w-7 h-7 bg-white rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold shadow-sm transition-colors"
                    >
                      -
                    </button>
                    <span className="font-bold text-primary text-sm">{quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(product.id, 1)}
                      className="w-7 h-7 bg-primary text-white rounded-lg hover:bg-primary-dark flex items-center justify-center font-bold shadow-sm transition-colors"
                    >
                      +
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAdd(product)}
                    className="w-full py-2 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    + Agregar
                  </button>
                )
              ) : businessWhatsapp ? (
                <a
                  href={`https://wa.me/52${businessWhatsapp}?text=Hola, me interesa el producto: ${product.name} (${formatCurrency(product.price)})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-xl transition-colors text-center"
                >
                  Pedir
                </a>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
