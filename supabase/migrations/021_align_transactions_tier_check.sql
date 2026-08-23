-- =============================================
-- Migración: Alinear CHECKs de transactions con el frontend
-- =============================================
-- El frontend (tras migration 013_rename_tiers y el sistema de pagos) usa:
--   subscription_tier: gratis, emprendedor, pro, avanzado, chatbot
--   payment_method:    transfer, mercadopago, stripe, conekta
-- Pero la tabla transactions quedó con el CHECK del esquema antiguo:
--   subscription_tier: basico, productos, ventas, premium
--   payment_method:    transfer, mercadopago, stripe
-- Esto hace que CUALQUIER pago nuevo con pro/avanzado (o conekta) FALLE al
-- insertar en transactions por violación de CHECK. Esta migración lo corrige.

-- 1. Alinear subscription_tier con el frontend
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_subscription_tier_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_subscription_tier_check
  CHECK (subscription_tier IN ('gratis', 'emprendedor', 'pro', 'avanzado', 'chatbot'));

-- 2. Alinear payment_method (agregar conekta)
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_payment_method_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_payment_method_check
  CHECK (payment_method IN ('transfer', 'mercadopago', 'stripe', 'conekta'));

-- 3. Renombrar datos existentes que aún tengan el formato viejo
UPDATE transactions SET subscription_tier = 'gratis'   WHERE subscription_tier = 'basico';
UPDATE transactions SET subscription_tier = 'pro'      WHERE subscription_tier IN ('ventas', 'delivery');
UPDATE transactions SET subscription_tier = 'avanzado' WHERE subscription_tier = 'premium';

-- =============================================
-- Verificación
-- =============================================
SELECT 'Migration: transactions CHECKs aligned with frontend' AS status;
