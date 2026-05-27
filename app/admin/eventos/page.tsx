export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { isAdmin, createServiceClient } from '@/lib/supabase/server'
import EventsTable from '@/components/admin/EventsTable'
import type { SiteEvent } from '@/types/database.types'

export default async function AdminEventosPage() {
  const admin = await isAdmin()
  if (!admin) redirect('/')

  const supabase = createServiceClient()
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('display_order')

  const list = (events as SiteEvent[]) || []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#1F2937]">Eventos y Fechas Especiales</h1>
          <span
            className="px-2.5 py-0.5 rounded-full text-xs font-bold"
            style={{ background: 'rgba(255,107,53,0.1)', color: '#FF6B35' }}
          >
            {list.length}
          </span>
        </div>
        <Link
          href="/admin/eventos/nuevo"
          className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-colors hover:opacity-90"
          style={{ background: '#FF6B35' }}
        >
          + Nuevo Evento
        </Link>
      </div>

      <EventsTable initialEvents={list} />
    </div>
  )
}
