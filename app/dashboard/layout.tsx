export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BusinessSidebar from '@/components/dashboard/BusinessSidebar'
import DashboardNotifications from '@/components/dashboard/DashboardNotifications'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  // Verificar que el usuario esté autenticado
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verificar que sea business owner
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single() as { data: { role: string; full_name: string } | null }

  if (!profile || profile.role !== 'business_owner') {
    redirect('/')
  }

  // Obtener negocios del dueño
  const { data: businesses } = await supabase
    .from('businesses')
    .select('id, name, logo_url, subscription_tier, is_active, whatsapp, business_type')
    .eq('owner_id', user.id) as { data: { id: string; name: string; logo_url: string | null; subscription_tier: string; is_active: boolean; whatsapp: string | null; business_type: 'productos' | 'servicios' | 'ambos' }[] | null }

  return (
    <div className="flex h-screen" style={{ background: 'var(--ivory)' }}>
      {/* Sidebar */}
      <BusinessSidebar
        userName={profile.full_name}
        businesses={businesses || []}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <main className="p-4 pt-16 lg:p-8">
          {children}
        </main>
      </div>

      {/* Real-time Order Notifications */}
      <DashboardNotifications
        businesses={(businesses || []).map(b => ({
          id: b.id,
          name: b.name,
          whatsapp: b.whatsapp || undefined,
        }))}
      />
    </div>
  )
}
