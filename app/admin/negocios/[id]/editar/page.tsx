export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import AdminEditBusinessForm from '@/components/admin/AdminEditBusinessForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminEditBusinessPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: business, error } = await supabase
    .from('businesses')
    .select(`
      *,
      category:categories(id, name),
      owner:profiles!businesses_owner_id_fkey(id, full_name, email, phone)
    `)
    .eq('id', id)
    .single()

  if (error || !business) {
    notFound()
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .is('parent_id', null)
    .order('name')

  // Get photos for gallery
  const { data: photos } = await supabase
    .from('business_photos')
    .select('*')
    .eq('business_id', id)
    .order('display_order', { ascending: true })

  // Normalize owner (Supabase may return array for relation)
  const owner = Array.isArray(business.owner) ? business.owner[0] || null : business.owner

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/admin/negocios/${id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
        >
          ← Volver
        </Link>
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Editar Negocio</h1>
          <p className="text-gray-600 text-sm truncate">{business.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <AdminEditBusinessForm
          business={{
            ...business,
            owner,
            is_featured: business.is_featured ?? false,
          }}
          categories={categories || []}
          photos={photos || []}
        />
      </div>
    </div>
  )
}
