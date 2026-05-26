import Link from 'next/link'
import type { Metadata } from 'next'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Planes y Precios',
  description: 'Conoce los planes de SomosLagos para tu negocio en Lagos de Moreno. Desde gratis hasta chatbot con IA. Sin contratos, cancela cuando quieras.',
  openGraph: {
    title: 'Planes y Precios — SomosLagos',
    description: 'Registra tu negocio gratis o elige un plan para crecer. Productos, pedidos, chatbot IA y mas.',
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

const CROSS = (
  <svg className="w-5 h-5 text-[var(--muted)] flex-shrink-0 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const plans = [
  { name: 'Gratis', price: '$0', period: 'siempre', color: 'text-gray-700', border: 'border-gray-200', bg: 'bg-white', cta: 'Empezar Gratis', ctaStyle: 'bg-gray-100 hover:bg-gray-200 text-secondary', href: '/registrar-negocio' },
  { name: 'Emprendedor', price: '$60', period: 'MXN/mes', color: 'text-primary', border: 'border-primary/30', bg: 'bg-white', cta: 'Elegir Emprendedor', ctaStyle: 'bg-primary/10 hover:bg-primary/20 text-primary', href: '/registrar-negocio' },
  { name: 'Pro', price: '$120', period: 'MXN/mes', color: 'text-emerald-600', border: 'border-emerald-500/30', bg: 'bg-white', popular: true, cta: 'Elegir Pro', ctaStyle: 'bg-primary hover:bg-primary-dark text-white', href: '/registrar-negocio' },
  { name: 'Avanzado', price: '$180', period: 'MXN/mes', color: 'text-purple-600', border: 'border-purple-500/30', bg: 'bg-white', cta: 'Elegir Avanzado', ctaStyle: 'bg-purple-600 hover:bg-purple-700 text-white', href: '/registrar-negocio' },
  { name: 'Chatbot', price: '$300', period: 'MXN/mes', color: 'text-white', border: 'border-violet-500', bg: 'bg-gradient-to-b from-violet-600 to-fuchsia-600', cta: 'WhatsApp', ctaStyle: 'bg-white hover:bg-gray-100 text-violet-700', href: 'https://wa.me/524741082768?text=Hola%2C%20me%20interesa%20el%20plan%20Chatbot%20para%20mi%20negocio', external: true },
]

const features = [
  { icon: '🔍', feature: 'Aparecer en buscador y mapa', tiers: [true, true, true, true, true] },
  { icon: '📱', feature: 'WhatsApp y telefono directo', tiers: [true, true, true, true, true] },
  { icon: '🕐', feature: 'Horarios y opiniones', tiers: [true, true, true, true, true] },
  { icon: '📷', feature: 'Fotos en galeria', tiers: ['3', '8', '15', '20', '25'] },
  { icon: '🖼️', feature: 'Portada personalizada', tiers: [false, true, true, true, true] },
  { icon: '🌐', feature: 'Redes sociales visibles', tiers: [false, true, true, true, true] },
  { icon: '📦', feature: 'Catalogo de productos', tiers: [false, false, true, true, true] },
  { icon: '🛒', feature: 'Recibir pedidos en linea', tiers: [false, false, true, true, true] },
  { icon: '💳', feature: 'Pagos por transferencia y tarjeta', tiers: [false, false, true, true, true] },
  { icon: '⭐', feature: 'Destacado en busquedas', tiers: [false, false, false, true, true] },
  { icon: '✅', feature: 'Badge verificado', tiers: [false, false, false, true, true] },
  { icon: '📊', feature: 'Estadisticas detalladas', tiers: [false, false, false, true, true] },
  { icon: '🤖', feature: 'Chatbot de WhatsApp con IA', tiers: [false, false, false, false, true], highlight: true },
  { icon: '⚡', feature: 'Atencion automatica 24/7', tiers: [false, false, false, false, true], highlight: true },
  { icon: '👆', feature: 'Pedidos por chat sin texto', tiers: [false, false, false, false, true], highlight: true },
]

const faqs = [
  { q: '¿Puedo empezar gratis y cambiar de plan despues?', a: 'Si. Puedes registrar tu negocio gratis y actualizarte a cualquier plan en cualquier momento. No hay periodo minimo ni penalizacion.' },
  { q: '¿Hay contrato o permanencia?', a: 'No. Todos los planes son mensuales sin contrato. Puedes cancelar cuando quieras y tu negocio seguira visible en el plan Gratis.' },
  { q: '¿Como pago mi plan?', a: 'Aceptamos transferencia bancaria y pago en efectivo. Al elegir un plan te indicamos los datos para el pago. Tambien puedes contactarnos por WhatsApp.' },
  { q: '¿Que incluye el plan Chatbot?', a: 'Incluye todo lo del plan Avanzado mas un chatbot de WhatsApp con inteligencia artificial que atiende a tus clientes 24/7, muestra tu menu/catalogo con fotos y precios, y toma pedidos automaticamente.' },
  { q: '¿Puedo cambiar de plan en cualquier momento?', a: 'Si. Puedes subir o bajar de plan cuando quieras. El cambio se aplica en tu siguiente periodo de pago.' },
  { q: '¿Que pasa si no renuevo?', a: 'Si no renuevas, tu negocio pasa automaticamente al plan Gratis. No se borra nada, solo se desactivan las funciones de pago.' },
]

/* Stripe color per tier index */
const stripeClass = [
  'pueblo-plan-stripe pueblo-plan-stripe-gratis',
  'pueblo-plan-stripe pueblo-plan-stripe-emprendedor',
  'pueblo-plan-stripe pueblo-plan-stripe-pro',
  'pueblo-plan-stripe pueblo-plan-stripe-avanzado',
  'pueblo-plan-stripe', // Chatbot gets its own gradient treatment below
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
            Elige el plan perfecto{' '}
            <span style={{ color: 'var(--coral)' }}>para tu negocio</span>
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10" style={{ color: 'var(--ink-soft)' }}>
            Empieza gratis y crece a tu ritmo. Desde listado básico hasta chatbot con inteligencia artificial.
            Sin contratos — cancela cuando quieras.
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

      {/* ── Plan Cards ── */}
      <section className="py-16">
        <div className="container mx-auto px-4">

          {/* Top 4 tiers (Gratis → Avanzado) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-8">
            {plans.slice(0, 4).map((plan, idx) => {
              const isPro = plan.popular
              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col overflow-hidden rounded-[var(--r-lg)] border ${stripeClass[idx]} ${
                    isPro
                      ? 'pueblo-plan-featured'
                      : 'bg-white border-[var(--hairline)] shadow-[var(--shadow-card)]'
                  }`}
                >
                  {/* Recommended badge */}
                  {isPro && (
                    <span
                      className="absolute top-4 right-4 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                      style={{ background: 'var(--gold)', color: 'var(--ink)' }}
                    >
                      Recomendado
                    </span>
                  )}

                  <div className="p-6 pt-7 flex flex-col flex-1">
                    {/* Tier name */}
                    <h3
                      className="font-extrabold text-xl mb-1"
                      style={{
                        fontFamily: 'var(--display)',
                        color: isPro ? 'var(--gold)' : 'var(--ink)',
                      }}
                    >
                      {plan.name}
                    </h3>

                    {/* Price */}
                    <div className="mb-4">
                      <span
                        className="text-5xl font-extrabold"
                        style={{
                          fontFamily: 'var(--display)',
                          color: isPro ? '#fff' : 'var(--coral)',
                        }}
                      >
                        {plan.price}
                      </span>
                      <span
                        className="text-sm ml-1.5"
                        style={{ color: isPro ? 'rgba(255,255,255,0.55)' : 'var(--muted)' }}
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
                        return (
                          <li
                            key={f.feature}
                            className="flex items-center gap-2.5 text-sm"
                            style={{ color: isPro ? 'rgba(255,255,255,0.82)' : 'var(--ink-soft)' }}
                          >
                            {isPro ? CHECK_GOLD : CHECK}
                            <span>
                              {typeof val === 'string' ? `${f.feature} (${val})` : f.feature}
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
                        isPro
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

          {/* Chatbot — full-width accent card */}
          {(() => {
            const chatbot = plans[4]
            return (
              <div className="max-w-6xl mx-auto">
                <div
                  className="relative rounded-[var(--r-lg)] overflow-hidden p-8 md:p-10 flex flex-col md:flex-row items-center gap-8"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed 0%, #a21caf 100%)',
                    boxShadow: 'var(--shadow-card-hover)',
                  }}
                >
                  {/* NUEVO badge */}
                  <span className="absolute top-5 right-5 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-white/20 text-white border border-white/30">
                    PRÓXIMAMENTE
                  </span>

                  <div className="flex-1 text-center md:text-left">
                    <p className="text-violet-200 text-sm font-semibold uppercase tracking-widest mb-2">
                      Plan Chatbot
                    </p>
                    <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-2" style={{ fontFamily: 'var(--display)' }}>
                      Chatbot de WhatsApp con IA
                    </h3>
                    <p className="text-white/70 max-w-xl mb-5">
                      Tu WhatsApp atiende solo. Tus clientes ven el menú, eligen productos y piden con un toque — sin escribir.
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start text-sm">
                      {['Atiende 24/7', 'Menú con fotos', 'Pedidos automáticos'].map((tag) => (
                        <span key={tag} className="px-3 py-1 rounded-full bg-white/15 text-white border border-white/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 shrink-0">
                    <div className="text-center">
                      <span className="text-5xl font-extrabold text-white" style={{ fontFamily: 'var(--display)' }}>
                        {chatbot.price}
                      </span>
                      <p className="text-white/60 text-sm">{chatbot.period}</p>
                    </div>
                    <a
                      href={chatbot.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 px-7 py-3.5 bg-white text-violet-700 font-bold rounded-full shadow-xl hover:scale-105 transition-all text-sm"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Preguntar por WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            )
          })()}
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

          <div className="hidden lg:block max-w-6xl mx-auto">
            <div
              className="overflow-hidden rounded-[var(--r-lg)] border bg-white"
              style={{ borderColor: 'var(--hairline)', boxShadow: 'var(--shadow-card)' }}
            >
              {/* Header row */}
              <div className="grid grid-cols-6">
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
                  const isPro = plan.popular
                  const isChatbot = plan.name === 'Chatbot'
                  return (
                    <div
                      key={plan.name}
                      className="p-5 border-b border-r text-center relative"
                      style={{
                        borderColor: 'var(--hairline)',
                        background: isPro
                          ? 'var(--ink)'
                          : isChatbot
                          ? 'linear-gradient(160deg, #7c3aed, #a21caf)'
                          : 'var(--ivory)',
                      }}
                    >
                      {isPro && (
                        <span
                          className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[10px] font-bold px-3 py-1 rounded-t-lg uppercase"
                          style={{ background: 'var(--gold)', color: 'var(--ink)' }}
                        >
                          Popular
                        </span>
                      )}
                      {isChatbot && (
                        <span className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-full text-[10px] font-bold px-3 py-1 rounded-t-lg uppercase bg-violet-700 text-white">
                          Nuevo
                        </span>
                      )}
                      <p
                        className="font-bold text-sm mb-1"
                        style={{
                          fontFamily: 'var(--display)',
                          color: isPro || isChatbot ? '#fff' : 'var(--ink)',
                        }}
                      >
                        {plan.name}
                      </p>
                      <p
                        className="text-2xl font-extrabold"
                        style={{
                          fontFamily: 'var(--display)',
                          color: isPro
                            ? 'var(--gold)'
                            : isChatbot
                            ? '#fff'
                            : 'var(--coral)',
                        }}
                      >
                        {plan.price}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: isPro || isChatbot ? 'rgba(255,255,255,0.55)' : 'var(--muted)' }}
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
                  className="grid grid-cols-6"
                  style={{
                    background: row.highlight
                      ? 'rgba(124,58,237,0.04)'
                      : idx % 2 === 0
                      ? '#fff'
                      : 'var(--ivory)',
                  }}
                >
                  <div
                    className="p-4 border-r flex items-center gap-2 text-sm"
                    style={{
                      borderColor: 'var(--hairline-soft)',
                      color: row.highlight ? '#7c3aed' : 'var(--ink-soft)',
                      fontWeight: row.highlight ? 600 : 400,
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
                        background:
                          plans[i].popular && !row.highlight
                            ? 'rgba(31,41,55,0.03)'
                            : i === 4 && row.highlight
                            ? 'rgba(124,58,237,0.06)'
                            : undefined,
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
                        i === 4 ? CHECK_GOLD : CHECK
                      ) : (
                        CROSS
                      )}
                    </div>
                  ))}
                </div>
              ))}

              {/* CTA row */}
              <div className="grid grid-cols-6 border-t" style={{ borderColor: 'var(--hairline)', background: 'var(--ivory)' }}>
                <div className="p-5 border-r" style={{ borderColor: 'var(--hairline-soft)' }} />
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className="p-5 border-r text-center"
                    style={{ borderColor: 'var(--hairline-soft)' }}
                  >
                    {plan.external ? (
                      <a
                        href={plan.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block px-5 py-2.5 text-sm font-semibold rounded-xl transition-all hover:scale-105 bg-white text-violet-700 border border-violet-200 hover:bg-violet-50"
                      >
                        {plan.cta}
                      </a>
                    ) : (
                      <Link
                        href={plan.href}
                        className="inline-block px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:scale-105"
                        style={{ background: plan.popular ? 'var(--gold)' : 'var(--coral)', color: plan.popular ? 'var(--ink)' : '#fff' }}
                      >
                        {plan.cta}
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
              Registra tu negocio gratis en menos de 2 minutos. Sin tarjeta, sin tramites.
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
