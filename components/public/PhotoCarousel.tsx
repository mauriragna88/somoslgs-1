'use client'

import { useState, useEffect } from 'react'
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

  // Close lightbox with Escape key + arrow navigation
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
  }

  if (photos.length === 0) return null

  return (
    <>
      <div className="bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Galeria</h2>
            <span className="text-sm text-gray-500">{photos.length} foto{photos.length !== 1 ? 's' : ''}</span>
          </div>

          {/* Masonry Layout */}
          <div className="columns-2 md:columns-3 lg:columns-4 gap-3">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={() => { setActiveIndex(i); setLightboxOpen(true) }}
                className="break-inside-avoid mb-3 block w-full group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group-hover:scale-[1.02]">
                  <Image
                    src={photo.image_url}
                    alt={`${businessName} - Foto ${i + 1}`}
                    width={400}
                    height={300}
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
              </button>
            ))}
          </div>
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
            aria-label="Cerrar galeria"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors z-10"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-4 text-white/90 text-sm font-medium">
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
                aria-label="Foto anterior"
                onClick={(e) => { e.stopPropagation(); goTo(activeIndex - 1) }}
                disabled={activeIndex === 0}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white disabled:opacity-0 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                aria-label="Siguiente foto"
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
                  aria-label={`Ver foto ${i + 1}`}
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
