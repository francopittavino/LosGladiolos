# Los Gladiolos — Credenciales y Cuentas

> **⚠️ IMPORTANTE: Este archivo NO debe contener claves secretas ni contraseñas reales.**
> Las credenciales reales van en el archivo `.env.local` (local) y en las variables de entorno de Vercel (producción).
> Este archivo solo trackea el estado de cada cuenta/credencial y las instrucciones para obtenerlas.

---

## Estado General de Cuentas

| # | Servicio | Cuenta Creada | Credencial Obtenida | Variable de Entorno |
|---|---|---|---|---|
| 1 | Vercel | ✅ Sí (+ GitHub) | ✅ Sí (proyecto `los-gladiolos` creado y Blob Storage conectado) | `NEXT_PUBLIC_BASE_URL`, `BLOB_READ_WRITE_TOKEN` |
| 2 | Neon (PostgreSQL) | ✅ Sí | ✅ Sí (cargada en `.env.local`, conectada y migrada) | `DATABASE_URL` |
| 3 | Google Cloud (Calendar API) | ✅ Sí (proyecto `los-gladiolos`) | ✅ Sí (cuenta de servicio `reservas@los-gladiolos.iam.gserviceaccount.com`) | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_CALENDAR_ID` |
| 4 | Meta (WhatsApp Cloud API) | ⬜ No | ⬜ No | `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` |
| 5 | Admin Panel | ⬜ No | ⬜ No | `ADMIN_PANEL_PASSWORD` |

---

## Orden de Configuración

Las cuentas se configuran en este orden porque cada una depende de la anterior:

1. **Vercel** → Necesaria para el deploy y para Blob Storage
2. **Neon** → Base de datos (se puede integrar directo desde Vercel)
3. **Google Cloud** → Para Calendar API (no depende de las anteriores, pero se usa más adelante)
4. **Meta WhatsApp** → Para enviar mensajes (se configura último porque es el más complejo)
5. **Admin Password** → Se define al final, es solo una contraseña que elige el dueño

---

## Detalle por Servicio

### 1. Vercel

**Estado:** ✅ Listo (proyecto creado, Blob Storage conectado con token en `.env.local`)

**Para qué se usa:** Hosting del sitio web + Blob Storage para fotos de DNI.

**Variables que provee:**
- `NEXT_PUBLIC_BASE_URL` → La URL del sitio una vez deployado (ej: `https://losgladiolos.vercel.app`)
- `BLOB_READ_WRITE_TOKEN` → Token para subir/leer fotos en Vercel Blob Storage

**Instrucciones:** Ver sección de setup paso a paso más abajo.

---

### 2. Neon (PostgreSQL)

**Estado:** ⬜ Pendiente

**Para qué se usa:** Base de datos donde se guardan reservas, departamentos, huéspedes, viajantes.

**Variables que provee:**
- `DATABASE_URL` → Connection string con formato `postgresql://user:pass@host/db?sslmode=require`

**Instrucciones:** Ver sección de setup paso a paso más abajo.

---

### 3. Google Cloud (Calendar API)

**Estado:** ⬜ Pendiente

**Para qué se usa:** Crear eventos automáticamente en el Google Calendar del dueño cuando se confirma una reserva.

**Variables que provee:**
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` → Email de la cuenta de servicio (ej: `reservas@mi-proyecto.iam.gserviceaccount.com`)
- `GOOGLE_PRIVATE_KEY` → Clave privada del archivo JSON descargado
- `GOOGLE_CALENDAR_ID` → ID del calendario (ej: `tu-email@gmail.com` o un ID específico)

**Instrucciones:** Ver sección de setup paso a paso más abajo.

---

### 4. Meta WhatsApp Cloud API

**Estado:** ⬜ Pendiente

**Para qué se usa:** Enviar mensajes automáticos de WhatsApp al admin (nuevas reservas) y a los huéspedes (confirmación, rechazo, datos de pago).

**Variables que provee:**
- `WHATSAPP_ACCESS_TOKEN` → Token permanente de acceso a la API
- `WHATSAPP_PHONE_NUMBER_ID` → ID del número de teléfono registrado en Meta

**Dato adicional necesario:**
- `WHATSAPP_ADMIN_PHONE` → Número de WhatsApp del admin con código de país (ej: `549XXXXXXXXXX`)

**Instrucciones:** Ver sección de setup paso a paso más abajo.

**Nota sobre Coexistence:** Se va a configurar el modo Coexistence para que el dueño pueda seguir usando WhatsApp Business normalmente en el celular mientras el sistema envía mensajes automáticos desde el mismo número.

---

### 5. Admin Panel Password

**Estado:** ⬜ Pendiente

**Para qué se usa:** Proteger el acceso al panel de administración.

**Variables que provee:**
- `ADMIN_PANEL_PASSWORD` → La contraseña que elige el dueño para entrar al panel

**Instrucciones:** El dueño elige una contraseña segura y la carga como variable de entorno.

---

## Registro de Credenciales Obtenidas

> Cada vez que se obtiene una credencial, se actualiza esta sección con la fecha y un ✅.

| Fecha | Servicio | Credencial | Estado |
|---|---|---|---|
| 2026-08-06 | Neon PostgreSQL | `DATABASE_URL` | ✅ Obtenida |
| 2026-08-06 | Vercel | Proyecto `los-gladiolos` creado (team `franco-p-s-projects`) | ✅ Obtenida |
| 2026-08-06 | Vercel Blob Storage | `BLOB_READ_WRITE_TOKEN` (store `los-gladiolos-blob`) | ✅ Obtenida |
| 2026-08-06 | Google Calendar API | Cuenta de servicio + calendario **"Los Gladiolos PRUEBAS"** | ✅ Obtenida y probada |

---

## Archivo .env.local (Template)

```env
# Base de datos (Neon)
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

# URL base del sitio
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```
