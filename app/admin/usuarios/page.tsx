export const dynamic = 'force-dynamic'

import { createServiceClient } from '@/lib/supabase/server'
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
  const supabase = createServiceClient()

  // Obtener todos los usuarios
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false }) as { data: UserProfile[] | null }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>Usuarios</h1>
        <p className="mt-1" style={{ color: 'var(--muted)' }}>Gestiona todos los usuarios del sistema</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Total Usuarios</p>
          <p className="text-3xl font-bold mt-2" style={{ color: 'var(--ink)', fontFamily: 'var(--display)' }}>{users?.length || 0}</p>
        </div>
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Administradores</p>
          <p className="text-3xl font-bold text-purple-600 mt-2" style={{ fontFamily: 'var(--display)' }}>
            {users?.filter(u => u.role === 'admin').length || 0}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Dueños de Negocio</p>
          <p className="text-3xl font-bold text-blue-600 mt-2" style={{ fontFamily: 'var(--display)' }}>
            {users?.filter(u => u.role === 'business_owner').length || 0}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6" style={{ boxShadow: 'var(--shadow-card)' }}>
          <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Clientes</p>
          <p className="text-3xl font-bold text-green-600 mt-2" style={{ fontFamily: 'var(--display)' }}>
            {users?.filter(u => u.role === 'customer').length || 0}
          </p>
        </div>
      </div>

      {/* Users Table with Actions */}
      <UsersTable users={users || []} />
    </div>
  )
}
