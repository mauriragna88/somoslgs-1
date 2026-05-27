export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'
import ProductForm from '@/components/dashboard/ProductForm'

interface NuevoBusiness {
  id: string
  name: string
  subscription_tier: string
  business_type: 'productos' | 'servicios' | 'ambos'
}

interface FormCategory {
  id: string
  name: string
  icon: string
}

export default async function NuevoProductoPage() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }

  const supabase = await createClient()

  // Get user's businesses
  const { data: allBusinesses } = await supabase
    .from('businesses')
    .select('*')
    .eq('owner_id', user.id) as { data: NuevoBusiness[] | null }

  // Get selected business from cookies
  const cookieStore = await cookies()
  const selectedBusinessId = cookieStore.get('selected_business_id')?.value

  // Use selected business or first one
  const selectedBusiness = selectedBusinessId
    ? allBusinesses?.find(b => b.id === selectedBusinessId) || allBusinesses?.[0]
    : allBusinesses?.[0]

  if (!selectedBusiness) {
    redirect('/dashboard')
  }

  // Check if plan allows products
  const canManageProducts = ['pro', 'avanzado'].includes(selectedBusiness.subscription_tier)

  if (!canManageProducts) {
    redirect('/dashboard/productos')
  }

  // Get categories for the form
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name') as { data: FormCategory[] | null }

  const bType = (selectedBusiness as any).business_type || 'productos'
  const titleLabel = bType === 'servicios' ? 'Nuevo Servicio' : bType === 'ambos' ? 'Nuevo Producto o Servicio' : 'Nuevo Producto'
  const subtitleLabel = bType === 'servicios'
    ? `Agrega un nuevo servicio a ${selectedBusiness.name}`
    : `Agrega un nuevo producto a tu catálogo de ${selectedBusiness.name}`

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{titleLabel}</h1>
          <p className="text-gray-600 mt-2">{subtitleLabel}</p>
        </div>

        <ProductForm
          businessId={selectedBusiness.id}
          categories={categories || []}
          businessType={bType}
        />
      </div>
    </div>
  )
}

