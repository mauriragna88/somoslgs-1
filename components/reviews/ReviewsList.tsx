'use client'

import { useState } from 'react'
import StarRating from './StarRating'
import type { Review } from '@/types/reviews'

interface ReviewsListProps {
  initialReviews: Review[]
  businessId: string
  isOwner: boolean
  totalCount: number
}

function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diff < 60) return 'hace un momento'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} dias`
  if (diff < 31536000) return `hace ${Math.floor(diff / 2592000)} meses`
  return `hace ${Math.floor(diff / 31536000)} anos`
}

export default function ReviewsList({ initialReviews, businessId, isOwner, totalCount }: ReviewsListProps) {
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [loading, setLoading] = useState(false)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [responseLoading, setResponseLoading] = useState(false)

  const hasMore = reviews.length < totalCount

  const loadMore = async () => {
    setLoading(true)
    try {
      const offset = reviews.length
      const res = await fetch(`/api/reviews?business_id=${businessId}&offset=${offset}&limit=10`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setReviews(prev => [...prev, ...data])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }

  const handleResponse = async (reviewId: string) => {
    if (!responseText.trim()) return
    setResponseLoading(true)

    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ response: responseText.trim() }),
      })

      if (res.ok) {
        const data = await res.json()
        setReviews(prev =>
          prev.map(r => r.id === reviewId ? {
            ...r,
            response: data.review.response,
            responded_at: data.review.responded_at,
          } : r)
        )
        setRespondingTo(null)
        setResponseText('')
      }
    } catch {
      // silently fail
    } finally {
      setResponseLoading(false)
    }
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p className="text-sm">Aun no hay opiniones. Se el primero en opinar.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div key={review.id} className="border border-gray-100 rounded-xl p-4">
          {/* Review header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">
                {(review.profile?.full_name || 'U')[0].toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {review.profile?.full_name || 'Usuario'}
              </p>
              <div className="flex items-center gap-2">
                <StarRating value={review.rating} size="sm" />
                <span className="text-xs text-gray-400">{timeAgo(review.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-sm text-gray-600 mt-2">{review.comment}</p>
          )}

          {/* Business response */}
          {review.response && (
            <div className="mt-3 ml-6 bg-gray-50 border border-gray-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-primary mb-1">Respuesta del negocio</p>
              <p className="text-sm text-gray-600">{review.response}</p>
            </div>
          )}

          {/* Owner respond button */}
          {isOwner && !review.response && (
            <div className="mt-3 ml-6">
              {respondingTo === review.id ? (
                <div className="space-y-2">
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    maxLength={500}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg resize-none text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResponse(review.id)}
                      disabled={responseLoading || !responseText.trim()}
                      className="px-4 py-1.5 bg-primary hover:bg-primary-dark disabled:bg-gray-300 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      {responseLoading ? 'Enviando...' : 'Responder'}
                    </button>
                    <button
                      onClick={() => { setRespondingTo(null); setResponseText('') }}
                      className="px-4 py-1.5 text-gray-500 hover:text-gray-700 text-sm transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setRespondingTo(review.id)}
                  className="text-sm text-primary hover:text-primary-dark font-medium transition-colors"
                >
                  Responder
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      {hasMore && (
        <div className="text-center pt-2">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 text-sm text-primary hover:text-primary-dark font-medium border border-primary/20 hover:border-primary/40 rounded-xl transition-colors"
          >
            {loading ? 'Cargando...' : 'Cargar mas opiniones'}
          </button>
        </div>
      )}
    </div>
  )
}
