'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MARKETPLACE_REPORT_REASONS } from '@/lib/constants'

interface Report {
  id: string
  reason: string
  details: string | null
  created_at: string
  reporter: { full_name: string } | null
  listing: {
    id: string
    title: string
    price: number
    images: string[]
    status: string
    seller: { full_name: string } | null
  } | null
}

interface Listing {
  id: string
  title: string
  price: number
  price_type: string
  condition: string
  status: string
  images: string[]
  created_at: string
  views: number
  is_featured: boolean
  featured_until: string | null
  seller: { full_name: string } | null
  category: { name: string; icon: string } | null
}

export default function AdminMarketplacePage() {
  const [tab, setTab] = useState<'reported' | 'all'>('reported')
  const [reports, setReports] = useState<Report[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ tab })
      if (tab === 'all' && search) params.set('q', search)

      const res = await fetch(`/api/admin/marketplace?${params}`)
      const json = await res.json()

      if (tab === 'reported') {
        setReports(json.data || [])
      } else {
        setListings(json.data || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [tab])

  const handleAction = async (listingId: string, action: string, reportId?: string) => {
    const confirmed = action === 'remove'
      ? confirm('¿Eliminar este artículo?')
      : true

    if (!confirmed) return

    await fetch(`/api/admin/marketplace/${listingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, report_id: reportId }),
    })

    fetchData()
  }

  const handleForceDelete = async (id: string) => {
    if (!confirm('¿Eliminar este artículo permanentemente?')) return

    await fetch(`/api/admin/marketplace/${id}`, { method: 'DELETE' })
    fetchData()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary mb-6">Marketplace - Moderación</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setTab('reported')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'reported' ? 'bg-white text-secondary shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Reportados
          {reports.length > 0 && tab === 'reported' && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">{reports.length}</span>
          )}
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            tab === 'all' ? 'bg-white text-secondary shadow-sm' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Todos los artículos
        </button>
      </div>

      {/* Search (only for "all" tab) */}
      {tab === 'all' && (
        <form
          onSubmit={(e) => { e.preventDefault(); fetchData() }}
          className="flex gap-3 mb-6"
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar artículos..."
            className="flex-1 max-w-md px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button type="submit" className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary-dark transition-colors">
            Buscar
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        </div>
      ) : tab === 'reported' ? (
        /* Reported tab */
        reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <span className="text-4xl block mb-3">&#10003;</span>
            No hay reportes pendientes
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-xl border border-gray-100 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Listing preview */}
                  {report.listing && (
                    <div className="flex gap-3 flex-1">
                      <div className="w-16 h-16 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        {report.listing.images?.[0] ? (
                          <Image src={report.listing.images[0]} alt="" fill sizes="64px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-secondary truncate">{report.listing.title}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(report.listing.price)} · Vendedor: {report.listing.seller?.full_name || 'N/A'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Report info */}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-600">
                      {MARKETPLACE_REPORT_REASONS[report.reason as keyof typeof MARKETPLACE_REPORT_REASONS] || report.reason}
                    </p>
                    {report.details && (
                      <p className="text-sm text-gray-600 mt-1">{report.details}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Reportado por {report.reporter?.full_name || 'Anónimo'} · {formatDate(report.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(report.listing?.id || '', 'dismiss', report.id)}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={() => handleAction(report.listing?.id || '', 'remove')}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Eliminar artículo
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* All listings tab */
        listings.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No hay artículos</div>
        ) : (
          <div className="space-y-3">
            {listings.map((listing) => {
              const statusColors: Record<string, string> = {
                active: 'bg-green-100 text-green-700',
                sold: 'bg-blue-100 text-blue-700',
                reserved: 'bg-yellow-100 text-yellow-700',
                expired: 'bg-gray-100 text-gray-700',
                removed: 'bg-red-100 text-red-700',
              }

              return (
                <div key={listing.id} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-4 items-center">
                  <div className="w-12 h-12 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {listing.images?.[0] ? (
                      <Image src={listing.images[0]} alt="" fill sizes="48px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-secondary truncate">{listing.title}</p>
                    <p className="text-xs text-gray-500">
                      {listing.seller?.full_name || 'N/A'} · {formatCurrency(listing.price)} · {listing.views} vistas · {formatDate(listing.created_at)}
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[listing.status] || ''}`}>
                    {listing.status}
                  </span>
                  {listing.is_featured && listing.featured_until && new Date(listing.featured_until) > new Date() && (
                    <span className="px-2 py-0.5 bg-gradient-to-r from-accent to-accent-dark text-secondary rounded-full text-xs font-bold">
                      &#11088;
                    </span>
                  )}
                  {listing.status === 'active' && (
                    listing.is_featured && listing.featured_until && new Date(listing.featured_until) > new Date() ? (
                      <button
                        onClick={() => handleAction(listing.id, 'unfeature')}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Quitar destacado
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(listing.id, 'feature')}
                        className="px-3 py-1.5 text-xs font-medium text-accent-dark border border-accent/30 rounded-lg hover:bg-accent/10 transition-colors"
                      >
                        Destacar 7d
                      </button>
                    )
                  )}
                  {listing.status !== 'removed' && (
                    <button
                      onClick={() => handleForceDelete(listing.id)}
                      className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
