'use client'

import { useRouter } from 'next/navigation'
import EventForm from '@/components/admin/EventForm'
import type { SiteEvent } from '@/types/database.types'

export default function NuevoEventoPage() {
  const router = useRouter()

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/eventos')}
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
        >
          ← Volver a Eventos
        </button>
        <h1 className="text-2xl font-bold text-[#1F2937]">Nuevo Evento</h1>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <EventForm
          event={null}
          onSaved={(_event: SiteEvent) => router.push('/admin/eventos')}
          onCancel={() => router.push('/admin/eventos')}
        />
      </div>
    </div>
  )
}
