'use client'

export default function SkeletonCard() {
  return (
    <div
      className="animate-pulse rounded-2xl overflow-hidden"
      style={{ background: 'var(--cream)', border: '1px solid rgba(31,41,55,0.07)' }}
    >
      {/* Image area */}
      <div
        className="h-40 w-full"
        style={{ background: 'rgba(31,41,55,0.07)' }}
      />

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Category pill */}
        <div
          className="h-4 w-20 rounded-full"
          style={{ background: 'rgba(31,41,55,0.07)' }}
        />
        {/* Title */}
        <div
          className="h-5 w-3/4 rounded-lg"
          style={{ background: 'rgba(31,41,55,0.07)' }}
        />
        {/* Subtitle / meta */}
        <div
          className="h-4 w-1/2 rounded-lg"
          style={{ background: 'rgba(31,41,55,0.07)' }}
        />
        {/* CTA row */}
        <div className="flex gap-2 pt-1">
          <div
            className="h-9 flex-1 rounded-full"
            style={{ background: 'rgba(31,41,55,0.07)' }}
          />
          <div
            className="h-9 w-9 rounded-full"
            style={{ background: 'rgba(31,41,55,0.07)' }}
          />
        </div>
      </div>
    </div>
  )
}
