-- AUDITORIA RLS (solo lectura). Pegar en Supabase > SQL Editor y revisar cada resultado.
-- No modifica nada.

-- 1) Tablas de public SIN Row Level Security (deberia salir vacio)
select c.relname as tabla
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity
order by 1;

-- 2) Politicas peligrosas: aplican a anon/public y dejan escribir (o leer todo) sin condicion real
select tablename, policyname, cmd, roles, qual as using_expr, with_check
from pg_policies
where schemaname = 'public'
  and (roles::text like '%public%' or roles::text like '%anon%')
  and (qual = 'true' or with_check = 'true' or (cmd in ('INSERT','UPDATE','DELETE','ALL') and qual is null and with_check is null))
order by tablename, cmd;

-- 3) Todas las politicas de las tablas mas sensibles
select tablename, policyname, cmd, roles, qual as using_expr, with_check
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles','businesses','orders','order_customers','order_items','notifications',
                    'subscriptions','subscription_history','transactions','marketplace_leads',
                    'business_claims','events','local_pages','local_page_clicks','audit_logs')
order by tablename, cmd, policyname;

-- 4) Columnas de businesses que el rol anon puede leer (deberian faltar las de pagos)
select column_name
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'businesses' and grantee = 'anon' and privilege_type = 'SELECT'
order by 1;

-- 5) Funciones SECURITY DEFINER (revisar que validen auth.uid())
select p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.prosecdef
order by 1;
