export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import AdminEditBusinessForm from '@/components/admin/AdminEditBusinessForm'

interface PageProps {
  params: { id: string }
}

export default async function AdminEditBusinessPage({ params }: PageProps) {
  const supabase = createServiceClient()

  const { data: business, error } = await supabase
    .from('businesses')
    .select(`
      *,
      category:categories(id, name),
      owner:profiles!businesses_owner_id_fkey(id, full_name, email, phone)
    `)
    .eq('id', params.id)
    .single()

  if (error || !business) {
    notFound()
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .is('parent_id', null)
    .order('name')

  // Normalize owner (Supabase may return array for relation)
  const owner = Array.isArray(business.owner) ? business.owner[0] || null : business.owner

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href={`/admin/negocios/${params.id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ← Volver
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Editar Negocio</h1>
          <p className="text-gray-600">{business.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <AdminEditBusinessForm
          business={{
            ...business,
            owner,
            is_featured: business.is_featured ?? false,
          }}
          categories={categories || []}
        />
      </div>
    </div>
  )
}
