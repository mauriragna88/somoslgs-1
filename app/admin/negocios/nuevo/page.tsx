export const dynamic = 'force-dynamic'

import CreateBusinessForm from '@/components/admin/CreateBusinessForm'
import { createClient } from '@/lib/supabase/server'

export default async function NewBusinessPage() {
  const supabase = createClient()

  // Obtener categorías para el formulario
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, parent_id')
    .order('name')

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>Agregar Nuevo Negocio</h1>
        <p className="mt-1" style={{ color: 'var(--muted)' }}>Completa el formulario para registrar un nuevo negocio</p>
      </div>

      {/* Form */}
      <CreateBusinessForm categories={categories || []} />
    </div>
  )
}
