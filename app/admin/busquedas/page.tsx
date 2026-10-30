export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { isAdmin, createServiceClient } from '@/lib/supabase/server'

interface Row {
  term: string
  results: number
  created_at: string
}

const DAYS = 30

export default async function AdminBusquedasPage() {
  const admin = await isAdmin()
  if (!admin) redirect('/')

  const supabase = createServiceClient()
  const since = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: searches }, { data: categories }] = await Promise.all([
    supabase.from('search_queries').select('term, results, created_at').gte('created_at', since).limit(10000),
    supabase.from('businesses').select('total_views, category:categories(name)').eq('is_active', true),
  ])

  const rows = (searches as Row[] | null) ?? []
  const byTerm = new Map<string, { count: number; results: number }>()
  for (const r of rows) {
    const cur = byTerm.get(r.term) ?? { count: 0, results: r.results }
    cur.count += 1
    cur.results = r.results
    byTerm.set(r.term, cur)
  }
  const ranked = [...byTerm.entries()].sort((a, b) => b[1].count - a[1].count)
  const top = ranked.slice(0, 25)
  const withoutResults = ranked.filter(([, v]) => v.results === 0).slice(0, 15)

  const views = new Map<string, number>()
  for (const b of (categories as unknown as { total_views: number | null; category: { name: string } | null }[] | null) ?? []) {
    const name = b.category?.name
    if (name) views.set(name, (views.get(name) ?? 0) + (b.total_views ?? 0))
  }
  const topCategories = [...views.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#1F2937] mb-1">Lo más buscado</h1>
      <p className="text-sm text-gray-500 mb-6">
        Últimos {DAYS} días · {rows.length.toLocaleString()} búsquedas registradas (sin IP ni usuario, sin bots).
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-1">
          <h2 className="font-semibold text-[#1F2937] mb-3">Búsquedas frecuentes</h2>
          {top.length === 0 ? (
            <p className="text-sm text-gray-500">Aún no hay datos. Se llenará conforme la gente use el buscador.</p>
          ) : (
            <ol className="space-y-1.5">
              {top.map(([term, v], i) => (
                <li key={term} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate"><span className="text-gray-400 mr-2">{i + 1}.</span>{term}</span>
                  <span className="font-semibold tabular-nums">{v.count}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-1">
          <h2 className="font-semibold text-[#1F2937] mb-1">Sin resultados</h2>
          <p className="text-xs text-gray-500 mb-3">Lo que buscan y no encuentran: oportunidades de negocios o categorías por sumar.</p>
          {withoutResults.length === 0 ? (
            <p className="text-sm text-gray-500">Ninguna búsqueda sin resultados por ahora.</p>
          ) : (
            <ul className="space-y-1.5">
              {withoutResults.map(([term, v]) => (
                <li key={term} className="flex items-center justify-between gap-3 text-sm">
                  <span className="truncate">{term}</span>
                  <span className="font-semibold tabular-nums">{v.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-1">
          <h2 className="font-semibold text-[#1F2937] mb-1">Categorías más visitadas</h2>
          <p className="text-xs text-gray-500 mb-3">Visitas acumuladas a fichas de negocio por categoría.</p>
          <ol className="space-y-1.5">
            {topCategories.map(([name, total], i) => (
              <li key={name} className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate"><span className="text-gray-400 mr-2">{i + 1}.</span>{name}</span>
                <span className="font-semibold tabular-nums">{total.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  )
}
