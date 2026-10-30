-- ENDURECIMIENTO RLS. Revisar con el resultado de 01_audit_rls_readonly.sql y ejecutar por bloques.
-- El service role (usado por las rutas /api del servidor) ignora RLS, asi que estas politicas
-- no lo afectan. Cada bloque es independiente e idempotente.

-- ============================================================
-- A) events: quitar el acceso total para cualquiera ("for all using (true)")
-- ============================================================
drop policy if exists "service role full access" on events;
drop policy if exists "admin manage events" on events;
create policy "admin manage events" on events
  for all
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- B) local_pages y local_page_clicks: mismo problema
-- ============================================================
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

-- ============================================================
-- C) marketplace_leads: hoy cualquiera puede leer buyer_id y mensajes
-- ============================================================
alter table marketplace_leads enable row level security;
drop policy if exists "leads public read" on marketplace_leads;
drop policy if exists "leads select involved" on marketplace_leads;
drop policy if exists "leads insert own" on marketplace_leads;
create policy "leads select involved" on marketplace_leads
  for select to authenticated
  using (
    buyer_id = auth.uid()
    or exists (select 1 from marketplace_listings l where l.id = marketplace_leads.listing_id and l.seller_id = auth.uid())
    or exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
create policy "leads insert own" on marketplace_leads
  for insert to authenticated
  with check (buyer_id = auth.uid());

-- ============================================================
-- D) profiles: impedir que un usuario se cambie su propio role (escalada a admin)
-- ============================================================
create or replace function public.prevent_role_self_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'No puedes cambiar tu rol';
  end if;
  return new;
end $$;
drop trigger if exists trg_prevent_role_self_change on profiles;
create trigger trg_prevent_role_self_change
  before update on profiles
  for each row execute function public.prevent_role_self_change();

-- ============================================================
-- E) FASE 2 (NO ejecutar a ciegas): datos bancarios y llaves en businesses son legibles por anon.
--    Quitar la lectura de esas columnas rompe cualquier `select *` sobre businesses y la pagina
--    /checkout/[slug], que hoy las lee con el cliente publico. Primero hay que leerlas en el servidor
--    con createServiceClient() y solo devolver al navegador lo necesario; despues:
--
-- revoke select (bank_name, bank_account_holder, bank_account_number, bank_clabe,
--                conekta_private_key, mercadopago_access_token, pos_config,
--                claim_phone, claim_email, claimed_by)
--   on businesses from anon, authenticated;
-- ============================================================
