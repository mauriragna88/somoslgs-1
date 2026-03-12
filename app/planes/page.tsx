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
  <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

const CHECK_VIOLET = (
  <svg className="w-5 h-5 text-violet-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
)

const CROSS = (
  <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const plans = [
  { name: 'Gratis', price: '$0', period: 'siempre', color: 'text-gray-700', border: 'border-gray-200', bg: 'bg-white', cta: 'Empezar Gratis', ctaStyle: 'bg-gray-100 hover:bg-gray-200 text-secondary', href: '/registrar-negocio' },
  { name: 'Emprendedor', price: '$60', period: '/mes', color: 'text-primary', border: 'border-primary/30', bg: 'bg-white', cta: 'Elegir Emprendedor', ctaStyle: 'bg-primary/10 hover:bg-primary/20 text-primary', href: '/registrar-negocio' },
  { name: 'Pro', price: '$120', period: '/mes', color: 'text-emerald-600', border: 'border-emerald-500/30', bg: 'bg-white', popular: true, cta: 'Elegir Pro', ctaStyle: 'bg-primary hover:bg-primary-dark text-white', href: '/registrar-negocio' },
  { name: 'Avanzado', price: '$180', period: '/mes', color: 'text-purple-600', border: 'border-purple-500/30', bg: 'bg-white', cta: 'Elegir Avanzado', ctaStyle: 'bg-purple-600 hover:bg-purple-700 text-white', href: '/registrar-negocio' },
  { name: 'Chatbot', price: '$300', period: '/mes', color: 'text-white', border: 'border-violet-500', bg: 'bg-gradient-to-b from-violet-600 to-fuchsia-600', cta: 'WhatsApp', ctaStyle: 'bg-white hover:bg-gray-100 text-violet-700', href: 'https://wa.me/524741082768?text=Hola%2C%20me%20interesa%20el%20plan%20Chatbot%20para%20mi%20negocio', external: true },
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

export default function PlanesPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 md:py-28 bg-gradient-to-br from-secondary via-[#1a2744] to-secondary overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 text-accent font-bold text-sm rounded-full border border-accent/30 mb-6">
            Sin contratos — cancela cuando quieras
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-5 leading-tight">
            El plan perfecto para{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-primary-light to-accent">tu negocio</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-8">
            Empieza gratis y crece a tu ritmo. Desde listado basico hasta chatbot con inteligencia artificial.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/registrar-negocio"
              className="px-8 py-4 bg-accent hover:bg-accent-dark text-secondary font-bold rounded-full shadow-xl hover:shadow-accent/30 hover:scale-105 transition-all text-lg"
            >
              Empezar Gratis
            </Link>
            <a
              href="#comparativa"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full border border-white/20 transition-all"
            >
              Ver Comparativa
            </a>
          </div>
        </div>
      </section>

      {/* Plan Cards — Mobile-first, visible on all sizes */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 max-w-7xl mx-auto">
            {plans.map((plan) => {
              const isChatbot = plan.name === 'Chatbot'
              const isDark = isChatbot
              return (
                <div
                  key={plan.name}
                  className={`relative rounded-2xl border-2 ${plan.border} ${plan.bg} p-6 flex flex-col ${plan.popular ? 'ring-2 ring-primary shadow-xl scale-[1.02]' : 'shadow-sm'}`}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                      MAS POPULAR
                    </span>
                  )}
                  {isChatbot && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                      NUEVO
                    </span>
                  )}
                  <div className="text-center mb-5 pt-2">
                    <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-secondary'}`}>{plan.name}</h3>
                    <p className={`text-4xl font-extrabold ${plan.color}`}>{plan.price}</p>
                    <p className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-400'}`}>{plan.period}</p>
                  </div>

                  <ul className="space-y-2.5 mb-6 flex-1">
                    {features.filter((f) => {
                      const idx = plans.indexOf(plan)
                      return f.tiers[idx] !== false
                    }).map((f) => {
                      const idx = plans.indexOf(plan)
                      const val = f.tiers[idx]
                      return (
                        <li key={f.feature} className={`flex items-center gap-2.5 text-sm ${isDark ? 'text-white/80' : 'text-gray-600'}`}>
                          {isChatbot && f.highlight ? CHECK_VIOLET : CHECK}
                          <span>{typeof val === 'string' ? `${f.feature} (${val})` : f.feature}</span>
                        </li>
                      )
                    })}
                  </ul>

                  {plan.external ? (
                    <a
                      href={plan.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`block text-center py-3 rounded-xl font-semibold text-sm ${plan.ctaStyle} transition-colors`}
                    >
                      {plan.cta}
                    </a>
                  ) : (
                    <Link
                      href={plan.href}
                      className={`block text-center py-3 rounded-xl font-semibold text-sm ${plan.ctaStyle} transition-colors`}
                    >
                      {plan.cta}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Comparison Table — Desktop */}
      <section id="comparativa" className="py-16 bg-surface">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-3">Comparativa Detallada</h2>
            <p className="text-gray-500">Compara todas las funciones de cada plan</p>
          </div>

          <div className="hidden lg:block max-w-6xl mx-auto">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {/* Header */}
              <div className="grid grid-cols-6">
                <div className="p-5 bg-gray-50 border-b border-r border-gray-200 flex items-end">
                  <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Funciones</span>
                </div>
                {plans.map((plan) => {
                  const isChatbot = plan.name === 'Chatbot'
                  return (
                    <div key={plan.name} className={`p-5 border-b border-r border-gray-200 text-center ${isChatbot ? 'bg-gradient-to-b from-violet-600 to-fuchsia-600' : 'bg-white'} ${plan.popular ? 'bg-primary/5' : ''} relative`}>
                      {plan.popular && (
                        <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 -translate-y-full bg-primary text-white text-[10px] font-bold px-3 py-1 rounded-t-lg">POPULAR</span>
                      )}
                      {isChatbot && (
                        <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 -translate-y-full bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-[10px] font-bold px-3 py-1 rounded-t-lg">NUEVO</span>
                      )}
                      <p className={`font-bold text-sm mb-1 ${isChatbot ? 'text-white' : 'text-secondary'}`}>{plan.name}</p>
                      <p className={`text-2xl font-extrabold ${plan.color}`}>{plan.price}</p>
                      <p className={`text-xs ${isChatbot ? 'text-white/70' : 'text-gray-400'}`}>{plan.period}</p>
                    </div>
                  )
                })}
              </div>

              {/* Feature rows */}
              {features.map((row, idx) => (
                <div key={idx} className={`grid grid-cols-6 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${row.highlight ? 'bg-violet-50/50' : ''}`}>
                  <div className={`p-4 border-r border-gray-100 flex items-center gap-2 text-sm ${row.highlight ? 'font-semibold text-violet-700' : 'text-gray-600'}`}>
                    <span className="text-base">{row.icon}</span>
                    {row.feature}
                  </div>
                  {row.tiers.map((val, i) => (
                    <div key={i} className={`p-4 border-r border-gray-100 flex items-center justify-center ${i === 4 && row.highlight ? 'bg-violet-100/50' : ''} ${plans[i].popular && !row.highlight ? 'bg-primary/[0.02]' : ''}`}>
                      {typeof val === 'string' ? (
                        <span className="text-sm font-semibold text-secondary">{val}</span>
                      ) : val ? (
                        i === 4 ? CHECK_VIOLET : CHECK
                      ) : CROSS}
                    </div>
                  ))}
                </div>
              ))}

              {/* CTA row */}
              <div className="grid grid-cols-6 bg-white border-t border-gray-200">
                <div className="p-5 border-r border-gray-100"></div>
                {plans.map((plan) => (
                  <div key={plan.name} className="p-5 border-r border-gray-100 text-center">
                    {plan.external ? (
                      <a
                        href={plan.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-block px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${plan.ctaStyle}`}
                      >
                        {plan.cta}
                      </a>
                    ) : (
                      <Link
                        href={plan.href}
                        className={`inline-block px-5 py-2.5 text-sm font-semibold rounded-lg transition-colors ${plan.ctaStyle}`}
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

      {/* Chatbot Section */}
      <section className="py-16 bg-gradient-to-br from-secondary via-[#1a2744] to-secondary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-violet-500/20 text-violet-300 font-bold text-sm rounded-full border border-violet-500/30 mb-6">
              PROXIMAMENTE
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Chatbot de WhatsApp con IA
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10">
              Tu WhatsApp atiende solo. Tus clientes ven el menu, eligen productos y piden con un toque — sin escribir.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🚫</span>
                </div>
                <h3 className="text-white font-bold mb-1">Adios listas por texto</h3>
                <p className="text-white/60 text-sm">Tu cliente elige tocando, no escribiendo</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🛒</span>
                </div>
                <h3 className="text-white font-bold mb-1">Menu con precios</h3>
                <p className="text-white/60 text-sm">Fotos, precios y pedido directo en el chat</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <div className="w-12 h-12 bg-primary-light/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-white font-bold mb-1">Vendes 24/7</h3>
                <p className="text-white/60 text-sm">El bot atiende aunque estes ocupado</p>
              </div>
            </div>

            <a
              href="https://wa.me/524741082768?text=Hola%2C%20me%20interesa%20el%20plan%20Chatbot%20para%20mi%20negocio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-[#25D366] hover:bg-[#1fb855] text-white font-bold text-lg rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Preguntame por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-secondary mb-3">Preguntas Frecuentes</h2>
              <p className="text-gray-500">Todo lo que necesitas saber sobre nuestros planes</p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <details key={i} className="group bg-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                  <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-secondary font-semibold text-sm md:text-base hover:bg-gray-100 transition-colors list-none [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-surface">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-secondary mb-3">¿Listo para crecer?</h2>
          <p className="text-gray-500 mb-6">Registra tu negocio gratis en menos de 2 minutos</p>
          <Link
            href="/registrar-negocio"
            className="inline-flex items-center gap-2 px-10 py-4 bg-accent hover:bg-accent-dark text-secondary font-bold text-lg rounded-full shadow-xl hover:shadow-accent/30 hover:scale-105 transition-all"
          >
            Registrar mi Negocio GRATIS
          </Link>
        </div>
      </section>
    </main>
  )
}
