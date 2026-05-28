-- Tabla de favoritos de usuarios
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_favorites (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, business_id)
);

-- Índices para queries rápidas
CREATE INDEX IF NOT EXISTS idx_user_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_business ON user_favorites(business_id);

-- RLS: cada usuario solo ve y gestiona sus propios favoritos
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can read own favorites"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users can insert own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete own favorites"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);
