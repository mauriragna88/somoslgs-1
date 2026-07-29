import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Planes y Precios',
  description: 'Tres planes simples para tu negocio en Lagos de Moreno: Gratis, Negocio Destacado y Vende en Linea. Sin contratos, cancela cuando quieras.',
  openGraph: {
    title: 'Planes y Precios — SomosLagos',
    description: 'Registra tu negocio gratis o elige un plan para crecer. Destacado y Vende en Linea.',
  },
}

const CHECK = (
  <svg className="w-5 h-5 text-[var(--coral)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

const CHECK_GOLD = (
  <svg className="w-5 h-5 text-[var(--gold)] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

const CHECK_TEAL = (
  <svg className="w-5 h-5 text-teal-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

const CROSS = (
  <svg className="w-5 h-5 text-[var(--muted)] flex-shrink-0 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

// ── 3 planes simplificados ──
const plans = [
  {
    name: 'Gratis',
    price: '$0',
    period: 'para siempre',
    cta: 'Empezar Gratis',
    href: '/registrar-negocio',
    description: 'Aparece en el directorio y empieza a recibir contactos',
  },
  {
    name: 'Negocio Destacado',
    price: '$149',
    period: 'MXN/mes · $1,490/año',
    cta: 'Elegir Destacado',
    href: '/registrar-negocio',
    popular: true,
    description: 'Mas visibilidad, mas contactos, mas credibilidad',
  },
  {
    name: 'Vende en Linea',
    price: 'desde $299',
    period: 'MXN/mes',
    cta: 'Elegir Vende en Linea',
    href: '/registrar-negocio',
    description: 'Catalogo, pedidos y pago — todo en tu perfil',
  },
]

const features = [
  { icon: '🔍', feature: 'Aparecer en buscador y mapa', tiers: [true, true, true] },
  { icon: '📱', feature: 'WhatsApp y telefono directo', tiers: [true, true, true] },
  { icon: '🕐', feature: 'Horarios de atencion', tiers: [true, true, true] },
  { icon: '⭐', feature: 'Opiniones de clientes', tiers: [true, true, true] },
  { icon: '📍', feature: 'Ubicacion en mapa interactivo', tiers: [true, true, true] },
  { icon: '🏠', feature: 'Reclamar tu negocio', tiers: [true, true, true] },
  { icon: '📷', feature: 'Fotos en galeria', tiers: ['3', '10', '20'] },
  { icon: '🖼️', feature: 'Portada personalizada', tiers: [false, true, true] },
  { icon: '🌐', feature: 'Redes sociales visibles', tiers: [false, true, true] },
  { icon: '🏅', feature: 'Posicion destacada en busquedas', tiers: [false, true, true] },
  { icon: '✅', feature: 'Insignia de negocio verificado', tiers: [false, true, true] },
  { icon: '📊', feature: 'Estadisticas de visitas y clics', tiers: [false, true, true] },
  { icon: '📣', feature: 'Promociones y publicaciones destacadas', tiers: [false, 'ocasional', true] },
  { icon: '📦', feature: 'Catalogo de productos', tiers: [false, false, true] },
  { icon: '🛒', feature: 'Recepcion de pedidos en linea', tiers: [false, false, true] },
  { icon: '💳', feature: 'Boton de pago o transferencia', tiers: [false, false, true] },
  { icon: '📈', feature: 'Estadisticas avanzadas de pedidos', tiers: [false, false, true] },
  { icon: '🤝', feature: 'Soporte para configurar productos', tiers: [false, false, true] },
  { icon: '🤖', feature: 'Chatbot de WhatsApp (complemento)', tiers: [false, false, 'opcional'] },
]

const faqs = [
  { q: '¿Puedo empezar gratis y cambiar de plan despues?', a: 'Si. Puedes registrar tu negocio gratis y actualizarte a cualquier plan en cualquier momento. No hay periodo minimo ni penalizacion.' },
  { q: '¿Hay contrato o permanencia?', a: 'No. Todos los planes son mensuales sin contrato. Puedes cancelar cuando quieras y tu negocio seguira visible en el plan Gratis.' },
  { q: '¿Como pago mi plan?', a: 'Aceptamos transferencia bancaria y pago en efectivo. Al elegir un plan te indicamos los datos para el pago. Tambien puedes contactarnos por WhatsApp.' },
  { q: '¿Que incluye el plan Vende en Linea?', a: 'Incluye todo lo del plan Destacado, mas catalogo de productos, recepcion de pedidos en linea, boton de pago o transferencia, y soporte para configurar tus productos. El chatbot de WhatsApp esta disponible como complemento.' },
  { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Si. Puedes subir o bajar de plan cuando quieras. El cambio se aplica en tu siguiente periodo de pago.' },
  { q: '¿Que pasa si no renuevo?', a: 'Si no renuevas, tu negocio pasa automaticamente al plan Gratis. No se borra nada, solo se desactivan las funciones de pago.' },
  { q: '¿El plan anual tiene descuento?', a: 'Si, el plan Negocio Destacado anual cuesta $1,490, lo que equivale a ~2 meses gratis respecto al precio mensual.' },
]

/* Stripe color per tier index */
const stripeClass = [
  'pueblo-plan-stripe pueblo-plan-stripe-gratis',
  'pueblo-plan-stripe pueblo-plan-stripe-pro',
  'pueblo-plan-stripe pueblo-plan-stripe-avanzado',
]

export default function PlanesPage() {
  return (
    <main className="min-h-screen pueblo-shell">

      {/* ── Hero ── */}
      <section className="relative py-20 md:py-28 overflow-hidden">
        {/* Warm radial blobs */}
        <div className="absolute top-0 right-0 w-[28rem] h-[28rem] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--coral) 18%, transparent), transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"
          style={{ background: 'radial-gradient(circle, color-mix(in srgb, var(--gold) 14%, transparent), transparent 70%)' }} />

        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="pueblo-eyebrow mb-6 inline-block">
            Planes · Precios claros
          </span>

          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-5 leading-tight"
            style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
          >
            Tres planes simples{' '}
            <span style={{ color: 'var(--coral)' }}>para crecer</span>
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: 'var(--ink-soft)' }}>
            Empieza gratis y crece a tu ritmo. Sin contratos — cancela cuando quieras.
            Invierte cuando ya tengas trafico y contactos.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/registrar-negocio"
              className="px-8 py-4 font-bold text-lg rounded-full text-white shadow-lg hover:scale-105 transition-all"
              style={{ background: 'var(--coral)', boxShadow: 'var(--shadow-card-hover)' }}
            >
              Empezar Gratis
            </Link>
            <a
              href="#comparativa"
              className="px-8 py-4 font-semibold text-lg rounded-full border transition-all hover:bg-white/60"
              style={{ color: 'var(--ink)', borderColor: 'var(--hairline)' }}
            >
              Ver Comparativa
            </a>
          </div>
        </div>
      </section>

      {/* ── Plan Cards (3 niveles) ── */}
      <section className="py-16">
        <div className="container mx-auto px-4">

          {/* 3 tiers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-10">
            {plans.map((plan, idx) => {
              const isPopular = plan.popular
              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col overflow-hidden rounded-[var(--r-lg)] border ${stripeClass[idx]} ${
                    isPopular
                      ? 'pueblo-plan-featured'
                      : 'bg-white border-[var(--hairline)] shadow-[var(--shadow-card)]'
                  }`}
                >
                  {/* Recommended badge */}
                  {isPopular && (
                    <span
                      className="absolute top-4 right-4 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                      style={{ background: 'var(--gold)', color: 'var(--ink)' }}
                    >
                      Mas Popular
                    </span>
                  )}

                  <div className="p-6 pt-7 flex flex-col flex-1">
                    {/* Tier name */}
                    <h3
                      className="font-extrabold text-xl mb-1"
                      style={{
                        fontFamily: 'var(--display)',
                        color: isPopular ? 'var(--gold)' : 'var(--ink)',
                      }}
                    >
                      {plan.name}
                    </h3>

                    {/* Description */}
                    <p
                      className="text-sm mb-3"
                      style={{ color: isPopular ? 'rgba(255,255,255,0.55)' : 'var(--muted)' }}
                    >
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mb-4">
                      <span
                        className="text-4xl font-extrabold"
                        style={{
                          fontFamily: 'var(--display)',
                          color: isPopular ? '#fff' : 'var(--coral)',
                        }}
                      >
                        {plan.price}
                      </span>
                      <span
                        className="text-sm ml-1.5 block mt-1"
                        style={{ color: isPopular ? 'rgba(255,255,255,0.55)' : 'var(--muted)' }}
                      >
                        {plan.period}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="pueblo-divider mb-5" />

                    {/* Features */}
                    <ul className="space-y-2.5 mb-7 flex-1">
                      {features.filter((f) => f.tiers[idx] !== false).map((f) => {
                        const val = f.tiers[idx]
                        const icon = isPopular ? CHECK_GOLD : idx === 2 ? CHECK_TEAL : CHECK
                        return (
                          <li
                            key={f.feature}
                            className="flex items-center gap-2.5 text-sm"
                            style={{ color: isPopular ? 'rgba(255,255,255,0.82)' : 'var(--ink-soft)' }}
                          >
                            {icon}
                            <span>
                              {typeof val === 'string' && val !== 'opcional' && val !== 'ocasional'
                                ? `${f.feature} (${val})`
                                : typeof val === 'string' && val === 'ocasional'
                                ? `${f.feature} (ocasional)`
                                : typeof val === 'string' && val === 'opcional'
                                ? `${f.feature} (opcional)`
                                : f.feature}
                            </span>
                          </li>
                        )
                      })}
                    </ul>

                    {/* CTA */}
                    <Link
                      href={plan.href}
                      className="block text-center py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02]"
                      style={
                        isPopular
                          ? { background: 'var(--gold)', color: 'var(--ink)', fontWeight: 700 }
                          : { background: 'var(--coral)', color: '#fff' }
                      }
                    >
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Chatbot — complement strip */}
          <div className="max-w-5xl mx-auto">
            <div
              className="relative rounded-[var(--r-lg)] overflow-hidden p-6 md:p-8 flex flex-col md:flex-row items-center gap-6"
              style={{
                background: 'linear-gradient(135deg, #0a1a0e 0%, #145a32 100%)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div className="flex-1 text-center md:text-left">
                <p className="text-teal-300 text-xs font-semibold uppercase tracking-widest mb-2">
                  Complemento opcional
                </p>
                <h3 className="text-2xl font-extrabold text-white mb-2" style={{ fontFamily: 'var(--display)' }}>
                  Chatbot de WhatsApp con IA
                </h3>
                <p className="text-white/70 mb-3 text-sm">
                  Tu WhatsApp atiende solo. Menu digital, pedidos automaticos y atencion 24/7.
                  Disponible como complemento para cualquier plan de pago.
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start text-xs">
                  {['Atiende 24/7', 'Menu con fotos', 'Pedidos automaticos'].map((tag) => (
                    <span key={tag} className="px-3 py-1 rounded-full bg-white/10 text-white border border-white/20">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-center gap-3 shrink-0">
                <span className="text-3xl font-extrabold text-white" style={{ fontFamily: 'var(--display)' }}>
                  desde $300
                </span>
                <p className="text-white/50 text-xs">MXN/mes · complemento</p>
                <a
                  href="https://wa.me/524741082768?text=Hola%2C%20me%20interesa%20el%20chatbot%20de%20WhatsApp%20para%20mi%20negocio"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-700 font-bold rounded-full shadow-xl hover:scale-105 transition-all text-sm"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Consultar
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section id="comparativa" className="py-16" style={{ background: 'var(--cream)' }}>
        <div className="container mx-auto px-4">

          <div className="text-center mb-10">
            <span className="pueblo-eyebrow mb-4 inline-block">Comparativa</span>
            <h2
              className="text-3xl md:text-4xl font-extrabold mb-3"
              style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
            >
              Comparativa Detallada
            </h2>
            <p style={{ color: 'var(--muted)' }}>Compara todas las funciones de cada plan</p>
          </div>

          <div className="hidden lg:block max-w-5xl mx-auto">
            <div
              className="overflow-hidden rounded-[var(--r-lg)] border bg-white"
              style={{ borderColor: 'var(--hairline)', boxShadow: 'var(--shadow-card)' }}
            >
              {/* Header row */}
              <div className="grid grid-cols-4">
                <div
                  className="p-5 border-b border-r flex items-end"
                  style={{ background: 'var(--ivory)', borderColor: 'var(--hairline)' }}
                >
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: 'var(--muted)' }}
                  >
                    Funciones
                  </span>
                </div>
                {plans.map((plan, idx) => {
                  const isPopular = plan.popular
                  return (
                    <div
                      key={plan.name}
                      className="p-5 border-b border-r text-center relative"
                      style={{
                        borderColor: 'var(--hairline)',
                        background: isPopular ? 'var(--ink)' : 'var(--ivory)',
                      }}
                    >
                      {isPopular && (
                        <span
                          className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[10px] font-bold px-3 py-1 rounded-t-lg uppercase"
                          style={{ background: 'var(--gold)', color: 'var(--ink)' }}
                        >
                          Popular
                        </span>
                      )}
                      <p
                        className="font-bold text-sm mb-1"
                        style={{
                          fontFamily: 'var(--display)',
                          color: isPopular ? '#fff' : 'var(--ink)',
                        }}
                      >
                        {plan.name}
                      </p>
                      <p
                        className="text-xl font-extrabold"
                        style={{
                          fontFamily: 'var(--display)',
                          color: isPopular ? 'var(--gold)' : 'var(--coral)',
                        }}
                      >
                        {plan.price}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: isPopular ? 'rgba(255,255,255,0.55)' : 'var(--muted)' }}
                      >
                        {plan.period}
                      </p>
                    </div>
                  )
                })}
              </div>

              {/* Feature rows */}
              {features.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-4"
                  style={{
                    background: idx % 2 === 0 ? '#fff' : 'var(--ivory)',
                  }}
                >
                  <div
                    className="p-4 border-r flex items-center gap-2 text-sm"
                    style={{
                      borderColor: 'var(--hairline-soft)',
                      color: 'var(--ink-soft)',
                    }}
                  >
                    <span className="text-base">{row.icon}</span>
                    {row.feature}
                  </div>
                  {row.tiers.map((val, i) => (
                    <div
                      key={i}
                      className="p-4 border-r flex items-center justify-center"
                      style={{
                        borderColor: 'var(--hairline-soft)',
                        background: plans[i].popular ? 'rgba(31,41,55,0.03)' : undefined,
                      }}
                    >
                      {typeof val === 'string' ? (
                        <span
                          className="text-sm font-semibold"
                          style={{ color: 'var(--ink)' }}
                        >
                          {val}
                        </span>
                      ) : val ? (
                        i === 1 ? CHECK_GOLD : i === 2 ? CHECK_TEAL : CHECK
                      ) : (
                        CROSS
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {/* CTA row */}
              <div className="grid grid-cols-4 border-t" style={{ borderColor: 'var(--hairline)', background: 'var(--ivory)' }}>
                <div className="p-5 border-r" style={{ borderColor: 'var(--hairline-soft)' }} />
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className="p-5 border-r text-center"
                    style={{ borderColor: 'var(--hairline-soft)' }}
                  >
                    <Link
                      href={plan.href}
                      className="inline-block px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:scale-105"
                      style={{ background: plan.popular ? 'var(--gold)' : 'var(--coral)', color: plan.popular ? 'var(--ink)' : '#fff' }}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile fallback: simple list */}
          <div className="lg:hidden space-y-6">
            {plans.map((plan, idx) => (
              <div
                key={plan.name}
                className="rounded-[var(--r-lg)] border p-6"
                style={{
                  borderColor: plan.popular ? 'var(--gold)' : 'var(--hairline)',
                  background: plan.popular ? 'var(--ink)' : '#fff',
                  color: plan.popular ? '#fff' : 'var(--ink)',
                }}
              >
                <h3 className="font-extrabold text-lg mb-2" style={{ fontFamily: 'var(--display)' }}>
                  {plan.name} — {plan.price}
                </h3>
                <ul className="space-y-2 mt-3">
                  {features.filter((f) => f.tiers[idx] !== false).map((f) => (
                    <li key={f.feature} className="flex items-center gap-2 text-sm">
                      {plan.popular ? CHECK_GOLD : CHECK}
                      <span>{f.feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className="block text-center mt-5 py-2.5 rounded-xl font-semibold text-sm"
                  style={{
                    background: plan.popular ? 'var(--gold)' : 'var(--coral)',
                    color: plan.popular ? 'var(--ink)' : '#fff',
                  }}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">

            <div className="text-center mb-10">
              <span className="pueblo-eyebrow mb-4 inline-block">FAQ</span>
              <h2
                className="text-3xl font-extrabold mb-3"
                style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}
              >
                Preguntas Frecuentes
              </h2>
              <p style={{ color: 'var(--muted)' }}>
                Todo lo que necesitas saber sobre nuestros planes
              </p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <details
                  key={i}
                  className="group rounded-[var(--r-lg)] border overflow-hidden bg-white"
                  style={{
                    borderColor: 'var(--hairline)',
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  <summary
                    className="flex items-center justify-between cursor-pointer px-6 py-4 font-semibold text-sm md:text-base transition-colors list-none [&::-webkit-details-marker]:hidden hover:bg-[var(--ivory)]"
                    style={{ color: 'var(--ink)' }}
                  >
                    <span className="pueblo-accent-line pl-4">{faq.q}</span>
                    <svg
                      className="w-5 h-5 flex-shrink-0 ml-4 group-open:rotate-180 transition-transform"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      style={{ color: 'var(--muted)' }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div
                    className="px-6 pb-5 pt-1 text-sm leading-relaxed"
                    style={{ color: 'var(--ink-soft)' }}
                  >
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div
            className="max-w-4xl mx-auto rounded-[var(--r-lg)] px-8 py-14 text-center"
            style={{
              background: 'linear-gradient(135deg, var(--coral) 0%, var(--coral-deep) 100%)',
              boxShadow: 'var(--shadow-card-hover)',
            }}
          >
            <span
              className="inline-block mb-4 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/30 text-white/80"
            >
              Sin contratos · Cancela cuando quieras
            </span>
            <h2
              className="text-2xl md:text-3xl font-extrabold text-white mb-3"
              style={{ fontFamily: 'var(--display)' }}
            >
              ¿Listo para crecer?
            </h2>
            <p className="text-white/75 mb-8 max-w-lg mx-auto">
              Registra tu negocio gratis en menos de 2 minutos. Invierte cuando tengas trafico.
            </p>
            <Link
              href="/registrar-negocio"
              className="inline-flex items-center gap-2 px-10 py-4 font-bold text-lg rounded-full transition-all hover:scale-105"
              style={{
                background: '#fff',
                color: 'var(--coral)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
              }}
            >
              Registrar mi Negocio GRATIS
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
