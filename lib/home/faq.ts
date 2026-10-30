/* Preguntas frecuentes de la home: una sola fuente para la seccion visible
   y para el JSON-LD FAQPage, de modo que el marcado siempre coincida con el contenido. */

export interface FaqItem {
  question: string
  answer: string
}

export const HOME_FAQ: FaqItem[] = [
  {
    question: '¿Cómo registro mi negocio en SomosLagos?',
    answer:
      'Entra a somoslagos.com.mx, haz clic en "Registrar negocio" y completa el formulario. Tu negocio queda publicado en el directorio al enviarlo.',
  },
  {
    question: '¿Es gratis registrar mi negocio en SomosLagos?',
    answer:
      'Sí, existe un plan gratuito con perfil, fotos, WhatsApp directo, horarios y aparición en el mapa. Existen planes de pago para negocios que quieren mayor visibilidad.',
  },
  {
    question: '¿Qué es Lagos de Moreno Pueblo Mágico?',
    answer:
      'Lagos de Moreno es un Pueblo Mágico de Jalisco, México, famoso por su arquitectura barroca, gastronomía, artesanías y tradiciones. SomosLagos es un directorio digital de su comunidad de negocios.',
  },
  {
    question: '¿Puedo pedir a un negocio local por WhatsApp desde SomosLagos?',
    answer:
      'Sí. Desde el perfil de cada negocio puedes contactarlos directamente por WhatsApp. Los negocios con Plan Pro además tienen catálogo de productos y pedidos en línea.',
  },
  {
    question: '¿SomosLagos tiene app móvil?',
    answer:
      'SomosLagos funciona como una Progressive Web App (PWA). Puedes instalarla en tu celular desde el navegador, sin necesidad de descargarla en la tienda de apps.',
  },
]
