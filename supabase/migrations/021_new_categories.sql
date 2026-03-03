-- ============================================
-- MIGRACIÓN 021: Nuevas categorías de negocio
-- Tendencias y servicios populares en Lagos de Moreno
-- ============================================

INSERT INTO categories (name, slug, icon, display_order) VALUES
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
  ('Coros y Música Religiosa', 'coros-musica-religiosa', '🎤', 94),
  ('Solistas y Grupos Musicales', 'solistas-grupos-musicales', '🎸', 95)

ON CONFLICT (slug) DO NOTHING;
