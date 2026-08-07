# Los Gladiolos — Sistema de Reservas Online

> **Documento maestro de contexto del proyecto.**
> Cualquier modelo de IA que trabaje en este proyecto debe leer este archivo primero.
>
> **Última actualización:** 2026-08-07 — auditoría completa + recuperación del código perdido.
> **Ver también:** `RESTAURACION.md` (plan de trabajo vigente) y `CREDENTIALS.md` (estado de cuentas).

---

## 0. Estado del proyecto

El proyecto está **restaurado y verificado**. El código vive en `C:\LosGladiolos\los-gladiolos\`, versionado en **https://github.com/francopittavino/LosGladiolos**.

El 6/8 se perdió la carpeta de trabajo (`OneDrive\Escritorio\LosGladiolos System\`), pero **producción nunca se cayó**. El 7/8 se restauró bajando el fuente del deployment de producción que Vercel conserva, más dos archivos de la integración de WhatsApp que se escribieron después del último deploy y se recuperaron del historial de la sesión.

Verificado el 7/8: `tsc --noEmit` y `next build` limpios (16 rutas) y 21/21 pruebas de punta a punta en verde contra la base real.

**`los-gladiolos/` es la única carpeta de código.** Las auxiliares de la restauración (`_original_vercel/`, la copia bajada de Vercel, y `_recuperado/`, la reconstrucción desde el historial) se borraron una vez integradas; quedan en el historial de git, commit `918acc7`. El borrador incompleto del 6/8 a la tarde también, en el commit `0915862`.

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

Fuente de verdad: `los-gladiolos/prisma/schema.prisma`, con 4 migraciones versionadas en `prisma/migrations/`. **Coincide exactamente con lo que hay aplicado en Neon** (verificado contra `information_schema` el 7/8).

Modelos: `Departamento`, `Reserva`, `PersonaHuesped`, `ViajanteFrecuente`, `TarifaMatriz`, `ListaNegra`, `ConfiguracionGeneral`.
Enums: `EstadoReserva` (PENDIENTE, CONFIRMADA, SENIA_PAGADA, RECHAZADA, CANCELADA_SIN_SENIA), `Planta` (BAJA, ALTA).

Puntos a tener presentes:

- **`ConfiguracionGeneral`** es una fila única con `id = "singleton"`. Guarda `porcentajeSenia` (default **30**), `plazoVencimientoHoras` (default **24**), `textoReglas` y `ultimoRecordatorioPendientes`. Acá es donde el dueño edita las reglas del negocio sin tocar código.
- **`colorCalendario`** guarda un **`colorId` de Google Calendar** (string numérico, ej. `"3"`), **no** un color hexadecimal.
- `PersonaHuesped` tiene `onDelete: Cascade` sobre la reserva.
- `ViajanteFrecuente.numeroDni` es `@unique` — es la clave con la que el huésped se identifica en la web.
- Hay 4 migraciones versionadas en `prisma/migrations/`, desde `20260806190701_init`.
- **Prisma 7 exige un driver adapter.** El cliente se instancia con `PrismaPg` (`@prisma/adapter-pg` + `pg`); no funciona sin él.

---

## 5. Estado Real de la Base de Datos (Neon)

Verificado el **2026-08-07**. Esquema aplicado y con datos reales:

| Tabla | Filas | Detalle |
|---|---|---|
| `Departamento` | 4 | ids literales `"Departamento 1"`…`"Departamento 4"`, capacidad 5, 2 BAJA + 2 ALTA |
| `TarifaMatriz` | 35 | matriz completa 1–5 personas × 1–7 noches. Ej: 1 persona/1 noche = $15.000 |
| `Reserva` | 0 | — |
| `PersonaHuesped` | 0 | — |
| `ViajanteFrecuente` | 0 | — |
| `ListaNegra` | 0 | — |
| `ConfiguracionGeneral` | 1 | singleton: seña **30%**, plazo **24 hs**, texto de reglas ya cargado (1201 caracteres) |
| `_prisma_migrations` | — | historial de las 4 migraciones aplicadas |

Los datos de prueba del 6/8 se borraron el 7/8. **Reservas, huéspedes, viajantes y lista negra están en cero**; para probar el panel admin hay que cargar algo primero.

---

## 6. Endpoints y Rutas

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

| Variable | En Vercel | En `.env.local` |
|---|---|---|
| `DATABASE_URL` | ✅ | ✅ |
| `BLOB_READ_WRITE_TOKEN` | ✅ | ✅ |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | ✅ `reservas@los-gladiolos.iam.gserviceaccount.com` | ✅ |
| `GOOGLE_PRIVATE_KEY` | ✅ | ✅ clave nueva generada el 7/8 |
| `GOOGLE_CALENDAR_ID` | ✅ | ⚠️ apunta al calendario **"Los Gladiolos PRUEBAS"** |
| `ADMIN_PANEL_PASSWORD` | ✅ | ⚠️ valor local de desarrollo |
| `CRON_SECRET` | ✅ | ⚠️ valor local de desarrollo |
| `NEXT_PUBLIC_BASE_URL` | ✅ | ✅ `http://localhost:3000` |
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ | ⬜ |
| `WHATSAPP_ACCESS_TOKEN` | ⬜ **Pendiente** | ⬜ |
| `WHATSAPP_ADMIN_PHONE` | ⬜ **Pendiente** | ⬜ |

**Las variables de Vercel son de tipo `sensitive`: no se pueden leer de vuelta**, ni por API ni con `vercel env pull`. Producción anda porque Vercel ya las tiene, pero para local hubo que **regenerar** la clave de Google. Ver `CREDENTIALS.md`.

El CLI de Prisma lee `.env.local` gracias a `prisma.config.ts`, que hace `config({ path: ".env.local" })` con `dotenv`.

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
| 8 | Cron de vencimiento de seña | ✅ Completo y **andando**: cron-job.org le pega cada hora en producción |
| 9 | Deploy final en Vercel | ✅ Vivo en https://los-gladiolos.vercel.app — 🔄 falta que deploye desde GitHub en vez del CLI |

> Estos ✅ están **verificados el 7/8**: build limpio, 21/21 pruebas de punta a punta contra la base real y 8/8 contra la API de Google Calendar (crear, actualizar y borrar eventos).

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
| 2026-08-07 | Poner el proyecto bajo git y publicarlo en GitHub | Es lo que evita que esto vuelva a pasar |
| 2026-08-07 | Restaurar desde el **fuente que Vercel guarda del deployment**, no desde la reconstrucción | Es el original exacto; trajo el `package.json` real, la migración inicial y las fotos del complejo |
| 2026-08-07 | Diseño **bordó/crema con Tailwind** | Es el que está integrado con el backend; se descartó el verde botánico del borrador |

---

## 11. Pendientes de Definición (negocio)

- [ ] **Datos bancarios** para la transferencia de la seña — hoy el mensaje de WhatsApp dice literalmente "(Datos bancarios pendientes de cargar)". Ver `lib/notificaciones.ts`, constante `DATOS_BANCARIOS`; conviene moverlo a `ConfiguracionGeneral`.
- [ ] **Token de WhatsApp** y número del admin.
- [ ] Plantillas de mensaje aprobadas por Meta, para poder escribirle a huéspedes fuera de la ventana de 24 hs.
- [ ] Qué hacer con estadías de **más de 7 noches** — la matriz de tarifas llega hasta 7.
- [ ] **Apuntar `GOOGLE_CALENDAR_ID` al calendario definitivo.** El que está configurado se llama "Los Gladiolos PRUEBAS"; hay que confirmar si producción usa ese mismo o el real, y compartir el calendario definitivo con la cuenta de servicio.
- [x] ~~Texto de las reglas~~ — cargado en `ConfiguracionGeneral` (1201 caracteres), editable desde el panel.
- [x] ~~Fotos del complejo~~ — en `public/images/`: hero, logo y 3 de galería.
