'use client'

type MarqueeItem = {
  label: string
  serif?: boolean
  gold?: boolean
  coral?: boolean
  muted?: boolean
}

// Lugares icónicos de Lagos de Moreno — fila serif italic
const ROW1: MarqueeItem[] = [
  { label: 'El Jardín Principal', serif: true },
  { label: 'Teatro Ocampo', serif: true },
  { label: 'La Parroquia', serif: true, gold: true },
  { label: 'El Calvario', serif: true },
  { label: 'Puente de Lagos', serif: true },
  { label: 'Mercado Municipal', serif: true },
  { label: 'Casa de la Cultura', serif: true },
  { label: 'Centro Histórico', serif: true, coral: true },
  { label: 'Santuario Guadalupano', serif: true },
  { label: 'Plaza de Armas', serif: true },
  { label: 'Escuelas y Colegios', serif: true },
  { label: 'Capilla de Tepeyac', serif: true },
]

// Identidad cultural — fila sans más pequeña
const ROW2: MarqueeItem[] = [
  { label: 'Pueblo Mágico', gold: true },
  { label: 'Fundada en 1563', muted: true },
  { label: 'Cuna de Escritores', coral: true },
  { label: 'Tierra Agavera', muted: true },
  { label: 'Gastronomía Jalisciense' },
  { label: 'Arte Barroco' },
  { label: 'Feria de Lagos', gold: true },
  { label: 'Los Alteños', muted: true },
  { label: 'Jalisco, México' },
  { label: 'SomosLagos', coral: true },
  { label: 'Tu ciudad digital' },
  { label: 'Negocios locales', muted: true },
]

function Separator({ row }: { row: 1 | 2 }) {
  return row === 1 ? (
    <span
      className="mx-5 flex-shrink-0 select-none"
      style={{ color: 'rgba(245,185,66,0.55)', fontSize: '0.65rem' }}
      aria-hidden="true"
    >
      ✦
    </span>
  ) : (
    <span
      className="mx-4 flex-shrink-0 select-none"
      style={{ color: 'rgba(255,253,248,0.18)', fontSize: '1rem', lineHeight: 1 }}
      aria-hidden="true"
    >
      ·
    </span>
  )
}

function itemStyle(item: MarqueeItem, row: 1 | 2): React.CSSProperties {
  const base: React.CSSProperties = {
    whiteSpace: 'nowrap',
    flexShrink: 0,
    userSelect: 'none',
  }
  if (row === 1) {
    return {
      ...base,
      fontFamily: item.serif ? 'var(--serif)' : 'var(--body)',
      fontStyle: item.serif ? 'italic' : 'normal',
      fontSize: '1.05rem',
      letterSpacing: item.serif ? '0.01em' : '0.02em',
      color: item.gold
        ? 'var(--gold)'
        : item.coral
          ? 'var(--coral)'
          : 'rgba(255,253,248,0.82)',
    }
  }
  return {
    ...base,
    fontFamily: 'var(--body)',
    fontSize: '0.78rem',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontWeight: 500,
    color: item.gold
      ? 'rgba(245,185,66,0.8)'
      : item.coral
        ? 'rgba(255,107,53,0.8)'
        : item.muted
          ? 'rgba(255,253,248,0.32)'
          : 'rgba(255,253,248,0.52)',
  }
}

function MarqueeRow({ items, reverse = false, row }: { items: MarqueeItem[]; reverse?: boolean; row: 1 | 2 }) {
  const doubled = [...items, ...items]
  const speed = row === 1 ? '38s' : '28s'
  return (
    <div className="overflow-hidden" aria-hidden="true">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: 'max-content',
          animation: `${reverse ? 'marquee-rtl' : 'marquee-ltr'} ${speed} linear infinite`,
        }}
      >
        {doubled.map((item, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <span style={itemStyle(item, row)}>{item.label}</span>
            <Separator row={row} />
          </span>
        ))}
      </div>
    </div>
  )
}

export default function MarqueeTicker() {
  return (
    <div
      className="py-4 overflow-hidden"
      style={{
        background: 'var(--ink)',
        borderTop: '1px solid rgba(255,253,248,0.04)',
        borderBottom: '1px solid rgba(255,253,248,0.04)',
      }}
    >
      <div className="mb-2.5">
        <MarqueeRow items={ROW1} row={1} />
      </div>
      <MarqueeRow items={ROW2} row={2} reverse />
    </div>
  )
}
