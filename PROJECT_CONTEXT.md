# Los Gladiolos — Sistema de Reservas Online

> **Documento maestro de contexto del proyecto.**
> Cualquier modelo de IA que trabaje en este proyecto debe leer este archivo primero.
>
> **Última actualización:** 2026-08-11 — Coexistence resultó no ser self-service: se contrata Dualhook.
> **Ver también:** `WHATSAPP.md` (lo único que falta del sistema), `CREDENTIALS.md` (estado de cuentas) y `RESTAURACION.md` (registro de la restauración del 7/8).

---

## ⏸️ Dónde retomar — última sesión: 2026-08-11

**El sistema está completo y funcionando. El bloqueo no es técnico: Coexistence no se puede dar de alta por cuenta propia y hay que contratar un proveedor. Se eligió Dualhook (USD 12/mes).**

### 👉 Lo primero que va a pasar

**Verificar la versión de WhatsApp Business en el celular del dueño.** Coexistence exige **2.24.17 o superior** y si no se cumple no sirve nada de lo demás. Es gratis y tarda un minuto: WhatsApp Business → Ajustes → Ayuda → Información de la aplicación.

Después, en este orden:

1. **Mandar el mail a `contact@dualhook.com`** con las cinco preguntas previas (soporte de Coexistence para un +54 ya activo en la app; si la WABA queda en nuestro portafolio con token propio; qué pasa con el número si dan de baja o cierran; tarifa de Meta por mensaje de utilidad en Argentina y quién la factura; si el plan de USD 12 incluye el heartbeat de 13 días). Las dos últimas son las que no se pueden responder probando.
2. **Arrancar la prueba gratis de 14 días**, pero recién cuando el dueño esté disponible para el alta — si no, se consumen días sin usarlos.
3. **Hacer el alta con Coexistence**, con el dueño y el celular presentes: llega un código por WhatsApp desde la cuenta oficial de Facebook Business y hay que tocar *"Conectar"* en la app.

Apenas el número esté en `CLOUD_API`, lo que sigue es por API y sin navegador:

```
npx tsx scripts/verificar-whatsapp.ts             # confirma CLOUD_API / CONNECTED
npx tsx scripts/clonar-plantillas.ts --confirmar  # crea las 9 en la WABA real
```

### Avances del 11/8 (segunda sesión)

- **Se descubrió que la ruta de retomada anterior era falsa.** El botón *Paso 2 → Añadir número nuevo* abre el alta común de un número: sin coexistencia y **scopeada a la WABA de prueba**. Se recorrió hasta el paso previo a verificar y **se abandonó sin registrar nada**.
- **Se confirmó por la documentación de Meta que Coexistence está reservado a Solution Partners y Tech Providers.** Un negocio directo no puede auto-darse de alta. Ese era el muro real, y explica por qué el QR no aparecía en ninguna consola.
- **Se evaluaron proveedores y se eligió Dualhook**, USD 12/mes, el piso del mercado con Coexistence. Detalle y comparativa en `WHATSAPP.md`.
- **Se descartó Evolution API** aun con el dueño dispuesto a asumir el riesgo de baneo — ver abajo.
- **Se parametrizó el host de la Cloud API** en `lib/whatsapp.ts` (`WHATSAPP_API_BASE_URL`, default `graph.facebook.com/v25.0`). Sin la variable el comportamiento es idéntico. `tsc --noEmit` limpio.
- **Se redujo `PROJECT_CONTEXT.md`** de 250 a ~120 líneas, y de paso se corrigió que el stack dice Prisma 7.9.1 (la tabla decía 5.22) y que el token de WhatsApp ya no está pendiente.

### ✅ Decisión cerrada (2026-08-11): se paga proveedor, y es Dualhook

Las dos condiciones del dueño —que no baneen el número y que conserve WhatsApp abierto en el celular— dejan en pie **solo** Coexistence vía proveedor, o avisar por mail. El dueño eligió pagar.

Dualhook a **USD 12/mes** contra 360dialog a EUR 49 y WATI a USD 59. Se eligió por arquitectura, no por precio: **no proxean los mensajes**, la WABA queda en nuestro portafolio y Meta entrega los webhooks directo al servidor, así que si dejaran de operar el número sigue siendo nuestro. Eso acota el riesgo de que sea una empresa chica —**tiene una sola reseña independiente en G2**— y encima dan 14 días de prueba gratis, o sea que se verifica antes de pagar.

Si la prueba no convence, la alternativa con trayectoria es 360dialog por 4× el precio.

### Estado verificado contra la Graph API (11/8)

| Qué | Estado |
|---|---|
| Método de pago | ✅ **MasterCard ···· 2840** en la WABA **real** (`403489972840929`) |
| Las 9 plantillas | ✅ **Aprobadas** en la WABA de prueba |
| Número real | 🔴 `ON_PREMISE` / `NOT_VERIFIED` — bloqueado hasta contratar el proveedor |
| WABA real | 🔴 0 plantillas (bloqueado por lo mismo) |

`reserva_cancelada_admin_motivo` quedó en MARKETING y Meta no la recategorizó, pero **da igual**: `scripts/clonar-plantillas.ts:24` fuerza `CATEGORIA = "UTILITY"` al crearlas en la WABA real. No hay que editar nada; sí conviene mirar la categoría que devuelve Meta al crearlas, porque puede reclasificar.

### Lo próximo

**Todo cuelga de contratar Dualhook y hacer el alta.** Después, por API: crear las 9 plantillas, esperar aprobación, compartir el calendario real y cambiar las variables (`WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `GOOGLE_CALENDAR_ID` y `WHATSAPP_ADMIN_PHONE`). Con Dualhook **no hace falta tocar `WHATSAPP_API_BASE_URL`**: la WABA queda en nuestro portafolio y el default de Meta sirve tal cual.

> Con el número de prueba **no se puede validar el flujo de punta a punta**, por el bug de la lista de destinatarios. La entrega en sí ya está probada y funciona.

### Pendientes sueltos

- [ ] **Revocar el token de Vercel** creado para la restauración → vercel.com/account/tokens
- [ ] **Borrar `C:\Users\franc\Downloads\los-gladiolos-*.json`** (clave privada de Google) después de guardarla en un gestor de contraseñas
- [ ] Decidir si el repositorio de GitHub queda público o pasa a privado
- [ ] Bajar el cron de cron-job.org a **cada 5 minutos** (el plazo de seña es de 1 hora)
- [ ] Que Vercel deploye desde GitHub en vez de por CLI
- [ ] **Confirmar la tarifa de Meta por mensaje de utilidad para Argentina** — no se pudo verificar con fuente oficial; es el único número que falta para cerrar el costo mensual

### Lo que NO hay que volver a investigar

- **Coexistence NO es self-service.** La doc de Meta dice textual *"You must already be a Solution Partner or Tech Provider"*. Un negocio directo no puede auto-darse de alta: hay que ir por un proveedor. Esto invalidó semanas de plan.
- **El botón *Paso 2 → Registrar tu número → Añadir número nuevo* no sirve.** Es el alta común de un número nuevo: asistente de tres pasos, verificación por SMS o llamada, **sin QR ni coexistencia**, y scopeado a la WABA de **prueba**. Se recorrió el 11/8 y se abandonó antes de verificar.
- **Tampoco hay opción de migrar en el Administrador de WhatsApp.** El panel del número solo edita el perfil y el botón de añadir está deshabilitado.
- **Twilio no soporta Coexistence**, por más que sea el más barato por mensaje (USD 0,005 sin abono).
- **Hacerse Tech Provider es desproporcionado**: verificación de empresa (semanas), revisión de app con dos videos de demostración, justificación de acceso avanzado, más implementar Embedded Signup y tres webhooks. Todo para ahorrar USD 12/mes, y encima el marco es para dar de alta números de clientes, no el propio.
- **Evolution API está descartado**, aun con el dueño dispuesto a asumir el riesgo de baneo. No es solo el riesgo: el issue tracker del propio proyecto tiene bucles infinitos de QR y sesiones caídas —y cada caída exige re-escanear con el celular del dueño—, y necesita un VPS de USD 5–10/mes, así que **no ahorra nada** contra los USD 12 de Dualhook.
- La verificación del negocio en Meta **no hace falta**: el Centro de seguridad dice que esta organización no tiene que completarla. (Sí haría falta para ser Tech Provider, camino descartado.)
- **No existe un número de prueba de Meta** hasta crear la app de desarrollador.
- Las variables `sensitive` de Vercel **no se pueden leer de vuelta**. Nunca.
- **La Cloud API no envía mensajes a grupos de WhatsApp.** `to` solo acepta un número individual; no hay endpoint de grupos y no lo destraba ninguna verificación.
- **Meta no permite que un número se envíe mensajes a sí mismo** — por eso los avisos internos van a un número distinto del emisor.
- **El checklist del Paso 2 en el Developer Console miente sobre el método de pago.** Muestra *"Añade un método de pago"* sin tildar aunque la tarjeta esté cargada, porque esa pantalla está scopeada a la WABA de **prueba**. La fuente de verdad es Facturación y pagos → Cuentas → *Cuentas de WhatsApp*.
- **El botón "Añadir número de teléfono" del Administrador de WhatsApp está deshabilitado en la WABA real, y está bien así.** El número ya está ahí como `ON_PREMISE`: no hay que añadirlo, hay que migrarlo, y eso va por el Paso 2 del Developer Console.
- **Meta exige autenticación en dos pasos** en el usuario administrador para acciones sensibles sobre un portafolio; sin eso falla con un error genérico que no lo dice.

---

## 1. Qué es

Sistema de reservas online para **"Los Gladiolos"**, alojamiento por día en Argentina con **4 departamentos** (2 planta baja, 2 planta alta), capacidad **5 personas** cada uno. El dueño **no es programador**: toda la administración va por un panel web protegido con contraseña.

Código en `C:\LosGladiolos\los-gladiolos\` → https://github.com/francopittavino/LosGladiolos
Producción viva en https://los-gladiolos.vercel.app

---

## 2. Stack

| Componente | Tecnología | Notas |
|---|---|---|
| Framework | Next.js 16.3 (App Router) + TypeScript | Turbopack |
| UI | React 19.2 + **Tailwind v4** | Paleta bordó/crema en `app/globals.css` |
| Base de datos | PostgreSQL (Neon, tier gratuito) | Región `sa-east-1`, con pooler |
| ORM | **Prisma 7.9.1** | **Exige driver adapter**: `PrismaPg` (`@prisma/adapter-pg` + `pg`). No funciona sin él |
| Fotos de DNI | Vercel Blob | Privado, servido vía `/api/admin/file` |
| Calendario | Google Calendar API (cuenta de servicio) | `reservas@los-gladiolos.iam.gserviceaccount.com` |
| Mensajería | Meta WhatsApp Cloud API v25.0 | Con plantillas en los 7 avisos |
| Panel admin | Cookie de sesión + `ADMIN_PANEL_PASSWORD` | `lib/adminAuth.ts` |
| Tareas periódicas | `GET /api/cron` con `CRON_SECRET` | Vercel Cron (1×día) + cron-job.org |

`googleCalendar.ts` y `whatsapp.ts` son **best effort**: si faltan credenciales, loguean y siguen. La reserva se guarda igual.

---

## 3. Reglas de negocio que no se deducen del código

- **La base de datos es la fuente de verdad de la disponibilidad**, no Google Calendar. Calendar es el reflejo visual para el dueño y para quien limpia.
- **Swap por accesibilidad:** si las dos unidades de planta baja están ocupadas y una la tiene una reserva `PENDIENTE` que no necesita accesibilidad, se la mueve arriba. Solo `PENDIENTE`, porque al huésped todavía no se le dijo qué departamento le tocaba.
- **Liberación al vuelo:** las señas vencidas se cancelan antes de cada consulta de disponibilidad y al abrir cada pantalla del panel, no solo por cron. El plan Hobby de Vercel permite un solo cron por día y el plazo de seña es de 1 hora.
- **Camas:** las reglas viven en `lib/camas.ts`, compartidas por el formulario (cliente) y las dos APIs. No pueden estar en `lib/reservas.ts` porque este importa módulos `server-only`. Las plazas tienen que alcanzar (`matrimonial×2 + simples >= personas`) y eso se aplica **achicando las opciones ofrecidas**, nunca con un cartel de error. `camaMatrimonial` es `Boolean?` para distinguir "no aplica" (1 persona) de "no quiere".
- **Título del evento de Calendar:** `Depto 1 — 2p — Juan Perez`. La cantidad de personas va segunda a pedido de los dueños: es lo primero que mira quien limpia y en la vista de mes el título se corta.
- **Eventos de día completo** con `end.date` exclusivo, para que dos reservas consecutivas no se vean superpuestas.
- **`CANCELADA_MANUAL` es distinto de `CANCELADA_SIN_SENIA`**: una la decide el admin, la otra el reloj. Mezclarlas hacía imposible saber por qué se cayó una reserva.
- **Viajantes frecuentes:** se identifican con su número de DNI y reservan **sin seña y sin cargar documentos**; queda confirmada al instante.
- **Blacklist por número de DNI** — por eso se pide el DNI como texto además de la foto.
- **Precio por matriz configurable** (`TarifaMatriz`), no por fórmula: el dueño edita cada combinación personas × noches desde el panel.

---

## 4. Base de datos

Fuente de verdad: `los-gladiolos/prisma/schema.prisma`, 4 migraciones versionadas desde `20260806190701_init`. Coincide con lo aplicado en Neon (verificado el 7/8).

Modelos: `Departamento`, `Reserva`, `PersonaHuesped`, `ViajanteFrecuente`, `TarifaMatriz`, `ListaNegra`, `ConfiguracionGeneral`.
Enums: `EstadoReserva` (PENDIENTE, CONFIRMADA, SENIA_PAGADA, RECHAZADA, CANCELADA_SIN_SENIA, CANCELADA_MANUAL), `Planta` (BAJA, ALTA).

- **`ConfiguracionGeneral`** es fila única con `id = "singleton"`: `porcentajeSenia` (**30**), `plazoVencimientoHoras` (**1**), `textoReglas` y `ultimoRecordatorioPendientes`. Acá edita el dueño las reglas del negocio sin tocar código.
- **`colorCalendario`** guarda un **`colorId` de Google Calendar** (string numérico, ej. `"3"`), **no** un hexadecimal.
- `ViajanteFrecuente.numeroDni` es `@unique` — es la clave con la que el huésped se identifica en la web.
- `PersonaHuesped` tiene `onDelete: Cascade` sobre la reserva.

**Datos cargados:** 4 departamentos (`"Departamento 1"`…`"Departamento 4"`), 35 tarifas (matriz 1–5 personas × 1–7 noches; 1 persona/1 noche = $15.000) y el singleton de configuración. **Reservas, huéspedes, viajantes y lista negra en cero** — se vaciaron el 9/8 para arrancar las pruebas de WhatsApp limpio.

---

## 5. Datos de Meta / WhatsApp

| Qué | Valor |
|---|---|
| Aplicación | *Los Gladiolos Reservas* — `1379636740973960` |
| Usuario del sistema | `reservas-bot` — `61592879320056` |
| WABA real | `403489972840929` |
| Número de prueba | +1 (555) 197-7380 |
| Phone Number ID de prueba | `1251498061386053` |
| Número real | +54 9 343 451-2995 — perfil `Los Gladiolos Alojamiento` |
| **Phone Number ID real** | `407269815803738` (confirmado el 11/8) |
| Proveedor de Coexistence | **Dualhook** — USD 12/mes, `contact@dualhook.com` |
| **Celular del personal** (avisos internos) | `5493434289399` — +54 9 343 428-9399 |

El **token permanente** ya está generado y el dueño lo guardó en su gestor de contraseñas.

**Decisión cerrada (10/8):** los tres avisos internos —reserva nueva, reserva de viajante, recordatorio de pendientes— van al **celular del personal**, un número distinto del emisor. Es cambiar `WHATSAPP_ADMIN_PHONE` en Vercel el día de la migración; **no hay trabajo de código**. Se descartó una lista de destinatarios (fan-out) **por costo**: cada empleado sería un mensaje facturado y el recordatorio se reenvía cada 2 hs.

El aviso al huésped sale desde el número del alojamiento, y el comprobante llega a esa conversación.

---

## 6. Variables de entorno

**Las credenciales están en Vercel.** No hay que regenerarlas: `vercel env pull .env.local`. Son de tipo **`sensitive`, no se pueden leer de vuelta** — por eso para local hubo que regenerar la clave de Google (ver `CREDENTIALS.md`).

`DATABASE_URL` · `BLOB_READ_WRITE_TOKEN` · `GOOGLE_SERVICE_ACCOUNT_EMAIL` · `GOOGLE_PRIVATE_KEY` · `GOOGLE_CALENDAR_ID` · `ADMIN_PANEL_PASSWORD` · `CRON_SECRET` · `NEXT_PUBLIC_BASE_URL` · `WHATSAPP_PHONE_NUMBER_ID` · `WHATSAPP_ACCESS_TOKEN` · `WHATSAPP_ADMIN_PHONE`

Las tres de WhatsApp ya están cargadas en Vercel. **`GOOGLE_CALENDAR_ID` apunta a "Los Gladiolos PRUEBAS" a propósito**, hasta la migración final; igual que el número de prueba. La decisión de fondo (7/8) fue **completar el sistema con recursos de prueba y migrar a los reales al final**, para no tocar el WhatsApp con el que el dueño atiende clientes hasta tener todo verificado.

El CLI de Prisma lee `.env.local` gracias a `prisma.config.ts`, que hace `config({ path: ".env.local" })`.

---

## 7. Privacidad

- Las fotos de DNI se guardan en Vercel Blob con **acceso privado** y se sirven solo por `/api/admin/file`, que exige sesión de admin.
- Aplica la **Ley 25.326 de Protección de Datos Personales** (Argentina): consentimiento informado, finalidad específica, derecho de acceso/rectificación/supresión, prohibido transferir a terceros.
- El repositorio **nunca** debe contener `.env*`. El `.gitignore` ya lo cubre.

---

## 8. Pendientes de definición (negocio)

- [ ] Qué hacer con estadías de **más de 7 noches** — la matriz de tarifas llega hasta 7.
- [ ] `DATOS_BANCARIOS` es una constante en `lib/notificaciones.ts`; conviene moverlo a `ConfiguracionGeneral` para que el dueño lo edite sin tocar código. Los datos ya están cargados.

---

## 9. Historia

El 6/8 se perdió la carpeta de trabajo, pero **producción nunca se cayó**. El 7/8 se restauró desde el fuente que Vercel conserva del deployment y se puso el proyecto bajo git — que es lo que evita que vuelva a pasar. El detalle está en `RESTAURACION.md`; las carpetas auxiliares de la restauración quedaron en el commit `918acc7`.

Último estado verificado (7/8): `tsc --noEmit` y `next build` limpios (16 rutas), 21/21 pruebas de punta a punta contra la base real y 8/8 contra Google Calendar.

**Convención del proyecto:** durante la sesión no se actualizan los documentos maestros ni se commitea; el registro se hace todo junto al cerrar con `/closesesion`. Encontrar cambios sin commitear al arrancar es normal, no una anomalía.
