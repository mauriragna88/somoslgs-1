# 📱 Directorio Lagos

Plataforma de búsqueda y pedidos de negocios locales en Lagos de Moreno, Jalisco.

## 🚀 Stack Tecnológico

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Payments**: Mercado Pago, Stripe, PayPal

## 📦 Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de variables de entorno
cp .env.example .env.local

# Configurar variables de entorno (ver abajo)

# Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## ⚙️ Configuración

### 1. Supabase

1. Crea una cuenta en [Supabase](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a Settings > API y copia:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Mercado Pago

1. Crea una cuenta en [Mercado Pago Developers](https://www.mercadopago.com.mx/developers)
2. Ve a Tus integraciones > Credenciales
3. Copia:
   - Public Key → `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
   - Access Token → `MERCADOPAGO_ACCESS_TOKEN`

### 3. Base de Datos

Ejecuta las migraciones de la base de datos:

```bash
# Iniciar Supabase localmente (opcional)
npx supabase start

# Aplicar migraciones
npx supabase db push
```

O ejecuta los scripts SQL manualmente desde el dashboard de Supabase (ver `ROADMAP.md` para el esquema completo).

## 📁 Estructura del Proyecto

```
directorio-lagos/
├── app/                    # App Router (Next.js 14)
│   ├── (auth)/            # Rutas de autenticación
│   ├── (dashboard)/       # Panel de negocios
│   ├── admin/             # Panel de administración
│   ├── negocios/          # Páginas públicas de negocios
│   └── api/               # API routes
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes de UI
│   └── ...
├── lib/                   # Utilidades y configuración
│   ├── supabase.ts       # Cliente de Supabase
│   └── utils.ts          # Funciones helper
├── types/                 # Definiciones de TypeScript
├── public/               # Archivos estáticos
└── ROADMAP.md            # Documentación completa

```

## 🛠️ Scripts Disponibles

```bash
npm run dev         # Desarrollo
npm run build       # Build para producción
npm run start       # Servidor de producción
npm run lint        # Linter
npm run type-check  # Verificar tipos TypeScript
```

## 📚 Documentación

Para documentación completa del proyecto, arquitectura, esquemas de base de datos, y roadmap de desarrollo, consulta [ROADMAP.md](./ROADMAP.md).

## 🌐 Deploy

### Vercel (Recomendado)

1. Conecta tu repositorio de GitHub a [Vercel](https://vercel.com)
2. Configura las variables de entorno
3. Deploy automático en cada push

### Otros

El proyecto puede desplegarse en cualquier plataforma que soporte Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- etc.

## 📝 Variables de Entorno

Copia `.env.example` a `.env.local` y configura todas las variables necesarias.

**IMPORTANTE**: Nunca commitees el archivo `.env.local` al repositorio.

## 🤝 Contribuir

Este es un proyecto privado. Si eres parte del equipo, sigue estas convenciones:

- Usa branches feature: `feature/nombre-feature`
- Commits descriptivos en español
- PRs pequeños y focalizados
- Testing antes de merge

## 📄 Licencia

Propiedad privada. Todos los derechos reservados.

## 📞 Contacto

Para soporte o preguntas, contacta al administrador del proyecto.

---

**Versión**: 1.0.0 (MVP)
**Última actualización**: Enero 2026
