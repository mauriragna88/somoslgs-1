-- ============================================
-- SEED: Categorías comerciales para SomosLagos
-- Lagos de Moreno, Jalisco
-- ============================================
-- Ejecutar en Supabase SQL Editor
-- Primero elimina categorías existentes (si quieres empezar limpio)
-- DELETE FROM categories;

-- ============================================
-- CATEGORÍAS PRINCIPALES (sin parent_id)
-- ============================================

INSERT INTO categories (name, slug, icon, display_order) VALUES
  -- Comida y Bebidas
  ('Restaurantes', 'restaurantes', '🍽️', 1),
  ('Comida Rápida', 'comida-rapida', '🍔', 2),
  ('Taquerías', 'taquerias', '🌮', 3),
  ('Cafeterías', 'cafeterias', '☕', 4),
  ('Panaderías', 'panaderias', '🥖', 5),
  ('Bares y Cantinas', 'bares-cantinas', '🍺', 6),
  ('Cocinas Económicas', 'cocinas-economicas', '🍲', 7),
  ('Marisquerías', 'marisquerias', '🦐', 8),
  ('Pizzerías', 'pizzerias', '🍕', 9),
  ('Heladerías y Postres', 'heladerias-postres', '🍦', 10),

  -- Tiendas y Comercio
  ('Abarrotes y Tiendas', 'abarrotes-tiendas', '🏪', 11),
  ('Ropa y Moda', 'ropa-moda', '👗', 12),
  ('Zapaterías', 'zapaterias', '👟', 13),
  ('Farmacias', 'farmacias', '💊', 14),
  ('Ferreterías', 'ferreterias', '🔧', 15),
  ('Papelerías', 'papelerias', '📚', 16),
  ('Mueblerías', 'mueblerias', '🛋️', 17),
  ('Electrónica y Celulares', 'electronica-celulares', '📱', 18),
  ('Joyerías', 'joyerias', '💍', 19),

  -- Alimentos Frescos
  ('Carnicerías', 'carnicerias', '🥩', 20),
  ('Tortillerías', 'tortillerias', '🫓', 21),
  ('Fruterías y Verdulerías', 'fruterias-verdulerias', '🍎', 22),
  ('Cremería y Lácteos', 'cremeria-lacteos', '🧀', 23),
  ('Pollerías', 'pollerias', '🍗', 24),

  -- Salud y Belleza
  ('Estéticas y Barberías', 'esteticas-barberias', '✂️', 25),
  ('Clínicas y Consultorios', 'clinicas-consultorios', '🏥', 26),
  ('Dentistas', 'dentistas', '🦷', 27),
  ('Ópticas', 'opticas', '👓', 28),
  ('Spa y Masajes', 'spa-masajes', '💆', 29),
  ('Gimnasios', 'gimnasios', '💪', 30),

  -- Servicios
  ('Moto-mandados y Mensajería', 'motomandados-mensajeria', '🏍️', 31),
  ('Talleres Mecánicos', 'talleres-mecanicos', '🔧', 32),
  ('Refaccionarias', 'refaccionarias', '🚗', 33),
  ('Lavanderías', 'lavanderias', '🧺', 34),
  ('Veterinarias', 'veterinarias', '🐾', 35),
  ('Floristerías', 'floristerias', '🌸', 36),
  ('Cerrajerías', 'cerrajerias', '🔑', 37),
  ('Tintorerías', 'tintorerias', '👔', 38),

  -- Profesional
  ('Servicios Profesionales', 'servicios-profesionales', '💼', 39),
  ('Contadores y Abogados', 'contadores-abogados', '📋', 40),
  ('Fotografía y Video', 'fotografia-video', '📷', 41),
  ('Constructoras y Materiales', 'constructoras-materiales', '🏗️', 42),
  ('Imprentas y Diseño', 'imprentas-diseno', '🖨️', 43),

  -- Entretenimiento y Educación
  ('Hoteles y Hospedaje', 'hoteles-hospedaje', '🏨', 44),
  ('Eventos y Fiestas', 'eventos-fiestas', '🎉', 45),
  ('Escuelas y Cursos', 'escuelas-cursos', '🎓', 46),
  ('Deportes y Recreación', 'deportes-recreacion', '⚽', 47),

  -- Más Comida
  ('Alitas', 'alitas', '🍗', 48),
  ('Hamburguesas', 'hamburguesas', '🍔', 49),

  -- Viajes
  ('Agencias de Viajes', 'agencias-de-viajes', '✈️', 50),

  -- Otros
  ('Gasolineras', 'gasolineras', '⛽', 51),
  ('Funerarias', 'funerarias', '🕊️', 52),
  ('Otros', 'otros', '📦', 53),

  -- Belleza y Cuidado Personal (trending)
  ('Uñas y Nail Salon', 'unas-nail-salon', '💅', 54),
  ('Maquillaje Profesional', 'maquillaje-profesional', '💄', 55),
  ('Cejas y Pestañas', 'cejas-pestanas', '👁️', 56),
  ('Depilación y Láser', 'depilacion-laser', '✨', 57),
  ('Cuidado de la Piel', 'cuidado-piel', '🧴', 58),

  -- Entretenimiento y Fiestas
  ('Animadores de Fiestas', 'animadores-fiestas', '🤡', 59),
  ('Músicos y Grupos', 'musicos-grupos', '🎵', 60),
  ('DJs y Sonido', 'djs-sonido', '🎧', 61),
  ('Organizadores de Eventos', 'organizadores-eventos', '🎀', 62),
  ('Decoración de Fiestas', 'decoracion-fiestas', '🎈', 63),
  ('Renta de Mobiliario', 'renta-mobiliario', '🪑', 64),
  ('Payasos y Shows', 'payasos-shows', '🎪', 65),
  ('Mariachis y Bandas', 'mariachis-bandas', '🎺', 66),

  -- Salud y Bienestar
  ('Nutriólogos', 'nutriologos', '🥗', 67),
  ('Psicólogos', 'psicologos', '🧠', 68),
  ('Fisioterapia', 'fisioterapia', '🦴', 69),
  ('Yoga y Meditación', 'yoga-meditacion', '🧘', 70),

  -- Hogar y Servicios
  ('Plomeros', 'plomeros', '🚿', 71),
  ('Electricistas', 'electricistas', '⚡', 72),
  ('Pintores', 'pintores', '🎨', 73),
  ('Jardinería y Paisajismo', 'jardineria-paisajismo', '🌿', 74),
  ('Fumigación y Control de Plagas', 'fumigacion-plagas', '🐛', 75),
  ('Limpieza Profesional', 'limpieza-profesional', '🧹', 76),
  ('Mudanzas y Fletes', 'mudanzas-fletes', '🚚', 77),

  -- Digital y Tecnología
  ('Marketing Digital', 'marketing-digital', '📲', 78),
  ('Diseño Web y Apps', 'diseno-web-apps', '💻', 79),
  ('Reparación de Computadoras', 'reparacion-computadoras', '🖥️', 80),

  -- Comida (trending)
  ('Repostería y Pasteles', 'reposteria-pasteles', '🎂', 81),
  ('Comida Saludable', 'comida-saludable', '🥑', 82),
  ('Food Trucks', 'food-trucks', '🚐', 83),
  ('Snacks y Botanas', 'snacks-botanas', '🍿', 84),

  -- Mascotas
  ('Grooming y Estética Canina', 'grooming-estetica-canina', '🐩', 85),
  ('Tiendas de Mascotas', 'tiendas-mascotas', '🐕', 86),

  -- Automotriz
  ('Autolavados', 'autolavados', '🚿', 87),
  ('Grúas y Asistencia Vial', 'gruas-asistencia-vial', '🚨', 88),
  ('Llanterías', 'llanterias', '🛞', 89),

  -- Otros servicios
  ('Tatuajes y Piercings', 'tatuajes-piercings', '🎨', 90),
  ('Bienes Raíces', 'bienes-raices', '🏠', 91),
  ('Guarderías', 'guarderias', '👶', 92),
  ('Costureras y Sastrería', 'costureras-sastreria', '🧵', 93),

  -- Música
  ('Coros y Música Religiosa', 'coros-musica-religiosa', '🎤', 94),
  ('Solistas y Grupos Musicales', 'solistas-grupos-musicales', '🎸', 95)

ON CONFLICT (slug) DO NOTHING;
