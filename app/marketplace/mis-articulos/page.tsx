'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { MARKETPLACE_CONDITIONS } from '@/lib/constants'
import { formatDaysRemaining } from '@/lib/utils'
import type { MarketplaceListing } from '@/types/database.types'

export default function MisArticulosPage() {
  const router = useRouter()
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [loading, setLoading] = useState(true)

  const fetchListings = async () => {
    try {
      // Use main marketplace API - the RLS policy returns own listings regardless of status
      const res = await fetch('/api/marketplace?limit=100&own=1')
      if (res.status === 401) {
        router.push('/login?redirect=/marketplace/mis-articulos')
        return
      }
      const data = await res.json()
      setListings(data.data || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [])

  const handleStatusChange = async (id: string, status: string) => {
    const res = await fetch(`/api/marketplace/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (res.ok) {
      fetchListings()
    }
  }

  const handleRenew = async (id: string) => {
    const res = await fetch(`/api/marketplace/${id}/renew`, { method: 'POST' })
    const data = await res.json()

    if (res.ok) {
      fetchListings()
    } else {
      alert(data.error || 'Error al renovar')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que quieres eliminar este artículo?')) return

    const res = await fetch(`/api/marketplace/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchListings()
    }
  }

  const statusLabels: Record<string, { text: string; color: string }> = {
    active: { text: 'Activo', color: 'bg-green-100 text-green-700' },
    sold: { text: 'Vendido', color: 'bg-blue-100 text-blue-700' },
    reserved: { text: 'Reservado', color: 'bg-yellow-100 text-yellow-700' },
    expired: { text: 'Expirado', color: 'bg-gray-100 text-gray-700' },
    removed: { text: 'Eliminado', color: 'bg-red-100 text-red-700' },
  }

  return (
    <main className="min-h-screen bg-surface">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-secondary">Mis artículos</h1>
            <p className="text-gray-500 text-sm mt-1">{listings.length} artículo{listings.length !== 1 ? 's' : ''}</p>
          </div>
          <Link
            href="/marketplace/publicar"
            className="px-6 py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-primary/20 text-sm"
          >
            + Publicar
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Cargando artículos...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">📦</span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No tienes artículos</h2>
            <p className="text-gray-600 mb-6">Publica tu primer artículo en el marketplace</p>
            <Link
              href="/marketplace/publicar"
              className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-colors"
            >
              Publicar artículo
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => {
              const status = statusLabels[listing.status] || statusLabels.active
              const expiry = formatDaysRemaining(listing.expires_at)
              const isExpired = listing.expires_at && new Date(listing.expires_at) < new Date()

              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-4"
                >
                  {/* Image */}
                  <div className="w-full sm:w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {listing.images?.[0] ? (
                      <Image src={listing.images[0]} alt={listing.title} fill sizes="96px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-secondary truncate">{listing.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mb-1">
                      {listing.price_type === 'gratis' ? 'Gratis'
                        : listing.price_type === 'intercambio' ? 'Intercambio'
                        : formatCurrency(listing.price)}
                      {' · '}
                      {MARKETPLACE_CONDITIONS[listing.condition]}
                      {' · '}
                      {listing.views} vista{listing.views !== 1 ? 's' : ''}
                    </p>
                    <p className={`text-xs ${expiry.color}`}>
                      {isExpired && listing.status === 'active' ? 'Expirado' : expiry.text}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex sm:flex-col gap-2 flex-shrink-0">
                    {listing.status === 'active' && !isExpired && (
                      <>
                        <Link
                          href={`/marketplace/editar/${listing.id}`}
                          className="px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
                        >
                          Editar
                        </Link>
                        <button
                          onClick={() => handleStatusChange(listing.id, 'sold')}
                          className="px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          Vendido
                        </button>
                      </>
                    )}
                    {(isExpired || listing.status === 'expired') && (
                      <button
                        onClick={() => handleRenew(listing.id)}
                        className="px-3 py-1.5 text-xs font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        Renovar
                      </button>
                    )}
                    {listing.status !== 'removed' && (
                      <button
                        onClick={() => handleDelete(listing.id)}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
