'use client'

import { useState } from 'react'
import StarRating from './StarRating'
import type { Review } from '@/types/reviews'

interface ReviewFormProps {
  businessId: string
  existingReview?: Review | null
  onReviewSubmitted: () => void
}

export default function ReviewForm({ businessId, existingReview, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (existingReview) {
    return (
      <div className="rounded-xl p-4" style={{ background: 'rgba(255,107,53,0.05)', border: '1px solid rgba(255,107,53,0.1)' }}>
        <div className="flex items-center gap-2 mb-1">
          <StarRating value={existingReview.rating} size="sm" />
          <span className="text-sm font-medium" style={{ color: 'var(--coral)' }}>Ya dejaste tu opinion</span>
        </div>
        {existingReview.comment && (
          <p className="text-sm text-gray-600 mt-1">{existingReview.comment}</p>
        )}
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError('Selecciona una calificacion')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: businessId,
          rating,
          comment: comment.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Error al enviar tu opinion')
        return
      }

      onReviewSubmitted()
    } catch {
      setError('Error de conexion. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-sm font-medium text-gray-700 mb-3">Califica este negocio</p>

      <StarRating value={rating} interactive onChange={setRating} size="lg" />

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Escribe tu opinion (opcional)"
        maxLength={500}
        rows={3}
        className="w-full mt-4 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 focus:border-[#FF6B35] transition-all text-sm"
      />
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-400">{comment.length}/500</span>
      </div>

      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="mt-3 w-full sm:w-auto px-6 py-2.5 disabled:bg-gray-300 text-white font-semibold rounded-xl transition-colors text-sm" style={{ background: 'var(--coral)' }}
      >
        {loading ? 'Enviando...' : 'Enviar opinion'}
      </button>
    </form>
  )
}
