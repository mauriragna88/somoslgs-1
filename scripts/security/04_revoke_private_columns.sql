-- FASE 2: columnas privadas de businesses ya no son legibles con la llave publica.
-- Un REVOKE por columna no basta si el rol tiene SELECT a nivel de tabla: se revoca la tabla
-- completa y se concede SELECT solo sobre las columnas publicas (lib/business-columns.ts).
-- Solo el service role (servidor) lee: bank_*, conekta_private_key, mercadopago_access_token,
-- pos_config, claim_phone, claim_email, claimed_by.
-- Aplicar DESPUES de desplegar el codigo que ya no pide esas columnas con el cliente publico.
revoke select on public.businesses from anon, authenticated;
grant select (id, owner_id, name, slug, category_id, description, address, neighborhood, city, state, postal_code, phone, whatsapp, email, website, latitude, longitude, logo_url, cover_url, subscription_tier, subscription_status, subscription_started_at, subscription_expires_at, business_hours, rating, total_reviews, total_orders, is_active, is_featured, accepts_delivery, accepts_online_payment, created_at, updated_at, payment_mode, is_courtesy, mercadopago_public_key, active_payment_gateways, business_type, facebook_url, instagram_url, tiktok_url, total_views, offers_delivery, delivery_fee, pos_type, is_claimed, claimed_at, claim_status)
  on public.businesses to anon, authenticated;

-- ROLLBACK (si algo se rompe):
-- grant select on public.businesses to anon, authenticated;
