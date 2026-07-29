-- ════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Páginas locales con intención SEO
-- ════════════════════════════════════════════════════════════════
--
-- Tabla para gestionar páginas de búsqueda local:
-- "Ferreterías en Lagos de Moreno", "Restaurantes con entrega a domicilio", etc.
-- Cada página apunta a un grupo de businesses por categoría/zona y mide clics.
--

CREATE TABLE IF NOT EXISTS local_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(220) UNIQUE NOT NULL,
  title VARCHAR(200) NOT NULL,
  h1 VARCHAR(200) NOT NULL,
  meta_description VARCHAR(300) NOT NULL,
  intro TEXT,
  -- Filtros que se aplican en la query (jsonb)
  category_slug VARCHAR(100),
  zone_filter VARCHAR(100),
  tags_filter TEXT[],
  -- Contenido adicional (markdown)
  body_markdown TEXT,
  featured_image_url TEXT,
  -- Estado
  status VARCHAR(20) DEFAULT 'published',
  -- Métricas
  view_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_local_pages_slug ON local_pages(slug);
CREATE INDEX IF NOT EXISTS idx_local_pages_status ON local_pages(status);

ALTER TABLE local_pages ENABLE ROW LEVEL SECURITY;

-- Public can read published pages
DROP POLICY IF EXISTS "Public read local pages" ON local_pages;
CREATE POLICY "Public read local pages" ON local_pages
  FOR SELECT USING (status = 'published');

-- Admin full access
DROP POLICY IF EXISTS "Admin full access local pages" ON local_pages;
CREATE POLICY "Admin full access local pages" ON local_pages
  FOR ALL USING (true);

-- Métricas de clics desde páginas locales a perfiles de negocios
CREATE TABLE IF NOT EXISTS local_page_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  local_page_id UUID NOT NULL REFERENCES local_pages(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  click_type VARCHAR(50) DEFAULT 'profile_view',
  -- 'profile_view' | 'whatsapp' | 'phone' | 'maps'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lpc_local_page ON local_page_clicks(local_page_id);
CREATE INDEX IF NOT EXISTS idx_lpc_business ON local_page_clicks(business_id);
CREATE INDEX IF NOT EXISTS idx_lpc_created ON local_page_clicks(created_at DESC);

ALTER TABLE local_page_clicks ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede crear clicks
DROP POLICY IF EXISTS "Anyone can log clicks" ON local_page_clicks;
CREATE POLICY "Anyone can log clicks" ON local_page_clicks
  FOR INSERT WITH CHECK (true);

-- Admin puede leer las métricas
DROP POLICY IF EXISTS "Admin read clicks" ON local_page_clicks;
CREATE POLICY "Admin read clicks" ON local_page_clicks
  FOR SELECT USING (true);

-- ════════════════════════════════════════════════════════════════
-- Seed: Páginas locales iniciales con intención SEO
-- ════════════════════════════════════════════════════════════════

INSERT INTO local_pages (slug, title, h1, meta_description, intro, category_slug, body_markdown, status)
VALUES
  (
    'ferreterias-en-lagos-de-moreno',
    'Ferreterias en Lagos de Moreno — directorio completo',
    'Ferreterias en Lagos de Moreno',
    'Encuentra ferreterias en Lagos de Moreno. Direcciones, telefonos, WhatsApp y horarios. Compara precios y encuentra lo que necesitas cerca de ti.',
    'Lagos de Moreno cuenta con varias ferreterias que ofrecen desde materiales de construccion hasta herramientas y plomeria. Aqui encontraras las opciones disponibles con su informacion de contacto actualizada.',
    'ferreterias',
    '## Que encontrar en una ferreteria en Lagos de Moreno\n\nLas ferreterias locales ofrecen:\n\n- Materiales de construccion (cemento, varilla, block)\n- Herramientas manuales y electricas\n- Plomeria y electricidad\n- Pinturas y accesorios\n- Articulos de jardineria\n\n## Como elegir la mejor ferreteria\n\n1. Cercania a tu domicilio o obra\n2. Variedad de productos\n3. Atencion y asesoria\n4. Precios competitivos\n\n## Zonas principales\n\nLas ferreterias se concentran en zonas como Centro, La Loma y la salida a Guadalajara. Revisa los perfiles individuales para ver direccion exacta y horario de atencion.',
    'published'
  ),
  (
    'restaurantes-con-entrega-a-domicilio',
    'Restaurantes con entrega a domicilio en Lagos de Moreno',
    'Restaurantes con entrega a domicilio',
    'Restaurantes en Lagos de Moreno con entrega a domicilio. Pide por WhatsApp o plataforma. Comida rapida, tacos, pizza, comida mexicana y mas.',
    'Si prefieres comer en casa, estos restaurantes en Lagos de Moreno ofrecen entrega a domicilio. Pide directo por WhatsApp y recibelo en tu puerta.',
    'restaurantes',
    '## Restaurantes con servicio a domicilio\n\nEstos restaurantes cuentan con servicio de entrega a domicilio en Lagos de Moreno. La mayoria acepta pedidos por WhatsApp o llamada telefonica.\n\n## Tipos de comida disponibles\n\n- Tacos y antojitos mexicanos\n- Pizza\n- Comida china\n- Hamburguesas\n- Pollo rostizado\n- Comida corrida\n\n## Como pedir\n\n1. Busca el restaurante en SomosLagos\n2. Mira su menu (si tienen plan Vende en Linea)\n3. Llama o manda WhatsApp\n4. Indica tu direccion y horario deseado',
    'published'
  ),
  (
    'esteticas-que-atienden-por-cita',
    'Esteticas que atienden por cita en Lagos de Moreno',
    'Esteticas que atienden por cita',
    'Salones de belleza y esteticas en Lagos de Moreno que atienden por cita previa. Manicure, pedicure, cortes, tintes y tratamientos faciales.',
    'Agenda tu cita en cualquiera de estas esteticas de Lagos de Moreno. Servicio personalizado sin esperas.',
    'esteticas',
    '## Ventajas de atenderte por cita\n\n- Sin esperas\n- Horario personalizado\n- Atencion dedicada\n- Mejor planeacion de tu tiempo\n\n## Servicios comunes\n\n- Corte y peinado\n- Tinte y coloracion\n- Manicure y pedicure\n- Tratamientos faciales\n- Depilacion\n- Maquillaje profesional',
    'published'
  ),
  (
    'veterinarias-abiertas-los-domingos',
    'Veterinarias abiertas los domingos en Lagos de Moreno',
    'Veterinarias abiertas los domingos',
    'Encuentra veterinarias en Lagos de Moreno que atienden los domingos. Urgencias, consultas, vacunas y estetica canina.',
    'Las emergencias no esperan. Estas veterinarias en Lagos de Moreno ofrecen atencion los domingos para tu mascota.',
    'veterinarias',
    '## Cuando tu mascota necesita atencion urgente\n\nLos domingos son dias complicados para encontrar atencion veterinaria. Aqui reunimos las opciones disponibles en Lagos de Moreno.\n\n## Servicios que ofrecen\n\n- Consulta general\n- Vacunacion\n- Urgencias\n- Estetica canina\n- Cirugia programada\n- Venta de alimentos',
    'published'
  ),
  (
    'lugares-para-desayunar',
    'Lugares para desayunar en Lagos de Moreno',
    'Lugares para desayunar en Lagos de Moreno',
    'Descubre los mejores lugares para desayunar en Lagos de Moreno. Restaurantes, cafeterias y fondas con opciones para todos los gustos.',
    'Lagos de Moreno tiene una rica tradicion desayunadora. Desde fondas economicas hasta restaurantes familiares, aqui encontraras opciones para empezar bien el dia.',
    'restaurantes',
    '## Tradicion desayunadora de Lagos\n\nEl desayuno es una comida importante en la cultura mexicana y Lagos de Moreno no es la excepcion.\n\n## Que puedes encontrar\n\n- Chilaquiles con huevo\n- Enchiladas mineras\n- Tamales\n- Atole y tamales\n- Hot cakes\n- Desayunos buffet\n- Comida corrida matutina',
    'published'
  ),
  (
    'salones-para-eventos',
    'Salones para eventos en Lagos de Moreno',
    'Salones para eventos en Lagos de Moreno',
    'Salones de fiestas, jardines y espacios para eventos sociales y corporativos en Lagos de Moreno. Bodas, XV anos, bautismos y reuniones.',
    'Encuentra el espacio perfecto para tu evento. Lagos de Moreno tiene opciones para todos los presupuestos y tamaños.',
    'salones-eventos',
    '## Tipos de espacios disponibles\n\n- Salones de fiestas cerrados\n- Jardines para eventos al aire libre\n- Haciendas\n- Centros sociales\n- Terrazas\n\n## Eventos que se pueden realizar\n\n- Bodas\n- XV anos\n- Bautismos\n- Primeras comuniones\n- Cumpleanos\n- Eventos corporativos\n- Graduaciones',
    'published'
  ),
  (
    'escuelas-particulares',
    'Escuelas particulares en Lagos de Moreno',
    'Escuelas particulares en Lagos de Moreno',
    'Directorio de escuelas particulares en Lagos de Moreno: preescolar, primaria, secundaria, bachillerato y universidades.',
    'Encuentra opciones de educacion privada en Lagos de Moreno. Desde preescolar hasta universidad.',
    'escuelas',
    '## Niveles educativos disponibles\n\n- Preescolar (kinder)\n- Primaria\n- Secundaria\n- Bachillerato / preparatoria\n- Universidad / licenciaturas\n- Idiomas\n\n## Como elegir la mejor opcion\n\n1. Ubicacion cercana a tu hogar\n2. Plan de estudios y validez oficial\n3. Costos y becas\n4. Infraestructura\n5. Actividades extracurriculares',
    'published'
  ),
  (
    'proveedores-para-empresas',
    'Proveedores para empresas en Lagos de Moreno',
    'Proveedores para empresas en Lagos de Moreno',
    'Encuentra proveedores locales para tu negocio en Lagos de Moreno: limpieza, mantenimiento, tecnologia, papeleria y servicios profesionales.',
    'Apoya lo local y encuentra proveedores de confianza para tu empresa o negocio en Lagos de Moreno.',
    'proveedores',
    '## Categorias de proveedores\n\n- Limpieza y mantenimiento\n- Tecnologia y computo\n- Papeleria y oficina\n- Servicios contables y legales\n- Publicidad y marketing\n- Imprenta\n- Refacciones y mantenimiento vehicular',
    'published'
  ),
  (
    'que-hacer-durante-la-feria-de-lagos',
    'Que hacer durante la Feria de Lagos de Moreno',
    'Que hacer durante la Feria de Lagos',
    'La Feria de Lagos de Moreno es una de las mas importantes de Jalisco. Conoce los eventos, gastronomia y atracciones de este ano.',
    'La Feria Nacional de Lagos de Moreno es una celebracion tradicional con eventos culturales, deportivos, gastronomicos y musicales.',
    NULL,
    '## Historia de la Feria\n\nLa Feria de Lagos de Moreno se celebra anualmente y es una de las festividades mas importantes del estado de Jalisco.\n\n## Eventos principales\n\n- Palenque de gallos\n- Teatro del pueblo\n- Exposicion ganadera\n- Muestras gastronomicas\n- Eventos culturales\n- Juegos mecanicos\n- Fiestas familiares\n\n## Gastronomia\n\nDurante la feria puedes encontrar:\n- Tacos\n- Tortas\n- Elotes\n- Churros\n- Bebidas tradicionales\n\n## Como llegar\n\nLa feria se realiza en el centro de Lagos. Hay transporte publico y opciones de estacionamiento.',
    'published'
  ),
  (
    'restaurantes-cerca-del-centro',
    'Restaurantes cerca del centro de Lagos de Moreno',
    'Restaurantes cerca del centro de Lagos de Moreno',
    'Encuentra restaurantes a pocos pasos del centro de Lagos de Moreno. Comida mexicana, internacional, cafeterias y mas.',
    'Si estas en el centro de Lagos, estos restaurantes estan a poca distancia caminando.',
    'restaurantes',
    '## Ubicacion privilegiada\n\nLos restaurantes cerca del centro son ideales para:\n\n- Almuerzo de trabajo\n- Cena romantica\n- Reunion familiar\n- Visita turistica\n\n## Tipos de cocina\n\n- Mexicana tradicional\n- Internacional\n- Italiana\n- Asiatica\n- Comida rapida\n- Cafeterias y desayunos',
    'published'
  )
ON CONFLICT (slug) DO NOTHING;

-- Verificación
-- SELECT COUNT(*) FROM local_pages WHERE status = 'published';
