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
    period: 'para siempre',
    popular: false,
    features: [
      { text: 'Listado en el directorio', included: true },
      { text: 'Mapa interactivo', included: true },
      { text: 'Boton de WhatsApp', included: true },
      { text: 'Horarios de negocio', included: true },
      { text: 'Hasta 5 fotos', included: true },
      { text: 'Opiniones de clientes', included: true },
      { text: 'Productos y pedidos', included: false },
      { text: 'Pagos en linea', included: false },
      { text: 'Destacado en busquedas', included: false },
      { text: 'Badge verificado', included: false },
    ],
  },
  {
    name: 'Pro',
    price: '$100',
    period: '/mes',
    popular: true,
    features: [
      { text: 'Todo lo del plan Gratis', included: true },
      { text: 'Catalogo de productos', included: true },
      { text: 'Recibir pedidos', included: true },
      { text: 'Pagos por transferencia', included: true },
      { text: 'Pagos con tarjeta', included: true },
      { text: 'Hasta 15 fotos', included: true },
      { text: 'Destacado en busquedas', included: false },
      { text: 'Badge verificado', included: false },
      { text: 'Estadisticas', included: false },
      { text: 'Soporte VIP', included: false },
    ],
  },
  {
    name: 'Avanzado',
    price: '$180',
    period: '/mes',
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
]

const faqs = [
  {
    q: '¿Es realmente gratis?',
    a: 'Si, el plan Gratis es 100% gratuito y permanente. Tu negocio aparece en el directorio, mapa y busquedas sin ningun costo. Los planes Pro y Avanzado son opcionales para quienes quieran funciones extra.',
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 p-6 ${
                  plan.popular
                    ? 'border-primary shadow-xl shadow-primary/10 scale-[1.02]'
                    : 'border-gray-100'
                }`}
              >
                {plan.popular && (
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
                </div>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((f) => (
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
