# Los Gladiolos — Credenciales y Cuentas

> **⚠️ Este archivo NO contiene claves secretas ni contraseñas reales.**
> Las credenciales reales viven en las **variables de entorno de Vercel** (fuente de verdad) y se bajan al `.env.local` local con `vercel env pull`.
> Acá solo se trackea el estado de cada cuenta y cómo obtener/recuperar cada credencial.
>
> **Última actualización:** 2026-08-07

---

## 🔑 Lo más importante: las variables `sensitive` NO se pueden recuperar

En Vercel, casi todas las variables de este proyecto están cargadas con el tipo **`sensitive`**. Ese tipo es de **escritura solamente**: Vercel las inyecta en producción, pero **no las devuelve nunca más** — ni por la API, ni con `vercel env pull`, ni mostrándolas en el panel.

| Variable | Entorno | Tipo | ¿Se puede recuperar? |
|---|---|---|---|
| `DATABASE_URL` | production | sensitive | ❌ (hay copia local en `.env.local`) |
| `ADMIN_PANEL_PASSWORD` | production | sensitive | ❌ |
| `CRON_SECRET` | production | sensitive | ❌ |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | production | sensitive | ❌ (pero se conoce el valor, ver abajo) |
| `GOOGLE_PRIVATE_KEY` | production | sensitive | ❌ |
| `GOOGLE_CALENDAR_ID` | production | sensitive | ❌ |
| `NEXT_PUBLIC_BASE_URL` | production | sensitive | ❌ (valor obvio) |
| `BLOB_READ_WRITE_TOKEN` | dev/preview/prod | encrypted | ✅ recuperada |
| `BLOB_STORE_ID` | dev/preview/prod | plain | ✅ recuperada |
| `BLOB_WEBHOOK_PUBLIC_KEY` | dev/preview/prod | plain | ✅ recuperada |

**Consecuencia práctica:** producción sigue andando porque Vercel ya tiene los valores guardados, pero **para trabajar en local hay que volver a generar** las de Google. No es una limitación del token que se usó: es cómo funciona el tipo `sensitive`.

> ⚠️ **Regla para el futuro:** cada vez que se cargue una variable `sensitive` en Vercel, guardar además una copia en un gestor de contraseñas. Vercel deja de ser un lugar del que se pueda recuperar.

---

## Estado General de Cuentas

| # | Servicio | Cuenta | Credencial | Variables |
|---|---|---|---|---|
| 1 | Vercel (+ GitHub) | ✅ Creada | ✅ Configurada | `NEXT_PUBLIC_BASE_URL` |
| 2 | Neon (PostgreSQL) | ✅ Creada | ✅ Configurada y en uso | `DATABASE_URL` |
| 3 | Vercel Blob Storage | ✅ Creado | ✅ Configurada y probada | `BLOB_READ_WRITE_TOKEN` |
| 4 | Google Cloud (Calendar API) | ✅ Creada | ✅ Configurada | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID` |
| 5 | Meta (WhatsApp Cloud API) | 🔄 Parcial | 🔄 **Falta el access token** | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ADMIN_PHONE` |
| 6 | Admin Panel | ✅ Definida | ✅ Configurada | `ADMIN_PANEL_PASSWORD` |
| 7 | Cron | ⬜ Pendiente | ⬜ Pendiente | `CRON_SECRET` |

---

## Detalle por Servicio

### 1. Vercel — ✅ Listo

Hosting del sitio + Blob Storage. La cuenta está creada y vinculada a GitHub.

- `NEXT_PUBLIC_BASE_URL` → URL del sitio. En local vale `http://localhost:3000`.
- El proyecto ya existe en Vercel con todas las variables cargadas.

### 2. Neon (PostgreSQL) — ✅ Listo y en uso

Base de datos con el esquema aplicado y datos de prueba cargados. Región `sa-east-1`.

- `DATABASE_URL` → la variable en Vercel usa el **endpoint con pooler** (`-pooler` en el host), que es lo correcto para serverless.

### 3. Vercel Blob Storage — ✅ Listo y probado

Guarda las fotos de DNI con acceso **privado**. Ya hay fotos subidas de la sesión de prueba del 6/8.

- `BLOB_READ_WRITE_TOKEN` → está en Vercel. Si hiciera falta regenerarlo: panel de Vercel → Storage → el store de Blob → `.env.local` tab.

### 4. Google Cloud (Calendar API) — ✅ En producción, 🔄 falta en local

Cuenta de servicio creada y funcionando: **`reservas@los-gladiolos.iam.gserviceaccount.com`**

- `GOOGLE_SERVICE_ACCOUNT_EMAIL` → el email de arriba.
- `GOOGLE_PRIVATE_KEY` → del JSON descargado. Los saltos de línea viajan escapados como `\n` literales; `lib/googleCalendar.ts` los desescapa solo.
- `GOOGLE_CALENDAR_ID` → el calendario del dueño, **compartido con la cuenta de servicio** con permiso de "Hacer cambios en los eventos".

**Para tenerlas en local hay que regenerar la clave** (las de Vercel son `sensitive` y no se pueden leer):

1. Google Cloud Console → **IAM y administración → Cuentas de servicio**
2. Entrar a `reservas@los-gladiolos.iam.gserviceaccount.com` → pestaña **Claves**
3. **Agregar clave → Crear clave nueva → JSON** → se descarga un archivo
4. Del JSON salen `client_email` y `private_key`
5. El `GOOGLE_CALENDAR_ID` se saca de Google Calendar → configuración del calendario → "Integrar calendario" → **ID del calendario**

> La cuenta de servicio **no se toca**: sigue existiendo y sigue teniendo permiso sobre el calendario. Solo se le agrega una clave más. Las claves viejas siguen funcionando (producción no se ve afectada), y conviene borrar las que no se usen.
>
> Guardar el JSON en un gestor de contraseñas, y **borrarlo del disco** una vez cargado en `.env.local`.

### 5. Meta WhatsApp Cloud API — 🔄 Lo único que falta

Es la única integración sin completar. El código (`lib/whatsapp.ts` y `lib/notificaciones.ts`) está terminado y funciona en modo "best effort": sin credenciales loguea y sigue, sin romper las reservas.

- `WHATSAPP_PHONE_NUMBER_ID` → ✅ ya cargado en Vercel.
- `WHATSAPP_ACCESS_TOKEN` → ⬜ **pendiente**. Meta App → WhatsApp → API Setup. El token temporal dura 24 hs; para producción hay que generar un **token permanente** desde un System User en Business Settings.
- `WHATSAPP_ADMIN_PHONE` → ⬜ **pendiente**. Número del dueño con código de país, solo dígitos (ej. `5491122334455`).

**Dos cosas a tener en cuenta para producción:**

1. **Ventana de 24 hs.** Meta solo deja mandar texto libre dentro de las 24 hs desde que la persona te escribió. Los avisos automáticos a huéspedes caen fuera de esa ventana, así que hay que crear **plantillas aprobadas** y usar `enviarPlantilla()` en vez de `enviarTexto()`. Para probar alcanza con que el destinatario le escriba primero al número de prueba.
2. **Coexistence.** Está previsto configurarlo para que el dueño siga usando WhatsApp Business en el celular con el mismo número.

### 6. Admin Panel — ✅ Listo

- `ADMIN_PANEL_PASSWORD` → definida y cargada en Vercel. La usa `lib/adminAuth.ts` para el login en `/admin/login`.

### 7. Cron — ⬜ Pendiente

`GET /api/cron` exige el header `Authorization: Bearer <CRON_SECRET>`. Sin la variable definida, **el endpoint devuelve 401 siempre** — o sea, hoy las tareas periódicas no corren.

- `CRON_SECRET` → inventar una cadena aleatoria larga y cargarla en Vercel. Vercel Cron manda ese header solo cuando la variable existe.
- El plan Hobby de Vercel permite **un solo cron por día**. Por eso está previsto sumar un servicio externo gratuito (tipo cron-job.org) que le pegue cada hora con el mismo header.

---

## Registro de Credenciales Obtenidas

| Fecha | Servicio | Credencial | Estado |
|---|---|---|---|
| 2026-08-06 | Neon PostgreSQL | `DATABASE_URL` | ✅ |
| 2026-08-06 | Vercel Blob | `BLOB_READ_WRITE_TOKEN` | ✅ |
| 2026-08-06 | Google Cloud | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID` | ✅ |
| 2026-08-06 | Admin Panel | `ADMIN_PANEL_PASSWORD` | ✅ |
| 2026-08-06 | Meta WhatsApp | `WHATSAPP_PHONE_NUMBER_ID` | ✅ |
| — | Meta WhatsApp | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_ADMIN_PHONE` | ⬜ Pendiente |
| — | Cron | `CRON_SECRET` | ⬜ Pendiente |

---

## Template de `.env.local`

```env
# Base de datos (Neon) — usar el endpoint con -pooler
DATABASE_URL=

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=

# Google Calendar API
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_CALENDAR_ID=

# Meta WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ADMIN_PHONE=

# Panel Admin
ADMIN_PANEL_PASSWORD=

# Tareas periódicas
CRON_SECRET=

# URL base del sitio
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> El `.gitignore` ignora `.env*`. **Nunca** commitear este archivo.
