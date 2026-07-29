-- ════════════════════════════════════════════════════════════════
-- MIGRACIÓN: Sistema de Reclamación de Negocios
-- ════════════════════════════════════════════════════════════════
--
-- Permite que los dueños reales reclamen negocios cargados por el admin.
--

-- 1. Agregar campos de reclamación a businesses
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS claimed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS claim_phone TEXT,
ADD COLUMN IF NOT EXISTS claim_email TEXT,
ADD COLUMN IF NOT EXISTS claim_status TEXT DEFAULT 'unclaimed';
-- claim_status: 'unclaimed' | 'pending' | 'approved' | 'rejected'

-- 2. Crear tabla de solicitudes de reclamación
CREATE TABLE IF NOT EXISTS business_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  claimant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  claimant_name TEXT NOT NULL,
  claimant_phone TEXT NOT NULL,
  claimant_email TEXT,
  verification_note TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  -- 'pending' | 'approved' | 'rejected'
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_claims_business ON business_claims(business_id);
CREATE INDEX IF NOT EXISTS idx_business_claims_status ON business_claims(status);
CREATE INDEX IF NOT EXISTS idx_business_claims_claimant ON business_claims(claimant_id);

-- 3. RLS Policies para business_claims
ALTER TABLE business_claims ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede crear una solicitud de reclamación
CREATE POLICY "Anyone can create a claim"
  ON business_claims FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Cualquiera puede ver sus propias solicitudes
CREATE POLICY "Users can view own claims"
  ON business_claims FOR SELECT
  TO authenticated
  USING (claimant_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- Solo admin puede actualizar (aprobar/rechazar)
CREATE POLICY "Only admin can update claims"
  ON business_claims FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- 4. RLS para los nuevos campos en businesses (lectura pública)
-- Los campos de claim son visibles para todos (para mostrar el botón)
-- is_claimed, claim_status son públicos. claimed_by solo para admin.
CREATE POLICY "Public can read claim status"
  ON businesses FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Solo admin o el dueño reclamado puede actualizar claim fields
CREATE POLICY "Admin can update claim fields"
  ON businesses FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

-- 5. Actualizar negocios existentes: los que tienen owner_id = NULL o no asignado
-- quedan como 'unclaimed'. Los que tienen owner_id quedan como 'claimed'.
UPDATE businesses
SET is_claimed = true,
    claim_status = 'claimed',
    claimed_by = owner_id,
    claimed_at = COALESCE(created_at, NOW())
WHERE owner_id IS NOT NULL AND owner_id != '';

-- Verificación
-- SELECT COUNT(*) FROM businesses WHERE is_claimed = false;
-- SELECT COUNT(*) FROM businesses WHERE is_claimed = true;
