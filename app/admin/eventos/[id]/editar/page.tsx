export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { isAdmin, createServiceClient } from '@/lib/supabase/server'
import EditEventoClient from './EditEventoClient'
import type { SiteEvent } from '@/types/database.types'

export default async function EditarEventoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = await isAdmin()
  if (!admin) redirect('/')

  const supabase = createServiceClient()
  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()

  if (!event) redirect('/admin/eventos')

  return <EditEventoClient event={event as SiteEvent} />
}
