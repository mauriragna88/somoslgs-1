export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import DeleteProductButton from '@/components/dashboard/DeleteProductButton'

interface ProductsBusiness {
  id: string
  name: string
  subscription_tier: string
  business_type: 'productos' | 'servicios' | 'ambos'
}

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  images: string[] | null
  is_active: boolean
  is_available: boolean
  stock_quantity: number | null
  type: 'producto' | 'servicio'
}

export default async function ProductsPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Obtener negocios del dueño
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name, subscription_tier, business_type')
    .eq('owner_id', user.id) as { data: ProductsBusiness[] | null }

  // Obtener el negocio seleccionado de las cookies
  const cookieStore = await cookies()
  const selectedBusinessId = cookieStore.get('selected_business_id')?.value

  // Usar el negocio seleccionado o el primero
  const selectedBusiness = selectedBusinessId
    ? businesses?.find(b => b.id === selectedBusinessId) || businesses?.[0]
    : businesses?.[0]

  // Verificar que el plan permita productos
  const canManageProducts = selectedBusiness && ['pro', 'avanzado'].includes(selectedBusiness.subscription_tier)

  // Obtener productos si tiene permiso
  let products: Product[] = []
  if (canManageProducts && selectedBusiness) {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', selectedBusiness.id)
      .order('created_at', { ascending: false }) as { data: Product[] | null }

    products = data || []
  }

  const bType = selectedBusiness?.business_type || 'productos'
  const pageTitle = bType === 'servicios' ? 'Servicios' : bType === 'ambos' ? 'Productos y Servicios' : 'Productos'
  const addLabel = bType === 'servicios' ? '+ Agregar Servicio' : bType === 'ambos' ? '+ Agregar' : '+ Agregar Producto'
  const emptyIcon = bType === 'servicios' ? '🔧' : '📦'

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{pageTitle}</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Gestiona el catálogo de tu negocio</p>
        </div>
        {canManageProducts && (
          <Link
            href="/dashboard/productos/nuevo"
            className="px-4 py-2 sm:px-6 sm:py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors text-sm sm:text-base text-center"
          >
            {addLabel}
          </Link>
        )}
      </div>

      {!selectedBusiness ? (
        /* No tiene negocios */
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <p className="text-gray-600">No tienes negocios registrados</p>
        </div>
      ) : !canManageProducts ? (
        /* Plan no permite productos */
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-5xl">🔒</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Actualiza tu Plan</h2>
          <p className="text-gray-600 mb-6">
            Tu plan actual <strong className="capitalize">{selectedBusiness.subscription_tier}</strong> no incluye la gestión de productos.
            <br />
            Actualiza al plan <strong>Pro</strong> para desbloquear esta función.
          </p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🛍️</span>
                <h3 className="font-semibold text-gray-900">Plan Pro</h3>
              </div>
              <p className="text-2xl font-bold text-green-600 mb-2">$100/mes</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Catálogo de productos</li>
                <li>✓ Recibe pedidos en línea</li>
                <li>✓ Pagos por transferencia y tarjeta</li>
                <li>✓ Panel de ventas</li>
              </ul>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-left">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">⭐</span>
                <h3 className="font-semibold text-gray-900">Plan Avanzado</h3>
              </div>
              <p className="text-2xl font-bold text-purple-600 mb-2">$180/mes</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Todo lo de Pro</li>
                <li>✓ Posición destacada</li>
                <li>✓ Estadísticas avanzadas</li>
                <li>✓ Badge verificado</li>
              </ul>
            </div>
          </div>
          <Link
            href="/dashboard/suscripcion"
            className="inline-flex items-center mt-6 px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
          >
            Actualizar Plan
          </Link>
        </div>
      ) : (
        /* Puede gestionar productos */
        <>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* Imagen */}
                  <div className="relative h-48 bg-gray-200">
                    {product.images && product.images.length > 0 ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-6xl">{product.type === 'servicio' ? '🔧' : '📦'}</span>
                      </div>
                    )}
                    {/* Type badge */}
                    {bType === 'ambos' && (
                      <div className="absolute top-2 left-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${product.type === 'servicio' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'}`}>
                          {product.type === 'servicio' ? '🔧 Servicio' : '📦 Producto'}
                        </span>
                      </div>
                    )}
                    {!product.is_available && (
                      <div className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded">
                        No disponible
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(product.price)}
                        </p>
                        {product.stock_quantity !== null && (
                          <p className="text-xs text-gray-500">Stock: {product.stock_quantity}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Link
                          href={`/dashboard/productos/${product.id}`}
                          className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                        >
                          Editar
                        </Link>
                        <DeleteProductButton
                          productId={product.id}
                          productName={product.name}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* No hay productos/servicios */
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-5xl">{emptyIcon}</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {bType === 'servicios' ? 'No tienes servicios' : bType === 'ambos' ? 'No tienes productos ni servicios' : 'No tienes productos'}
              </h2>
              <p className="text-gray-600 mb-6">
                {bType === 'servicios' ? 'Comienza agregando tu primer servicio' : 'Comienza agregando tu primer producto al catálogo'}
              </p>
              <Link
                href="/dashboard/productos/nuevo"
                className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
              >
                {bType === 'servicios' ? '+ Agregar Primer Servicio' : '+ Agregar Primer Producto'}
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  )
}
