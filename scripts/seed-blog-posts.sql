-- Artículos iniciales del blog SomosLagos
-- Ejecutar en Supabase SQL Editor
-- Reemplaza 'TU-USER-ID-AQUI' con el UUID de tu cuenta admin

INSERT INTO blog_posts (title, slug, excerpt, content, category, status, published_at, is_featured, tags)
VALUES

-- ============================================================
-- ARTÍCULO 1: Guía de restaurantes
-- ============================================================
(
  'Los mejores lugares para comer en Lagos de Moreno',
  'mejores-lugares-comer-lagos-de-moreno',
  'Desde carnitas y birria hasta cafeterías y restaurantes de autor. Descubre dónde comer bien en Lagos de Moreno, Jalisco.',
  E'# Los mejores lugares para comer en Lagos de Moreno\n\nLagos de Moreno tiene una escena gastronómica que sorprende a quien la descubre. Desde puestos de carnitas que llevan décadas en la misma esquina hasta cafeterías modernas con espresso de especialidad, hay opciones para todos los gustos y bolsillos.\n\n## Carnitas y antojitos: el alma de Lagos\n\nEl desayuno y el almuerzo en Lagos tienen un ritual casi sagrado. Los fines de semana, las familias buscan una buena ración de carnitas con tortillas recién hechas, acompañadas de frijoles charros y una salsa verde que pique lo justo.\n\nBusca los puestos establecidos cerca del mercado municipal — los que llevan más años son los que más cola tienen. No es casualidad.\n\n## Birria: la otra joya local\n\nLa birria de res al estilo Los Altos es diferente a la que encuentras en otras partes. Más concentrada, con chile guajillo y especias que se cocinan durante horas. Acompáñala con cebolla, cilantro y unas gotas de limón.\n\n## Cafeterías y opciones modernas\n\nEn los últimos años han abierto cafeterías que sirven café de grano mexicano, pasteles artesanales y desayunos más contemporáneos. Son el punto de encuentro de los lagunenses que trabajan desde casa o quieren una reunión tranquila.\n\n## Dónde buscar más opciones\n\nEn **SomosLagos** puedes explorar el directorio completo de restaurantes y negocios de comida en Lagos de Moreno, con horarios, ubicación en mapa y contacto directo por WhatsApp.\n\n👉 Explora la categoría [Restaurantes y comida](/categorias/restaurantes) para ver todas las opciones disponibles.\n\n## Consejo final\n\nLos mejores lugares suelen estar llenos entre 1pm y 3pm de lunes a viernes. Si puedes, ve antes o después de ese horario para no esperar. Y siempre lleva efectivo — muchos locales todavía no tienen terminal.',
  'guias-locales',
  'published',
  NOW(),
  true,
  ARRAY['restaurantes', 'gastronomia', 'lagos de moreno', 'donde comer']
),

-- ============================================================
-- ARTÍCULO 2: Qué hacer en Lagos
-- ============================================================
(
  'Qué hacer en Lagos de Moreno este fin de semana',
  'que-hacer-lagos-de-moreno-fin-de-semana',
  'Plan completo para disfrutar Lagos de Moreno: desde el centro histórico y la Parroquia hasta mercados, cafés y actividades para toda la familia.',
  E'# Qué hacer en Lagos de Moreno este fin de semana\n\nLagos de Moreno es una de las ciudades más bonitas de Los Altos de Jalisco — y a veces sus propios habitantes lo olvidan. Si tienes el fin de semana libre, aquí va un plan para aprovecharlo al máximo.\n\n## Sábado por la mañana: el centro histórico\n\nEmpieza con un café en alguna de las cafeterías del centro y luego camina por el centro histórico. La Parroquia de la Asunción es imponente, especialmente de mañana cuando la luz le pega directo. Entra, vale la pena.\n\nDa una vuelta por el Jardín Principal — los fines de semana suele haber vendedores de artesanías y antojitos. Es el corazón social de la ciudad.\n\n## Mañana: mercado y desayuno\n\nEl mercado municipal es una experiencia completa. Hay puestos de jugos, gorditas, quesadillas y todo lo que necesitas para un buen desayuno. Llega temprano, antes de las 10am, cuando todo está fresco.\n\n## Tarde del sábado: explorar los alrededores\n\nA 20 minutos de Lagos hay paisajes de Los Altos que vale la pena ver: presas, campos y el típico cielo abierto de Jalisco. Si tienes carro, da una vuelta por las carreteras secundarias.\n\n## Domingo: calma y negocios locales\n\nEl domingo es perfecto para apoyar a los negocios locales. Desayuna en algún lugar del directorio, compra artesanías, pasa a la panadería del barrio.\n\nEn **SomosLagos** puedes encontrar negocios locales por categoría, con mapa y horarios actualizados:\n\n👉 [Explora el directorio de negocios en Lagos de Moreno](/buscar)\n\n## Para las familias\n\nLagos tiene parques y espacios al aire libre donde los niños pueden correr. El Jardín Principal tiene juegos y suele haber actividades los fines de semana. Checa también si hay eventos culturales en el teatro o en la Casa de la Cultura.\n\n## Antes de ir\n\nRevisa los horarios de los lugares que quieras visitar — algunos negocios tienen horarios especiales el fin de semana. En SomosLagos puedes ver si un negocio está abierto en este momento antes de ir.',
  'guias-locales',
  'published',
  NOW() - INTERVAL '2 days',
  false,
  ARRAY['turismo', 'fin de semana', 'lagos de moreno', 'que hacer', 'actividades']
),

-- ============================================================
-- ARTÍCULO 3: Tips para negocios locales
-- ============================================================
(
  'Cómo hacer crecer tu negocio local en Lagos de Moreno',
  'como-crecer-negocio-local-lagos-de-moreno',
  'Consejos prácticos para que tu negocio en Lagos de Moreno tenga más visibilidad, atraiga más clientes y crezca de forma sostenida.',
  E'# Cómo hacer crecer tu negocio local en Lagos de Moreno\n\nTener un buen producto o servicio ya no es suficiente. En 2025, si tu negocio no tiene presencia digital, existe el riesgo real de que tus clientes potenciales simplemente no te encuentren — aunque estés a dos cuadras de su casa.\n\nAquí van los pasos más importantes para que tu negocio local en Lagos de Moreno crezca.\n\n## 1. Asegúrate de que te puedan encontrar en internet\n\nEl primer paso es tener una ficha de negocio actualizada con:\n- Nombre correcto\n- Dirección exacta\n- Horarios reales (muchos negocios pierden clientes porque sus horarios en línea están desactualizados)\n- Número de WhatsApp o teléfono\n- Fotos del lugar y del producto\n\nUn directorio local como **SomosLagos** te da visibilidad directa entre personas en Lagos de Moreno que están buscando lo que tú ofreces. [Registra tu negocio aquí](/registrar-negocio).\n\n## 2. Las fotos importan más de lo que crees\n\nUn negocio con fotos de calidad recibe hasta 3 veces más visitas que uno sin fotos. No necesitas cámara profesional — un celular con buena luz natural es suficiente.\n\nTips rápidos:\n- Toma fotos de día, cerca de una ventana\n- Muestra el producto terminado, no solo los ingredientes\n- Incluye una foto del lugar para que la gente sepa qué esperar\n\n## 3. Pide reseñas a tus clientes frecuentes\n\nLas reseñas son el boca en boca digital. Un cliente satisfecho que deja una reseña de 5 estrellas vale más que cualquier anuncio.\n\nCuando alguien quede contento con tu servicio, pídele directamente: *"¿Me harías el favor de dejarnos una reseña en SomosLagos?"* La mayoría acepta si se lo preguntas en el momento.\n\n## 4. Responde siempre los mensajes de WhatsApp\n\nLa velocidad de respuesta es uno de los factores más importantes para convertir un interesado en cliente. Si tardas más de 2 horas en responder, muchos ya encontraron otra opción.\n\nSi no puedes estar siempre disponible, configura un mensaje automático de bienvenida en WhatsApp Business que indique tu horario de atención.\n\n## 5. Constancia sobre perfección\n\nNo tienes que hacer todo de golpe. Una foto nueva cada semana, responder reseñas, actualizar el horario cuando cambia — estas acciones pequeñas y constantes construyen presencia digital de forma sostenida.\n\n---\n\n¿Todavía no tienes tu negocio en SomosLagos? Es gratis registrarse y empieza a recibir visibilidad hoy mismo.\n\n👉 [Registrar mi negocio en SomosLagos](/registrar-negocio)',
  'tips',
  'published',
  NOW() - INTERVAL '4 days',
  false,
  ARRAY['negocios', 'tips', 'marketing local', 'crecer negocio', 'lagos de moreno']
),

-- ============================================================
-- ARTÍCULO 4: Comercio local
-- ============================================================
(
  'Por qué comprar en negocios locales de Lagos de Moreno',
  'por-que-comprar-negocios-locales-lagos-de-moreno',
  'Cuando compras en un negocio local, el dinero se queda en Lagos de Moreno. Te explicamos el impacto real del comercio local en nuestra ciudad.',
  E'# Por qué comprar en negocios locales de Lagos de Moreno\n\nEs fácil pedir por Amazon o ir al centro comercial. Es conveniente, rápido y a veces más barato. Pero hay algo que esas opciones no pueden hacer: quedarse en Lagos de Moreno.\n\n## El dinero que circula localmente multiplica su impacto\n\nCuando compras en un negocio local, ese dinero no se va a una corporación en otro país. Se queda en la ciudad: el dueño lo usa para pagar a sus empleados lagunenses, para comprar insumos a proveedores locales, para pagar su renta en un local de la ciudad.\n\nEstudios de comercio local muestran que por cada $100 pesos gastados en un negocio local, entre $60 y $70 siguen circulando en la economía local. En una cadena, ese porcentaje cae a menos de $30.\n\n## Los negocios locales conocen a sus clientes\n\nEl dueño de la ferretería de tu colonia sabe qué tipo de tornillo necesitas para ese mueble específico. La señora de la papelería te guarda el cuaderno que siempre pides. Hay un nivel de atención y conocimiento que los grandes almacenes simplemente no pueden replicar.\n\n## Construyen comunidad\n\nLos negocios locales patrocinan las fiestas del barrio, dan empleo a los vecinos, conocen a las familias por nombre. Son parte del tejido social de Lagos de Moreno de una forma que ninguna tienda de cadena puede serlo.\n\n## Cómo encontrar negocios locales en Lagos de Moreno\n\n**SomosLagos** es un directorio dedicado exclusivamente a negocios en Lagos de Moreno. Puedes buscar por categoría, ver horarios, ubicación en mapa y contactar directamente por WhatsApp.\n\n👉 [Explorar negocios locales en Lagos de Moreno](/buscar)\n\n## El reto: hacerlo hábito\n\nNo se trata de nunca comprar en línea ni de pagar más por todo. Se trata de, antes de ir al centro comercial o hacer un pedido de Amazon, preguntarte: *¿hay alguien en Lagos que venda esto?*\n\nMuchas veces la respuesta es sí. Y ahora es más fácil que nunca encontrarlos.',
  'general',
  'published',
  NOW() - INTERVAL '7 days',
  false,
  ARRAY['comercio local', 'economia local', 'lagos de moreno', 'negocios']
);
