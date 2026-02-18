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
  businesses: { owner_id: string; subscription_tier: string }
}

interface FormCategory {
  id: string
  name: string
  icon: string
}

export default async function EditarProductoPage({ params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = createClient()

  // Get product and verify ownership
  const { data: product, error } = await supabase
    .from('products')
    .select('*, businesses!inner(owner_id, subscription_tier)')
    .eq('id', params.id)
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
  const canManageProducts = ['ventas', 'delivery', 'premium'].includes(product.businesses.subscription_tier)

  if (!canManageProducts) {
    redirect('/dashboard/productos')
  }

  // Get categories for the form
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name') as { data: FormCategory[] | null }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Editar Producto</h1>
          <p className="text-gray-600 mt-2">
            Actualiza la información de tu producto
          </p>
        </div>

        <ProductForm
          businessId={product.business_id}
          categories={categories || []}
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
          }}
        />
      </div>
    </div>
  )
}
