/*
  Run this in your Supabase SQL Editor.
  DO NOT run via CLI or migrations — execute manually in the dashboard.

  URL: https://app.supabase.com/project/<your-project>/sql/new
*/

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  month_code text not null,
  dates text not null,
  description text not null,
  category text not null,
  category_color text not null,
  image_src text not null,
  image_alt text not null,
  is_upcoming boolean default false,
  col_span text default 'md:col-span-1',
  row_span text default 'md:row-span-1',
  display_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table events enable row level security;

create policy "anyone can read active events" on events
  for select using (is_active = true);

create policy "service role full access" on events
  for all using (true);

-- Seed existing events
insert into events (name, month_code, dates, description, category, category_color, image_src, image_alt, is_upcoming, col_span, row_span, display_order) values
  ('Feria de Lagos', 'AGO', '1 – 15 Agosto', 'La fiesta más grande del año. Charrería, música en vivo, artesanías, gastronomía y el desfile más colorido del Bajío. Un evento que marca a Lagos para siempre.', 'Tradición', '#FF6B35', '/tourism/danza-matachines.jpg', 'Feria de Lagos de Moreno — Danza de Matachines', true, 'md:col-span-1', 'md:row-span-2', 1),
  ('Día de Muertos', 'NOV', '1 – 2 Nov', 'Ofrendas, cempasúchil y danzas que honran a quienes ya no están. El centro histórico se transforma en un altar vivo.', 'Tradición', '#D946EF', '/tourism/dia-muertos.jpg', 'Día de Muertos en Lagos de Moreno', false, 'md:col-span-1', 'md:row-span-1', 2),
  ('Aniversario de la Ciudad', 'MAR', '21 Marzo', 'Lagos celebra su fundación en 1563 con eventos culturales, conciertos y una ciudad que se viste de orgullo.', 'Cultural', '#F5B942', '/tourism/centro-historico.jpg', 'Centro histórico de Lagos de Moreno', false, 'md:col-span-1', 'md:row-span-1', 3),
  ('Calles Decembrinas', 'DIC', 'Todo Diciembre', 'En diciembre Lagos se transforma. Luces, nacimientos, ponche y buñuelos llenan cada rincón del centro histórico.', 'Familiar', '#22B8CF', '/tourism/callelagos1.jpg', 'Callejones de Lagos en diciembre', false, 'md:col-span-2', 'md:row-span-1', 4),
  ('Semana Santa', 'ABR', 'Semana Santa', 'Procesiones y representaciones que llenan de devoción el corazón de Lagos. Una de las más emotivas de todo Jalisco.', 'Religioso', '#C86B4A', '/tourism/turismo-religioso.jpg', 'Turismo religioso en Lagos de Moreno', false, 'md:col-span-1', 'md:row-span-1', 5),
  ('Haciendas de los Altos', '365', 'Todo el año', 'Las haciendas históricas de los Altos de Jalisco: arquitectura colonial, tequila artesanal y paisajes que enamoran.', 'Turismo', '#22C55E', '/tourism/panoramica-lagos.jpg', 'Panorámica de Lagos de Moreno', false, 'md:col-span-1', 'md:row-span-1', 6);
