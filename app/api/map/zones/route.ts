import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    // Return top zones by count with auto-distributed SVG positions
    const PALETTE = ['var(--coral)', 'var(--gold)', '#22B8CF', '#22C55E', '#D946EF', '#2F80ED', '#14B8A6', '#F59E0B']

    const zonesData = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12)

    // Posiciones distribuidas en un patrón de cuadrícula radial
    const total = zonesData.length
    const CX = 270, CY = 200
    const zones = zonesData.map(([label, businesses], i) => {
      // Distribuir en espiral/óvalo para evitar solapamiento
      const angle = (i / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2
      const radiusX = 200, radiusY = 150
      const cx = CX + Math.cos(angle) * radiusX * (i % 2 === 0 ? 1 : 0.8)
      const cy = CY + Math.sin(angle) * radiusY * (i % 2 === 0 ? 1 : 0.8)
      return {
        id: label.toLowerCase().replace(/\s+/g, '-').replace(/[áéíóú]/g, (c) =>
          ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' }[c] ?? c)
        ),
        label,
        businesses,
        slug: encodeURIComponent(label),
        color: PALETTE[i % PALETTE.length],
        cx,
        cy,
      }
    })

    return NextResponse.json(zones)
  } catch {
    return NextResponse.json([])
  }
}
