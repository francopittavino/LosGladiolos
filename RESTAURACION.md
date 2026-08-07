# Los Gladiolos — Plan de Restauración

> **Estado:** plan activo. Iniciado el **2026-08-07**, actualizado el mismo día tras verificar producción.
> Cuando termine, el proyecto vuelve a guiarse por `PROJECT_CONTEXT.md`.

---

## 1. Qué pasó, y qué NO pasó

El **6/8 a la tarde** se empezó el proyecto en `C:\LosGladiolos\los-gladiolos\`: landing y formulario, sin backend.

El **6/8 a la noche** se rehízo y completó el sistema entero en otra carpeta, `C:\Users\franc\OneDrive\Escritorio\LosGladiolos System\`, y **se deployó a producción**. Esa carpeta desapareció del disco.

El **7/8** se retomó por error sobre la carpeta vieja de la tarde, que además estaba rota (dependencias a medio instalar, dos directorios `app/` en conflicto, alias de TypeScript mal apuntado).

### 🟢 Producción nunca se cayó

Verificado el 7/8: **https://los-gladiolos.vercel.app responde 200**, sirviendo la versión buena. El cron de cron-job.org le sigue pegando cada hora. **No se perdió el sistema: se perdió la copia local del código.**

La causa de fondo: el deploy se hizo con `vercel --prod` desde la carpeta local, **nunca desde GitHub**. Sin repositorio remoto, la carpeta era el único lugar donde vivía el código fuente.

### Lo recuperado

Se reconstruyeron **62 archivos** desde el historial de la sesión de Claude Code que los escribió, replayando en orden cronológico cada escritura y edición. Quedaron en `C:\LosGladiolos\_recuperado\los-gladiolos\`.

**La base de datos confirma que esa es la versión real:** el esquema vivo en Neon tiene `ConfiguracionGeneral` y las columnas `ViajanteFrecuente.numeroDni / dominioVehiculo / fotoDni`, que existen **solo** ahí.

### Lo que NO se pudo recuperar del historial

| Qué | Por qué | Cómo se resuelve |
|---|---|---|
| `package.json` con las dependencias reales | El replay de ediciones no aplicó | Bajarlo del source de Vercel (Fase 1) |
| Valores de las credenciales | Nunca pasaron por el historial | `vercel env pull` — están en Vercel |
| `node_modules`, `.next` | No son código fuente | `npm install` |
| Fotos del complejo | Nunca se subieron | Pendiente del dueño |

---

## 2. Estado real del sistema

| Pieza | Estado |
|---|---|
| Base de datos Neon | ✅ Esquema aplicado, 4 departamentos y 35 tarifas cargados |
| Configuración general | ✅ Seña 30%, plazo 24 hs, **texto de reglas ya cargado** (1201 caracteres) |
| Backend y panel admin | ✅ En producción |
| Google Calendar | ✅ Integrado y con credenciales en Vercel |
| Vercel Blob (fotos DNI) | ✅ Integrado y probado |
| **Cron** | ✅ **Hecho.** cron-job.org le pega cada hora a `/api/cron` con el `CRON_SECRET`; verificado con un 200 el 6/8 20:23 |
| Deploy | ✅ Vivo en https://los-gladiolos.vercel.app |
| Copia local del código | 🔄 En restauración |
| Repositorio en GitHub | 🔄 Repo local creado, **falta publicar** |
| **WhatsApp** | ⬜ **Lo único que falta del sistema** |

---

## 3. Decisiones tomadas

- **Se conserva la versión recuperada** y se archiva el borrador de la tarde.
- **Diseño: bordó/crema con Tailwind** — el que está integrado con el backend. El verde botánico del borrador se descarta.
- **WhatsApp se deja para el final**, después de tener el entorno local restaurado y verificado.
- **Datos de prueba: borrados** el 7/8 (reserva "Maria Lopez" + 2 huéspedes, viajante "Juan Prueba", 1 entrada de lista negra). Se conservaron los 4 departamentos, las 35 tarifas y la configuración general.

---

## 4. Plan de trabajo

### Fase 0 — Poner todo bajo git ✅ casi

1. ✅ Repositorio inicializado en `C:\LosGladiolos\`, rama `main`.
2. ✅ `.gitignore` cubre `.env*`, `node_modules`, `.next`, `.vercel` y `**/.claude/settings.local.json`.
3. ✅ Primer commit: 90 archivos, incluido `_recuperado/`.
4. ⬜ **Falta publicar en GitHub.** Agregar el repo a GitHub Desktop lo pone en la lista pero no lo sube: hay que apretar **"Publish repository"** y marcar **"Keep this code private"** (el proyecto maneja fotos de DNI).

> **Git está disponible** vía GitHub Desktop (`C:\Users\franc\AppData\Local\GitHubDesktop\app-3.6.3\resources\app\git\cmd\git.exe`), aunque no está en el PATH.
>
> ⚠️ `los-gladiolos/.claude/settings.local.json` quedó fuera del repo **a propósito**: su lista de permisos tiene la cadena de conexión a Neon con contraseña.

---

### Fase 1 — Contrastar con el código original de Vercel 🔴 siguiente

Vercel conserva el código fuente de los deploys hechos por CLI. Ese es el original exacto; la reconstrucción es un replay y puede diferir en los 27 archivos que se editaron después de escribirse.

1. Entrar al proyecto en Vercel → **Deployments** → el deployment de producción → pestaña **Source**.
2. Descargar el árbol de archivos.
3. Dejarlo en `C:\LosGladiolos\_original_vercel\`.
4. Comparar archivo por archivo contra `_recuperado/`. Donde difieran, **gana el de Vercel**.
5. De ahí sale además el `package.json` real, con la lista de dependencias que el replay no pudo recuperar.

### Fase 2 — Reconstituir el proyecto

1. Dejar la versión buena en `C:\LosGladiolos\los-gladiolos\` (así los paths y la config de Vercel no cambian).
2. Archivar el borrador — sin borrarlo hasta que la Fase 4 esté verificada.
3. Traer del borrador lo que la versión buena no tenga: `public/`, `eslint.config.mjs`, `postcss.config.mjs`.

### Fase 3 — Dependencias y credenciales

```bash
npm install                       # con el package.json real de Vercel
npx prisma generate
npx vercel login && npx vercel link
npx vercel env pull .env.local
```

Dos cosas a tener en cuenta:

- La versión buena usa **Prisma 7**, no la 5.22 del borrador. `prisma.config.ts` depende de `prisma/config`, que existe recién desde Prisma 6.
- **La política `allow-scripts` de npm bloquea el postinstall de Prisma.** Hay que correr `npx prisma generate` a mano después de cada `npm install`. Es exactamente lo que tenía roto el proyecto el 7/8 a la mañana.

### Fase 4 — Revalidación local

1. `npx tsc --noEmit` y `npx next build` — que compilen limpio.
2. `npx prisma migrate status` — las 3 migraciones aplicadas y **sin drift** contra Neon.
3. `npm run dev` y probar de punta a punta:
   - Reserva de huésped general con fotos de DNI → crea la reserva, sube a Blob, asigna departamento.
   - Login en `/admin` → ver la reserva → confirmar → verificar el evento en Google Calendar.
   - Reserva de viajante frecuente por DNI.
   - Reserva con un DNI en lista negra → tiene que rechazarla.
4. Los avisos de WhatsApp deben loguear "sin credenciales" **sin romper** la reserva (comportamiento best effort esperado).

> Para probar el panel hace falta volver a cargar algún dato: la base quedó sin reservas, sin viajantes y sin lista negra.

### Fase 5 — WhatsApp (lo último)

| Tarea | Detalle |
|---|---|
| `WHATSAPP_ACCESS_TOKEN` | Token **permanente** vía System User en Meta Business Settings. El de la pantalla de API Setup dura 24 hs |
| `WHATSAPP_ADMIN_PHONE` | Celular del dueño, solo dígitos con código de país |
| Número de prueba | Agregar el celular como destinatario de prueba en la app de Meta |
| Plantillas aprobadas | Necesarias para escribirle a huéspedes fuera de la ventana de 24 hs de Meta |
| Datos bancarios | Hoy el mensaje dice "(Datos bancarios pendientes de cargar)". Conviene moverlo a `ConfiguracionGeneral` en vez de dejarlo hardcodeado en `lib/notificaciones.ts` |

### Fase 6 — Cerrar

1. Conectar el proyecto de Vercel al repositorio de GitHub, para que los próximos deploys salgan de ahí y no del CLI.
2. Si la app queda en un subdirectorio del repo, configurar el **Root Directory** en Vercel.
3. Cargar las variables de WhatsApp en Vercel.
4. Subir las fotos reales del complejo.

---

## 5. Cosas que NO hay que hacer

1. **No correr `prisma db push` ni `migrate` con el `schema.prisma` del borrador.** Es viejo: borraría `ConfiguracionGeneral` y las columnas nuevas de `ViajanteFrecuente`, con los datos adentro.
2. **No ejecutar `/api/seed` ni `prisma/seed.ts` del borrador.** Los ids de departamento en la base son `"Departamento 1"`…`"Departamento 4"`, distintos de los que usan esos scripts: crearían 4 duplicados en vez de actualizar.
3. **No commitear `.env.local`** ni `los-gladiolos/.claude/settings.local.json`.
4. **No borrar `_recuperado/`** hasta que la Fase 4 esté verificada y commiteada.
5. **No tratar `colorCalendario` como color hexadecimal.** Es un `colorId` de Google Calendar (string numérico, ej. `"3"`).
6. **No usar el cliente Prisma del borrador para consultar la base.** Se generó del esquema viejo y falla al leer `ViajanteFrecuente` (busca `claveIngresoFija`, que no existe).

---

## 6. Checklist

**Fase 0 — Git**
- [x] `git init` en `C:\LosGladiolos\` (rama `main`)
- [x] `.gitignore` verificado
- [x] Primer commit con el material recuperado — 90 archivos
- [ ] **Publicado en GitHub como repositorio privado**

**Fase 1 — Original de Vercel**
- [ ] Source del deployment de producción descargado
- [ ] Comparado contra `_recuperado/`
- [ ] `package.json` real recuperado

**Fase 2 — Proyecto**
- [ ] Versión buena en la carpeta de trabajo
- [ ] Borrador archivado
- [ ] `public/` y configs traídos

**Fase 3 — Dependencias y credenciales**
- [ ] `npm install` + `npx prisma generate`
- [ ] `vercel env pull .env.local`

**Fase 4 — Revalidación**
- [ ] `tsc --noEmit` y `next build` limpios
- [ ] `migrate status` sin drift
- [ ] Reserva general end-to-end con fotos
- [ ] Confirmación desde el panel + evento en Calendar
- [ ] Reserva de viajante frecuente
- [ ] Bloqueo por lista negra

**Fase 5 — WhatsApp**
- [ ] Token permanente + número del admin
- [ ] Número de prueba agregado en Meta
- [ ] Plantillas aprobadas
- [ ] Datos bancarios cargados

**Fase 6 — Cierre**
- [ ] Vercel deployando desde GitHub
- [ ] Variables de WhatsApp en Vercel
- [ ] Fotos del complejo subidas

---

## 7. Registro

| Fecha | Qué se hizo |
|---|---|
| 2026-08-07 | Reconstruidos 62 archivos desde el historial de sesiones |
| 2026-08-07 | Repositorio git inicializado con 90 archivos; `.env` y secretos excluidos |
| 2026-08-07 | Verificado que producción sigue viva y que el cron funciona |
| 2026-08-07 | Elegido el diseño bordó/Tailwind; descartado el verde botánico |
| 2026-08-07 | Borrados los datos de prueba de Neon (1 reserva + 2 huéspedes, 1 viajante, 1 lista negra) |
