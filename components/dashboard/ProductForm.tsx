'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import ImageUpload from './ImageUpload'

const productSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  price: z.number().min(0, 'El precio debe ser mayor a 0'),
  category: z.string().optional().nullable(),
  stock: z.number().int().min(0, 'El stock debe ser mayor o igual a 0').optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  images: z.array(z.string()).optional(),
  is_available: z.boolean().default(true),
  type: z.enum(['producto', 'servicio']).default('producto'),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  businessId: string
  categories: Array<{ id: string; name: string }>
  businessType?: 'productos' | 'servicios' | 'ambos'
  product?: {
    id: string
    name: string
    description: string
    price: number
    category: string | null
    stock?: number | null
    sku?: string | null
    images?: string[]
    is_available: boolean
    type?: 'producto' | 'servicio'
  }
}

export default function ProductForm({ businessId, categories, businessType = 'productos', product }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageUrl, setImageUrl] = useState(product?.images?.[0] || '')

  // Determine default item type based on businessType
  const defaultType = businessType === 'servicios' ? 'servicio' : 'producto'

  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price || 0,
    category: product?.category || '',
    stock: product?.stock || 0,
    sku: product?.sku || '',
    images: product?.images || [],
    is_available: product?.is_available ?? true,
    type: product?.type || defaultType,
  })

  const isService = formData.type === 'servicio'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const productData = {
        ...formData,
        images: imageUrl ? [imageUrl] : [],
        category: formData.category || null,
        sku: isService ? null : (formData.sku || null),
        stock: isService ? null : (formData.stock || 0),
      }

      const validatedData = productSchema.parse(productData)

      const url = product
        ? `/api/products/${product.id}`
        : '/api/products'

      const method = product ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validatedData,
          business_id: businessId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Error al guardar el ${isService ? 'servicio' : 'producto'}`)
      }

      router.push('/dashboard/productos')
      router.refresh()
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(`Error al guardar el ${isService ? 'servicio' : 'producto'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Toggle producto/servicio for "ambos" type businesses */}
      {businessType === 'ambos' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tipo
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'producto' })}
              className={`p-3 border-2 rounded-xl text-center transition-all ${
                formData.type === 'producto'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <span className="text-xl block mb-1">📦</span>
              <span className="text-sm font-medium">Producto</span>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'servicio' })}
              className={`p-3 border-2 rounded-xl text-center transition-all ${
                formData.type === 'servicio'
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <span className="text-xl block mb-1">🔧</span>
              <span className="text-sm font-medium">Servicio</span>
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {isService ? 'Nombre del Servicio' : 'Nombre del Producto'} *
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={isService ? 'Ej: Corte de cabello' : 'Ej: Tacos al Pastor'}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {isService ? 'Describe tu servicio' : 'Descripción'} *
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder={isService ? 'Describe en qué consiste tu servicio...' : 'Describe tu producto...'}
          rows={4}
          required
        />
      </div>

      <div className={`grid grid-cols-1 ${isService ? '' : 'sm:grid-cols-2'} gap-4`}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Precio (MXN) *
          </label>
          <input
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
            required
          />
        </div>

        {!isService && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock
            </label>
            <input
              type="number"
              value={formData.stock || 0}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
          </div>
        )}
      </div>

      <div className={`grid grid-cols-1 ${isService ? '' : 'sm:grid-cols-2'} gap-4`}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría (Opcional)
          </label>
          <select
            value={formData.category || ''}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Sin categoría</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {!isService && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SKU (Opcional)
            </label>
            <input
              type="text"
              value={formData.sku || ''}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="SKU-001"
            />
          </div>
        )}
      </div>

      <ImageUpload
        currentImage={imageUrl}
        onUploadComplete={(url) => setImageUrl(url)}
      />

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_available"
          checked={formData.is_available}
          onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="is_available" className="ml-2 text-sm text-gray-700">
          {isService ? 'Servicio disponible' : 'Producto disponible'}
        </label>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading
            ? 'Guardando...'
            : product
              ? `Actualizar ${isService ? 'Servicio' : 'Producto'}`
              : `Crear ${isService ? 'Servicio' : 'Producto'}`
          }
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
