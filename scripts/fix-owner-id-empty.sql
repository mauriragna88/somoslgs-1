-- ════════════════════════════════════════════════════════════════
-- FIX: Limpiar owner_id corruptos antes de marcar como claimed
-- ════════════════════════════════════════════════════════════════
--
-- Algunas filas tienen owner_id = '' (string vacío) en una columna UUID.
-- Postgres rechaza 'WHERE owner_id IS NOT NULL AND owner_id != ''' con
-- error 22P02 invalid input syntax for type uuid.
--
-- Solución: normalizar esos rows antes del UPDATE.
--

-- 1. Buscar el UUID zero que sí es válido
DO $$
BEGIN
  -- Solo si hay rows con owner_id = ''
  IF EXISTS (SELECT 1 FROM businesses WHERE owner_id::text = '') THEN
    -- Convertir '' a NULL (UUID no acepta string vacío)
    UPDATE businesses
    SET owner_id = NULL
    WHERE owner_id::text = '';
    
    RAISE NOTICE 'Filas con owner_id vacío convertidas a NULL: %',
      (SELECT COUNT(*) FROM businesses WHERE owner_id IS NULL);
  END IF;
END $$;

-- 2. Ahora sí: marcar como claimed solo si owner_id es un UUID válido
UPDATE businesses
SET is_claimed = true,
    claim_status = 'claimed',
    claimed_by = owner_id,
    claimed_at = COALESCE(created_at, NOW())
WHERE owner_id IS NOT NULL;

-- Verificación
-- SELECT COUNT(*) AS claimed FROM businesses WHERE is_claimed = true;
-- SELECT COUNT(*) AS unclaimed FROM businesses WHERE is_claimed = false OR is_claimed IS NULL;
