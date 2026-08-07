# Los Gladiolos — Plan de Restauración

> **Estado:** ✅ **Restauración completa** (2026-08-07). Solo queda WhatsApp, que ya era el pendiente conocido de antes de perder la carpeta.
> El proyecto vuelve a guiarse por `PROJECT_CONTEXT.md`.

## ✅ Resultado

El sistema está restaurado en `C:\LosGladiolos\los-gladiolos\` — **única carpeta de código** —, versionado en GitHub y **verificado funcionando en local**:

- `npx tsc --noEmit` y `npx next build` limpios — **16 rutas**, panel admin incluido
- **21 de 21 pruebas de punta a punta** contra la base real de Neon: alta de reserva con asignación automática de departamento, precio desde la matriz de tarifas, rechazo por lista negra, validación de reglas y de fechas, cron protegido por `CRON_SECRET`, y panel admin exigiendo sesión
- **8 de 8 pruebas contra Google Calendar**: autenticación de la cuenta de servicio, creación del evento de día completo con el color del departamento, actualización (reasignación) y borrado (rechazo o seña vencida)

La base se usó de verdad en las pruebas y quedó limpia después (0 reservas, 0 lista negra; se conservan los 4 departamentos, las 35 tarifas y la configuración).

Las carpetas auxiliares `_original_vercel/` y `_recuperado/` se borraron una vez integradas; quedan en el historial de git (commit `918acc7`).

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

Nada de esto bloquea: el fuente de Vercel (Fase 1) trae el proyecto completo. Se deja anotado por si esa vía fallara.

| Qué | Por qué | Cómo se resuelve |
|---|---|---|
| `package.json` con las dependencias reales | El replay de ediciones no aplicó | Viene en el source de Vercel |
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

### Fase 1 — Bajar el código original de Vercel 🔴 siguiente

Vercel conserva el código fuente de los deploys hechos por CLI. **Ese es el original, y es el que se usa como proyecto.** La reconstrucción de `_recuperado/` fue el plan B de cuando no sabíamos que existía esta copia; queda en el repositorio solo como respaldo.

1. Crear un token en **vercel.com/account/tokens** (expiración corta) y **revocarlo apenas termine la descarga**.
2. Bajar el árbol del deployment de producción vía la API de Vercel a `C:\LosGladiolos\_original_vercel\`.
3. **Único chequeo necesario:** comparar la fecha del deployment contra la última edición registrada en el historial (`lib/notificaciones.ts`, 6/8 23:48). Si el deploy es posterior, el fuente de Vercel está completo y no hace falta mirar nada más. Si fuera anterior, revisar solo los archivos tocados en esa ventana.

> No hace falta comparar archivo por archivo contra `_recuperado/`. El de Vercel manda.

### Fase 2 — Reconstituir el proyecto

1. Instalar el fuente de Vercel como la versión de trabajo en `C:\LosGladiolos\los-gladiolos\` (así los paths y la config de Vercel no cambian).
2. Archivar el borrador — sin borrarlo hasta que la Fase 4 esté verificada.
3. Traer del borrador lo que falte: `public/`, `eslint.config.mjs`, `postcss.config.mjs`.

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

**Ver `WHATSAPP.md`**, que tiene el paso a paso completo: token permanente vía usuario del sistema, asignación de activos, plantillas de Meta y pruebas.

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
- [x] Publicado en **https://github.com/francopittavino/LosGladiolos**
- [ ] Confirmar que el repositorio esté en **privado**

**Fase 1 — Original de Vercel**
- [x] Source del deployment de producción descargado (75 archivos)
- [x] Detectado que el deploy (23:09) es **anterior** a la integración de WhatsApp (23:47), y traídos esos 2 archivos del historial
- [ ] **Revocar el token de Vercel**

**Fase 2 — Proyecto**
- [x] Versión buena en `los-gladiolos/`
- [x] Borrador descartado (queda en git, commit `0915862`)
- [x] `public/` con las fotos reales y configs, todo del original

**Fase 3 — Dependencias y credenciales**
- [x] `npm install` + `npx prisma generate` (Prisma 7.9.1)
- [~] `.env.local` armado con base de datos y Blob. **Faltan las de Google Calendar**: el token de proyecto no puede desencriptarlas

**Fase 4 — Revalidación**
- [x] `tsc --noEmit` y `next build` limpios (16 rutas)
- [x] Alta de reserva end-to-end con asignación automática de departamento
- [x] Precio tomado de la matriz de tarifas
- [x] Bloqueo por lista negra (403, y no persiste la reserva)
- [x] Validación de reglas aceptadas y de fechas pasadas
- [x] Cron: 401 sin credencial, 200 con `CRON_SECRET`
- [x] Panel admin exige sesión; `/admin/login` responde
- [ ] Confirmación desde el panel + evento en Calendar — **requiere las credenciales de Google**

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
| 2026-08-07 | Repositorio publicado en GitHub |
| 2026-08-07 | Bajado el fuente original del deployment de producción (75 archivos) vía la API de Vercel |
| 2026-08-07 | Restaurado el proyecto: fuente de Vercel + `whatsapp.ts` y `notificaciones.ts` del historial |
| 2026-08-07 | Verificado en local: build limpio y 21/21 pruebas de punta a punta contra Neon |

---

## 8. Lo único que queda

1. **Revocar el token de Vercel** usado para la restauración.
2. **Borrar del disco el JSON de la clave de Google** (`C:\Users\franc\Downloads\los-gladiolos-*.json`), después de guardarlo en un gestor de contraseñas.
3. **Decidir la visibilidad del repositorio.** Hoy está público. No hay credenciales filtradas (verificado sobre todo el historial), pero queda a la vista la lógica de autenticación del panel y cómo se sirven las fotos de DNI.
4. **Confirmar a qué calendario apunta producción.** El `GOOGLE_CALENDAR_ID` que se cargó en local es el de "Los Gladiolos PRUEBAS".
5. **WhatsApp** — ver Fase 5. Es lo único del sistema que sigue sin estar.
