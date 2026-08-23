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
  { icon: '🔍', title: 'Te encuentran', desc: 'Tu negocio visible en el directorio, mapa y busquedas locales de Lagos de Moreno' },
  { icon: '💬', title: 'Te contactan', desc: 'WhatsApp directo, llamadas, catalogo y promociones — todo en un solo perfil' },
  { icon: '📊', title: 'Te administras', desc: 'Herramientas creadas por DEVOGATEC para crecer tu presencia digital' },
  { icon: '📱', title: 'Presencia Digital', desc: 'Perfil profesional las 24 horas, sin necesidad de pagina web propia' },
  { icon: '📍', title: 'Mapa Interactivo', desc: 'Ubicacion exacta para que tus clientes te encuentren facilmente' },
  { icon: '⭐', title: 'Opiniones', desc: 'Genera confianza con resenas reales de tus clientes' },
]

const steps = [
  { num: '1', title: 'Crea tu cuenta', desc: 'Registrate gratis con tu correo en menos de 2 minutos' },
  { num: '2', title: 'Llena tu informacion', desc: 'Agrega nombre, direccion, fotos, horarios y contacto' },
  { num: '3', title: 'Empieza a recibir clientes', desc: 'Tu negocio aparece en busquedas y el mapa de Lagos' },
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
    .not('slug', 'like', '__hidden__%')
    .order('display_order')

  // Get real business count for display
  const { count: businessCount } = await supabase
    .from('businesses')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true) as { count: number | null }

  const businessDisplayCount = Math.max(5, Math.floor((businessCount || 0) / 5) * 5)

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
      <div className="min-h-screen py-12 px-4" style={{ background: 'var(--ivory)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--ink)' }}>
              Registra tu Negocio en
              <span style={{ color: 'var(--coral)' }}> Lagos de Moreno</span>
            </h1>
            <p className="text-xl" style={{ color: 'var(--muted)' }}>
              Alcanza mas clientes con tu presencia digital — <strong style={{ color: 'var(--coral)' }}>es GRATIS</strong>
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
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--ink) 0%, var(--coral) 100%)' }}>
        <div className="absolute inset-0 bg-[url('/lagos-hero.jpg')] bg-cover bg-center opacity-15"></div>
        <div className="relative container mx-auto px-4 py-20 md:py-28 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
            Te ayudamos a ser encontrado<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent via-accent-light to-accent">
              y a convertir visitas en clientes
            </span>
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Te encuentran en el directorio. Te contactan por WhatsApp.
            Te administras con herramientas de DEVOGATEC.
            Registrate <strong style={{ color: 'var(--gold)' }}>GRATIS</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/registro?ref=registrar-negocio"
              className="px-10 py-4 rounded-full font-bold text-lg shadow-xl transition-all hover:scale-105"
              style={{ background: 'var(--gold)', color: 'var(--ink)' }}
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
              <p className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--gold)' }}>{businessDisplayCount}+</p>
              <p className="text-xs text-white/80 uppercase tracking-wider mt-1">Negocios</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/10">
              <p className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--coral)' }}>100%</p>
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
            <span className="inline-block px-4 py-1.5 text-sm font-semibold rounded-full mb-4" style={{ background: 'rgba(255,107,53,0.1)', color: 'var(--coral)' }}>Beneficios</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--ink)' }}>
              Todo lo que necesitas para crecer
            </h2>
            <p className="max-w-lg mx-auto" style={{ color: 'var(--muted)' }}>
              Herramientas profesionales para que tu negocio destaque en Lagos de Moreno
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((b) => (
              <div key={b.title} className="p-6 bg-white rounded-2xl hover:-translate-y-1 transition-all" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.1), rgba(245,185,66,0.1))' }}>
                  <span className="text-3xl">{b.icon}</span>
                </div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--ink)' }}>{b.title}</h3>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20" style={{ background: 'var(--cream)' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 text-sm font-semibold rounded-full mb-4" style={{ background: 'rgba(245,185,66,0.12)', color: 'var(--gold)' }}>Proceso</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--ink)' }}>
              3 pasos simples
            </h2>
            <p className="max-w-lg mx-auto" style={{ color: 'var(--muted)' }}>
              En menos de 5 minutos tu negocio esta listo para recibir clientes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s) => (
              <div key={s.num} className="text-center relative">
                <div className="w-16 h-16 text-white rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-bold shadow-lg" style={{ background: 'linear-gradient(135deg, var(--coral), #E2541F)' }}>
                  {s.num}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--ink)' }}>{s.title}</h3>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Opciones opcionales — discreta, sin precios */}
      <section className="py-10 bg-white" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            ¿Quieres más visibilidad? Hay funciones opcionales para crecer a tu ritmo.{' '}
            <Link href="/planes" className="font-medium underline underline-offset-2" style={{ color: 'var(--coral)' }}>
              Ver opciones →
            </Link>
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20" style={{ background: 'var(--cream)' }}>
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <span className="inline-block px-4 py-1.5 text-sm font-semibold rounded-full mb-4" style={{ background: 'rgba(31,41,55,0.05)', color: 'var(--ink)' }}>FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: 'var(--ink)' }}>
              Preguntas frecuentes
            </h2>
          </div>

          <div className="max-w-2xl mx-auto space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group bg-white rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.06)' }}>
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-semibold transition-colors list-none [&::-webkit-details-marker]:hidden" style={{ color: 'var(--ink)' }}>
                  {faq.q}
                  <svg className="w-5 h-5 group-open:rotate-180 transition-transform flex-shrink-0 ml-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: 'var(--muted)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-6 pb-4 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20" style={{ background: 'linear-gradient(135deg, var(--ink) 0%, var(--coral) 100%)' }}>
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Te ayudamos a ser encontrado<br />
            y a convertir visitas en clientes
          </h2>
          <p className="text-lg text-white/80 max-w-xl mx-auto mb-10">
            Tres niveles de crecimiento: te encuentran, te contactan, te administras.
            Empezar es gratis y toma menos de 5 minutos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/registro?ref=registrar-negocio"
              className="px-10 py-4 rounded-full font-bold text-lg shadow-xl transition-all hover:scale-105"
              style={{ background: 'var(--gold)', color: 'var(--ink)' }}
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
