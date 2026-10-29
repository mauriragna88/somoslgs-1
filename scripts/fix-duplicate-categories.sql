-- ════════════════════════════════════════════════════════════════
-- FIX: Desactivar categorías duplicadas (sin violar FK)
-- ════════════════════════════════════════════════════════════════
--
-- El approach anterior intentaba cambiar parent_id a un UUID zero
-- que no existe en categories → ERROR 23503 FK constraint.
--
-- Nueva estrategia: renombrar + slug inerte + display_order negativo.
-- Esto oculta las categorías duplicadas sin violar FK constraints.
-- Son reversibles (solo cambias 3 campos).
--

-- 3.1 — Motomandados: renombrar "Moto-mandados y Mensajería"
UPDATE categories
SET name = '[OCULTA] Moto-mandados y Mensajería',
    slug = '__hidden__moto-mandados-y-mensajeria-' || id::text,
    display_order = -9999
WHERE name ILIKE '%moto-mandado%' OR name ILIKE '%mensajeria%';

-- 3.2 — Uñas: renombrar "Uñas y Nail Salon"
UPDATE categories
SET name = '[OCULTA] Uñas y Nail Salon',
    slug = '__hidden__unas-y-nail-salon-' || id::text,
    display_order = -9999
WHERE name ILIKE '%uña% nail%' OR name ILIKE '%nail salon%';

-- 3.3 — Fiestas: renombrar "Decoraciones y Fiestas"
UPDATE categories
SET name = '[OCULTA] Decoraciones y Fiestas',
    slug = '__hidden__decoraciones-y-fiestas-' || id::text,
    display_order = -9999
WHERE name ILIKE '%decoraciones% y fiestas%';

-- 3.4 — Profesionales: renombrar "Profesionales"
UPDATE categories
SET name = '[OCULTA] Profesionales',
    slug = '__hidden__profesionales-' || id::text,
    display_order = -9999
WHERE name ILIKE '%profesionales%' AND name NOT ILIKE '%servicios%';

-- Verificación: listar categorías ocultas
-- SELECT name, slug, display_order FROM categories WHERE name LIKE '[OCULTA]%';
