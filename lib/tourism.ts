/**
 * Datos de turismo y actividades en Lagos de Moreno
 * Contenido estático para SEO — los negocios se cargan dinámicamente de Supabase
 */

export interface Activity {
  id: string
  title: string
  description: string
  longDescription: string
  icon: string
  gradient: string
  image: string
  relatedCategories: string[] // slugs de categorías existentes
}

export interface Zone {
  id: string
  name: string
  description: string
  longDescription: string
  icon: string
  gradient: string
  image: string
  relatedCategories: string[]
  coordinates?: { lat: number; lng: number }
}

// --- Actividades ---
export const ACTIVITIES: Activity[] = [
  {
    id: 'gastronomia',
    title: 'Descubre la Gastronomía',
    description: 'Birria, carnitas, dulces típicos y antojitos que solo encuentras aquí.',
    longDescription: 'Lagos de Moreno es cuna de una gastronomía rica y variada. Desde la famosa birria jalisciense hasta los dulces de leche artesanales, cada platillo cuenta una historia. Visita restaurantes, fondas y puestos tradicionales que llevan generaciones compartiendo su sazón.',
    icon: '🍽️',
    gradient: 'from-orange-500 to-red-500',
    image: '/tourism/centro-historico.jpg',
    relatedCategories: ['restaurantes', 'cafeterias', 'antojitos'],
  },
  {
    id: 'compras',
    title: 'Compras y Artesanías',
    description: 'Lleva un pedacito de Lagos: artesanías, textiles y productos únicos.',
    longDescription: 'Explora tiendas y mercados donde encontrarás artesanías de piel, textiles bordados, dulces regionales y recuerdos únicos. El comercio local de Lagos de Moreno es una experiencia en sí misma, con vendedores que te cuentan la historia detrás de cada producto.',
    icon: '🛍️',
    gradient: 'from-pink-500 to-purple-500',
    image: '/tourism/casa-cultura.jpg',
    relatedCategories: ['tiendas', 'ropa', 'artesanias'],
  },
  {
    id: 'turismo-religioso',
    title: 'Turismo Religioso',
    description: 'Templos centenarios con arquitectura colonial que te dejará sin palabras.',
    longDescription: 'Lagos de Moreno alberga templos y parroquias con siglos de historia. Desde la majestuosa Parroquia de la Asunción hasta el icónico Templo del Calvario, cada edificio religioso es una obra de arte arquitectónica que refleja la profunda fe y tradición de la región.',
    icon: '⛪',
    gradient: 'from-amber-500 to-yellow-500',
    image: '/tourism/turismo-religioso.jpg',
    relatedCategories: [],
  },
  {
    id: 'fotografia',
    title: 'Fotografía y Rincones',
    description: 'Lagos es un Pueblo Mágico perfecto para capturar momentos únicos.',
    longDescription: 'Cada esquina de Lagos de Moreno es una postal. Sus calles empedradas, fachadas coloniales coloridas, puentes históricos y miradores ofrecen escenarios perfectos para la fotografía. Ya sea al amanecer desde el Calvario o al atardecer junto al río, Lagos nunca deja de sorprender.',
    icon: '📸',
    gradient: 'from-cyan-500 to-blue-500',
    image: '/tourism/calvario-panoramica.jpg',
    relatedCategories: ['fotografia', 'servicios'],
  },
  {
    id: 'paseos',
    title: 'Paseos y Recorridos',
    description: 'Camina por calles empedradas y disfruta el ambiente tranquilo de Lagos.',
    longDescription: 'No hay mejor forma de conocer Lagos de Moreno que caminando. Recorre el centro histórico, cruza el emblemático puente sobre el río, sube al Templo del Calvario para una vista panorámica y descubre rincones escondidos. Después, acompáñalo con un helado o un café en algún negocio local.',
    icon: '🚶',
    gradient: 'from-emerald-500 to-teal-500',
    image: '/tourism/centro-historico.jpg',
    relatedCategories: ['cafeterias', 'heladerias'],
  },
  {
    id: 'eventos',
    title: 'Eventos y Tradiciones',
    description: 'Ferias, fiestas patronales y festividades que hacen único a Lagos.',
    longDescription: 'Lagos de Moreno cobra vida con sus tradiciones: la Feria de la Primavera, las fiestas de la Asunción en agosto, las celebraciones de Semana Santa y el Día de Muertos. Cada evento es una oportunidad para vivir la cultura laguense en su máxima expresión.',
    icon: '🎉',
    gradient: 'from-violet-500 to-fuchsia-500',
    image: '/tourism/dia-muertos.jpg',
    relatedCategories: [],
  },
]

// --- Zonas Emblemáticas ---
export const ZONES: Zone[] = [
  {
    id: 'templo-calvario',
    name: 'Templo del Calvario',
    description: 'Icónico templo en lo alto con la mejor vista panorámica de Lagos.',
    longDescription: 'Construido en el siglo XIX con arquitectura neoclásica, el Templo del Calvario se alza majestuoso sobre Lagos de Moreno. Sube sus escalinatas para disfrutar de una vista panorámica impresionante de toda la ciudad y sus alrededores. Es el símbolo más reconocido de Lagos.',
    icon: '⛪',
    gradient: 'from-teal-600 to-emerald-700',
    image: '/tourism/templo-calvario.jpg',
    relatedCategories: [],
    coordinates: { lat: 21.3571, lng: -102.3425 },
  },
  {
    id: 'centro-historico',
    name: 'Centro Histórico',
    description: 'Corazón de Lagos: portales, plazas y arquitectura colonial.',
    longDescription: 'Declarado Patrimonio de la Humanidad por la UNESCO en 2010, el centro histórico de Lagos de Moreno es un tesoro arquitectónico. Pasea por sus portales, admira las casonas coloniales y siéntate en la plaza principal a disfrutar de un momento tranquilo en este Pueblo Mágico.',
    icon: '🏛️',
    gradient: 'from-slate-700 to-slate-900',
    image: '/tourism/centro-historico.jpg',
    relatedCategories: ['restaurantes', 'cafeterias', 'tiendas'],
    coordinates: { lat: 21.3528, lng: -102.3444 },
  },
  {
    id: 'puente-rio',
    name: 'Puente del Río Lagos',
    description: 'Emblemático puente con vista al río, ideal para paseos y fotos.',
    longDescription: 'Construido en 1860, el Puente del Río Lagos es uno de los monumentos más fotografiados de la ciudad. Su arquitectura de cantera y las vistas del río lo convierten en el lugar perfecto para un paseo romántico o una sesión de fotos al atardecer.',
    icon: '🌉',
    gradient: 'from-blue-600 to-indigo-700',
    image: '/tourism/puente-rio.jpg',
    relatedCategories: ['heladerias', 'cafeterias'],
  },
  {
    id: 'parroquia-asuncion',
    name: 'Parroquia de la Asunción',
    description: 'Joya del barroco mexicano con fachada de cantera rosa.',
    longDescription: 'La Parroquia de la Asunción es considerada una de las mejores expresiones del barroco mexicano. Su imponente fachada de cantera rosa, con torres de tres cuerpos, domina el paisaje del centro de Lagos. En su interior, retablos dorados y pinturas coloniales cuentan siglos de historia.',
    icon: '🕍',
    gradient: 'from-rose-600 to-pink-700',
    image: '/tourism/parroquia-asuncion.jpg',
    relatedCategories: [],
    coordinates: { lat: 21.3534, lng: -102.3442 },
  },
  {
    id: 'teatro-rosas-moreno',
    name: 'Teatro José Rosas Moreno',
    description: 'Teatro histórico neoclásico, joya cultural de Lagos.',
    longDescription: 'Nombrado en honor al célebre poeta y fabulista laguense, el Teatro José Rosas Moreno es un edificio neoclásico que ha sido escenario de eventos culturales desde el siglo XIX. Su elegante interior y su rica programación lo convierten en un punto obligado para los amantes de la cultura.',
    icon: '🎭',
    gradient: 'from-purple-600 to-violet-700',
    image: '/tourism/teatro-rosas-moreno.jpg',
    relatedCategories: [],
  },
  {
    id: 'museo-arte-sacro',
    name: 'Museo de Arte Sacro',
    description: 'Colección de arte religioso colonial y piezas históricas.',
    longDescription: 'El Museo de Arte Sacro resguarda una valiosa colección de arte religioso que abarca desde la época colonial hasta el siglo XX. Pinturas, esculturas, ornamentos litúrgicos y documentos históricos te transportan a los orígenes de Lagos de Moreno.',
    icon: '🖼️',
    gradient: 'from-amber-600 to-orange-700',
    image: '/tourism/turismo-religioso.jpg',
    relatedCategories: [],
  },
  {
    id: 'presa-cuarenta',
    name: 'Presa de Cuarenta',
    description: 'Zona natural perfecta para días al aire libre y picnics.',
    longDescription: 'A las afueras de Lagos de Moreno, la Presa de Cuarenta ofrece un escape natural con aguas tranquilas rodeadas de paisajes verdes. Es el lugar ideal para un día de campo, pesca recreativa o simplemente disfrutar de la naturaleza lejos del bullicio de la ciudad.',
    icon: '🏞️',
    gradient: 'from-green-600 to-emerald-700',
    image: '/tourism/panoramica-lagos.jpg',
    relatedCategories: [],
  },
  {
    id: 'haciendas',
    name: 'Haciendas Coloniales',
    description: 'Haciendas históricas que cuentan la historia de la región.',
    longDescription: 'Los alrededores de Lagos de Moreno están salpicados de haciendas coloniales que fueron el corazón de la actividad ganadera y agrícola de la región. Algunas han sido restauradas y abren sus puertas para que conozcas la vida hacendaria del México colonial.',
    icon: '🏡',
    gradient: 'from-yellow-700 to-amber-800',
    image: '/tourism/palacio-municipal.jpg',
    relatedCategories: [],
  },
  {
    id: 'jardin-constituyentes',
    name: 'Jardín de los Constituyentes',
    description: 'Plaza principal con kiosco, rodeada de portales y comercios.',
    longDescription: 'El Jardín de los Constituyentes es el corazón social de Lagos de Moreno. Con su kiosco tradicional, bancas bajo los árboles y rodeado de portales con cafés y tiendas, es el lugar perfecto para sentarse a observar la vida cotidiana de este Pueblo Mágico.',
    icon: '🌳',
    gradient: 'from-teal-500 to-green-600',
    image: '/tourism/jardin-constituyentes.jpg',
    relatedCategories: ['cafeterias', 'heladerias', 'restaurantes'],
    coordinates: { lat: 21.3530, lng: -102.3440 },
  },
  {
    id: 'casa-cultura',
    name: 'Casa de la Cultura',
    description: 'Centro cultural con exposiciones, talleres y eventos artísticos.',
    longDescription: 'La Casa de la Cultura de Lagos de Moreno es un espacio dedicado a las artes y la educación. Alberga exposiciones temporales, talleres de arte, presentaciones de libros y eventos culturales. Un lugar imprescindible para quienes buscan conocer el lado artístico de Lagos.',
    icon: '🎨',
    gradient: 'from-indigo-600 to-blue-700',
    image: '/tourism/casa-cultura.jpg',
    relatedCategories: [],
  },
]

// --- SEO ---
export const TOURISM_SEO = {
  title: 'Qué Hacer en Lagos de Moreno | Guía Turística Completa 2026',
  description: 'Descubre las mejores cosas que hacer en Lagos de Moreno, Jalisco. Lugares emblemáticos, gastronomía, eventos, compras y negocios locales en este Pueblo Mágico.',
  keywords: [
    'qué hacer en lagos de moreno',
    'lugares para visitar en lagos de moreno',
    'turismo lagos de moreno',
    'actividades lagos de moreno jalisco',
    'pueblo mágico lagos de moreno',
    'donde ir en lagos de moreno',
    'que visitar en lagos de moreno',
    'cosas que hacer en lagos de moreno',
    'guía turística lagos de moreno',
    'templo del calvario lagos',
    'centro histórico lagos de moreno',
    'donde comer en lagos de moreno',
  ],
}
