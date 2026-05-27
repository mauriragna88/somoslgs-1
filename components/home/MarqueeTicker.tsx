'use client'

const ROW1 = [
  { icon: '🍽️', label: 'Restaurantes' },
  { icon: '💇', label: 'Belleza' },
  { icon: '🏪', label: 'Tiendas' },
  { icon: '🏨', label: 'Hospedaje' },
  { icon: '🎭', label: 'Entretenimiento' },
  { icon: '💊', label: 'Salud' },
  { icon: '🛒', label: 'Servicios' },
  { icon: '🌮', label: 'Antojitos' },
  { icon: '🏛️', label: 'Lagos de Moreno', gold: true },
  { icon: '✨', label: 'Pueblo Mágico', gold: true },
]

const ROW2 = [
  { icon: '⭐', label: 'Reseñas reales' },
  { icon: '📍', label: 'Jalisco' },
  { icon: '💬', label: 'WhatsApp directo' },
  { icon: '🗺️', label: 'Descubre' },
  { label: 'SomosLagos', coral: true },
  { icon: '🛍️', label: 'Compra y Vende' },
  { label: 'Tu ciudad digital', coral: true },
  { icon: '🏆', label: 'Negocios locales' },
  { icon: '🎪', label: 'Eventos' },
]

type MarqueeItem = {
  icon?: string
  label: string
  gold?: boolean
  coral?: boolean
}

function MarqueeRow({ items, reverse = false }: { items: MarqueeItem[]; reverse?: boolean }) {
  const doubled = [...items, ...items]
  return (
    <div className="overflow-hidden py-1.5" aria-hidden="true">
      <div
        style={{
          display: 'flex',
          width: 'max-content',
          animation: `${reverse ? 'marquee-rtl' : 'marquee-ltr'} ${reverse ? '26s' : '32s'} linear infinite`,
        }}
      >
        {doubled.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 px-4 py-1.5 mx-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0"
            style={{
              background: item.gold
                ? 'rgba(245,185,66,0.15)'
                : item.coral
                  ? 'rgba(255,107,53,0.13)'
                  : 'rgba(255,253,248,0.07)',
              color: item.gold
                ? 'var(--gold)'
                : item.coral
                  ? 'var(--coral)'
                  : 'rgba(255,253,248,0.65)',
              border: `1px solid ${
                item.gold
                  ? 'rgba(245,185,66,0.28)'
                  : item.coral
                    ? 'rgba(255,107,53,0.22)'
                    : 'rgba(255,253,248,0.09)'
              }`,
            }}
          >
            {item.icon && <span aria-hidden="true">{item.icon}</span>}
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function MarqueeTicker() {
  return (
    <div
      className="py-3 overflow-hidden"
      style={{
        background: 'var(--ink)',
        borderTop: '1px solid rgba(255,253,248,0.05)',
        borderBottom: '1px solid rgba(255,253,248,0.05)',
      }}
    >
      <MarqueeRow items={ROW1} />
      <MarqueeRow items={ROW2} reverse />
    </div>
  )
}
