# Los Gladiolos — Sistema de Reservas Online

> **Documento maestro de contexto del proyecto.**
> Cualquier modelo de IA que trabaje en este proyecto debe leer este archivo primero.
>
> **Última actualización:** 2026-08-11 — falta un solo trámite: el Coexistence del número real.
> **Ver también:** `WHATSAPP.md` (lo único que falta del sistema), `CREDENTIALS.md` (estado de cuentas) y `RESTAURACION.md` (registro de la restauración del 7/8).

---

## ⏸️ Dónde retomar — última sesión: 2026-08-11

**El sistema está completo y funcionando. Falta un solo trámite: el Coexistence del número real. Del lado del código no queda nada.**

### 👉 Lo primero que va a pasar

**El Coexistence, que quedó agendado para la tarde del 11/8 o la mañana del 12/8**, cuando el dueño tenga el celular a mano. Todo lo previo ya está verificado y en verde.

Se lanza desde: `developers.facebook.com` → *Los Gladiolos Reservas* → **Casos de uso** → *Conectar en WhatsApp* → **Paso 2. Configuración de producción** → desplegar *Registrar tu número de teléfono de WhatsApp* → botón **"Añadir número nuevo"**.

> ⚠️ **No se puede hacer en diferido ni por partes.** El código de verificación llega durante el flujo y expira en minutos; si vence, se reinicia todo. Y además del código, el Coexistence pide **escanear un QR con la app de WhatsApp Business** para vincular la Cloud API como dispositivo enlazado. Hace falta el dueño presente, con el celular desbloqueado, los ~5 minutos que dura. Un modelo puede manejar el navegador, pero no puede escanear el QR ni recibir el código.

Apenas eso esté hecho, lo que sigue se hace por API y sin navegador:

```
npx tsx scripts/verificar-whatsapp.ts             # confirma CLOUD_API / CONNECTED
npx tsx scripts/clonar-plantillas.ts --confirmar  # crea las 9 en la WABA real
```

El runbook completo del día de la migración —con las verificaciones y la vuelta atrás— está en `WHATSAPP.md`.

### Avances del 11/8 — todo lo previo al Coexistence quedó verificado

Se relevó el estado real contra la Graph API y el navegador, y **no queda ningún bloqueo salvo el trámite en sí**:

| Qué | Estado |
|---|---|
| Método de pago | ✅ **MasterCard ···· 2840** en la WABA **real** (`403489972840929`) |
| Las 9 plantillas | ✅ **Aprobadas** en la WABA de prueba |
| Número real | 🔴 `ON_PREMISE` / `NOT_VERIFIED` — falta el Coexistence |
| WABA real | 🔴 0 plantillas (bloqueado hasta el Coexistence) |

**El pendiente de `reserva_cancelada_admin_motivo` se puede tachar.** Sigue en MARKETING y Meta no la recategorizó sola, pero da igual: `scripts/clonar-plantillas.ts:24` fuerza `CATEGORIA = "UTILITY"` para todas al crearlas en la WABA real, así que la categoría mala no se arrastra. No hay que editar nada. Conviene igual mirar la categoría que devuelve Meta al crearlas, porque puede reclasificar.

### Avances del 10/8 — se cerró lo último que estaba abierto

Quedó resuelta la decisión de los avisos internos (abajo) y se relevó **dónde y cómo se carga el método de pago**, que era el requisito que faltaba y del que no se sabía la ruta. El detalle está en `WHATSAPP.md`.

Nada de esto tocó código: el sistema sigue como quedó el 9/8.

También se agregó `.claude/skills/closesesion/`, el par de `opensesion`. **Convención nueva del proyecto: durante la sesión no se actualizan los documentos maestros ni se commitea; el registro se hace todo junto al cerrar con `/closesesion`.** Encontrar cambios sin commitear al arrancar es normal, no una anomalía.

### Avances del 9/8 — toda la configuración de Meta quedó lista

Se completó el registro de desarrollador, se creó la app, se aplicó el caso de uso de WhatsApp, se creó el usuario del sistema con los activos asignados y **se generó el token permanente**, que el dueño guardó en su gestor de contraseñas.

| Qué | Valor |
|---|---|
| Aplicación | *Los Gladiolos Reservas* — `1379636740973960` |
| Usuario del sistema | `reservas-bot` — `61592879320056` |
| Número de prueba | +1 (555) 197-7380 |
| **Phone Number ID de prueba** | `1251498061386053` |

**Lo que destrabó todo fue activar la autenticación en dos pasos** del usuario administrador. Meta la exige para acciones sensibles sobre un portafolio y, en vez de decirlo, fallaba con un error genérico. El detalle está en `WHATSAPP.md`.

Las tres variables ya están cargadas en Vercel y **las 9 plantillas están creadas y en revisión** en la WABA de prueba.

También se normalizó el teléfono del huésped en todo el circuito (`lib/telefono.ts`) y **la base quedó vacía**: las 6 reservas que había eran de prueba y ninguna tenía el teléfono en el formato que espera WhatsApp. Se borraron junto con su evento de calendario, para arrancar las pruebas limpio. Los scripts quedaron en `prisma/auditar-telefonos.ts` y `prisma/limpiar-reservas-prueba.ts`.

El código quedó completo: `lib/notificaciones.ts` usa plantillas en los siete avisos, y los nombres, el orden de las variables y el idioma se verificaron contra Meta por la Graph API. Los datos bancarios ya están cargados y el número del alojamiento está habilitado como destinatario de prueba.

### ✅ Decisión cerrada (2026-08-10): los avisos internos van al celular del personal

Los tres avisos internos —reserva nueva, reserva de viajante, recordatorio de pendientes— van por **WhatsApp al celular del personal**, un número distinto del emisor. Eso resuelve el choque con Meta, que **no permite que un número se envíe mensajes a sí mismo**.

**No hay trabajo de código.** Es cambiar `WHATSAPP_ADMIN_PHONE` en Vercel el día de la migración. El número es **`5493434289399`** (+54 9 343 428-9399).

Se evaluó mandarlos a un **grupo de WhatsApp con todos los empleados** y **no se puede**: la Cloud API no envía a grupos, `to` solo acepta un número individual. Lo más parecido sería una lista de destinatarios (fan-out en `lib/notificaciones.ts`), **descartado por costo**: cada empleado es un mensaje facturado y el recordatorio del cron se reenvía cada 2 hs.

> El aviso al huésped sale por WhatsApp desde el número del alojamiento, y el comprobante sigue llegando a esa conversación.

### Lo próximo

**Ya no hay nada en paralelo: todo lo que queda cuelga del Coexistence.**

1. **El Coexistence del número real**, que es el cuello de botella de todo lo demás y lo tiene que hacer el dueño.

   El número figura como **`ON_PREMISE`**: nunca se incorporó a la Cloud API. Hasta que eso no pase no se puede enviar desde él **ni crear las plantillas en la WABA real** — Meta lo bloquea con *"esta cuenta no tiene permiso para crear ni actualizar plantillas"*. Nada de esto se puede adelantar.

2. Después, todo por API: crear las 9 plantillas con `scripts/clonar-plantillas.ts`, esperar aprobación, compartir el calendario real y cambiar las tres variables (`WHATSAPP_PHONE_NUMBER_ID`, `GOOGLE_CALENDAR_ID` y `WHATSAPP_ADMIN_PHONE`).

> Con el número de prueba **no se puede validar el flujo de punta a punta**, por el bug de la lista de destinatarios. La entrega en sí ya está probada y funciona.



### Pendientes sueltos

- [ ] **Revocar el token de Vercel** creado para la restauración → vercel.com/account/tokens
- [ ] **Borrar `C:\Users\franc\Downloads\los-gladiolos-*.json`** (clave privada de Google) después de guardarla en un gestor de contraseñas
- [ ] Decidir si el repositorio de GitHub queda público o pasa a privado
- [x] ~~Cargar los datos bancarios en `/admin/configuracion`~~ — hecho el 9/8

### Lo que NO hay que volver a investigar

- La verificación del negocio en Meta **no hace falta**: el Centro de seguridad dice que esta organización no tiene que completarla.
- **No existe un número de prueba de Meta**: aparece recién al crear la app de desarrollador. Lo que hay conectado es el número real de la empresa.
- Las variables `sensitive` de Vercel **no se pueden leer de vuelta**. Nunca.
- **La Cloud API no envía mensajes a grupos de WhatsApp.** `to` solo acepta un número individual; no hay endpoint de grupos y no lo destraba ninguna verificación.
- **El checklist del Paso 2 en el Developer Console miente sobre el método de pago.** Muestra *"Añade un método de pago"* sin tildar aunque la tarjeta esté cargada, porque esa pantalla está scopeada a la WABA de **prueba**. La fuente de verdad es Facturación y pagos → Cuentas → *Cuentas de WhatsApp*, que lista las dos WABA con su tarjeta.
- **El botón "Añadir número de teléfono" del Administrador de WhatsApp está deshabilitado en la WABA real, y está bien así.** El número ya está ahí, solo que como `ON_PREMISE`: no hay que añadirlo, hay que migrarlo. El flujo va por el Paso 2 del Developer Console, no por ahí.
- **El Coexistence no se puede hacer en diferido ni delegar en un modelo.** El código de verificación expira en minutos y además hay que escanear un QR con la app de WhatsApp Business. Requiere al dueño presente con el celular.

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
- **Distribución de camas** (reglas completas en `lib/camas.ts`, que las comparten el formulario y las dos APIs):
  - **1 persona:** no se pregunta; `camaMatrimonial` y `camasSimples` quedan en `null`
  - **2 a 4:** checkbox de **cama matrimonial** (arranca destildada) + cantidad de **camas simples**, que arranca en una por persona. La matrimonial cuenta 2 plazas y cada simple 1. El **mínimo** es el que hace que las plazas alcancen; el **máximo** es la cantidad de personas, y baja uno si tildan matrimonial. Combinaciones posibles: `2p` → 2 simples, o matrimonial + 0/1 · `3p` → 3 simples, o matrimonial + 1/2 · `4p` → 4 simples, o matrimonial + 2/3
  - **5:** distribución fija de **1 matrimonial + 3 simples**; no se elige, solo se le avisa al huésped

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
3. **Si confirma:** se crea el evento en Google Calendar y le llega WhatsApp al huésped con el monto de seña, los datos bancarios y el plazo (por defecto **1 hora**, dicho como duración y como hora exacta en horario de Argentina).
4. **Si no paga en plazo:** se cancela la reserva (`CANCELADA_SIN_SENIA`), se borra el evento del calendario y se avisa al huésped. Lo dispara el cron y, además, cada pantalla del panel y cada consulta de disponibilidad hacen el barrido "al vuelo".
5. **Si rechaza:** WhatsApp al huésped, no se toca el calendario.
6. También puede marcar la seña como pagada y reasignar departamento (revalida disponibilidad y actualiza Calendar).
7. **Cancelación manual:** sobre una reserva `CONFIRMADA` o `SENIA_PAGADA` hay un botón **Cancelar reserva** (confirmación en dos pasos + motivo opcional). Deja la reserva en `CANCELADA_MANUAL`, libera el departamento, borra el evento y le avisa al huésped por WhatsApp con el motivo.
8. Mientras haya reservas pendientes, el cron le insiste al admin cada 2 horas.

### 3.4.1 Formato del evento en Calendar
El calendario lo lee la persona que limpia, así que el título está armado para que se entienda de un vistazo en la vista de mes, donde se corta enseguida:

```
Depto 1 — 2p — Juan Perez
```

**Departamento → cantidad de personas (`Np`) → nombre.** La cantidad va segunda a pedido de los dueños: es el dato operativo que se mira primero. La descripción del evento lleva el resto (teléfono, disposición de camas, check-in y check-out).

### 3.5 Viajantes Frecuentes
- ABM en el panel admin: nombre, teléfono, **DNI único**, cantidad de personas habitual, dominio del vehículo, foto de DNI, notas.
- El viajante se identifica en la web con su número de DNI y reserva **sin seña y sin cargar documentos**; queda confirmada al instante.
- Al guardar: evento en Google Calendar + WhatsApp al cliente.

---

## 4. Esquema de Base de Datos

Fuente de verdad: `los-gladiolos/prisma/schema.prisma`, con 4 migraciones versionadas en `prisma/migrations/`. **Coincide exactamente con lo que hay aplicado en Neon** (verificado contra `information_schema` el 7/8).

Modelos: `Departamento`, `Reserva`, `PersonaHuesped`, `ViajanteFrecuente`, `TarifaMatriz`, `ListaNegra`, `ConfiguracionGeneral`.
Enums: `EstadoReserva` (PENDIENTE, CONFIRMADA, SENIA_PAGADA, RECHAZADA, CANCELADA_SIN_SENIA, CANCELADA_MANUAL), `Planta` (BAJA, ALTA).

Puntos a tener presentes:

- **`ConfiguracionGeneral`** es una fila única con `id = "singleton"`. Guarda `porcentajeSenia` (default **30**), `plazoVencimientoHoras` (default **1**), `textoReglas` y `ultimoRecordatorioPendientes`. Acá es donde el dueño edita las reglas del negocio sin tocar código.
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
| `ConfiguracionGeneral` | 1 | singleton: seña **30%**, plazo **1 hora**, texto de reglas ya cargado (1201 caracteres) |
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
| `GOOGLE_CALENDAR_ID` | ✅ | ✅ apunta a **"Los Gladiolos PRUEBAS"**, a propósito hasta la migración final |
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
| 8 | Cron de vencimiento de seña | ✅ Completo y **andando**: cron-job.org le pega en producción — ⚠️ con el plazo en 1 hora hay que bajarlo a **cada 5 minutos** |
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
| 2026-08-07 | Plazo de seña a **1 hora** | Lo pidió el dueño: la reserva no puede quedar bloqueando un departamento un día entero esperando la transferencia |
| 2026-08-07 | Estado `CANCELADA_MANUAL` aparte de `CANCELADA_SIN_SENIA` | Son cosas distintas: una la decide el admin, la otra la decide el reloj. Mezclarlas hacía imposible saber por qué se cayó una reserva |
| 2026-08-07 | Barrido de vencidas también al abrir cada pantalla del panel | Con plazos de 1 hora, esperar al cron mostraba reservas ya vencidas como confirmadas |
| 2026-08-08 | Cantidad de personas en el título del evento, como `2p`, justo después del departamento | Lo pidieron los dueños: es lo primero que mira quien limpia, y en la vista de mes el título se corta |
| 2026-08-08 | `camaMatrimonial` es `Boolean?`, no `Boolean` | Con un default `true` no se podría distinguir "matrimonial" de "no aplica", y el calendario mostraría la línea de camas en reservas de 1 persona |
| 2026-08-08 | El mínimo de camas simples baja a 0 si tildan matrimonial | Con mínimo 1 fijo, la pareja típica de 2 obligaba a preparar una cama que no usa nadie |
| 2026-08-08 | Las plazas tienen que alcanzar: `matrimonial×2 + simples >= personas` | No tenía sentido permitir 4 personas con 2 plazas. Se aplica achicando las opciones que se ofrecen, no con un cartel de error: el huésped nunca llega a elegir algo inválido |
| 2026-08-08 | Con matrimonial tildada, el máximo de simples baja uno | Si ya hay una cama que duerme a dos, ofrecer además una simple por cabeza hace preparar camas que no usa nadie. Queda una sola de más como margen |
| 2026-08-08 | Las reglas de camas viven en `lib/camas.ts`, no en `lib/reservas.ts` | `reservas.ts` importa Calendar y notificaciones, que son `server-only`; el formulario público es un componente cliente y necesita las mismas reglas. Duplicarlas era garantizar que pantalla y servidor se contradijeran |
| 2026-08-06 | Eventos de día completo en Calendar, con `end.date` exclusivo | Refleja exactamente las noches ocupadas y evita que dos reservas consecutivas se vean superpuestas |
| 2026-08-06 | Swap de planta baja → alta solo para reservas `PENDIENTE` | Al huésped todavía no se le comunicó su departamento, así que moverlo no rompe ninguna promesa |
| 2026-08-06 | Cancelación de señas vencidas también "al vuelo" | El plan Hobby de Vercel solo permite un cron por día |
| 2026-08-07 | Poner el proyecto bajo git y publicarlo en GitHub | Es lo que evita que esto vuelva a pasar |
| 2026-08-07 | Restaurar desde el **fuente que Vercel guarda del deployment**, no desde la reconstrucción | Es el original exacto; trajo el `package.json` real, la migración inicial y las fotos del complejo |
| 2026-08-07 | Diseño **bordó/crema con Tailwind** | Es el que está integrado con el backend; se descartó el verde botánico del borrador |
| 2026-08-07 | **Completar el sistema con recursos de prueba** (calendario "PRUEBAS" y número de prueba de Meta) y migrar a los reales al final | No se toca el WhatsApp con el que el dueño atiende clientes hasta que todo esté verificado. La migración es solo cambiar dos variables de entorno |
| 2026-08-07 | WhatsApp con **Coexistence** | El dueño sigue atendiendo a mano desde el mismo número |

---

## 11. Pendientes de Definición (negocio)

- [ ] **Datos bancarios** para la transferencia de la seña — hoy el mensaje de WhatsApp dice literalmente "(Datos bancarios pendientes de cargar)". Ver `lib/notificaciones.ts`, constante `DATOS_BANCARIOS`; conviene moverlo a `ConfiguracionGeneral`.
- [ ] **Token de WhatsApp** y número del admin.
- [ ] Plantillas de mensaje aprobadas por Meta, para poder escribirle a huéspedes fuera de la ventana de 24 hs.
- [ ] Qué hacer con estadías de **más de 7 noches** — la matriz de tarifas llega hasta 7.
- [ ] **Migración a recursos reales** (calendario del alojamiento y número de la empresa). Es el último paso planificado, cuando el sistema esté completo — ver `WHATSAPP.md`.
- [x] ~~Texto de las reglas~~ — cargado en `ConfiguracionGeneral` (1201 caracteres), editable desde el panel.
- [x] ~~Fotos del complejo~~ — en `public/images/`: hero, logo y 3 de galería.
