# Auditoría de Sincronización BD ↔ Frontend — SomosLagos

**Fecha:** sesión de auditoría
**Fuente de verdad:** `supabase/migrations/` (la BD real de Supabase) — NO `supabase-schema.sql`, que está obsoleto.

---

## ⚠️ Conclusión clave (leer primero)

El archivo `supabase-schema.sql` del repo está **desactualizado** y **NO refleja la BD real** de producción. La BD real está definida por las **migraciones** en `supabase/migrations/`, que agregan campos y cambian `CHECK`s que el SQL viejo no tiene.

**Resultado:** la mayoría de "discrepancias críticas" parecían problemas, pero en realidad **el frontend está correctamente sincronizado** con la BD real. A continuación el estado real, con los pocos problemas verdaderos.

---

## ✅ Lo que SÍ está sincronizado (no es problema)

### subscription_tier
El frontend usa `gratis / emprendedor / pro / avanzado / chatbot`. La migración **`013_rename_tiers.sql`** renombró los tiers en la BD:
- `basico` → `gratis`
- `ventas` → `pro`
- `premium` → `avanzado`

Por eso la home (`app/page.tsx`) filtra `.in('subscription_tier', ['avanzado'])` y **SÍ devuelve negocios** (se ven en la captura del usuario). El CHECK `('basico','productos','ventas','premium')` del SQL viejo es un **fantasma obsoleto**.

> Nota: `chatbot` y `emprendedor` se usan en el frontend pero no hay migración que los renombre/agregue al CHECK de la BD. Si un negocio se guarda con `chatbot` o `emprendedor` podría fallar la inserción. **Verificar** en Supabase si esos dos valores están permitidos.

### Campos que las migraciones SÍ agregan (falsos positivos de la auditoría)
| Campo | Migración | ¿Existe en BD real? |
|---|---|---|
| `business_type` | `012_business_type.sql` | ✅ Sí |
| `facebook_url` / `instagram_url` / `tiktok_url` | `016_social_links.sql` | ✅ Sí |
| `products.type` (producto/servicio) | `012` + `017_product_type.sql` | ✅ Sí |
| `bank_name`, `bank_account_holder`, `bank_account_number`, `bank_clabe` | `004_business_bank_data.sql` | ✅ Sí |
| `payment_receipt_url` (en orders) | `004_business_bank_data.sql` | ✅ Sí |
| `total_views` (en businesses) | `020_business_views.sql` | ✅ Sí |
| `is_courtesy` | `add_is_courtesy.sql` | ✅ Sí |

### orders payment_method / payment_status
La migración `004` **amplía los CHECK** a lo que el frontend espera:
- `payment_method` incluye `transfer` → `('cash','card','transfer','mercadopago','stripe','paypal')` ✅
- `payment_status` incluye `pending_verification`, `verified`, `failed` → `('pending','pending_verification','verified','paid','refunded','failed')` ✅

Por eso el dashboard de pedidos que usa `transfer`, `pending_verification`, `verified`, `failed`, y `payment_receipt_url` está **correcto**.

### Fotografía
- `businesses.logo_url` ✅
- `businesses.cover_url` ✅
- `business_photos.image_url` / `storage_path` (migración `007`) ✅
- `products.images` (JSONB) ✅

### Marketplace
- La tabla `marketplace_listings` existe en `019_marketplace.sql` (fuera del SQL principal).
- La home **sí renderiza** `MarketplaceStrip` (`app/page.tsx`), pero devuelve `null` si no hay publicaciones activas o expiradas → por eso "no se ve".

### Tablas admin
`events`, `banners`, `blog_posts`, `business_views`, `business_photos`, `transactions`, `subscription_history`, `audit_logs` están en migraciones separadas (no en el SQL principal). Funcionan si las migraciones están aplicadas.

---

## 🔴 PROBLEMAS REALES (estado y soluciones aplicadas)

### ✅ 1. `subscription_status = 'paused'` NO está permitido por la BD — CORREGIDO
- **Dónde:** `components/admin/SubscriptionManager.tsx` (acción "Pausar") y `app/api/admin/subscriptions/route.ts` (línea ~102).
- **Problema:** ninguna migración agrega `paused` al CHECK de `subscription_status` (sigue en `active | inactive | suspended`).
- **Impacto:** el `UPDATE` al pausar un negocio fallaba por violación de CHECK.
- **Solución aplicada:** ✅ mapear "Pausar" → `suspended` en `app/api/admin/subscriptions/route.ts` (ya commiteado). Alternativa pendiente si se quiere `paused` real: agregar migración SQL que lo añada al CHECK.

### ✅ 2. `stock_quantity` no existe (la BD usa `stock`) — CORREGIDO
- **Dónde:** `app/dashboard/productos/page.tsx` (interfaz `Product` y render "Stock:").
- **Problema:** el dashboard leía `stock_quantity` (siempre `undefined`) en vez de `stock`. El stock del cliente nunca se mostraba.
- **Solución aplicada:** ✅ cambiado `stock_quantity` → `stock` en la interfaz y el render (commiteado).

### ✅ 3. `banners.description` se perdía al crear — CORREGIDO
- **Dónde:** `components/admin/BannerForm.tsx` enviaba `description`, pero `app/api/admin/banners/route.ts` no lo validaba ni insertaba.
- **Solución aplicada:** ✅ agregado `description` y `display_mode` al schema y al INSERT de la API (commiteado).

### ✅ 4. El CHECK de la tabla `transactions` está desalineado — CORREGIDO (migración creada)
- **Dónde:** `app/api/payments/transfer/route.ts:18,84`, `app/api/payments/agreement/route.ts:18,70`, y webhooks de `conekta`/`mercadopago` que insertan en `transactions`.
- **Problema:** la tabla `transactions` (definida en `supabase-transactions-table.sql`) tiene CHECK antiguos `subscription_tier IN ('basico','productos','ventas','premium')` y `payment_method IN ('transfer','mercadopago','stripe')`. El frontend inserta `pro/avanzado` y `payment_method: 'conekta'` → **violación de CHECK → los pagos fallan**. Ninguna migración previa actualizaba `transactions`.
- **Solución aplicada:** ✅ creado `supabase/migrations/021_align_transactions_tier_check.sql` que alinea `subscription_tier` a `gratis/emprendedor/pro/avanzado/chatbot` y agrega `conekta` a `payment_method`. **Requiere ejecutarse en Supabase** (no pude correrlo sin red).

### 🛠️ CÓMO APLICAR LA MIGRACIÓN (accionable)
En el SQL Editor de Supabase, ejecuta el contenido de `supabase/migrations/021_align_transactions_tier_check.sql`.

### ⚠️ 5. Verificar `emprendedor` y `chatbot` en la BD
- El frontend usa `emprendedor` y `chatbot` como tiers, pero la migración `013` solo renombró a `gratis/pro/avanzado`. Confirmar en Supabase si esos dos valores son válidos en el CHECK real de `businesses` (la migración 021 ya los agrega a `transactions`).

### ✅ 5. Confirmado que el resto del frontend está sincronizado (falsos positivos descartados)
Con evidencia de migraciones: `delivering` (008), `order_customers` (003), `payment_receipt_url` + `payment_method='transfer'` + `payment_status` ampliado (004), `products.type` + `business_type` (012, 017), redes sociales (016), `total_views` (020). Todos existen en la BD real, así que el dashboard, admin y queries públicas están correctamente alineados.

---

## 📌 Acciones de verificación manual (requieren acceso a Supabase)

El sandbox de esta sesión no tiene acceso de red a Supabase, por lo que **no pude consultar la BD en vivo**. Para 100% de certeza, revisar en el SQL Editor de Supabase:

1. `SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname LIKE '%subscription_tier%' OR conname LIKE '%subscription_status%';`
2. `SELECT DISTINCT subscription_tier FROM businesses;` y `SELECT DISTINCT subscription_status FROM businesses;`
3. Confirmar que existan las tablas: `business_photos`, `events`, `banners`, `blog_posts`, `marketplace_listings`, `business_views`, `transactions`, `subscription_history`, `audit_logs`.

Con los resultados se decide la corrección final de `subscription_tier`/`subscription_status`.

---

## Recomendación de modelo único

Para unificar (recomendado):
- **Tiers:** `gratis`, `emprendedor`, `pro`, `avanzado`, `chatbot` (el que usa el frontend).
- Actualizar el CHECK de la BD con esos 5 valores vía migración, para que coincida con el frontend.
- **subscription_status:** agregar `paused` al CHECK o mapear a `suspended`.

Si en la BD real los valores son otros (los que devuelva la consulta), alinear el frontend a esos.
