'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { SiteEvent } from '@/types/database.types'

interface EventsTableProps {
  initialEvents: SiteEvent[]
}

export default function EventsTable({ initialEvents }: EventsTableProps) {
  const [events, setEvents] = useState<SiteEvent[]>(initialEvents)
  const router = useRouter()

  const handleToggleActive = async (event: SiteEvent) => {
    const supabase = createClient()
    const newValue = !event.is_active
    setEvents(prev => prev.map(e => e.id === event.id ? { ...e, is_active: newValue } : e))
    const { error } = await supabase
      .from('events')
      .update({ is_active: newValue })
      .eq('id', event.id)
    if (error) {
      setEvents(prev => prev.map(e => e.id === event.id ? { ...e, is_active: event.is_active } : e))
      toast.error('Error al actualizar evento')
    } else {
      toast.success(newValue ? 'Evento activado' : 'Evento desactivado')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este evento? Esta acción no se puede deshacer.')) return
    const supabase = createClient()
    setEvents(prev => prev.filter(e => e.id !== id))
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) {
      toast.error('Error al eliminar evento')
      const supabase2 = createClient()
      const { data } = await supabase2.from('events').select('*').order('display_order')
      if (data) setEvents(data as SiteEvent[])
    } else {
      toast.success('Evento eliminado')
    }
  }

  return (
    <div>
      {events.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <span className="text-5xl block mb-4">📅</span>
          <p className="text-gray-500 mb-2">No hay eventos creados</p>
          <p className="text-sm text-gray-400">Crea tu primer evento para mostrarlo en el inicio</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl border border-gray-100 p-4 overflow-hidden relative"
                style={{
                  borderLeft: `4px solid ${event.category_color}`,
                }}
              >
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{ background: `${event.category_color}0d` }}
                />
                <div className="relative">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-[#1F2937] text-sm">{event.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{event.dates}</p>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={{
                        background: `${event.category_color}20`,
                        color: event.category_color,
                      }}
                    >
                      {event.category}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleToggleActive(event)}
                      className="flex-1 text-xs px-3 py-1.5 rounded-lg border transition-colors"
                      style={event.is_active
                        ? { borderColor: '#FF6B35', color: '#FF6B35', background: 'rgba(255,107,53,0.06)' }
                        : { borderColor: '#d1d5db', color: '#6b7280' }
                      }
                    >
                      {event.is_active ? 'Activo' : 'Inactivo'}
                    </button>
                    <button
                      onClick={() => router.push(`/admin/eventos/${event.id}/editar`)}
                      className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[#FF6B35]"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead style={{ background: '#1F2937' }}>
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase">Orden</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase">Nombre</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase">Fechas</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-white/70 uppercase">Categoría</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-white/70 uppercase">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-white/70 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-gray-50/50 transition-colors"
                    style={{ background: `${event.category_color}08` }}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      {event.display_order}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-sm text-[#1F2937]">{event.name}</p>
                      <p className="text-xs text-gray-400 truncate max-w-[200px]">{event.description}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      <span className="font-bold text-xs mr-1.5" style={{ color: event.category_color }}>
                        {event.month_code}
                      </span>
                      {event.dates}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-block text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{
                          background: `${event.category_color}20`,
                          color: event.category_color,
                        }}
                      >
                        {event.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(event)}
                        className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors"
                        style={event.is_active
                          ? { background: 'rgba(255,107,53,0.12)', color: '#FF6B35' }
                          : { background: '#f3f4f6', color: '#6b7280' }
                        }
                      >
                        {event.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => router.push(`/admin/eventos/${event.id}/editar`)}
                          className="p-1.5 text-gray-400 hover:text-[#FF6B35] rounded-lg hover:bg-[rgba(255,107,53,0.05)] transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
