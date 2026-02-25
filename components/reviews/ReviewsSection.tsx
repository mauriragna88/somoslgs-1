'use client'

import { useState, useEffect } from 'react'
import StarRating from './StarRating'
import ReviewForm from './ReviewForm'
import ReviewsCTA from './ReviewsCTA'
import ReviewsList from './ReviewsList'
import type { Review } from '@/types/reviews'

interface ReviewsSectionProps {
  businessId: string
  ownerId: string
  rating: number
  totalReviews: number
  initialReviews: Review[]
}

export default function ReviewsSection({
  businessId,
  ownerId,
  rating,
  totalReviews,
  initialReviews,
}: ReviewsSectionProps) {
  const [userId, setUserId] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [reviews, setReviews] = useState<Review[]>(initialReviews)
  const [currentRating, setCurrentRating] = useState(rating)
  const [currentTotal, setCurrentTotal] = useState(totalReviews)

  // Check auth on client
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUserId(user.id)
          setIsLoggedIn(true)
        }
      } catch {
        // not logged in
      } finally {
        setAuthLoading(false)
      }
    }
    checkAuth()
  }, [])

  const existingReview = userId ? reviews.find(r => r.user_id === userId) : null
  const isOwner = userId === ownerId

  const handleReviewSubmitted = async () => {
    // Refetch reviews
    try {
      const res = await fetch(`/api/reviews?business_id=${businessId}&offset=0&limit=10`)
      const data = await res.json()
      if (Array.isArray(data)) {
        setReviews(data)
        // Update rating display
        if (data.length > 0) {
          const avg = Math.round((data.reduce((sum: number, r: Review) => sum + r.rating, 0) / data.length) * 10) / 10
          setCurrentRating(avg)
          setCurrentTotal(data.length)
        }
      }
    } catch {
      // fallback: just reload
      window.location.reload()
    }
  }

  return (
    <section className="mb-12">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Opiniones</h2>
        {currentTotal > 0 && (
          <StarRating value={currentRating} count={currentTotal} size="md" />
        )}
      </div>

      {/* Form or CTA */}
      {!authLoading && (
        <div className="mb-6">
          {isLoggedIn ? (
            !isOwner && (
              <ReviewForm
                businessId={businessId}
                existingReview={existingReview}
                onReviewSubmitted={handleReviewSubmitted}
              />
            )
          ) : (
            <ReviewsCTA />
          )}
        </div>
      )}

      {/* Reviews list */}
      <ReviewsList
        initialReviews={reviews}
        businessId={businessId}
        isOwner={isOwner}
        totalCount={currentTotal}
      />
    </section>
  )
}
