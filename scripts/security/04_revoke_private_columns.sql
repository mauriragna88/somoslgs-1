-- FASE 2: columnas privadas de businesses ya no son legibles con la llave publica.
-- Solo el service role (servidor) las lee. Aplicar DESPUES de desplegar el codigo que ya no las pide
-- con el cliente publico (checkout, panel del dueño, ficha publica).
revoke select (bank_name, bank_account_holder, bank_account_number, bank_clabe,
               conekta_private_key, mercadopago_access_token, pos_config,
               claim_phone, claim_email, claimed_by)
  on public.businesses from anon, authenticated;

-- ROLLBACK (si algo se rompe):
-- grant select (bank_name, bank_account_holder, bank_account_number, bank_clabe,
--               conekta_private_key, mercadopago_access_token, pos_config,
--               claim_phone, claim_email, claimed_by)
--   on public.businesses to anon, authenticated;
