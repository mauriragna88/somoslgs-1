export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'
import UsersTable from '@/components/admin/UsersTable'

interface UserProfile {
  id: string
  role: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  created_at: string
}

export default async function AdminUsersPage() {
  // Use service role client to bypass RLS and get ALL users
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Obtener todos los usuarios
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false }) as { data: UserProfile[] | null }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Usuarios</h1>
        <p className="text-gray-600 mt-1">Gestiona todos los usuarios del sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 font-medium">Total Usuarios</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{users?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 font-medium">Administradores</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">
            {users?.filter(u => u.role === 'admin').length || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 font-medium">Dueños de Negocio</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            {users?.filter(u => u.role === 'business_owner').length || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 font-medium">Clientes</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {users?.filter(u => u.role === 'customer').length || 0}
          </p>
        </div>
      </div>

      {/* Users Table with Actions */}
      <UsersTable users={users || []} />
    </div>
  )
}
