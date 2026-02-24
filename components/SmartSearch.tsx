'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

interface SearchResult {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  address: string
  subscription_tier: string
  is_featured: boolean
  category: { id: string; name: string; icon: string } | null
}

interface SmartSearchProps {
  variant: 'header' | 'hero' | 'mobile'
  onNavigate?: () => void
}

export default function SmartSearch({ variant, onNavigate }: SmartSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([])
      setShowDropdown(false)
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
        setShowDropdown(data.length > 0)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    setSelectedIndex(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchResults(value)
    }, 300)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedIndex >= 0 && results[selectedIndex]) {
      navigateTo(`/negocios/${results[selectedIndex].slug}`)
      return
    }
    if (query.trim()) {
      navigateTo(`/buscar?q=${encodeURIComponent(query.trim())}`)
    } else {
      navigateTo('/buscar')
    }
  }

  const navigateTo = (url: string) => {
    setShowDropdown(false)
    setQuery('')
    setResults([])
    onNavigate?.()
    router.push(url)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || results.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setSelectedIndex(-1)
    }
  }

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const inputClasses = {
    header: 'w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-full text-sm focus:outline-none focus:bg-white focus:border-primary/30 focus:ring-2 focus:ring-primary/10 transition-all',
    hero: 'w-full pl-12 pr-4 py-4 text-base bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:bg-white/20 focus:border-white/40 focus:ring-2 focus:ring-accent/30 transition-all',
    mobile: 'w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all',
  }

  const dropdownClasses = {
    header: 'absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50',
    hero: 'absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50',
    mobile: 'absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50',
  }

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className={variant === 'hero' ? 'relative flex gap-3' : 'relative'}>
        <div className={variant === 'hero' ? 'relative flex-1' : 'relative w-full'}>
          <svg
            className={`absolute ${variant === 'hero' ? 'left-4' : 'left-3'} top-1/2 -translate-y-1/2 ${variant === 'hero' ? 'w-5 h-5' : 'w-4 h-4'} text-gray-400`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (results.length > 0) setShowDropdown(true) }}
            placeholder="Buscar negocios, productos, servicios..."
            className={inputClasses[variant]}
          />
          {loading && (
            <div className={`absolute ${variant === 'hero' ? 'right-4' : 'right-3'} top-1/2 -translate-y-1/2`}>
              <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        {variant === 'hero' && (
          <button
            type="submit"
            className="px-8 py-4 bg-accent hover:bg-accent-dark text-secondary font-bold rounded-2xl transition-all hover:scale-105 shadow-xl shadow-accent/20"
          >
            Buscar
          </button>
        )}
      </form>

      {/* Dropdown de resultados */}
      {showDropdown && (
        <div className={dropdownClasses[variant]}>
          <div className="max-h-80 overflow-y-auto">
            {results.map((biz, index) => (
              <Link
                key={biz.id}
                href={`/negocios/${biz.slug}`}
                onClick={(e) => {
                  e.preventDefault()
                  navigateTo(`/negocios/${biz.slug}`)
                }}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  index === selectedIndex ? 'bg-primary/5' : ''
                } ${index > 0 ? 'border-t border-gray-50' : ''}`}
              >
                {/* Logo */}
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  {biz.logo_url ? (
                    <Image
                      src={biz.logo_url}
                      alt={biz.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold text-sm">
                      {biz.name[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900 truncate">{biz.name}</p>
                    {(biz.is_featured || biz.subscription_tier === 'avanzado') && (
                      <span className="text-xs text-amber-500">&#11088;</span>
                    )}
                  </div>
                  {biz.category && (
                    <p className="text-xs text-gray-500 truncate">
                      {biz.category.icon} {biz.category.name}
                      {biz.address && ` \u2022 ${biz.address}`}
                    </p>
                  )}
                  {!biz.category && biz.address && (
                    <p className="text-xs text-gray-500 truncate">{biz.address}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Ver todos los resultados */}
          <button
            onClick={() => navigateTo(`/buscar?q=${encodeURIComponent(query.trim())}`)}
            className="w-full px-4 py-3 text-sm font-medium text-primary hover:bg-primary/5 border-t border-gray-100 transition-colors text-center"
          >
            Ver todos los resultados para &ldquo;{query}&rdquo;
          </button>
        </div>
      )}
    </div>
  )
}
