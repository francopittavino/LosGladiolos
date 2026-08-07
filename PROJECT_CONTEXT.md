# Los Gladiolos — Sistema de Reservas Online

> **Documento maestro de contexto del proyecto.**
> Cualquier modelo de IA que trabaje en este proyecto debe leer este archivo primero.
>
> **Última actualización:** 2026-08-07 — auditoría completa + recuperación del código perdido.
> **Ver también:** `RESTAURACION.md` (plan de trabajo vigente) y `CREDENTIALS.md` (estado de cuentas).

---

## 0. Lo primero que hay que entender

Existen **dos versiones del código** en el disco, y la que está en el directorio de trabajo habitual **no es la buena**:

| Ruta | Qué es | Estado |
|---|---|---|
| `C:\LosGladiolos\los-gladiolos\` | Primer borrador (6/8 a la tarde). Landing + formulario, sin backend. | ⚠️ Incompleto, es un callejón sin salida |
| `C:\LosGladiolos\_recuperado\los-gladiolos\` | **Sistema completo** (6/8 a la noche). Backend, panel admin, Calendar, WhatsApp, cron, migraciones. | ✅ Esta es la versión buena |

La versión buena se había perdido: vivía en `C:\Users\franc\OneDrive\Escritorio\LosGladiolos System\`, carpeta que ya no existe en disco. Se **reconstruyó el 7/8 a partir del historial de la sesión de Claude Code** que la escribió (`C:\Users\franc\.claude\projects\C--Users-franc-OneDrive-Escritorio-LosGladiolos-System\`), replayando en orden cronológico todas las operaciones de escritura y edición. 62 archivos recuperados.

**La base de datos de Neon confirma que la versión recuperada es la real:** el esquema en producción tiene la tabla `ConfiguracionGeneral` y las columnas `ViajanteFrecuente.numeroDni / dominioVehiculo / fotoDni`, que **solo existen en la versión recuperada**. El borrador tiene un esquema viejo que, si se aplicara, borraría esas columnas.

---

## 1. Descripción General

Sistema de reservas online para un alojamiento por día llamado **"Los Gladiolos"**, en Argentina. Tiene **4 departamentos** (2 en planta baja, 2 en planta alta), todos con capacidad de **5 personas**. Se despliega en **Vercel**.

El dueño (admin) **no es programador**, así que toda la administración se hace desde un panel web simple protegido con contraseña.

---

## 2. Stack Técnico

| Componente | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 16.3 (App Router) + TypeScript | Turbopack |
| UI | React 19.2 + **Tailwind v4** | Paleta bordó/crema definida en `app/globals.css` |
| Base de datos | PostgreSQL (Neon, tier gratuito) | Región `sa-east-1`, con pooler |
| ORM | Prisma 5.22 | Con migraciones versionadas + `prisma.config.ts` |
| Fotos de DNI | Vercel Blob Storage | Acceso privado, servido vía `/api/admin/file` |
| Calendario | Google Calendar API (cuenta de servicio) | `reservas@los-gladiolos.iam.gserviceaccount.com` |
| Mensajería | Meta WhatsApp Cloud API v25.0 | Único integrado sin credenciales todavía |
| Panel Admin | Cookie de sesión + `ADMIN_PANEL_PASSWORD` | `lib/adminAuth.ts` |
| Tareas periódicas | `GET /api/cron` protegido con `CRON_SECRET` | Vercel Cron (1×día) + servicio externo horario |

---

## 3. Funcionalidades

### 3.1 Página Pública
Header, hero, galería del complejo y formulario de reserva con dos modos: huésped general y viajante frecuente.

### 3.2 Formulario de Reserva (Huésped General)
- Nombre y teléfono de contacto
- Fechas de estadía y cantidad de personas
- Checkbox: "alguna persona no puede subir escaleras"
- Por cada huésped: **número de DNI** (texto) + fotos de DNI frente y dorso
- **Validación contra Lista Negra**: si un DNI está bloqueado, la reserva no se completa
- Aceptación obligatoria de las reglas (texto editable desde el panel, modal `ReglasModal`)
- Muestra el **precio total** calculado desde `TarifaMatriz` antes de enviar

### 3.3 Disponibilidad y Asignación Automática
La **base de datos es la fuente de verdad** de la disponibilidad, no Google Calendar. Calendar es solo el reflejo visual para el dueño.

1. Se consideran ocupados los departamentos con reservas en estado `PENDIENTE`, `CONFIRMADA` o `SENIA_PAGADA` que se solapen con el rango pedido.
2. Si marcó "no puede subir escaleras" → solo se consideran los 2 de planta baja.
3. **Swap por accesibilidad:** si ambas unidades de planta baja están ocupadas pero una la tiene una reserva `PENDIENTE` que *no* necesita accesibilidad, el sistema la mueve a planta alta para liberar el lugar. Solo se mueven reservas `PENDIENTE`, porque al huésped todavía no se le comunicó qué departamento le tocaba.
4. Si hay lugar → se asigna automáticamente → reserva queda `PENDIENTE`.
5. Si no hay → se le avisa al huésped en el momento, sin notificar al admin.
6. **Liberación al vuelo:** antes de cada consulta de disponibilidad se cancelan las señas vencidas, así un cupo se libera al instante sin esperar al cron diario.

### 3.4 Notificación y Confirmación (Admin)
1. Reserva `PENDIENTE` → WhatsApp al admin con link a `/admin/reservas/[id]`.
2. Ahí ve todos los datos + fotos de DNI. Botones **Confirmar**, **Rechazar** y **Reasignar**.
3. **Si confirma:** se crea el evento en Google Calendar y le llega WhatsApp al huésped con el monto de seña, los datos bancarios y el plazo.
4. **Si no paga en plazo:** el cron cancela la reserva, borra el evento del calendario y avisa al huésped.
5. **Si rechaza:** WhatsApp al huésped, no se toca el calendario.
6. También puede marcar la seña como pagada y reasignar departamento (revalida disponibilidad y actualiza Calendar).
7. Mientras haya reservas pendientes, el cron le insiste al admin cada 2 horas.

### 3.5 Viajantes Frecuentes
- ABM en el panel admin: nombre, teléfono, **DNI único**, cantidad de personas habitual, dominio del vehículo, foto de DNI, notas.
- El viajante se identifica en la web con su número de DNI y reserva **sin seña y sin cargar documentos**; queda confirmada al instante.
- Al guardar: evento en Google Calendar + WhatsApp al cliente.

---

## 4. Esquema de Base de Datos

Fuente de verdad: `_recuperado/los-gladiolos/prisma/schema.prisma`. **Coincide exactamente con lo que hay aplicado en Neon** (verificado contra `information_schema` el 7/8).

Modelos: `Departamento`, `Reserva`, `PersonaHuesped`, `ViajanteFrecuente`, `TarifaMatriz`, `ListaNegra`, `ConfiguracionGeneral`.
Enums: `EstadoReserva` (PENDIENTE, CONFIRMADA, SENIA_PAGADA, RECHAZADA, CANCELADA_SIN_SENIA), `Planta` (BAJA, ALTA).

Puntos a tener presentes:

- **`ConfiguracionGeneral`** es una fila única con `id = "singleton"`. Guarda `porcentajeSenia` (default **30**), `plazoVencimientoHoras` (default **24**), `textoReglas` y `ultimoRecordatorioPendientes`. Acá es donde el dueño edita las reglas del negocio sin tocar código.
- **`colorCalendario`** guarda un **`colorId` de Google Calendar** (string numérico, ej. `"3"`), **no** un color hexadecimal.
- `PersonaHuesped` tiene `onDelete: Cascade` sobre la reserva.
- `ViajanteFrecuente.numeroDni` es `@unique` — es la clave con la que el huésped se identifica en la web.
- Hay 3 migraciones versionadas en `prisma/migrations/`.

---

## 5. Estado Real de la Base de Datos (Neon)

Verificado el **2026-08-07**. Esquema aplicado y con datos reales:

| Tabla | Filas | Detalle |
|---|---|---|
| `Departamento` | 4 | ids literales `"Departamento 1"`…`"Departamento 4"`, capacidad 5, 2 BAJA + 2 ALTA |
| `TarifaMatriz` | 35 | matriz completa 1–5 personas × 1–7 noches. Ej: 1 persona/1 noche = $15.000 |
| `Reserva` | 1 | prueba "Maria Lopez", CONFIRMADA, seña 30% ($11.400 de $38.000) |
| `PersonaHuesped` | 2 | con fotos de DNI reales subidas a Vercel Blob |
| `ViajanteFrecuente` | 1 | registro de prueba |
| `ListaNegra` | 1 | registro de prueba |
| `ConfiguracionGeneral` | — | fila singleton de configuración |
| `_prisma_migrations` | — | historial de migraciones aplicadas |

Son **datos de prueba de la sesión del 6/8**, no datos productivos. Conviene limpiarlos antes de salir a producción.

---

## 6. Endpoints y Rutas (versión recuperada)

**API pública**

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/disponibilidad` | Chequea disponibilidad y previsualiza la asignación |
| POST | `/api/reservas` | Crea la reserva: valida blacklist, calcula precio, asigna depto, avisa al admin |
| POST | `/api/upload-dni` | Sube las fotos de DNI a Vercel Blob (privado) |
| POST | `/api/viajantes/reservar` | Reserva directa confirmada para viajante frecuente |
| GET | `/api/config` | Configuración pública (texto de reglas) |
| GET | `/api/cron` | Tareas periódicas. Requiere `Authorization: Bearer <CRON_SECRET>` |
| GET | `/api/admin/file` | Sirve las fotos privadas de Blob, solo con sesión de admin |

**Panel admin** (`/admin/login` + grupo `(protected)`): dashboard, detalle de reserva con confirmar/rechazar/reasignar, tarifas, blacklist, viajantes y configuración general. Usa Server Actions, no endpoints REST.

**Librerías** (`lib/`): `prisma.ts`, `reservas.ts` (disponibilidad, asignación, swap, cancelación de señas), `googleCalendar.ts`, `whatsapp.ts`, `notificaciones.ts`, `adminAuth.ts`, `format.ts`.

Tanto `googleCalendar.ts` como `whatsapp.ts` están escritos como **best effort**: si faltan las credenciales, loguean y siguen. La reserva se guarda igual. Esto permite desarrollar sin tener todo configurado.

---

## 7. Variables de Entorno

**Las credenciales están guardadas en Vercel.** No hay que volver a generarlas: se recuperan con `vercel env pull .env.local`.

| Variable | Estado |
|---|---|
| `DATABASE_URL` | ✅ En Vercel y en el `.env.local` actual |
| `BLOB_READ_WRITE_TOKEN` | ✅ En Vercel (falta en el `.env.local` actual) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | ✅ En Vercel — `reservas@los-gladiolos.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | ✅ En Vercel |
| `GOOGLE_CALENDAR_ID` | ✅ En Vercel |
| `ADMIN_PANEL_PASSWORD` | ✅ En Vercel |
| `NEXT_PUBLIC_BASE_URL` | ✅ En Vercel |
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ En Vercel |
| `WHATSAPP_ACCESS_TOKEN` | ⬜ **Pendiente** — es lo único que falta |
| `WHATSAPP_ADMIN_PHONE` | ⬜ **Pendiente** |
| `CRON_SECRET` | ⬜ Pendiente (lo usa `/api/cron`) |

En la versión recuperada, el CLI de Prisma sí lee `.env.local` gracias a `prisma.config.ts`, que hace `config({ path: ".env.local" })` con `dotenv`.

---

## 8. Privacidad y Datos Sensibles

- Las fotos de DNI se guardan en Vercel Blob con **acceso privado** y se sirven únicamente a través de `/api/admin/file`, que exige sesión de admin.
- Aplica la **Ley 25.326 de Protección de Datos Personales** (Argentina): consentimiento informado, finalidad específica (solo la reserva), derecho de acceso/rectificación/supresión, medidas de seguridad adecuadas, prohibido transferir a terceros sin consentimiento.
- El repositorio **nunca** debe contener `.env*`. El `.gitignore` ya lo cubre.

---

## 9. Estado por Etapas

| Etapa | Descripción | Estado |
|---|---|---|
| 0 | Cuentas y credenciales | 🔄 Todo listo menos WhatsApp |
| 1 | Estructura Next.js + Prisma + DB | ✅ Completa |
| 2 | Página pública + formulario | ✅ Completa |
| 3 | Disponibilidad y asignación automática | ✅ Completa (incluye swap por accesibilidad) |
| 4 | Google Calendar | ✅ Código completo, credenciales en Vercel |
| 5 | WhatsApp Cloud API | ✅ Código completo — ⬜ falta el access token |
| 6 | Panel admin | ✅ Completo |
| 7 | Viajantes frecuentes | ✅ Completo |
| 8 | Cron de vencimiento de seña | ✅ Completo — ⬜ falta configurar `CRON_SECRET` y el disparador |
| 9 | Deploy final en Vercel | 🔄 Pendiente de reconectar el repo |

> ⚠️ Estos ✅ significan **"el código existe y fue escrito y probado en la sesión del 6/8"**. Después de la recuperación del 7/8, el proyecto **todavía no se volvió a instalar ni compilar**. Hay que revalidarlo — ver `RESTAURACION.md`.

---

## 10. Decisiones Tomadas

| Fecha | Decisión | Razón |
|---|---|---|
| 2026-08-06 | Neon como base de datos | Tier gratuito generoso, integración con Vercel, serverless |
| 2026-08-06 | Vercel Blob para las fotos de DNI | Integración nativa, acceso privado configurable |
| 2026-08-06 | Precio por **matriz configurable** (`TarifaMatriz`), no por fórmula | El dueño edita cada combinación personas × noches desde el panel |
| 2026-08-06 | Blacklist por número de DNI | Bloquear huéspedes problemáticos al momento de reservar |
| 2026-08-06 | Pedir el DNI por texto además de la foto | Permite validar la blacklist automáticamente |
| 2026-08-06 | **La DB es la fuente de verdad de la disponibilidad**, no Calendar | Calendar puede fallar o no estar configurado; la reserva no debe depender de eso |
| 2026-08-06 | Seña **30%**, plazo **24 hs** (editables en `ConfiguracionGeneral`) | Valores por defecto acordados |
| 2026-08-06 | Eventos de día completo en Calendar, con `end.date` exclusivo | Refleja exactamente las noches ocupadas y evita que dos reservas consecutivas se vean superpuestas |
| 2026-08-06 | Swap de planta baja → alta solo para reservas `PENDIENTE` | Al huésped todavía no se le comunicó su departamento, así que moverlo no rompe ninguna promesa |
| 2026-08-06 | Cancelación de señas vencidas también "al vuelo" | El plan Hobby de Vercel solo permite un cron por día |
| 2026-08-07 | Recuperar el código desde el historial de sesiones en vez de reescribirlo | El código recuperado es más completo y es el que coincide con la DB |
| 2026-08-07 | Poner el proyecto bajo git | Es lo que evita que esto vuelva a pasar |

---

## 11. Pendientes de Definición (negocio)

- [ ] **Datos bancarios** para la transferencia de la seña — hoy el mensaje de WhatsApp dice literalmente "(Datos bancarios pendientes de cargar)". Ver `lib/notificaciones.ts`, constante `DATOS_BANCARIOS`; conviene moverlo a `ConfiguracionGeneral`.
- [ ] **Token de WhatsApp** y número del admin.
- [ ] **Texto definitivo de las reglas** (se carga desde el panel, en Configuración).
- [ ] **Fotos reales del complejo** para la galería.
- [ ] Qué hacer con estadías de **más de 7 noches** — la matriz de tarifas llega hasta 7.
- [ ] Plantillas de mensaje aprobadas por Meta, para poder escribirle a huéspedes fuera de la ventana de 24 hs.
