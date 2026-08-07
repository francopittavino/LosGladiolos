# Los Gladiolos — Plan de Restauración

> **Estado:** plan activo, iniciado el **2026-08-07**.
> Este documento manda mientras dure la restauración. Cuando termine, el proyecto vuelve a guiarse por `PROJECT_CONTEXT.md`.

---

## 1. Qué pasó

El **6/8 a la tarde** se empezó el proyecto en `C:\LosGladiolos\los-gladiolos\`: landing y formulario, sin backend.

El **6/8 a la noche** se rehízo y completó el sistema entero en otra carpeta, `C:\Users\franc\OneDrive\Escritorio\LosGladiolos System\`: backend, panel de administración, Google Calendar, WhatsApp, cron y migraciones de base de datos. Esa carpeta **desapareció del disco**.

El **7/8** se retomó por error sobre la carpeta vieja de la tarde, que estaba además rota (dependencias a medio instalar, dos directorios `app/` en conflicto, alias de TypeScript mal apuntado). Se arregló para que compile, pero es el borrador incompleto.

**La versión buena se recuperó.** Estaba en el historial de la sesión de Claude Code que la escribió. Se reconstruyeron **62 archivos** replayando en orden cronológico todas las escrituras y ediciones de esa sesión. Quedaron en:

```
C:\LosGladiolos\_recuperado\los-gladiolos\
```

**La base de datos confirma que esa es la versión real:** el esquema vivo en Neon tiene la tabla `ConfiguracionGeneral` y las columnas `ViajanteFrecuente.numeroDni / dominioVehiculo / fotoDni`, que existen **solo** en la versión recuperada.

---

## 2. Qué se recuperó

Los 62 archivos incluyen todo el sistema:

- **Backend:** `/api/reservas`, `/api/disponibilidad`, `/api/upload-dni`, `/api/viajantes/reservar`, `/api/config`, `/api/cron`, `/api/admin/file`
- **Panel admin completo:** login con cookie de sesión, dashboard, detalle de reserva con confirmar/rechazar/reasignar, tarifas, blacklist, viajantes y configuración general
- **Integraciones:** `lib/googleCalendar.ts` (crear/actualizar/borrar eventos) y `lib/whatsapp.ts` + `lib/notificaciones.ts` (6 tipos de aviso)
- **Lógica de negocio:** `lib/reservas.ts` — disponibilidad, asignación automática, swap por accesibilidad, cancelación idempotente de señas vencidas
- **Front:** componentes de sitio y de reserva, diseño Tailwind con paleta bordó/crema
- **Infra:** 3 migraciones de Prisma, `prisma.config.ts`, `.gitignore`, `vercel.json`

### Lo que NO se pudo recuperar

| Qué | Por qué | Cómo se resuelve |
|---|---|---|
| `package.json` con la lista real de dependencias | El replay de ediciones no aplicó | Reinstalar los paquetes a mano — ver Fase 2 |
| Valores de las credenciales | Nunca pasaron por el historial | `vercel env pull` — están en Vercel |
| `node_modules` y `.next` | No son código fuente | `npm install` |
| Fotos del complejo | Nunca se subieron | Pendiente del dueño |

---

## 3. Decisión de base

**Se conserva la versión recuperada y se descarta el borrador de la tarde.** El borrador está por detrás en todo (no tiene backend, ni panel, ni integraciones, y su `schema.prisma` es viejo).

### ⚠️ Lo único en disputa: el diseño visual

Hay dos diseños distintos y hay que elegir uno:

| | Borrador (tarde) | Recuperada (noche) |
|---|---|---|
| Paleta | Verde botánico | **Bordó / crema** |
| Técnica | CSS plano, 461 líneas | Tailwind v4 con tokens |
| Va con el backend | ❌ No | ✅ Sí |

Por defecto se sigue con el **bordó/Tailwind**, que es el que está integrado con el resto. Si preferís el verde, se puede portar después: es trabajo de CSS, no toca la lógica.

---

## 4. Plan de trabajo

### Fase 0 — Poner todo bajo git ✅ hecha (7/8), menos publicar

Es lo que evita que esto vuelva a pasar.

1. ✅ Repositorio inicializado en `C:\LosGladiolos\`, rama `main` — entran el código **y** los documentos de contexto.
2. ✅ `.gitignore` cubre `.env*`, `node_modules`, `.next`, `.vercel` y `**/.claude/settings.local.json`.
3. ✅ Primer commit: **90 archivos**, incluido `_recuperado/`. El material recuperado quedó a salvo antes de tocarlo.
4. ⬜ **Falta publicar en GitHub.** Con GitHub Desktop: "Add existing repository" → apuntar a `C:\LosGladiolos` → "Publish repository". **Marcar privado**: el proyecto maneja fotos de DNI.

> **Git está disponible** a través de GitHub Desktop (`C:\Users\franc\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe`), aunque no está en el PATH. Conviene instalar Git for Windows aparte para tenerlo suelto en la terminal.
>
> ⚠️ **`los-gladiolos/.claude/settings.local.json` quedó fuera del repo a propósito:** su lista de permisos tiene la cadena de conexión completa a Neon, con contraseña. No lo agregues a mano.

---

### Fase 1 — Reconstituir el proyecto

1. Mover `_recuperado\los-gladiolos\` a la carpeta de trabajo definitiva.
2. Archivar el borrador (no borrarlo hasta decidir lo del diseño).
3. Recuperar del borrador lo único que le falta a la versión buena: `public/`, `eslint.config.mjs`, `postcss.config.mjs`, `next-env.d.ts`.

### Fase 2 — Dependencias

El `package.json` recuperado quedó con la lista base. Hay que reinstalar:

```bash
npm install prisma@7 @prisma/client@7 googleapis @vercel/blob dotenv server-only
npx prisma generate
```

Ojo con dos cosas:

- La versión recuperada usa **Prisma 7**, no la 5.22 del borrador. `prisma.config.ts` depende de `prisma/config`, que existe recién desde Prisma 6.
- **La política `allow-scripts` de npm bloquea el postinstall de Prisma.** Hay que correr `npx prisma generate` a mano después de cada `npm install`. Es exactamente lo que tenía roto el proyecto el 7/8 a la mañana.

### Fase 3 — Credenciales

```bash
npx vercel login
npx vercel link
npx vercel env pull .env.local
```

Baja de una todas las variables ya configuradas: base de datos, Blob, Google Calendar, contraseña del admin. Detalle completo en `CREDENTIALS.md`.

### Fase 4 — Revalidación

El código recuperado **fue escrito y probado el 6/8, pero no se volvió a ejecutar desde la reconstrucción**. Antes de darlo por bueno:

1. `npx tsc --noEmit` y `npx next build` — que compile limpio.
2. `npx prisma migrate status` — confirmar que las 3 migraciones figuran aplicadas y que **no hay drift** contra Neon.
3. Levantar `npm run dev` y probar de punta a punta:
   - Reserva de huésped general, con fotos de DNI → tiene que crear la reserva, subir las fotos a Blob y asignar departamento.
   - Login en `/admin` → ver la reserva → confirmar → verificar que aparezca el evento en Google Calendar.
   - Reserva de viajante frecuente por DNI.
   - Intento de reserva con un DNI de la lista negra → tiene que rechazarla.
4. Revisar que los avisos de WhatsApp logueen "sin credenciales" **sin romper** la reserva (comportamiento best effort esperado).

> Los avisos de WhatsApp no van a llegar hasta la Fase 5. Es lo esperado.

### Fase 5 — Completar lo que falta

| Tarea | Bloqueado por |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` y `WHATSAPP_ADMIN_PHONE` | Meta Business — token permanente vía System User |
| Plantillas de mensaje aprobadas por Meta | Necesarias para escribirle a huéspedes fuera de la ventana de 24 hs |
| `CRON_SECRET` | Inventar la cadena y cargarla en Vercel. **Sin esto `/api/cron` devuelve 401 siempre** |
| Disparador horario del cron | Servicio externo gratuito — Vercel Hobby solo permite 1 cron por día |
| Datos bancarios de la seña | Hoy el WhatsApp dice "(Datos bancarios pendientes de cargar)". Conviene moverlo a `ConfiguracionGeneral` en vez de dejarlo hardcodeado en `lib/notificaciones.ts` |
| Texto definitivo de las reglas | Se carga desde el panel de configuración |
| Fotos del complejo | Del dueño |

### Fase 6 — Deploy

1. Reconectar el proyecto de Vercel al repositorio nuevo de GitHub.
2. Si el repo queda con la app en un subdirectorio, configurar el **Root Directory** en Vercel.
3. Cargar `CRON_SECRET` y las variables de WhatsApp en Vercel.
4. Actualizar `NEXT_PUBLIC_BASE_URL` con el dominio real.
5. **Limpiar los datos de prueba** de Neon antes de abrirlo al público: la reserva de "Maria Lopez", el viajante y la entrada de lista negra de prueba. Los 4 departamentos y las 35 tarifas **se conservan**.

---

## 5. Cosas que NO hay que hacer

1. **No correr `prisma db push` ni `migrate` con el `schema.prisma` del borrador.** Es una versión vieja: borraría `ConfiguracionGeneral` y las columnas nuevas de `ViajanteFrecuente`, con los datos adentro.
2. **No ejecutar `/api/seed` ni `prisma/seed.ts` del borrador.** Los ids de departamento en la base son `"Departamento 1"`…`"Departamento 4"`, distintos de los que usan esos scripts: en vez de actualizar, crearían 4 departamentos duplicados.
3. **No commitear `.env.local`.**
4. **No borrar `_recuperado/`** hasta que la Fase 4 esté verificada y commiteada.
5. **No tratar `colorCalendario` como color hexadecimal.** Es un `colorId` de Google Calendar (string numérico, ej. `"3"`). El borrador tiene hex y está mal.

---

## 6. Checklist

**Fase 0 — Git**
- [x] `git init` en `C:\LosGladiolos\` (rama `main`)
- [x] `.gitignore` verificado (`.env*`, `node_modules`, `.next`, `.vercel`, settings de Claude)
- [x] Primer commit con el material recuperado — 90 archivos
- [ ] Publicado en GitHub como repositorio **privado**

**Fase 1 — Proyecto**
- [ ] Versión recuperada en la carpeta de trabajo
- [ ] Borrador archivado
- [ ] `public/` y configs traídos del borrador

**Fase 2 — Dependencias**
- [ ] Paquetes instalados (Prisma 7, googleapis, @vercel/blob, dotenv, server-only)
- [ ] `npx prisma generate` OK

**Fase 3 — Credenciales**
- [ ] `vercel link` + `vercel env pull .env.local`

**Fase 4 — Revalidación**
- [ ] `tsc --noEmit` y `next build` limpios
- [ ] `migrate status` sin drift
- [ ] Reserva general end-to-end con fotos
- [ ] Confirmación desde el panel + evento en Calendar
- [ ] Reserva de viajante frecuente
- [ ] Bloqueo por lista negra

**Fase 5 — Faltantes**
- [ ] WhatsApp (token, número, plantillas)
- [ ] `CRON_SECRET` + disparador horario
- [ ] Datos bancarios
- [ ] Texto de reglas
- [ ] Fotos del complejo

**Fase 6 — Deploy**
- [ ] Vercel reconectado al repo
- [ ] Variables cargadas en Vercel
- [ ] Datos de prueba limpiados
- [ ] Deploy verificado
