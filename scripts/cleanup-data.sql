-- ╔══════════════════════════════════════════════════════════════╗
-- ║  SOMOSLAGOS — LIMPIEZA DE DATOS (Q-004)                        ║
-- ║  Ejecutar en Supabase Dashboard → SQL Editor                   ║
-- ║  SOLO LECTURA primero (correr SELECTs de preview)               ║
-- ║  Luego ejecutar los UPDATEs                                     ║
-- ╚══════════════════════════════════════════════════════════════╝
--
-- IMPORTANTE: Hacer backup antes de ejecutar.
-- Ejecutar cada sección por separado y verificar el resultado.
--
-- ════════════════════════════════════════════════════════════════
-- SECCIÓN 1: UNIFICAR ZONAS — "Zona Centro" → "Centro"
-- ════════════════════════════════════════════════════════════════

-- PREVIEW: Negocios en "Zona Centro"
-- SELECT id, name, neighborhood FROM businesses WHERE neighborhood ILIKE '%zona centro%';

-- EJECUTAR: Unificar "Zona Centro" a "Centro"
UPDATE businesses
SET neighborhood = 'Centro',
    updated_at = NOW()
WHERE neighborhood ILIKE '%zona centro%';

-- ════════════════════════════════════════════════════════════════
-- SECCIÓN 2: CORREGIR DIRECCIONES GENÉRICAS — "Centro Centro"
-- ════════════════════════════════════════════════════════════════

-- PREVIEW: Negocios con "Centro Centro" u otras direcciones duplicadas
-- SELECT id, name, address, neighborhood FROM businesses WHERE address ILIKE '%centro centro%' OR address ILIKE '%centro, centro%';

-- EJECUTAR: Limpiar "Centro Centro" — reemplazar por solo "Centro"
UPDATE businesses
SET address = REGEXP_REPLACE(address, 'centro\s*,?\s*centro', 'Centro', 'i'),
    updated_at = NOW()
WHERE address ILIKE '%centro centro%';

-- ════════════════════════════════════════════════════════════════
-- SECCIÓN 3: UNIFICAR CATEGORÍAS DUPLICADAS
-- ════════════════════════════════════════════════════════════════
--
-- Duplicate pairs detectados:
--   1. "Motomandados" vs "Moto-mandados y Mensajería"
--   2. "Uñas y Belleza" vs "Uñas y Nail Salon"
--   3. "Decoraciones y Fiestas" vs "Decoración de Fiestas"
--   4. "Servicios Profesionales" vs "Profesionales"
--
-- Estrategia:
--   a) Reasignar todos los negocios de la categoría duplicada a la categoría canónica
--   b) Marcar la categoría duplicada como inactiva (delete o marcar parent_id)
--   c) Mantener el nombre canónico más descriptivo

-- PREVIEW: Verificar categorías duplicadas
-- SELECT id, name, slug FROM categories WHERE name ILIKE '%motomandado%' OR name ILIKE '%moto-mandado%';
-- SELECT id, name, slug FROM categories WHERE name ILIKE '%uña%' OR name ILIKE '%nail%';
-- SELECT id, name, slug FROM categories WHERE name ILIKE '%decoraci%' AND name ILIKE '%fiesta%';
-- SELECT id, name, slug FROM categories WHERE name ILIKE '%profesional%';

-- 3.1 — Motomandados: mantener "Motomandados", mover negocios de "Moto-mandados y Mensajería"
UPDATE businesses
SET category_id = (SELECT id FROM categories WHERE name ILIKE '%motomandados%' AND name NOT ILIKE '%mensajeria%' LIMIT 1),
    updated_at = NOW()
WHERE category_id = (SELECT id FROM categories WHERE name ILIKE '%moto-mandado%' OR name ILIKE '%mensajeria%' LIMIT 1);

-- Eliminar o desactivar la categoría duplicada
UPDATE categories SET parent_id = '00000000-0000-0000-0000-000000000000'
WHERE name ILIKE '%moto-mandado%' OR name ILIKE '%mensajeria%';

-- 3.2 — Uñas: mantener "Uñas y Belleza", mover de "Uñas y Nail Salon"
UPDATE businesses
SET category_id = (SELECT id FROM categories WHERE name ILIKE '%uña% y belleza%' LIMIT 1),
    updated_at = NOW()
WHERE category_id = (SELECT id FROM categories WHERE name ILIKE '%uña% nail%' OR name ILIKE '%nail salon%' LIMIT 1);

UPDATE categories SET parent_id = '00000000-0000-0000-0000-000000000000'
WHERE name ILIKE '%uña% nail%' OR name ILIKE '%nail salon%';

-- 3.3 — Fiestas: mantener "Decoración de Fiestas", mover de "Decoraciones y Fiestas"
UPDATE businesses
SET category_id = (SELECT id FROM categories WHERE name ILIKE '%decoración% de fiestas%' LIMIT 1),
    updated_at = NOW()
WHERE category_id = (SELECT id FROM categories WHERE name ILIKE '%decoraciones% y fiestas%' LIMIT 1);

UPDATE categories SET parent_id = '00000000-0000-0000-0000-000000000000'
WHERE name ILIKE '%decoraciones% y fiestas%';

-- 3.4 — Profesionales: mantener "Servicios Profesionales", mover de "Profesionales"
UPDATE businesses
SET category_id = (SELECT id FROM categories WHERE name ILIKE '%servicios profesionales%' LIMIT 1),
    updated_at = NOW()
WHERE category_id = (SELECT id FROM categories WHERE name ILIKE '%profesionales%' AND name NOT ILIKE '%servicios%' LIMIT 1);

UPDATE categories SET parent_id = '00000000-0000-0000-0000-000000000000'
WHERE name ILIKE '%profesionales%' AND name NOT ILIKE '%servicios%';

-- ════════════════════════════════════════════════════════════════
-- SECCIÓN 4: REVISAR TEATRO OCAMPO Y TEATRO ROSAS MORENO
-- ════════════════════════════════════════════════════════════════
--
-- Lagos de Moreno tiene el Teatro Rosas Moreno (histórico, correcto).
-- "Teatro Ocampo" puede ser un error — verificar si existe.
--
-- PREVIEW:
-- SELECT id, name, address, neighborhood FROM businesses WHERE name ILIKE '%teatro%';
-- SELECT id, name, address FROM businesses WHERE name ILIKE '%ocampo%';

-- Si "Teatro Ocampo" es incorrecto, renombrarlo:
-- UPDATE businesses SET name = 'Teatro Rosas Moreno', updated_at = NOW()
-- WHERE name ILIKE '%teatro ocampo%';

-- ════════════════════════════════════════════════════════════════
-- SECCIÓN 5: MARCAR NEGOCIOS INACTIVOS
-- ════════════════════════════════════════════════════════════════
--
-- Criterios para marcar como inactivo:
-- - Negocios sin teléfono Y sin WhatsApp
-- - Negocios que son claramente duplicados (mismo nombre, misma dirección)
--
-- PREVIEW: Negocios sin contacto
-- SELECT id, name, phone, whatsapp FROM businesses WHERE (phone IS NULL OR phone = '') AND (whatsapp IS NULL OR whatsapp = '');

-- EJECUTAR: Marcar inactivos los que no tienen contacto
UPDATE businesses
SET is_active = false,
    updated_at = NOW()
WHERE (phone IS NULL OR phone = '' OR phone = 'null')
  AND (whatsapp IS NULL OR whatsapp = '' OR whatsapp = 'null')
  AND is_active = true;

-- PREVIEW: Duplicados por nombre
-- SELECT name, COUNT(*) as cnt FROM businesses GROUP BY name HAVING COUNT(*) > 1;

-- EJECUTAR: Desactivar duplicados (mantener el más reciente)
UPDATE businesses b1
SET is_active = false, updated_at = NOW()
WHERE b1.is_active = true
  AND EXISTS (
    SELECT 1 FROM businesses b2
    WHERE b2.name = b1.name
      AND b2.created_at > b1.created_at
      AND b2.is_active = true
  );

-- ════════════════════════════════════════════════════════════════
-- SECCIÓN 6: CORREGIR NOMBRES INCOMPLETOS O MAL ESCRITOS
-- ════════════════════════════════════════════════════════════════
--
-- Revisar manualmente:
-- SELECT id, name FROM businesses WHERE LENGTH(name) < 5 OR name ~ '^\s' OR name ~ '\s$';
--
-- Ejemplos comunes a corregir (ejecutar solo si apply):
-- UPDATE businesses SET name = TRIM(name), updated_at = NOW() WHERE name ~ '^\s|\s$';
-- UPDATE businesses SET name = INITCAP(name), updated_at = NOW() WHERE name = LOWER(name);

-- ════════════════════════════════════════════════════════════════
-- SECCIÓN 7: CREAR CATEGORÍA "OTROS SERVICIOS" SI NO EXISTE
-- ════════════════════════════════════════════════════════════════

INSERT INTO categories (name, slug, icon, display_order)
SELECT 'Otros Servicios', 'otros-servicios', '📋', 999
WHERE NOT EXISTS (
  SELECT 1 FROM categories WHERE slug = 'otros-servicios'
);

-- ════════════════════════════════════════════════════════════════
-- SECCIÓN 8: VERIFICACIÓN POST-LIMPIEZA
-- ════════════════════════════════════════════════════════════════

-- Total negocios activos
-- SELECT COUNT(*) FROM businesses WHERE is_active = true;

-- Total categorías con al menos 2 negocios
-- SELECT COUNT(DISTINCT c.id) FROM categories c
--   JOIN businesses b ON b.category_id = c.id
--   WHERE b.is_active = true AND c.parent_id IS NULL
--   GROUP BY c.id HAVING COUNT(b.id) >= 2;

-- Zonas únicas
-- SELECT DISTINCT neighborhood FROM businesses WHERE is_active = true ORDER BY neighborhood;

-- ════════════════════════════════════════════════════════════════
-- FIN DEL SCRIPT — Ejecutar cada sección por separado
-- ════════════════════════════════════════════════════════════════
