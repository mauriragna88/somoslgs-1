'use client'

import { useEffect, useRef, useState } from 'react'

interface TextRevealProps {
  text: string
  className?: string
  staggerMs?: number
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  children?: React.ReactNode
}

export default function TextReveal({
  text,
  className = '',
  staggerMs = 80,
  as: Tag = 'span',
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      setIsVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.2 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const words = text.split(' ')

  return (
    <Tag ref={ref as any} className={className}>
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden mr-[0.25em]"
        >
          <span
            className={`inline-block transition-all ease-out ${
              isVisible
                ? 'opacity-100 translate-y-0 blur-0'
                : 'opacity-0 translate-y-full blur-sm'
            }`}
            style={{
              transitionDuration: '500ms',
              transitionDelay: `${i * staggerMs}ms`,
            }}
          >
            {word}
          </span>
        </span>
      ))}
    </Tag>
  )
}
