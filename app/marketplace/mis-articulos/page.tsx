'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MARKETPLACE_CONDITIONS, MARKETPLACE_FEATURED_PRICE } from '@/lib/constants'
import { formatDaysRemaining } from '@/lib/utils'
import type { MarketplaceListing } from '@/types/database.types'

interface ListingWithLeads extends MarketplaceListing {
  lead_count?: number
}

export default function MisArticulosPage() {
  const router = useRouter()
  const [listings, setListings] = useState<ListingWithLeads[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedLeads, setExpandedLeads] = useState<Record<string, any[]>>({})
  const [loadingLeads, setLoadingLeads] = useState<Record<string, boolean>>({})

  const fetchListings = async () => {
    try {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const toggleLeads = async (listing: ListingWithLeads) => {
    if (expandedLeads[listing.id]) {
      // Collapse
      const copy = { ...expandedLeads }
      delete copy[listing.id]
      setExpandedLeads(copy)
      return
    }

    // Fetch leads
    setLoadingLeads((prev) => ({ ...prev, [listing.id]: true }))
    try {
      const res = await fetch(`/api/marketplace/${listing.id}/interest`)
      if (res.ok) {
        const json = await res.json()
        setExpandedLeads((prev) => ({ ...prev, [listing.id]: json.data || [] }))
      }
    } catch {
      // ignore
    } finally {
      setLoadingLeads((prev) => ({ ...prev, [listing.id]: false }))
    }
  }

  const isFeatured = (listing: ListingWithLeads) =>
    listing.is_featured &&
    listing.featured_until &&
    new Date(listing.featured_until) > new Date()

  const statusLabels: Record<string, { text: string; color: string }> = {
    active: { text: 'Activo', color: 'bg-green-100 text-green-700' },
    sold: { text: 'Vendido', color: 'bg-blue-100 text-blue-700' },
    reserved: { text: 'Reservado', color: 'bg-yellow-100 text-yellow-700' },
    expired: { text: 'Expirado', color: 'bg-gray-100 text-gray-700' },
    removed: { text: 'Eliminado', color: 'bg-red-100 text-red-700' },
  }

  const featureWhatsAppUrl = `https://wa.me/524741082768?text=${encodeURIComponent(
    `Hola, quiero destacar mi artículo en SomosLagos Marketplace por $${MARKETPLACE_FEATURED_PRICE}.`
  )}`

  return (
    <main className="min-h-screen" style={{ background: 'var(--ivory)' }}>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>Mis articulos</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{listings.length} articulo{listings.length !== 1 ? 's' : ''}</p>
          </div>
          <Link
            href="/marketplace/publicar"
            className="px-6 py-2.5 text-white font-semibold rounded-xl transition-all text-sm"
            style={{ background: 'var(--coral)' }}
          >
            + Publicar
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--coral)', borderTopColor: 'transparent' }} />
            <p style={{ color: 'var(--muted)' }}>Cargando articulos...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl mb-4 block">&#128230;</span>
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--ink)' }}>No tienes articulos</h2>
            <p className="mb-6" style={{ color: 'var(--muted)' }}>Publica tu primer articulo en el marketplace</p>
            <Link
              href="/marketplace/publicar"
              className="inline-block px-6 py-3 text-white font-semibold rounded-lg transition-colors"
              style={{ background: 'var(--coral)' }}
            >
              Publicar articulo
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => {
              const status = statusLabels[listing.status] || statusLabels.active
              const expiry = formatDaysRemaining(listing.expires_at)
              const isExpired = listing.expires_at && new Date(listing.expires_at) < new Date()
              const featured = isFeatured(listing)
              const leads = expandedLeads[listing.id]
              const leadCountNum = listing.lead_count || 0

              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-2xl p-4"
                  style={featured
                    ? { boxShadow: 'var(--shadow-card)', border: '1px solid rgba(245,185,66,0.4)' }
                    : { boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.05)' }}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Image */}
                    <div className="w-full sm:w-24 h-24 relative rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--cream)' }}>
                      {listing.images?.[0] ? (
                        <Image src={listing.images[0]} alt={listing.title} fill sizes="96px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">&#128230;</div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold truncate" style={{ color: 'var(--ink)' }}>{listing.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                          {status.text}
                        </span>
                        {featured && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(245,185,66,0.2)', color: 'var(--gold)' }}>
                            &#11088; Destacado
                          </span>
                        )}
                      </div>
                      <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>
                        {listing.price_type === 'gratis' ? 'Gratis'
                          : listing.price_type === 'intercambio' ? 'Intercambio'
                          : formatCurrency(listing.price)}
                        {' · '}
                        {MARKETPLACE_CONDITIONS[listing.condition]}
                        {' · '}
                        {listing.views} vista{listing.views !== 1 ? 's' : ''}
                      </p>
                      <div className="flex items-center gap-3">
                        <p className={`text-xs ${expiry.color}`}>
                          {isExpired && listing.status === 'active' ? 'Expirado' : expiry.text}
                        </p>
                        {leadCountNum > 0 && (
                          <button
                            onClick={() => toggleLeads(listing)}
                            className="text-xs font-medium transition-colors"
                            style={{ color: 'var(--coral)' }}
                          >
                            {leadCountNum} interesado{leadCountNum !== 1 ? 's' : ''}
                            {leads ? ' ▲' : ' ▼'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex sm:flex-col gap-2 flex-shrink-0">
                      {listing.status === 'active' && !isExpired && (
                        <>
                          <Link
                            href={`/marketplace/editar/${listing.id}`}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors"
                            style={{ color: 'var(--coral)', border: '1px solid rgba(255,107,53,0.3)' }}
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

                  {/* Expanded leads section */}
                  {loadingLeads[listing.id] && (
                    <div className="mt-3 pt-3 text-center" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                      <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: 'var(--coral)', borderTopColor: 'transparent' }} />
                    </div>
                  )}

                  {leads && leads.length > 0 && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                      <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>Personas interesadas</h4>
                      <div className="space-y-2">
                        {leads.map((lead: any) => (
                          <div key={lead.id} className="flex items-center justify-between rounded-lg p-2" style={{ background: 'var(--cream)' }}>
                            <div>
                              <p className="text-sm font-medium" style={{ color: 'var(--ink-soft)' }}>
                                {lead.buyer?.full_name || 'Usuario'}
                              </p>
                              {lead.message && (
                                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>&quot;{lead.message}&quot;</p>
                              )}
                              <p className="text-xs" style={{ color: 'var(--muted)' }}>{formatDate(lead.created_at)}</p>
                            </div>
                            {featured && lead.buyer?.phone && (
                              <a
                                href={`https://wa.me/52${lead.buyer.phone.replace(/\D/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 text-xs font-medium text-green-600 border border-green-200 rounded-lg hover:bg-green-50 transition-colors flex-shrink-0"
                              >
                                WhatsApp
                              </a>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* CTA to upgrade if not featured */}
                      {!featured && (
                        <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
                          <p className="text-sm text-amber-800 font-medium mb-1">
                            &#128274; Contactos ocultos
                          </p>
                          <p className="text-xs text-amber-700 mb-2">
                            Desbloquea nombres completos, telefonos y WhatsApp directo de cada interesado.
                          </p>
                          <a
                            href={featureWhatsAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-4 py-2 text-xs font-bold rounded-lg transition-colors"
                            style={{ background: 'var(--gold)', color: 'var(--ink)' }}
                          >
                            Destacar por ${MARKETPLACE_FEATURED_PRICE} / 7 dias
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {leads && leads.length === 0 && (
                    <div className="mt-3 pt-3 text-center text-sm" style={{ borderTop: '1px solid rgba(0,0,0,0.07)', color: 'var(--muted)' }}>
                      Aun no hay interesados en este articulo
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
