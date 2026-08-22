'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

interface SearchResult {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  address: string
  neighborhood: string | null
  subscription_tier: string
  is_featured: boolean
  rating: number
  total_reviews: number
  category: { id: string; name: string; icon: string } | null
}

interface CategorySuggestion {
  id: string
  name: string
  icon: string
  slug: string
}

interface SmartSearchProps {
  variant: 'header' | 'hero' | 'mobile'
  onNavigate?: () => void
}

const EASE = [0.16, 1, 0.3, 1] as const

/* Highlight del texto coincidente en el nombre del negocio */
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>
  const q = query.trim().toLowerCase()
  const lower = text.toLowerCase()
  const idx = lower.indexOf(q)
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(255,107,53,0.18)', color: 'inherit', borderRadius: 2, padding: '0 1px' }}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  )
}

export default function SmartSearch({ variant, onNavigate }: SmartSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [categories, setCategories] = useState<CategorySuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const fetchResults = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([])
      if (!searchQuery.trim()) {
        // Sin texto: mostrar sugerencias de categorías
        setShowDropdown(categories.length > 0)
      } else {
        setShowDropdown(false)
      }
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
        setShowDropdown(true)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [categories])

  // Cargar sugerencias de categorías al montar
  useEffect(() => {
    fetch('/api/search/categories?limit=8')
      .then(res => res.json())
      .then((data: CategorySuggestion[]) => setCategories(data))
      .catch(() => setCategories([]))
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    setSelectedIndex(-1)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchResults(value)
    }, 250)
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
    if (!showDropdown) return

    const total = query.trim().length >= 2 ? results.length : categories.length

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev < total - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : total - 1))
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
    header: 'w-full pl-10 pr-4 py-2 bg-gray-100 border border-transparent rounded-full text-sm focus:outline-none focus:bg-white focus:border-[#FF6B35]/30 focus:ring-2 focus:ring-[#FF6B35]/10 transition-all',
    hero: 'w-full pl-12 pr-4 py-4 text-base bg-pueblo-crema border-2 border-pueblo-canteraLight rounded-2xl text-pueblo-noche placeholder-pueblo-terracotta/40 focus:outline-none focus:bg-white focus:border-pueblo-barroco focus:ring-2 focus:ring-pueblo-barroco/20 shadow-lg shadow-pueblo-noche/10 transition-all',
    mobile: 'w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-xl text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#FF6B35]/20 transition-all',
  }

  const dropdownClasses = {
    header: 'absolute top-full left-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 w-[420px]',
    hero: 'absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50',
    mobile: 'absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50',
  }

  const showingResults = query.trim().length >= 2
  const listItems = showingResults ? results : categories

  return (
    <div ref={containerRef} className="relative">
      <form onSubmit={handleSubmit} className={variant === 'hero' ? 'relative flex gap-3' : 'relative'}>
        <div className={variant === 'hero' ? 'relative flex-1' : 'relative w-full'}>
          <svg
            className={`absolute ${variant === 'hero' ? 'left-4' : 'left-3'} top-1/2 -translate-y-1/2 ${variant === 'hero' ? 'w-5 h-5' : 'w-4 h-4'} ${variant === 'hero' ? 'text-pueblo-terracotta/60' : 'text-gray-400'}`}
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
            onFocus={() => {
              if (query.trim().length >= 2) {
                if (results.length > 0) setShowDropdown(true)
              } else if (categories.length > 0) {
                setShowDropdown(true)
              }
            }}
            aria-label="Buscar negocios, productos y servicios"
            placeholder="Buscar negocios, productos, servicios..."
            className={inputClasses[variant]}
          />
          {loading && (
            <div className={`absolute ${variant === 'hero' ? 'right-4' : 'right-3'} top-1/2 -translate-y-1/2`}>
              <div className={`w-4 h-4 border-2 rounded-full animate-spin ${variant === 'hero' ? 'border-pueblo-canteraLight border-t-pueblo-barroco' : 'border-[#FF6B35]/30 border-t-[#FF6B35]'}`}></div>
            </div>
          )}
        </div>
        {variant === 'hero' && (
          <button
            type="submit"
            className="px-8 py-4 bg-gradient-to-r from-pueblo-barroco to-pueblo-terracotta hover:from-pueblo-terracotta hover:to-pueblo-barroco text-pueblo-noche font-bold rounded-2xl transition-all hover:scale-105 shadow-xl shadow-pueblo-barroco/20"
          >
            Buscar
          </button>
        )}
      </form>

      {/* Dropdown con AnimatePresence */}
      <AnimatePresence>
        {showDropdown && listItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.22, ease: EASE }}
            className={dropdownClasses[variant]}
            style={{ transformOrigin: 'top center' }}
          >
            {/* Header del dropdown */}
            <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                {showingResults ? `Resultados para "${query}"` : 'Explorar por categoría'}
              </span>
              {showingResults && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}>
                  {results.length} encontrados
                </span>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {showingResults ? (
                /* Resultados de negocios — stagger al aparecer */
                results.map((biz, index) => (
                  <motion.div
                    key={biz.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE, delay: Math.min(index * 0.05, 0.3) }}
                  >
                    <Link
                      href={`/negocios/${biz.slug}`}
                      onClick={(e) => {
                        e.preventDefault()
                        navigateTo(`/negocios/${biz.slug}`)
                      }}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors border-b border-gray-100 last:border-0 ${
                        index === selectedIndex ? 'bg-[rgba(255,107,53,0.08)] border-l-2 border-l-[#FF6B35]' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Logo */}
                      <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-sm">
                        {biz.logo_url ? (
                          <Image
                            src={biz.logo_url}
                            alt={biz.name}
                            width={44}
                            height={44}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[rgba(255,107,53,0.2)] to-[rgba(255,107,53,0.1)] text-[#FF6B35] font-bold text-base">
                            {biz.name[0].toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Info con highlight */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            <HighlightMatch text={biz.name} query={query} />
                          </p>
                          {(biz.is_featured || biz.subscription_tier === 'avanzado') && (
                            <span className="text-xs text-amber-500 flex-shrink-0">&#11088;</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {biz.category && (
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded-md flex-shrink-0" style={{ color: 'rgba(255,107,53,0.8)', background: 'rgba(255,107,53,0.08)' }}>
                              {biz.category.icon} {biz.category.name}
                            </span>
                          )}
                          {(biz.neighborhood || biz.address) && (
                            <span className="text-xs text-gray-500 truncate">
                              📍 {biz.neighborhood || biz.address}
                            </span>
                          )}
                          {biz.rating > 0 && (
                            <span className="text-xs text-amber-600 flex-shrink-0">
                              ★ {biz.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                /* Sugerencias de categorías */
                <div className="grid grid-cols-2 gap-1.5 p-3">
                  {categories.map((cat, index) => (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: EASE, delay: Math.min(index * 0.04, 0.28) }}
                    >
                      <Link
                        href={`/categorias/${cat.slug}`}
                        onClick={(e) => {
                          e.preventDefault()
                          navigateTo(`/categorias/${cat.slug}`)
                        }}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
                          index === selectedIndex ? 'bg-[rgba(255,107,53,0.1)]' : 'hover:bg-gray-50'
                        }`}
                      >
                        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base" style={{ background: 'rgba(255,107,53,0.08)' }}>
                          {cat.icon || '📦'}
                        </span>
                        <span className="text-[13px] font-semibold text-gray-800 truncate">{cat.name}</span>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Ver todos los resultados */}
            <button
              onClick={() => navigateTo(showingResults ? `/buscar?q=${encodeURIComponent(query.trim())}` : '/buscar')}
              className="w-full px-4 py-3 text-sm font-semibold text-[#FF6B35] hover:bg-[rgba(255,107,53,0.05)] border-t-2 border-gray-100 transition-colors text-center flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {showingResults ? `Ver todos los resultados para "${query}"` : 'Ver todos los negocios'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
