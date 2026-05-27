import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ZONE_COLORS = [
  'var(--coral)',
  'var(--gold)',
  '#22B8CF',
  '#22C55E',
  '#D946EF',
  '#2F80ED',
]

export async function GET() {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('businesses')
      .select('neighborhood')
      .eq('is_active', true)
      .not('neighborhood', 'is', null)

    if (error) throw error

    const rows = (data ?? []) as { neighborhood: string | null }[]

    // Count businesses per real neighborhood name
    const counts: Record<string, number> = {}
    for (const biz of rows) {
      const n = (biz.neighborhood ?? '').trim()
      if (!n) continue
      counts[n] = (counts[n] ?? 0) + 1
    }

    // Return top 6 by count with SVG positions and colors
    const SVG_POSITIONS = [
      { cx: 300, cy: 200 },
      { cx: 180, cy: 150 },
      { cx: 420, cy: 140 },
      { cx: 240, cy: 280 },
      { cx: 380, cy: 300 },
      { cx: 120, cy: 260 },
    ]

    const zones = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, businesses], i) => ({
        id: label.toLowerCase().replace(/\s+/g, '-').replace(/[áéíóú]/g, (c) =>
          ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' }[c] ?? c)
        ),
        label,
        businesses,
        slug: encodeURIComponent(label),
        color: ZONE_COLORS[i],
        cx: SVG_POSITIONS[i].cx,
        cy: SVG_POSITIONS[i].cy,
      }))

    return NextResponse.json(zones)
  } catch {
    return NextResponse.json([])
  }
}
