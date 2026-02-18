'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'

interface Photo {
  id: string
  image_url: string
  display_order: number
}

interface PhotoCarouselProps {
  photos: Photo[]
  businessName: string
}

export default function PhotoCarousel({ photos, businessName }: PhotoCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const thumbsRef = useRef<HTMLDivElement>(null)

  const scrollToIndex = useCallback((index: number) => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const child = container.children[index] as HTMLElement
    if (child) {
      container.scrollTo({ left: child.offsetLeft, behavior: 'smooth' })
    }
  }, [])

  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return
    const container = scrollRef.current
    const scrollLeft = container.scrollLeft
    const childWidth = container.children[0]?.clientWidth || 1
    const newIndex = Math.round(scrollLeft / childWidth)
    setActiveIndex(Math.min(newIndex, photos.length - 1))
  }, [photos.length])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, photos.length - 1))
    setActiveIndex(clamped)
    scrollToIndex(clamped)
  }

  const goPrev = () => goTo(activeIndex - 1)
  const goNext = () => goTo(activeIndex + 1)

  if (photos.length === 0) return null

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Fotos del establecimiento</h2>

        {/* Main carousel */}
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide gap-0"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {photos.map((photo, i) => (
              <div
                key={photo.id}
                className="w-full flex-shrink-0 snap-center"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={photo.image_url}
                    alt={`${businessName} - Foto ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 800px"
                    className="object-cover"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Prev/Next buttons */}
          {photos.length > 1 && (
            <>
              <button
                onClick={goPrev}
                disabled={activeIndex === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-md flex items-center justify-center text-gray-700 disabled:opacity-30 disabled:cursor-default transition-opacity"
                aria-label="Foto anterior"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={goNext}
                disabled={activeIndex === photos.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 hover:bg-white rounded-full shadow-md flex items-center justify-center text-gray-700 disabled:opacity-30 disabled:cursor-default transition-opacity"
                aria-label="Foto siguiente"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Dots indicator */}
        {photos.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-3">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === activeIndex
                    ? 'bg-primary w-6'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Ir a foto ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Thumbnails strip */}
        {photos.length > 1 && (
          <div
            ref={thumbsRef}
            className="flex gap-2 mt-3 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => goTo(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden relative transition-all ${
                  i === activeIndex
                    ? 'ring-2 ring-primary ring-offset-1'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Image
                  src={photo.image_url}
                  alt={`Thumbnail ${i + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
