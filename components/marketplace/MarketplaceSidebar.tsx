import Link from 'next/link'
import BannerDisplay from '@/components/ads/BannerDisplay'
import type { MarketplaceCategory } from '@/types/database.types'

interface MarketplaceSidebarProps {
  categories: (MarketplaceCategory & { count: number })[]
  activeCategory: string
  searchParams: Record<string, string>
}

function buildUrl(params: Record<string, string>, overrides: Record<string, string>) {
  const merged = { ...params, ...overrides }
  const qs = Object.entries(merged)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
  return `/marketplace${qs ? `?${qs}` : ''}`
}

export default function MarketplaceSidebar({
  categories,
  activeCategory,
  searchParams,
}: MarketplaceSidebarProps) {
  const totalCount = categories.reduce((sum, c) => sum + c.count, 0)

  return (
    <aside className="hidden lg:block lg:col-span-1">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
        <h3 className="font-bold text-secondary mb-4 text-sm uppercase tracking-wide">Categorías</h3>
        <nav className="space-y-1">
          <Link
            href={buildUrl(searchParams, { category: '' })}
            className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
              !activeCategory
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span>Todas</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${!activeCategory ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-500'}`}>
              {totalCount}
            </span>
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={buildUrl(searchParams, { category: cat.id })}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                activeCategory === cat.id
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="truncate">
                <span className="mr-1.5">{cat.icon}</span>
                {cat.name}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${
                activeCategory === cat.id ? 'bg-primary/20 text-primary' : 'bg-gray-100 text-gray-500'
              }`}>
                {cat.count}
              </span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        <BannerDisplay placement="marketplace_sidebar" />
      </div>
    </aside>
  )
}
