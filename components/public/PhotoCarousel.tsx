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
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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

  // Close lightbox with Escape key
  useEffect(() => {
    if (!lightboxOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowLeft') goTo(activeIndex - 1)
      if (e.key === 'ArrowRight') goTo(activeIndex + 1)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKey)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightboxOpen, activeIndex])

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, photos.length - 1))
    setActiveIndex(clamped)
    scrollToIndex(clamped)
  }

  if (photos.length === 0) return null

  // Grid layout for 1-4 photos, carousel for 5+
  const useGrid = photos.length <= 4

  return (
    <>
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Galeria</h2>
            <span className="text-sm text-gray-500">{photos.length} foto{photos.length !== 1 ? 's' : ''}</span>
          </div>

          {useGrid ? (
            /* Grid layout for few photos */
            <div className={`grid gap-2 rounded-2xl overflow-hidden ${
              photos.length === 1 ? 'grid-cols-1' :
              photos.length === 2 ? 'grid-cols-2' :
              photos.length === 3 ? 'grid-cols-2 grid-rows-2' :
              'grid-cols-2 grid-rows-2'
            }`} style={{ maxHeight: '500px' }}>
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  onClick={() => { setActiveIndex(i); setLightboxOpen(true) }}
                  className={`relative overflow-hidden group cursor-pointer ${
                    photos.length === 3 && i === 0 ? 'row-span-2' : ''
                  } ${photos.length === 1 ? 'aspect-video' : 'aspect-square'}`}
                >
                  <Image
                    src={photo.image_url}
                    alt={`${businessName} - Foto ${i + 1}`}
                    fill
                    sizes={photos.length === 1 ? '100vw' : '50vw'}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </button>
              ))}
            </div>
          ) : (
            /* Carousel for many photos */
            <div className="relative">
              <div
                ref={scrollRef}
                className="flex overflow-x-auto snap-x snap-mandatory gap-3"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
              >
                {photos.map((photo, i) => (
                  <button
                    key={photo.id}
                    onClick={() => { setActiveIndex(i); setLightboxOpen(true) }}
                    className="w-[85%] md:w-[60%] flex-shrink-0 snap-center cursor-pointer group"
                  >
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 shadow-md">
                      <Image
                        src={photo.image_url}
                        alt={`${businessName} - Foto ${i + 1}`}
                        fill
                        sizes="(max-width: 768px) 85vw, 60vw"
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>

              {/* Nav buttons */}
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => goTo(activeIndex - 1)}
                    disabled={activeIndex === 0}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 disabled:opacity-0 transition-all duration-200 backdrop-blur-sm"
                    aria-label="Foto anterior"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => goTo(activeIndex + 1)}
                    disabled={activeIndex === photos.length - 1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center text-gray-700 disabled:opacity-0 transition-all duration-200 backdrop-blur-sm"
                    aria-label="Foto siguiente"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          )}

          {/* Thumbnails strip */}
          {photos.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1 justify-center" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  onClick={() => goTo(i)}
                  className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden relative transition-all duration-200 ${
                    i === activeIndex
                      ? 'ring-2 ring-primary ring-offset-2 scale-105'
                      : 'opacity-50 hover:opacity-100 hover:scale-105'
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

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/70 text-sm font-medium">
            {activeIndex + 1} / {photos.length}
          </div>

          {/* Main image */}
          <div
            className="relative w-full h-full max-w-5xl max-h-[85vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[activeIndex].image_url}
              alt={`${businessName} - Foto ${activeIndex + 1}`}
              fill
              sizes="100vw"
              className="object-contain"
              priority
            />
          </div>

          {/* Lightbox nav */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(activeIndex - 1) }}
                disabled={activeIndex === 0}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white disabled:opacity-0 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goTo(activeIndex + 1) }}
                disabled={activeIndex === photos.length - 1}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white disabled:opacity-0 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Lightbox thumbnails */}
          {photos.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
              {photos.map((photo, i) => (
                <button
                  key={photo.id}
                  onClick={(e) => { e.stopPropagation(); goTo(i) }}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden relative transition-all duration-200 ${
                    i === activeIndex
                      ? 'ring-2 ring-white scale-110'
                      : 'opacity-40 hover:opacity-80'
                  }`}
                >
                  <Image
                    src={photo.image_url}
                    alt={`Thumbnail ${i + 1}`}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
