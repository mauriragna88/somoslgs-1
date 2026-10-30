import Link from 'next/link'

/* Invitacion a registrar el negocio. Cada variante habla a un tipo de negocio distinto
   para que se sienta cercana y no un anuncio generico. */
const VARIANTS = {
  hoteles: {
    eyebrow: '🏨 Hoteles y hospedaje',
    title: 'Tú puedes ser el próximo hotel que busquen cuando quieran hospedarse en Lagos',
    body: 'Quien visita Lagos busca en línea dónde dormir antes de salir de casa. Que te encuentre a ti.',
  },
  restaurantes: {
    eyebrow: '🍽️ Restaurantes y taquerías',
    title: 'Restaurantes y taquerías son de lo más visitado. Que el siguiente en destacar seas tú',
    body: 'Muestra tu menú, tus horarios y un botón de WhatsApp. Es gratis y tarda unos minutos.',
  },
  paisano: {
    eyebrow: '🇺🇸 Paisanos y visitantes',
    title: 'Tú puedes ser el próximo negocio que busquen desde Estados Unidos',
    body: 'Los paisanos que regresan a Lagos buscan en línea antes de llegar. Haz que te encuentren.',
  },
  general: {
    eyebrow: '📍 Tu negocio en Lagos',
    title: 'Sé el próximo negocio que todos busquen en Lagos de Moreno',
    body: 'Tu perfil con fotos, horarios, ubicación y WhatsApp directo. Registrarte es gratis.',
  },
} as const

export type InviteVariant = keyof typeof VARIANTS

export default function InviteBanner({ variant = 'general' }: { variant?: InviteVariant }) {
  const v = VARIANTS[variant]
  return (
    <aside className="container mx-auto px-4 my-10" aria-label="Registra tu negocio">
      <div
        className="relative overflow-hidden rounded-3xl p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6"
        style={{ background: 'linear-gradient(120deg,#072d52,#0a4172 60%,#0e98ab)', color: '#fbeee3' }}
      >
        <div
          className="pointer-events-none absolute -right-10 -top-10 w-48 h-48 rounded-full"
          style={{ background: 'rgba(229,148,56,0.28)', filter: 'blur(40px)' }}
          aria-hidden="true"
        />
        <div className="relative max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: '#e59438' }}>{v.eyebrow}</p>
          <h2 className="text-2xl md:text-3xl font-black" style={{ fontFamily: 'var(--display)', lineHeight: 1.1 }}>{v.title}</h2>
          <p className="mt-2" style={{ color: 'rgba(251,238,227,0.85)' }}>{v.body}</p>
        </div>
        <Link
          href="/registrar-negocio"
          className="relative inline-flex items-center justify-center px-7 min-h-12 rounded-full font-bold whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: '#e59438', color: '#072d52', outlineColor: '#fbeee3' }}
        >
          Registrar mi negocio gratis
        </Link>
      </div>
    </aside>
  )
}
