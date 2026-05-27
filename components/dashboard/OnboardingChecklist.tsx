import Link from 'next/link'

interface ChecklistItem {
  label: string
  done: boolean
  href: string
  cta: string
}

interface OnboardingChecklistProps {
  logo: boolean
  description: boolean
  hours: boolean
  whatsapp: boolean
  hasProducts: boolean
  hasPhotos: boolean
}

export default function OnboardingChecklist({
  logo,
  description,
  hours,
  whatsapp,
  hasProducts,
  hasPhotos,
}: OnboardingChecklistProps) {
  const items: ChecklistItem[] = [
    { label: 'Sube tu logo', done: logo, href: '/dashboard/mi-negocio', cta: 'Subir' },
    { label: 'Agrega una descripción', done: description, href: '/dashboard/mi-negocio', cta: 'Escribir' },
    { label: 'Configura tus horarios', done: hours, href: '/dashboard/mi-negocio', cta: 'Configurar' },
    { label: 'Agrega tu número de WhatsApp', done: whatsapp, href: '/dashboard/mi-negocio', cta: 'Agregar' },
    { label: 'Publica al menos 1 producto', done: hasProducts, href: '/dashboard/productos/nuevo', cta: 'Crear' },
    { label: 'Sube al menos 1 foto', done: hasPhotos, href: '/dashboard/mi-negocio', cta: 'Subir' },
  ]

  const completed = items.filter(i => i.done).length
  const total = items.length
  const pct = Math.round((completed / total) * 100)

  if (completed === total) return null

  return (
    <div className="bg-white rounded-2xl overflow-hidden mb-8" style={{ boxShadow: 'var(--shadow-card)' }}>
      <div className="px-6 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
            Completa tu perfil
          </h2>
          <span className="text-sm font-semibold" style={{ color: 'var(--coral)' }}>
            {completed}/{total}
          </span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: 'rgba(0,0,0,0.06)' }}>
          <div
            className="h-2 rounded-full transition-all"
            style={{ width: `${pct}%`, background: 'var(--coral)' }}
          />
        </div>
        <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
          Los perfiles completos reciben hasta 3x más visitas
        </p>
      </div>

      <div className="divide-y" style={{ borderColor: 'rgba(0,0,0,0.04)' }}>
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 px-6 py-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: item.done ? 'var(--coral)' : 'rgba(0,0,0,0.06)',
              }}
            >
              {item.done && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <p
              className="flex-1 text-sm"
              style={{ color: item.done ? 'var(--muted)' : 'var(--ink)', textDecoration: item.done ? 'line-through' : 'none' }}
            >
              {item.label}
            </p>
            {!item.done && (
              <Link
                href={item.href}
                className="text-xs font-semibold px-3 py-1 rounded-full transition-colors"
                style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}
              >
                {item.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
