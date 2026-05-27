export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'
import ProductForm from '@/components/dashboard/ProductForm'

interface ProductWithBusiness {
  id: string
  business_id: string
  name: string
  description: string | null
  price: number
  category: string | null
  stock: number | null
  sku: string | null
  images: string[] | null
  is_available: boolean
  type: 'producto' | 'servicio'
  businesses: { owner_id: string; subscription_tier: string; business_type: string }
}

interface FormCategory {
  id: string
  name: string
  icon: string
}

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Get product and verify ownership
  const { data: product, error } = await supabase
    .from('products')
    .select('*, businesses!inner(owner_id, subscription_tier, business_type)')
    .eq('id', id)
    .single() as unknown as { data: ProductWithBusiness | null; error: any }

  if (error || !product) {
    redirect('/dashboard/productos')
  }

  // @ts-ignore - businesses is from join
  if (product.businesses.owner_id !== user.id) {
    redirect('/dashboard/productos')
  }

  // Check if plan allows products
  // @ts-ignore - businesses is from join
  const canManageProducts = ['pro', 'avanzado'].includes(product.businesses.subscription_tier)

  if (!canManageProducts) {
    redirect('/dashboard/productos')
  }

  // Get categories for the form
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name') as { data: FormCategory[] | null }

  const bType = (product.businesses.business_type || 'productos') as 'productos' | 'servicios' | 'ambos'
  const isServiceItem = (product as any).type === 'servicio'
  const editLabel = isServiceItem ? 'Editar Servicio' : 'Editar Producto'

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{editLabel}</h1>
          <p className="text-gray-600 mt-2">
            Actualiza la información de tu {isServiceItem ? 'servicio' : 'producto'}
          </p>
        </div>

        <ProductForm
          businessId={product.business_id}
          categories={categories || []}
          businessType={bType}
          product={{
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: product.price,
            category: product.category || null,
            stock: product.stock || 0,
            sku: product.sku || '',
            images: product.images || [],
            is_available: product.is_available,
            type: (product as any).type || 'producto',
          }}
        />
      </div>
    </div>
  )
}

