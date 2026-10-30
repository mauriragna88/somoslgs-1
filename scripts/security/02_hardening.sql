-- ENDURECIMIENTO RLS (v2, basado en la auditoria real de producción del 2026-10-29).
-- El service role (rutas /api del servidor) ignora RLS, por lo que estas politicas no lo afectan.
-- Idempotente: se puede correr mas de una vez.

-- ============================================================
-- A) Politicas "acceso total" que aplicaban al rol public/anon (cualquiera con la llave publica)
--    Se reemplazan por reglas de admin reales.
-- ============================================================
drop policy if exists "service role full access" on events;
drop policy if exists "admin manage events" on events;
create policy "admin manage events" on events
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Admin full access local pages" on local_pages;
drop policy if exists "admin manage local pages" on local_pages;
create policy "admin manage local pages" on local_pages
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Admin read clicks" on local_page_clicks;
drop policy if exists "admin read local page clicks" on local_page_clicks;
create policy "admin read local page clicks" on local_page_clicks
  for select
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Admin full access" on blog_posts;
drop policy if exists "admin manage blog posts" on blog_posts;
create policy "admin manage blog posts" on blog_posts
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Tablas internas (chatbot / POS): sin politica = solo service role. Quitar el acceso publico.
drop policy if exists "Service role full access on chat_messages_log" on chat_messages_log;
drop policy if exists "Service role full access on chatbot_sessions" on chatbot_sessions;
drop policy if exists "Service role full access on pos_orders" on pos_orders;

-- ============================================================
-- B) marketplace_leads: cualquiera podia leer buyer_id y mensajes
-- ============================================================
drop policy if exists "Public read" on marketplace_leads;
drop policy if exists "leads select involved" on marketplace_leads;
create policy "leads select involved" on marketplace_leads
  for select to authenticated
  using (
    buyer_id = auth.uid()
    or exists (select 1 from marketplace_listings l where l.id = marketplace_leads.listing_id and l.seller_id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- C) Escalada de privilegios:
--    - profiles: "Users can update own profile" permitia cambiarse el role a 'admin'
--    - businesses: el dueño podia cambiar su plan, is_courtesy, is_featured, owner_id, etc.
--    El service role (auth.uid() null) y los admins siguen pudiendo cambiarlo todo.
-- ============================================================
create or replace function public.prevent_profile_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'No puedes cambiar tu rol';
  end if;
  return new;
end $$;
drop trigger if exists trg_prevent_profile_role_change on profiles;
create trigger trg_prevent_profile_role_change
  before update on profiles
  for each row execute function public.prevent_profile_role_change();

create or replace function public.protect_business_privileged_columns()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null
     and not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
     and (
       new.owner_id is distinct from old.owner_id
       or new.subscription_tier is distinct from old.subscription_tier
       or new.subscription_status is distinct from old.subscription_status
       or new.subscription_started_at is distinct from old.subscription_started_at
       or new.subscription_expires_at is distinct from old.subscription_expires_at
       or new.is_courtesy is distinct from old.is_courtesy
       or new.is_featured is distinct from old.is_featured
       or new.is_claimed is distinct from old.is_claimed
       or new.claimed_by is distinct from old.claimed_by
       or new.rating is distinct from old.rating
       or new.total_reviews is distinct from old.total_reviews
     ) then
    raise exception 'No puedes modificar campos reservados del negocio';
  end if;
  return new;
end $$;
drop trigger if exists trg_protect_business_privileged_columns on businesses;
create trigger trg_protect_business_privileged_columns
  before update on businesses
  for each row execute function public.protect_business_privileged_columns();

-- ============================================================
-- D) Funciones SECURITY DEFINER invocables por cualquiera via /rest/v1/rpc
-- ============================================================
revoke execute on function public.check_expired_subscriptions() from public, anon, authenticated;
revoke execute on function public.activate_subscription_on_payment() from public, anon, authenticated;

-- ============================================================
-- E) Privilegios innecesarios de tabla para anon/authenticated (RLS no cubre TRUNCATE)
-- ============================================================
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- ============================================================
-- F) FASE 2 (NO incluida): datos bancarios/llaves legibles en businesses (3 CLABE, 2 cuentas hoy).
--    Requiere cambiar /checkout/[slug] para leerlos en el servidor con service role antes de:
--
-- revoke select (bank_name, bank_account_holder, bank_account_number, bank_clabe,
--                conekta_private_key, mercadopago_access_token, pos_config,
--                claim_phone, claim_email, claimed_by)
--   on businesses from anon, authenticated;
-- ============================================================
