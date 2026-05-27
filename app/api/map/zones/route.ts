import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ZONE_KEYWORDS: Record<string, string[]> = {
  centro: ['centro', 'histórico', 'historico', 'centro histórico'],
  jardines: ['jardines', 'jardín', 'jardin'],
  satelite: ['satélite', 'satelite'],
  hidalgo: ['hidalgo'],
  obrera: ['obrera'],
  morelos: ['morelos'],
}

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('businesses')
      .select('neighborhood')
      .eq('is_active', true)
      .not('neighborhood', 'is', null)

    if (error) throw error

    const counts: Record<string, number> = {}
    const rows = (data ?? []) as { neighborhood: string | null }[]

    for (const biz of rows) {
      const n = (biz.neighborhood ?? '').toLowerCase().trim()
      if (!n) continue

      let matched = false
      for (const [zoneId, keywords] of Object.entries(ZONE_KEYWORDS)) {
        if (keywords.some(k => n.includes(k))) {
          counts[zoneId] = (counts[zoneId] ?? 0) + 1
          matched = true
          break
        }
      }
      if (!matched) {
        counts['centro'] = (counts['centro'] ?? 0) + 1
      }
    }

    return NextResponse.json(counts)
  } catch {
    return NextResponse.json({})
  }
}
