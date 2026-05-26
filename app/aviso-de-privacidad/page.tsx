import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Aviso de Privacidad',
  description: 'Aviso de Privacidad de SomosLagos conforme a la Ley Federal de Proteccion de Datos Personales en Posesion de los Particulares (LFPDPPP).',
  openGraph: {
    title: 'Aviso de Privacidad | SomosLagos',
    description: 'Aviso de Privacidad de SomosLagos.',
    url: 'https://www.somoslagos.com.mx/aviso-de-privacidad',
  },
}

export default function AvisoDePrivacidadPage() {
  return (
    <main className="min-h-screen py-12" style={{ background: 'var(--ivory)' }}>
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-2xl p-8 md:p-12" style={{ boxShadow: 'var(--shadow-card)', border: '1px solid rgba(0,0,0,0.06)' }}>
          <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--display)', color: 'var(--ink)' }}>Aviso de Privacidad</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>Ultima actualizacion: 1 de marzo de 2026</p>

          <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
            <section>
              <h2 className="text-lg font-bold mt-8 mb-3" style={{ color: 'var(--ink)' }}>1. Identidad del Responsable</h2>
              <p>
                <strong>SomosLagos</strong> (en adelante &ldquo;la Plataforma&rdquo;), con domicilio en Lagos de Moreno, Jalisco, Mexico,
                es responsable del tratamiento de sus datos personales conforme a la Ley Federal de Proteccion de Datos Personales
                en Posesion de los Particulares (LFPDPPP) y su Reglamento.
              </p>
              <p>Correo de contacto: <strong>mauri.ragna@gmail.com</strong></p>
              <p>Sitio web: <strong>www.somoslagos.com.mx</strong></p>
            </section>

            <section>
              <h2 className="text-lg font-bold mt-8 mb-3" style={{ color: 'var(--ink)' }}>2. Datos Personales Recabados</h2>
              <p>Para las finalidades descritas en este aviso, podemos recabar los siguientes datos personales:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Nombre completo</li>
                <li>Correo electronico</li>
                <li>Numero de telefono</li>
                <li>Direccion del negocio (si registra un negocio)</li>
                <li>Fotografias del negocio, productos o articulos</li>
                <li>Informacion de redes sociales (enlaces publicos)</li>
                <li>Datos de navegacion (cookies, direccion IP)</li>
              </ul>
              <p className="mt-2">
                <strong>No recabamos datos sensibles</strong> como datos financieros bancarios, datos de salud,
                origen etnico, creencias religiosas u orientacion sexual.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mt-8 mb-3" style={{ color: 'var(--ink)' }}>3. Finalidades del Tratamiento</h2>
              <p>Sus datos personales seran utilizados para las siguientes finalidades:</p>
              <h3 className="font-semibold text-secondary mt-4 mb-2">Finalidades primarias (necesarias):</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Crear y administrar su cuenta de usuario</li>
                <li>Registrar y publicar su negocio en el directorio</li>
                <li>Publicar articulos en el marketplace</li>
                <li>Procesar pagos de suscripciones</li>
                <li>Mostrar informacion de contacto de negocios a usuarios</li>
                <li>Gestionar pedidos y transacciones entre usuarios y negocios</li>
              </ul>
              <h3 className="font-semibold text-secondary mt-4 mb-2">Finalidades secundarias (opcionales):</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>Enviar notificaciones por correo electronico sobre su cuenta o negocio</li>
                <li>Enviar informacion sobre nuevas funciones de la plataforma</li>
                <li>Realizar estadisticas internas y mejorar nuestros servicios</li>
              </ul>
              <p className="mt-2">
                Si no desea que sus datos personales sean tratados para las finalidades secundarias, puede enviar
                un correo a <strong>mauri.ragna@gmail.com</strong> indicando su solicitud.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mt-8 mb-3" style={{ color: 'var(--ink)' }}>4. Transferencia de Datos</h2>
              <p>
                Sus datos personales pueden ser transferidos y tratados por terceros proveedores de tecnologia
                necesarios para la operacion de la plataforma:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li><strong>Supabase</strong> (almacenamiento de datos y autenticacion)</li>
                <li><strong>Vercel</strong> (hospedaje web)</li>
                <li><strong>Resend</strong> (envio de correos electronicos transaccionales)</li>
                <li><strong>Google</strong> (autenticacion OAuth, si usa &ldquo;Iniciar sesion con Google&rdquo;)</li>
              </ul>
              <p className="mt-2">
                Estas transferencias se realizan conforme al articulo 37 de la LFPDPPP y son necesarias para
                el cumplimiento de la relacion juridica entre usted y la Plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mt-8 mb-3" style={{ color: 'var(--ink)' }}>5. Derechos ARCO</h2>
              <p>
                Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos
                personales (derechos ARCO). Para ejercer estos derechos, envie un correo electronico a{' '}
                <strong>mauri.ragna@gmail.com</strong> con la siguiente informacion:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Nombre completo y correo electronico asociado a su cuenta</li>
                <li>Descripcion clara del derecho que desea ejercer</li>
                <li>Cualquier documento que acredite su identidad</li>
              </ul>
              <p className="mt-2">
                Responderemos a su solicitud en un plazo maximo de 20 dias habiles conforme a la ley.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mt-8 mb-3" style={{ color: 'var(--ink)' }}>6. Cookies y Tecnologias de Rastreo</h2>
              <p>
                La Plataforma utiliza cookies y tecnologias similares para:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Mantener su sesion iniciada</li>
                <li>Recordar sus preferencias</li>
                <li>Mejorar la experiencia de navegacion</li>
              </ul>
              <p className="mt-2">
                Puede deshabilitar las cookies desde la configuracion de su navegador, aunque esto podria
                afectar la funcionalidad de la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mt-8 mb-3" style={{ color: 'var(--ink)' }}>7. Cambios al Aviso de Privacidad</h2>
              <p>
                Nos reservamos el derecho de modificar este Aviso de Privacidad en cualquier momento.
                Las modificaciones estaran disponibles en esta misma pagina:{' '}
                <strong>www.somoslagos.com.mx/aviso-de-privacidad</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mt-8 mb-3" style={{ color: 'var(--ink)' }}>8. Consentimiento</h2>
              <p>
                Al registrarse en la Plataforma y aceptar los terminos durante el proceso de registro,
                usted otorga su consentimiento para el tratamiento de sus datos personales conforme a
                este Aviso de Privacidad.
              </p>
            </section>
          </div>

          <div className="mt-10 pt-6" style={{ borderTop: '1px solid rgba(0,0,0,0.07)' }}>
            <Link href="/" className="text-sm font-medium" style={{ color: 'var(--coral)' }}>
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
