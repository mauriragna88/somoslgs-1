-- ============================================
-- MIGRACIÓN 020: Analytics de Visitas por Negocio
-- ============================================
-- Tabla de eventos de visitas (permite agrupar por día/mes, referrers, dispositivos)

CREATE TABLE IF NOT EXISTS business_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  ip_hash TEXT NOT NULL,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para queries de analytics
CREATE INDEX idx_bv_business ON business_views(business_id);
CREATE INDEX idx_bv_biz_date ON business_views(business_id, created_at);

-- Contador rápido en businesses (evita COUNT en cada request)
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;

-- RLS
ALTER TABLE business_views ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede insertar (API routes)
-- Dueños pueden leer las vistas de sus negocios
CREATE POLICY "business_views_owner_read" ON business_views
  FOR SELECT USING (
    business_id IN (
      SELECT id FROM businesses WHERE owner_id = auth.uid()
    )
  );

-- Admins pueden leer todo
CREATE POLICY "business_views_admin_read" ON business_views
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
