import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terminos y Condiciones',
  description: 'Terminos y Condiciones de uso de la plataforma SomosLagos.',
  openGraph: {
    title: 'Terminos y Condiciones | SomosLagos',
    description: 'Terminos y Condiciones de uso de SomosLagos.',
    url: 'https://www.somoslagos.com.mx/terminos',
  },
}

export default function TerminosPage() {
  return (
    <main className="min-h-screen bg-surface py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-secondary mb-2">Terminos y Condiciones</h1>
          <p className="text-sm text-gray-400 mb-8">Ultima actualizacion: 1 de marzo de 2026</p>

          <div className="prose prose-gray max-w-none space-y-6 text-sm leading-relaxed text-gray-700">
            <section>
              <h2 className="text-lg font-bold text-secondary mt-8 mb-3">1. Aceptacion de los Terminos</h2>
              <p>
                Al acceder y utilizar la plataforma <strong>SomosLagos</strong> (www.somoslagos.com.mx),
                usted acepta estos Terminos y Condiciones en su totalidad. Si no esta de acuerdo con
                alguna parte de estos terminos, le pedimos que no utilice la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-secondary mt-8 mb-3">2. Descripcion del Servicio</h2>
              <p>
                SomosLagos es una plataforma digital que conecta negocios locales con la comunidad de
                Lagos de Moreno, Jalisco. Ofrecemos:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Directorio de negocios locales con informacion de contacto, horarios y ubicacion</li>
                <li>Marketplace para compra y venta de articulos entre particulares</li>
                <li>Blog con contenido local</li>
                <li>Sistema de opiniones y calificaciones</li>
                <li>Pedidos en linea para negocios con plan Pro o Avanzado</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-secondary mt-8 mb-3">3. Registro de Usuarios</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Debe ser mayor de 18 anos para registrarse</li>
                <li>La informacion proporcionada debe ser veraz y actualizada</li>
                <li>Es responsable de mantener la confidencialidad de su contrasena</li>
                <li>Una cuenta por persona; las cuentas no son transferibles</li>
                <li>Nos reservamos el derecho de suspender cuentas que violen estos terminos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-secondary mt-8 mb-3">4. Registro de Negocios</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>El negocio registrado debe operar legalmente en Lagos de Moreno o zona metropolitana</li>
                <li>La informacion del negocio (nombre, direccion, telefono, fotos) sera publica</li>
                <li>El responsable del negocio garantiza tener autorizacion para publicar la informacion</li>
                <li>SomosLagos puede verificar la autenticidad del negocio y rechazar registros falsos</li>
                <li>Los planes de suscripcion (Gratis, Pro, Avanzado) tienen funciones diferenciadas segun se describe en la pagina de registro</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-secondary mt-8 mb-3">5. Marketplace</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Los articulos publicados deben ser legales y cumplir con la legislacion mexicana</li>
                <li>SomosLagos <strong>no interviene</strong> en las transacciones entre compradores y vendedores</li>
                <li>SomosLagos <strong>no se hace responsable</strong> de la calidad, estado o entrega de los articulos</li>
                <li>Las negociaciones y pagos se realizan directamente entre las partes</li>
                <li>Los articulos expiran automaticamente despues de 30 dias</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-secondary mt-8 mb-3">6. Contenido Prohibido</h2>
              <p>Queda estrictamente prohibido publicar:</p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Contenido ilegal, difamatorio, amenazante o discriminatorio</li>
                <li>Material con derechos de autor sin autorizacion</li>
                <li>Informacion falsa o enganosa</li>
                <li>Articulos prohibidos: armas, drogas, material pornografico, productos robados</li>
                <li>Spam, publicidad no autorizada o contenido automatizado</li>
                <li>Datos personales de terceros sin su consentimiento</li>
              </ul>
              <p className="mt-2">
                SomosLagos se reserva el derecho de eliminar cualquier contenido que viole estas reglas
                sin previo aviso.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-secondary mt-8 mb-3">7. Opiniones y Calificaciones</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Las opiniones deben reflejar experiencias reales con el negocio</li>
                <li>No se permiten opiniones falsas, difamatorias o con lenguaje ofensivo</li>
                <li>Los duenos de negocios pueden responder a las opiniones</li>
                <li>SomosLagos puede moderar o eliminar opiniones que violen estos terminos</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-secondary mt-8 mb-3">8. Propiedad Intelectual</h2>
              <p>
                El diseno, codigo, logotipos y contenido original de SomosLagos son propiedad de sus creadores
                y estan protegidos por las leyes de propiedad intelectual de Mexico.
              </p>
              <p className="mt-2">
                Al publicar contenido (fotos, descripciones, opiniones) en la plataforma, usted otorga a
                SomosLagos una licencia no exclusiva para mostrar dicho contenido en la plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-secondary mt-8 mb-3">9. Pagos y Suscripciones</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>El plan Gratis no tiene costo y no requiere pago</li>
                <li>Los planes Pro y Avanzado requieren pago mensual segun los precios publicados</li>
                <li>Los pagos se procesan por transferencia bancaria o acuerdo directo</li>
                <li>No se realizan reembolsos una vez activado el periodo de suscripcion</li>
                <li>Si el pago no se recibe, el negocio puede ser desactivado temporalmente</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-secondary mt-8 mb-3">10. Limitacion de Responsabilidad</h2>
              <p>
                SomosLagos actua como intermediario tecnologico y <strong>no se hace responsable</strong> de:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>La veracidad de la informacion publicada por negocios o usuarios</li>
                <li>La calidad de los productos o servicios ofrecidos por los negocios</li>
                <li>Las transacciones realizadas entre usuarios en el marketplace</li>
                <li>Interrupciones del servicio por causas tecnicas o de fuerza mayor</li>
                <li>Danos directos o indirectos derivados del uso de la plataforma</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-secondary mt-8 mb-3">11. Cancelacion de Cuenta</h2>
              <p>
                Usted puede solicitar la cancelacion de su cuenta en cualquier momento enviando un correo a{' '}
                <strong>mauri.ragna@gmail.com</strong>. Al cancelar su cuenta:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Sus datos personales seran eliminados conforme al Aviso de Privacidad</li>
                <li>Los negocios asociados seran desactivados</li>
                <li>Las opiniones publicadas podran mantenerse de forma anonima</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-secondary mt-8 mb-3">12. Ley Aplicable</h2>
              <p>
                Estos Terminos y Condiciones se rigen por las leyes de los Estados Unidos Mexicanos.
                Para cualquier controversia derivada del uso de la plataforma, las partes se someten a la
                jurisdiccion de los tribunales competentes en Lagos de Moreno, Jalisco, Mexico.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-secondary mt-8 mb-3">13. Modificaciones</h2>
              <p>
                SomosLagos se reserva el derecho de modificar estos Terminos y Condiciones en cualquier momento.
                Las modificaciones seran publicadas en esta pagina y entraran en vigor inmediatamente.
                El uso continuado de la plataforma constituye la aceptacion de los terminos modificados.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-secondary mt-8 mb-3">14. Contacto</h2>
              <p>
                Para cualquier duda o aclaracion sobre estos Terminos y Condiciones, puede contactarnos en:
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>Correo: <strong>mauri.ragna@gmail.com</strong></li>
                <li>Sitio web: <strong>www.somoslagos.com.mx</strong></li>
              </ul>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 flex gap-4">
            <Link href="/" className="text-sm text-primary hover:text-primary-dark font-medium">
              ← Volver al inicio
            </Link>
            <Link href="/aviso-de-privacidad" className="text-sm text-primary hover:text-primary-dark font-medium">
              Aviso de Privacidad
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
