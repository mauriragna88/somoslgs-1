/* Columnas de `businesses` que pueden leerse con la llave publica (anon/authenticated).
   Las columnas privadas (datos bancarios, llaves de pasarela, POS y datos de reclamacion)
   solo se leen en el servidor con el service role. Ver scripts/security/04_revoke_private_columns.sql */
export const PUBLIC_BUSINESS_COLUMNS = [
  'id', 'owner_id', 'name', 'slug', 'category_id', 'description', 'address', 'neighborhood', 'city', 'state',
  'postal_code', 'phone', 'whatsapp', 'email', 'website', 'latitude', 'longitude', 'logo_url', 'cover_url',
  'subscription_tier', 'subscription_status', 'subscription_started_at', 'subscription_expires_at',
  'business_hours', 'rating', 'total_reviews', 'total_orders', 'is_active', 'is_featured', 'accepts_delivery',
  'accepts_online_payment', 'created_at', 'updated_at', 'payment_mode', 'is_courtesy', 'mercadopago_public_key',
  'active_payment_gateways', 'business_type', 'facebook_url', 'instagram_url', 'tiktok_url', 'total_views',
  'offers_delivery', 'delivery_fee', 'pos_type', 'is_claimed', 'claimed_at', 'claim_status',
].join(', ')

export const PRIVATE_BUSINESS_COLUMNS = [
  'bank_name', 'bank_account_holder', 'bank_account_number', 'bank_clabe',
  'conekta_private_key', 'mercadopago_access_token', 'pos_config',
  'claim_phone', 'claim_email', 'claimed_by',
] as const
