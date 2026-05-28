-- Asignar imágenes locales a los artículos del blog seeded
-- Ejecutar en Supabase SQL Editor

UPDATE blog_posts
SET featured_image_url = '/tourism/centro-historico.jpg'
WHERE slug = 'mejores-lugares-comer-lagos-de-moreno'
  AND featured_image_url IS NULL;

UPDATE blog_posts
SET featured_image_url = '/tourism/jardin-constituyentes.jpg'
WHERE slug = 'que-hacer-fin-de-semana-lagos-de-moreno'
  AND featured_image_url IS NULL;

UPDATE blog_posts
SET featured_image_url = '/tourism/teatro-rosas-moreno.jpg'
WHERE slug = 'como-hacer-crecer-tu-negocio-local'
  AND featured_image_url IS NULL;

UPDATE blog_posts
SET featured_image_url = '/tourism/callelagos1.jpg'
WHERE slug = 'por-que-comprar-negocios-locales'
  AND featured_image_url IS NULL;
