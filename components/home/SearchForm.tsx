'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchForm() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`)
    } else {
      router.push('/buscar')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex gap-2">
      <div className="relative flex-1">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar negocios, productos, servicios..."
          className="w-full pl-12 pr-4 py-4 text-base bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:bg-white/15 focus:border-white/40 focus:ring-2 focus:ring-primary-light/20 transition-all"
        />
      </div>
      <button
        type="submit"
        className="px-8 py-4 bg-accent hover:bg-accent-dark text-secondary font-semibold rounded-full transition-all hover:scale-105 shadow-lg"
      >
        Buscar
      </button>
    </form>
  )
}
