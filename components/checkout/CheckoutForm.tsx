'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { useCartStore } from '@/lib/stores/cart'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface BankData {
  bank_name: string | null
  bank_account_holder: string | null
  bank_account_number: string | null
  bank_clabe: string | null
}

interface CheckoutFormProps {
  business: {
    id: string
    name: string
    slug: string
    whatsapp: string | null
    address: string | null
    bankData: BankData
  }
  conektaEnabled?: boolean
  mercadoPagoEnabled?: boolean
}

export default function CheckoutForm({ business, conektaEnabled = false, mercadoPagoEnabled = false }: CheckoutFormProps) {
  const router = useRouter()
  const { items, getSubtotal, clearCart } = useCartStore()

  const businessItems = items.filter(i => i.business_id === business.id)
  const subtotal = businessItems.reduce(
    (sum, item) => sum + Math.round(item.price * item.quantity * 100) / 100,
    0
  )

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    delivery_type: 'pickup' as 'pickup' | 'delivery',
    delivery_address: '',
    notes: '',
    payment_method: '' as '' | 'cash' | 'card' | 'mercadopago' | 'transfer',
  })

  const [receiptUrl, setReceiptUrl] = useState('')
  const [uploadingReceipt, setUploadingReceipt] = useState(false)
  const [receiptError, setReceiptError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')

  const [orderSuccess, setOrderSuccess] = useState<{
    orderNumber: string
    whatsappNotifyUrl: string | null
  } | null>(null)

  const deliveryFee = formData.delivery_type === 'delivery' ? 30 : 0
  const total = subtotal + deliveryFee
  const cardMinimum = 100
  const belowCardMinimum = total < cardMinimum

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setReceiptError('')
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setReceiptError('Por favor selecciona una imagen valida')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setReceiptError('La imagen debe ser menor a 5MB')
      return
    }

    try {
      setUploadingReceipt(true)
      const supabase = createClient()

      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
      const filePath = `receipts/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('business-images')
        .upload(filePath, file, { cacheControl: '3600', upsert: false })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('business-images')
        .getPublicUrl(filePath)

      setReceiptUrl(publicUrl)
    } catch {
      setReceiptError('Error al subir el comprobante. Intenta de nuevo.')
    } finally {
      setUploadingReceipt(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setFormError('')

    if (!formData.payment_method) {
      setFormError('Selecciona un metodo de pago')
      return
    }

    if (formData.payment_method === 'transfer' && !receiptUrl) {
      setReceiptError('Por favor sube tu comprobante de pago')
      return
    }

    if (formData.delivery_type === 'delivery' && !formData.delivery_address.trim()) {
      setFormError('Ingresa tu direccion de entrega')
      return
    }

    setSubmitting(true)

    try {
      const orderData = {
        business_id: business.id,
        items: businessItems.map((item) => ({
          product_id: item.product_id,
          product_name: item.name,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: Math.round(item.price * item.quantity * 100) / 100,
        })),
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_email: formData.customer_email || undefined,
        delivery_type: formData.delivery_type,
        delivery_address: formData.delivery_type === 'delivery' ? formData.delivery_address : undefined,
        notes: formData.notes || undefined,
        payment_method: formData.payment_method,
        payment_receipt_url: formData.payment_method === 'transfer' ? receiptUrl : undefined,
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

      // For card payments, redirect to Conekta checkout
      if (formData.payment_method === 'card') {
        try {
          const conektaResponse = await fetch('/api/conekta/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'order',
              order_id: data.order.id,
              order_number: data.order.order_number,
              amount: total,
              customer_name: formData.customer_name,
              customer_email: formData.customer_email || undefined,
              customer_phone: formData.customer_phone,
              business_name: business.name,
              business_slug: business.slug,
              business_id: business.id,
            }),
          })

          const conektaData = await conektaResponse.json()

          if (!conektaResponse.ok) {
            throw new Error(conektaData.error || 'Error al conectar con pasarela de pago')
          }

          clearCart()
          window.location.href = conektaData.checkout_url
          return
        } catch (conektaError: any) {
          setFormError(conektaError.message || 'Error al procesar pago con tarjeta. Tu pedido fue creado, contacta al negocio.')
          setSubmitting(false)
          return
        }
      }

      // For MercadoPago payments, redirect to MP checkout
      if (formData.payment_method === 'mercadopago') {
        try {
          const mpResponse = await fetch('/api/mercadopago/create-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'order',
              order_id: data.order.id,
              order_number: data.order.order_number,
              amount: total,
              customer_name: formData.customer_name,
              customer_email: formData.customer_email || undefined,
              customer_phone: formData.customer_phone,
              business_name: business.name,
              business_slug: business.slug,
              business_id: business.id,
            }),
          })

          const mpData = await mpResponse.json()

          if (!mpResponse.ok) {
            throw new Error(mpData.error || 'Error al conectar con MercadoPago')
          }

          clearCart()
          window.location.href = mpData.init_point
          return
        } catch (mpError: any) {
          setFormError(mpError.message || 'Error al procesar pago con MercadoPago. Tu pedido fue creado, contacta al negocio.')
          setSubmitting(false)
          return
        }
      }

      setOrderSuccess({
        orderNumber: data.order.order_number,
        whatsappNotifyUrl: data.order.whatsapp_notify_url,
      })
      clearCart()
    } catch (error: any) {
      setFormError(error.message || 'Error al procesar el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  // Success modal
  if (orderSuccess) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Pedido Recibido!
        </h2>
        <p className="text-gray-600 mb-2">Tu numero de pedido es:</p>
        <p className="text-3xl font-bold text-primary mb-6">
          {orderSuccess.orderNumber}
        </p>

        {orderSuccess.whatsappNotifyUrl && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800 mb-3">
              Notifica al negocio para que preparen tu pedido mas rapido
            </p>
            <a
              href={orderSuccess.whatsappNotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
            >
              <span className="text-xl">💬</span>
              Enviar WhatsApp al Negocio
            </a>
          </div>
        )}

        <p className="text-sm text-gray-500 mb-6">
          El negocio recibira tu pedido y te contactara pronto
        </p>

        <div className="space-y-3">
          <Link
            href={`/negocios/${business.slug}`}
            className="block w-full py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-center"
          >
            Volver al Negocio
          </Link>
          <Link
            href="/"
            className="block w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg transition-colors text-center"
          >
            Ir al Inicio
          </Link>
        </div>
      </div>
    )
  }

  // Empty cart
  if (businessItems.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito esta vacio</h2>
        <p className="text-gray-600 mb-6">
          Agrega productos del negocio para continuar
        </p>
        <Link
          href={`/negocios/${business.slug}`}
          className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors"
        >
          Ver Productos
        </Link>
      </div>
    )
  }

  const hasBankData = business.bankData.bank_clabe

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. Order Summary */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Resumen del Pedido</h2>
        <div className="space-y-3">
          {businessItems.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-xl">📦</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-sm text-gray-500">{item.quantity} x {formatCurrency(item.price)}</p>
              </div>
              <p className="font-bold text-gray-900">
                {formatCurrency(Math.round(item.price * item.quantity * 100) / 100)}
              </p>
            </div>
          ))}

          <div className="border-t pt-3 mt-3 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {formData.delivery_type === 'delivery' && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Envio a domicilio</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-1">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Customer Info */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Tus Datos</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              required
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              placeholder="Tu nombre completo"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Telefono *
            </label>
            <input
              type="tel"
              required
              value={formData.customer_phone}
              onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              placeholder="10 digitos"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email (opcional)
            </label>
            <input
              type="email"
              value={formData.customer_email}
              onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              placeholder="tu@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* 3. Delivery Type */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Tipo de Entrega</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              // If switching to pickup removes delivery fee and drops below card minimum, reset card
              const newTotal = subtotal
              const resetCard = formData.payment_method === 'card' && newTotal < cardMinimum
              setFormData({ ...formData, delivery_type: 'pickup', delivery_address: '', payment_method: resetCard ? '' : formData.payment_method })
            }}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              formData.delivery_type === 'pickup'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">🏪</div>
            <p className="font-bold text-gray-900">Recoger en local</p>
            <p className="text-sm text-gray-500 mt-1">
              {business.address || 'Pasa al negocio por tu pedido'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setFormData({ ...formData, delivery_type: 'delivery', payment_method: formData.payment_method === 'cash' ? '' : formData.payment_method })}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              formData.delivery_type === 'delivery'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-3xl mb-2">🚚</div>
            <p className="font-bold text-gray-900">Envio a domicilio</p>
            <p className="text-sm text-gray-500 mt-1">+{formatCurrency(30)} costo de envio</p>
          </button>
        </div>

        {formData.delivery_type === 'delivery' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Direccion de entrega *
            </label>
            <textarea
              required
              value={formData.delivery_address}
              onChange={(e) => setFormData({ ...formData, delivery_address: e.target.value })}
              placeholder="Calle, numero, colonia..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* 4. Payment Method - PROMINENT TILES */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Metodo de Pago</h2>
        <div className="space-y-3">
          {/* Cash - only for pickup */}
          {formData.delivery_type === 'pickup' && (
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, payment_method: 'cash' })
                setReceiptUrl('')
                setReceiptError('')
              }}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                formData.payment_method === 'cash'
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">💵</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">Pagar en el local</p>
                <p className="text-sm text-gray-500">Pagas al recoger tu pedido</p>
              </div>
              {formData.payment_method === 'cash' && (
                <div className="ml-auto text-primary text-2xl">✓</div>
              )}
            </button>
          )}

          {/* Transfer */}
          <button
            type="button"
            onClick={() => setFormData({ ...formData, payment_method: 'transfer' })}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
              formData.payment_method === 'transfer'
                ? 'border-primary bg-primary/5'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-3xl">📱</span>
            </div>
            <div>
              <p className="font-bold text-gray-900">Transferencia bancaria</p>
              <p className="text-sm text-gray-500">
                {hasBankData ? 'Transfiere y sube tu comprobante' : 'No disponible - banco no configurado'}
              </p>
            </div>
            {formData.payment_method === 'transfer' && (
              <div className="ml-auto text-primary text-2xl">✓</div>
            )}
          </button>

          {/* Card via Conekta */}
          {conektaEnabled ? (
            belowCardMinimum ? (
              <div className="w-full p-4 rounded-xl border-2 border-amber-200 bg-amber-50 flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">💳</span>
                </div>
                <div>
                  <p className="font-bold text-gray-700">Pago con tarjeta</p>
                  <p className="text-sm text-amber-700 font-medium">
                    Monto minimo para pago con tarjeta: {formatCurrency(cardMinimum)}
                  </p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Tu pedido actual es de {formatCurrency(total)}. Agrega mas productos para usar tarjeta.
                  </p>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, payment_method: 'card' })
                  setReceiptUrl('')
                  setReceiptError('')
                }}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                  formData.payment_method === 'card'
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">💳</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Pago con tarjeta</p>
                  <p className="text-sm text-gray-500">Visa, Mastercard, Amex</p>
                </div>
                {formData.payment_method === 'card' && (
                  <div className="ml-auto text-primary text-2xl">✓</div>
                )}
              </button>
            )
          ) : (
            !mercadoPagoEnabled && (
              <div className="w-full p-4 rounded-xl border-2 border-gray-200 flex items-center gap-4 opacity-60 cursor-not-allowed">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-3xl">💳</span>
                </div>
                <div>
                  <p className="font-bold text-gray-900">Pago con tarjeta</p>
                  <p className="text-sm text-gray-500">Proximamente</p>
                </div>
                <span className="ml-auto bg-gray-200 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">
                  PRONTO
                </span>
              </div>
            )
          )}

          {/* MercadoPago */}
          {mercadoPagoEnabled && (
            <button
              type="button"
              onClick={() => {
                setFormData({ ...formData, payment_method: 'mercadopago' })
                setReceiptUrl('')
                setReceiptError('')
              }}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4 ${
                formData.payment_method === 'mercadopago'
                  ? 'border-[#009ee3] bg-[#009ee3]/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#009ee3]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-3xl">💳</span>
              </div>
              <div>
                <p className="font-bold text-gray-900">Mercado Pago</p>
                <p className="text-sm text-gray-500">Tarjeta, OXXO, SPEI y mas</p>
              </div>
              {formData.payment_method === 'mercadopago' && (
                <div className="ml-auto text-[#009ee3] text-2xl">✓</div>
              )}
            </button>
          )}
        </div>

        {/* Bank Details for Transfer */}
        {formData.payment_method === 'transfer' && hasBankData && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
            <h4 className="text-sm font-bold text-green-800 mb-3">
              Datos para Transferencia
            </h4>
            <div className="space-y-2 text-sm">
              {business.bankData.bank_name && (
                <div className="flex justify-between">
                  <span className="text-green-700">Banco:</span>
                  <span className="font-medium text-green-900">{business.bankData.bank_name}</span>
                </div>
              )}
              {business.bankData.bank_account_holder && (
                <div className="flex justify-between">
                  <span className="text-green-700">Titular:</span>
                  <span className="font-medium text-green-900">{business.bankData.bank_account_holder}</span>
                </div>
              )}
              {business.bankData.bank_account_number && (
                <div className="flex justify-between">
                  <span className="text-green-700">Cuenta:</span>
                  <span className="font-medium text-green-900 font-mono">{business.bankData.bank_account_number}</span>
                </div>
              )}
              {business.bankData.bank_clabe && (
                <div className="flex justify-between">
                  <span className="text-green-700">CLABE:</span>
                  <span className="font-medium text-green-900 font-mono text-xs">{business.bankData.bank_clabe}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-green-600 mt-3">
              Monto a transferir: <strong>{formatCurrency(total)}</strong>
            </p>
          </div>
        )}

        {/* Warning if no bank data */}
        {formData.payment_method === 'transfer' && !hasBankData && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <p className="text-sm text-yellow-800">
              Este negocio aun no ha configurado sus datos bancarios.
              Por favor selecciona otro metodo de pago o contacta al negocio.
            </p>
          </div>
        )}

        {/* Receipt Upload for Transfer */}
        {formData.payment_method === 'transfer' && hasBankData && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <label className="block text-sm font-medium text-blue-800 mb-2">
              Comprobante de Pago *
            </label>
            <p className="text-xs text-blue-600 mb-3">
              Sube una captura o foto de tu transferencia
            </p>

            {receiptUrl ? (
              <div className="space-y-2">
                <div className="relative">
                  <Image
                    src={receiptUrl}
                    alt="Comprobante"
                    width={400}
                    height={160}
                    className="w-full max-h-40 object-contain rounded-lg border border-blue-300"
                  />
                  <button
                    type="button"
                    onClick={() => setReceiptUrl('')}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  ✓ Comprobante subido correctamente
                </p>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  uploadingReceipt ? 'border-blue-400 bg-blue-100' : 'border-blue-300 hover:border-blue-500 hover:bg-blue-100'
                }`}>
                  {uploadingReceipt ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-blue-600 font-medium">Subiendo...</span>
                    </div>
                  ) : (
                    <>
                      <span className="text-3xl block mb-2">📤</span>
                      <span className="text-blue-600 font-medium">Subir comprobante</span>
                      <p className="text-xs text-blue-500 mt-1">PNG, JPG (max. 5MB)</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleReceiptUpload}
                  disabled={uploadingReceipt}
                />
              </label>
            )}

            {receiptError && (
              <p className="text-sm text-red-600 mt-2">{receiptError}</p>
            )}
          </div>
        )}
      </div>

      {/* 5. Notes */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Notas (opcional)</h2>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Instrucciones especiales, alergias, etc..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Error */}
      {formError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{formError}</p>
        </div>
      )}

      {/* 6. Submit */}
      <button
        type="submit"
        disabled={submitting || !formData.payment_method}
        className="w-full py-4 bg-primary hover:bg-primary-dark text-white text-lg font-bold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Procesando...' : `Confirmar Pedido - ${formatCurrency(total)}`}
      </button>

      <p className="text-center text-xs text-gray-400">
        Al confirmar aceptas que el negocio procesara tu pedido
      </p>
    </form>
  )
}
