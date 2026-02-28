-- Marketplace: categorías, artículos y reportes
-- Ejecutar en Supabase SQL Editor

-- Categorías del marketplace (separadas de negocios)
CREATE TABLE marketplace_categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar(100) NOT NULL,
  icon varchar(10),
  slug varchar(100) NOT NULL UNIQUE,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Artículos del marketplace
CREATE TABLE marketplace_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title varchar(100) NOT NULL,
  description text,
  price decimal(10,2) NOT NULL DEFAULT 0,
  price_type varchar(20) NOT NULL DEFAULT 'fijo' CHECK (price_type IN ('fijo', 'negociable', 'gratis', 'intercambio')),
  condition varchar(20) NOT NULL DEFAULT 'usado' CHECK (condition IN ('nuevo', 'seminuevo', 'usado')),
  category_id uuid REFERENCES marketplace_categories(id),
  images text[] DEFAULT '{}',
  location varchar(200),
  whatsapp varchar(20) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'reserved', 'expired', 'removed')),
  is_featured boolean DEFAULT false,
  featured_until timestamptz,
  views integer DEFAULT 0,
  expires_at timestamptz DEFAULT (now() + interval '30 days'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reportes (para marketplace y futuros usos)
CREATE TABLE reports (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id uuid NOT NULL REFERENCES auth.users(id),
  item_type varchar(30) NOT NULL CHECK (item_type IN ('marketplace_listing', 'review', 'business')),
  item_id uuid NOT NULL,
  reason varchar(50) NOT NULL CHECK (reason IN ('spam', 'fraude', 'contenido_inapropiado', 'articulo_prohibido', 'otro')),
  details text,
  status varchar(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX idx_listings_seller ON marketplace_listings(seller_id);
CREATE INDEX idx_listings_category ON marketplace_listings(category_id);
CREATE INDEX idx_listings_status ON marketplace_listings(status);
CREATE INDEX idx_listings_featured ON marketplace_listings(is_featured, featured_until);
CREATE INDEX idx_listings_created ON marketplace_listings(created_at DESC);
CREATE INDEX idx_listings_price ON marketplace_listings(price);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_item ON reports(item_type, item_id);

-- RLS
ALTER TABLE marketplace_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policies: marketplace_categories (todos leen)
CREATE POLICY "categories_select" ON marketplace_categories FOR SELECT USING (true);

-- Policies: marketplace_listings
CREATE POLICY "listings_select_active" ON marketplace_listings FOR SELECT USING (status = 'active' OR seller_id = auth.uid());
CREATE POLICY "listings_insert" ON marketplace_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "listings_update_own" ON marketplace_listings FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "listings_delete_own" ON marketplace_listings FOR DELETE USING (auth.uid() = seller_id);

-- Policies: reports
CREATE POLICY "reports_insert" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_select_own" ON reports FOR SELECT USING (auth.uid() = reporter_id);

-- Categorías iniciales
INSERT INTO marketplace_categories (name, icon, slug, display_order) VALUES
  ('Electrónica', '📱', 'electronica', 1),
  ('Muebles', '🪑', 'muebles', 2),
  ('Ropa y Accesorios', '👕', 'ropa-accesorios', 3),
  ('Vehículos', '🚗', 'vehiculos', 4),
  ('Hogar y Jardín', '🏡', 'hogar-jardin', 5),
  ('Deportes', '⚽', 'deportes', 6),
  ('Herramientas', '🔧', 'herramientas', 7),
  ('Bebés y Niños', '👶', 'bebes-ninos', 8),
  ('Mascotas', '🐾', 'mascotas', 9),
  ('Música e Instrumentos', '🎸', 'musica-instrumentos', 10),
  ('Videojuegos', '🎮', 'videojuegos', 11),
  ('Libros', '📚', 'libros', 12),
  ('Materiales de Construcción', '🧱', 'construccion', 13),
  ('Comida y Bebida', '🍕', 'comida-bebida', 14),
  ('Otro', '📦', 'otro', 99);
