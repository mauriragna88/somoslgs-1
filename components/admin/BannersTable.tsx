'use client'

import { useState } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import type { Banner } from '@/types/database.types'
import { BANNER_PLACEMENT_LABELS, type BannerPlacement } from '@/lib/constants'
import BannerForm from './BannerForm'

interface BannersTableProps {
  initialBanners: Banner[]
}

export default function BannersTable({ initialBanners }: BannersTableProps) {
  const [banners, setBanners] = useState<Banner[]>(initialBanners)
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)

  const handleToggle = async (banner: Banner) => {
    try {
      const res = await fetch(`/api/admin/banners/${banner.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !banner.is_active }),
      })
      if (!res.ok) throw new Error('Error al actualizar')
      setBanners(prev =>
        prev.map(b => b.id === banner.id ? { ...b, is_active: !b.is_active } : b)
      )
      toast.success(banner.is_active ? 'Banner desactivado' : 'Banner activado')
    } catch {
      toast.error('Error al cambiar estado')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este banner?')) return
    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      setBanners(prev => prev.filter(b => b.id !== id))
      toast.success('Banner eliminado')
    } catch {
      toast.error('Error al eliminar banner')
    }
  }

  const handleSaved = (saved: Banner) => {
    if (editingBanner) {
      setBanners(prev => prev.map(b => b.id === saved.id ? saved : b))
    } else {
      setBanners(prev => [saved, ...prev])
    }
    setShowForm(false)
    setEditingBanner(null)
  }

  const formatDate = (d: string | null) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  const getCTR = (impressions: number, clicks: number) => {
    if (impressions === 0) return '0%'
    return ((clicks / impressions) * 100).toFixed(1) + '%'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1F2937]">Publicidad</h1>
        <button
          onClick={() => { setEditingBanner(null); setShowForm(true) }}
          className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#E2541F] transition-colors font-medium text-sm"
        >
          + Nuevo Banner
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1F2937]">
                {editingBanner ? 'Editar Banner' : 'Nuevo Banner'}
              </h2>
              <button
                onClick={() => { setShowForm(false); setEditingBanner(null) }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <BannerForm
              banner={editingBanner}
              onSaved={handleSaved}
              onCancel={() => { setShowForm(false); setEditingBanner(null) }}
            />
          </div>
        </div>
      )}

      {banners.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
          <span className="text-5xl block mb-4">📢</span>
          <p className="text-gray-500 mb-2">No hay banners creados</p>
          <p className="text-sm text-gray-400">Crea tu primer banner para empezar a monetizar</p>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {banners.map((banner) => (
              <div key={banner.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex gap-3 mb-3">
                  <div className="w-20 h-14 rounded-lg overflow-hidden relative flex-shrink-0 bg-gray-100">
                    <Image
                      src={banner.image_url}
                      alt={banner.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#1F2937] text-sm truncate">{banner.title}</h3>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs text-gray-400">
                        {BANNER_PLACEMENT_LABELS[banner.placement as BannerPlacement] || banner.placement}
                      </p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                        {banner.display_mode === 'image_only' ? 'Imagen' : 'Img+Texto'}
                      </span>
                    </div>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                      banner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {banner.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 text-xs text-gray-500 mb-3">
                  <span>Impresiones: {banner.impressions.toLocaleString()}</span>
                  <span>Clics: {banner.clicks.toLocaleString()}</span>
                  <span>CTR: {getCTR(banner.impressions, banner.clicks)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(banner)}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    {banner.is_active ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => { setEditingBanner(banner); setShowForm(true) }}
                    className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-[#FF6B35]"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(banner.id)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Banner</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ubicación</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Fechas</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Impresiones</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Clics</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">CTR</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Estado</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {banners.map((banner) => (
                  <tr key={banner.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-10 rounded-lg overflow-hidden relative flex-shrink-0 bg-gray-100">
                          <Image
                            src={banner.image_url}
                            alt={banner.title}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-sm text-[#1F2937] truncate max-w-[180px]">{banner.title}</p>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 flex-shrink-0">
                              {banner.display_mode === 'image_only' ? 'Imagen' : 'Img+Texto'}
                            </span>
                          </div>
                          {banner.link_url && (
                            <p className="text-xs text-gray-400 truncate max-w-[200px]">{banner.link_url}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {BANNER_PLACEMENT_LABELS[banner.placement as BannerPlacement] || banner.placement}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      <div>{formatDate(banner.start_date)}</div>
                      <div>{banner.end_date ? `hasta ${formatDate(banner.end_date)}` : 'Sin fecha fin'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{banner.impressions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{banner.clicks.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-700">{getCTR(banner.impressions, banner.clicks)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(banner)}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          banner.is_active
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {banner.is_active ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => { setEditingBanner(banner); setShowForm(true) }}
                          className="p-1.5 text-gray-400 hover:text-[#FF6B35] rounded-lg hover:bg-[rgba(255,107,53,0.05)]"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(banner.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
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
