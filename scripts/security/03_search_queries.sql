-- Registro de busquedas (anonimo): solo termino normalizado, numero de resultados y fecha.
-- Sin IP, sin usuario. RLS activado y sin politicas: solo el service role (servidor) escribe y lee.
create table if not exists public.search_queries (
  id bigint generated always as identity primary key,
  term text not null check (char_length(term) between 2 and 80),
  results integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists idx_search_queries_created on public.search_queries (created_at desc);
create index if not exists idx_search_queries_term on public.search_queries (term);
alter table public.search_queries enable row level security;
revoke all on public.search_queries from anon, authenticated;
