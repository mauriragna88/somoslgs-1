import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/server'
import Link from 'next/link'
import RegisterBusinessForm from '@/components/business/RegisterBusinessForm'

export const metadata: Metadata = {
  title: 'Registrar mi Negocio',
  description: 'Registra tu negocio GRATIS en SomosLagos y llega a miles de clientes en Lagos de Moreno, Jalisco.',
  openGraph: {
    title: 'Registrar mi Negocio | SomosLagos',
    description: 'Registra tu negocio en SomosLagos y llega a miles de clientes en Lagos de Moreno.',
    url: 'https://www.somoslagos.com.mx/registrar-negocio',
  },
}

const benefits = [
  { icon: '📱', title: 'Presencia Digital', desc: 'Tu negocio visible las 24 horas, los 7 dias de la semana para miles de personas' },
  { icon: '💬', title: 'WhatsApp Directo', desc: 'Tus clientes te contactan al instante con un solo toque' },
  { icon: '📍', title: 'Mapa Interactivo', desc: 'Ubicacion exacta con indicaciones para que te encuentren facil' },
  { icon: '📸', title: 'Fotos y Galeria', desc: 'Muestra tus productos, local e instalaciones con fotos atractivas' },
  { icon: '🕐', title: 'Horarios Visibles', desc: 'Tus clientes saben cuando estas abierto antes de visitarte' },
  { icon: '⭐', title: 'Opiniones de Clientes', desc: 'Recibe resenas que generan confianza y atraen mas clientes' },
]

const steps = [
  { num: '1', title: 'Crea tu cuenta', desc: 'Registrate gratis con tu correo en menos de 2 minutos' },
  { num: '2', title: 'Llena tu informacion', desc: 'Agrega nombre, direccion, fotos, horarios y contacto' },
  { num: '3', title: 'Empieza a recibir clientes', desc: 'Tu negocio aparece en busquedas y el mapa de Lagos' },
]

const plans = [
  {
    name: 'Gratis',
    price: '$0',
    dailyPrice: '',
    period: 'para siempre',
    popular: false,
    features: [
      { text: 'Aparece en el buscador', included: true },
      { text: 'WhatsApp y telefono clickeable', included: true },
      { text: 'Mapa con tu ubicacion', included: true },
      { text: 'Horarios y opiniones', included: true },
      { text: 'Hasta 3 fotos', included: true },
      { text: 'Portada personalizada', included: false },
      { text: 'Redes sociales', included: false },
      { text: 'Productos y pedidos', included: false },
    ],
  },
  {
    name: 'Emprendedor',
    price: '$60',
    dailyPrice: 'Solo $2 MXN/día',
    period: 'MXN/mes',
    popular: true,
    features: [
      { text: 'Todo lo del plan Gratis', included: true },
      { text: 'Portada personalizada', included: true },
      { text: 'Redes sociales visibles', included: true },
      { text: 'Hasta 8 fotos en galeria', included: true },
      { text: 'Mejor posicion en busquedas', included: true },
      { text: 'Productos y pedidos', included: false },
      { text: 'Destacado en busquedas', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '$120',
    dailyPrice: 'Solo $4 MXN/día',
    period: 'MXN/mes',
    popular: false,
    features: [
      { text: 'Todo lo del plan Emprendedor', included: true },
      { text: 'Catalogo de productos', included: true },
      { text: 'Recibir pedidos en linea', included: true },
      { text: 'Pagos por transferencia y tarjeta', included: true },
      { text: 'Tus productos en el Chatbot IA 🤖', included: true },
      { text: 'Hasta 15 fotos', included: true },
      { text: 'Destacado en busquedas', included: false },
      { text: 'Estadisticas', included: false },
    ],
  },
  {
    name: 'Avanzado',
    price: '$180',
    dailyPrice: 'Solo $6 MXN/día',
    period: 'MXN/mes',
    popular: false,
    features: [
      { text: 'Todo lo del plan Pro', included: true },
      { text: 'Destacado en busquedas', included: true },
      { text: 'Badge verificado', included: true },
      { text: 'Estadisticas detalladas', included: true },
      { text: 'Soporte VIP prioritario', included: true },
      { text: 'Hasta 20 fotos', included: true },
    ],
  },
  {
    name: 'Chatbot',
    price: '$300',
    dailyPrice: 'Solo $10 MXN/día',
    period: 'MXN/mes',
    popular: false,
    hot: true,
    features: [
      { text: 'Todo lo del plan Avanzado', included: true },
      { text: 'Chatbot de pedidos con IA', included: true },
      { text: 'Catalogo automatico en el chat', included: true },
      { text: 'Pedidos sin escribir textos', included: true },
      { text: 'Pagos integrados en el bot', included: true },
      { text: 'Atencion 24/7 automatica', included: true },
      { text: 'Hasta 25 fotos', included: true },
    ],
  },
]

const faqs = [
  {
    q: '¿Es realmente gratis?',
    a: 'Si, el plan Gratis es 100% gratuito y permanente. Tu negocio aparece en el directorio con WhatsApp, mapa y busquedas sin ningun costo. Los planes de pago son opcionales para quienes quieran verse mas profesionales o vender en linea.',
  },
  {
    q: '¿Cuanto tiempo tarda en aparecer mi negocio?',
    a: 'Tu negocio aparece inmediatamente despues de completar el registro. No hay tiempos de espera ni aprobaciones.',
  },
  {
    q: '¿Puedo cambiar de plan despues?',
    a: 'Si, puedes empezar con el plan Gratis y subir a Pro o Avanzado cuando quieras. Tambien puedes regresar al plan Gratis en cualquier momento.',
  },
  {
    q: '¿Necesito saber de tecnologia?',
    a: 'No. El proceso de registro es muy sencillo, solo necesitas llenar un formulario con la informacion de tu negocio. Es como llenar un perfil de red social.',
  },
  {
    q: '¿Que tipo de negocios pueden registrarse?',
    a: 'Cualquier negocio en Lagos de Moreno: restaurantes, tiendas, talleres, consultorios, servicios profesionales, comida, salones de belleza, etc.',
  },
  {
    q: '¿Como me contactan los clientes?',
    a: 'Tus clientes pueden contactarte directamente por WhatsApp con un solo toque, llamarte, ver tu ubicacion en el mapa o visitar tu sitio web si lo tienes.',
  },
]

export default async function RegistrarNegocioPage() {
  const user = await getUser()
  const supabase = await createClient()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, icon')
    .is('parent_id', null)
    .order('display_order')

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single() as { data: { role: string } | null }
    isAdmin = profile?.role === 'admin'
  }

  // If logged in, show the form directly
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Registra tu Negocio en
              <span className="text-primary"> Lagos de Moreno</span>
            </h1>
            <p className="text-xl text-gray-600">
              Alcanza mas clientes con tu presencia digital — <strong className="text-primary">es GRATIS</strong>
            </p>
          </div>
          <RegisterBusinessForm categories={categories || []} isAdmin={isAdmin} />
        </div>
      </div>
    )
  }

  // Not logged in: show persuasive landing
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-secondary via-secondary to-primary/90 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/lagos-hero.jpg')] bg-cover bg-center opacity-15"></div>
        <div className="relative container mx-auto px-4 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
            Pon tu negocio en el{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent-light to-accent">
              mapa digital
            </span>{' '}
            de Lagos
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Miles de personas buscan negocios como el tuyo en Lagos de Moreno.
            Registrate <strong className="text-accent">GRATIS</strong> y empieza a recibir clientes hoy.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/registro?ref=registrar-negocio"
              className="bg-accent hover:bg-accent-dark text-secondary px-10 py-4 rounded-full font-bold text-lg shadow-xl transition-all hover:scale-105 hover:shadow-accent/30"
            >
              Registrar mi Negocio GRATIS
            </Link>
            <Link
              href="/login?ref=registrar-negocio"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-semibold text-lg backdrop-blur-sm border border-white/20 transition-all"
            >
              Ya tengo cuenta
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
              <p className="text-2xl md:text-3xl font-bold text-accent">25+</p>
              <p className="text-xs text-white/80 uppercase tracking-wider mt-1">Negocios</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
              <p className="text-2xl md:text-3xl font-bold text-primary-light">100%</p>
              <p className="text-xs text-white/80 uppercase tracking-wider mt-1">Gratis</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
              <p className="text-2xl md:text-3xl font-bold text-white">24/7</p>
              <p className="text-xs text-white/80 uppercase tracking-wider mt-1">Visible</p>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4">Beneficios</span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-3">
              Todo lo que necesitas para crecer
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Herramientas profesionales para que tu negocio destaque en Lagos de Moreno
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((b) => (
              <div key={b.title} className="p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl flex items-center justify-center mb-4">
                  <span className="text-3xl">{b.icon}</span>
                </div>
                <h3 className="font-bold text-secondary mb-2">{b.title}</h3>
                <p className="text-sm text-gray-500">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20 bg-surface">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent-dark text-sm font-semibold rounded-full mb-4">Proceso</span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-3">
              3 pasos simples
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              En menos de 5 minutos tu negocio esta listo para recibir clientes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s) => (
              <div key={s.num} className="text-center relative">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark text-white rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-bold shadow-lg shadow-primary/20">
                  {s.num}
                </div>
                <h3 className="font-bold text-secondary text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4">Planes</span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-3">
              Elige el plan ideal para ti
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              Empieza gratis y crece a tu ritmo. Sin contratos ni permanencias.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 max-w-7xl mx-auto">
            {plans.map((plan: any) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 p-6 ${
                  plan.hot
                    ? 'border-purple-500 shadow-xl shadow-purple-500/20 bg-gradient-to-b from-purple-50 to-white scale-[1.02]'
                    : plan.popular
                    ? 'border-primary shadow-xl shadow-primary/10 scale-[1.02]'
                    : 'border-gray-100'
                }`}
              >
                {plan.hot && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                    </svg>
                    Nuevo
                  </span>
                )}
                {plan.popular && !plan.hot && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-4 py-1 rounded-full">
                    Popular
                  </span>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-secondary mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-extrabold text-secondary">{plan.price}</span>
                    <span className="text-gray-400 text-sm">{plan.period}</span>
                  </div>
                  {plan.dailyPrice && (
                    <p className="text-xs text-accent-dark font-semibold mt-1">{plan.dailyPrice} — menos que un cafe</p>
                  )}
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f: any) => (
                    <li key={f.text} className="flex items-center gap-2.5 text-sm">
                      {f.included ? (
                        <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={f.included ? 'text-gray-700' : 'text-gray-400'}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                {plan.hot ? (
                  <a
                    href="https://wa.me/524741082768?text=Hola%2C%20me%20interesa%20el%20plan%20Chatbot%20para%20mi%20negocio"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center py-3 rounded-xl font-semibold transition-colors bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white"
                  >
                    Contactar por WhatsApp
                  </a>
                ) : (
                  <Link
                    href="/registro?ref=registrar-negocio"
                    className={`block w-full text-center py-3 rounded-xl font-semibold transition-colors ${
                      plan.popular
                        ? 'bg-primary hover:bg-primary-dark text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-secondary'
                    }`}
                  >
                    {plan.price === '$0' ? 'Empezar Gratis' : 'Elegir Plan'}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-surface">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 bg-secondary/5 text-secondary text-sm font-semibold rounded-full mb-4">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-3">
              Preguntas frecuentes
            </h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group bg-white rounded-xl border border-gray-100 overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-semibold text-secondary hover:text-primary transition-colors list-none [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-br from-secondary via-secondary to-primary/80">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Tu negocio merece ser encontrado
          </h2>
          <p className="text-lg text-white/80 max-w-xl mx-auto mb-10">
            Unete a los negocios de Lagos de Moreno que ya estan creciendo con SomosLagos.
            El registro es gratis y toma menos de 5 minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/registro?ref=registrar-negocio"
              className="bg-accent hover:bg-accent-dark text-secondary px-10 py-4 rounded-full font-bold text-lg shadow-xl transition-all hover:scale-105 hover:shadow-accent/30"
            >
              Registrar mi Negocio GRATIS
            </Link>
            <Link
              href="/login?ref=registrar-negocio"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-full font-semibold text-lg backdrop-blur-sm border border-white/20 transition-all"
            >
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
