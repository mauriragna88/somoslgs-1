import { redirect } from 'next/navigation'
import { isAdmin, createServiceClient } from '@/lib/supabase/server'
import BannersTable from '@/components/admin/BannersTable'
import type { Banner } from '@/types/database.types'

export const dynamic = 'force-dynamic'

export default async function PublicidadPage() {
  const admin = await isAdmin()
  if (!admin) redirect('/')

  const supabase = createServiceClient()
  const { data: banners } = await supabase
    .from('banners')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <BannersTable initialBanners={(banners as Banner[]) || []} />
    </div>
  )
}
