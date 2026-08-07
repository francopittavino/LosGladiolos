# Los Gladiolos — Sistema de Reservas Online

> **Documento maestro de contexto del proyecto.**
> Cualquier modelo de IA que trabaje en este proyecto debe leer este archivo primero para entender el alcance, la arquitectura, las decisiones tomadas y el progreso actual.

---

## 1. Descripción General

Sistema de reservas online para un alojamiento por día llamado **"Los Gladiolos"**, ubicado en Argentina. Tiene **4 departamentos** (2 en planta baja, 2 en planta alta), todos con capacidad de **5 personas**. El sistema se despliega en **Vercel**.

El dueño (admin) **no es programador**, por lo que toda la administración se hace desde un panel web simple protegido con usuario y contraseña.

---

## 2. Stack Técnico

| Componente | Tecnología | Notas |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | Deploy en Vercel |
| Base de datos | PostgreSQL (Neon, tier gratuito) | — |
| ORM | Prisma | — |
| Almacenamiento de fotos | Vercel Blob Storage | Acceso privado, nunca público |
| Calendario | Google Calendar API (cuenta de servicio) | Carga automática de reservas |
| Mensajería | Meta WhatsApp Cloud API (Coexistence) | Mismo número de WhatsApp Business del celular |
| Panel Admin | Protegido con usuario/contraseña | Solo para el dueño |
| Cron Jobs | Vercel Cron | Para vencimiento de señas |

---

## 3. Funcionalidades

### 3.1 Página Pública
- Sección de bienvenida/recibida
- Galería de fotos del complejo
- Formulario de reserva (con pestaña para Huéspedes Generales y pestaña para Viajantes Frecuentes)

### 3.2 Formulario de Reserva (Huésped)
El huésped completa:
- Nombre y teléfono de contacto
- Fechas de estadía y cantidad de personas (hasta 5)
- Checkbox: "Alguna persona no puede subir escaleras"
- Fotos del DNI (frente y dorso) **+ número de DNI ingresado por texto** de cada persona que se aloja.
- **Validación automática contra Lista Negra (Blacklist)**: si algún DNI ingresado está en la lista negra, no se permite completar la reserva.
- Checkbox obligatorio de aceptación de reglas del alojamiento (texto editable, se define después)
- Se muestra el **precio total calculado** según la matriz de tarifas configurable por el admin.

### 3.3 Lógica de Disponibilidad y Asignación Automática
1. Al enviar el formulario, el sistema consulta Google Calendar para ver qué departamentos están libres en esas fechas.
2. Si marcó "no puede subir escaleras" → solo se consideran los 2 departamentos de planta baja.
3. Si hay un departamento disponible → se asigna automáticamente → reserva queda como **PENDIENTE**.
4. Si no hay disponibilidad → se avisa al huésped en el momento, sin notificar al admin.

### 3.4 Notificación y Confirmación (Admin)
1. Reserva PENDIENTE → llega WhatsApp al admin con link a `/admin/reserva/[id]`.
2. En esa página ve todos los datos + fotos de DNI. Dos botones: **Confirmar** o **Rechazar**.
3. **Si confirma:**
   - Se crea evento en Google Calendar (con nombre del departamento en título/color).
   - Le llega WhatsApp al huésped: reserva aprobada, debe pagar seña (% del total) por transferencia, con datos de cuenta y plazo (24-48hs).
4. **Si no paga en plazo:** Cron job cancela la reserva, el departamento vuelve a quedar libre.
5. **Si rechaza:** WhatsApp al huésped avisando, no se toca el calendario.
6. Desde el panel: marcar seña pagada, reasignar departamento (valida disponibilidad, actualiza Calendar).

### 3.5 Viajantes Frecuentes
- Apartado en panel admin para cargar clientes de confianza: nombre, teléfono, cantidad de personas habitual, clave fija de ingreso.
- El cliente frecuente puede ingresar su DNI en la pestaña especial de la página pública para reservar directo sin pedirle DNI ni seña.
- Al guardar: se anota en Google Calendar y le llega WhatsApp al cliente confirmando el departamento asignado.

---

## 4. Esquema de Base de Datos (Prisma)

```prisma
model Departamento {
  id              String   @id @default(cuid())
  nombre          String
  capacidad       Int      @default(5)
  planta          Planta
  colorCalendario String
  reservas        Reserva[]
}

model Reserva {
  id                  String   @id @default(cuid())
  nombreSolicitante   String
  telefono            String
  fechaInicio         DateTime
  fechaFin            DateTime
  cantPersonas        Int
  puedeSubirEscaleras Boolean  @default(true)
  precioTotal         Decimal
  montoSenia          Decimal?
  seniaPagada         Boolean  @default(false)
  vencimientoSenia    DateTime?
  aceptoReglas        Boolean  @default(false)
  estado              EstadoReserva @default(PENDIENTE)
  departamentoId      String?
  departamento        Departamento? @relation(fields: [departamentoId], references: [id])
  viajanteFrecuenteId String?
  viajanteFrecuente   ViajanteFrecuente? @relation(fields: [viajanteFrecuenteId], references: [id])
  googleEventId       String?
  personas            PersonaHuesped[]
  createdAt           DateTime @default(now())
}

model PersonaHuesped {
  id            String  @id @default(cuid())
  reservaId     String
  reserva       Reserva @relation(fields: [reservaId], references: [id])
  nombre        String?
  numeroDni     String?
  fotoDniFrente String?
  fotoDniDorso  String?
}

model ViajanteFrecuente {
  id                   String  @id @default(cuid())
  nombre               String
  telefono             String
  numeroDni            String  @unique
  cantPersonasHabitual Int
  dominioVehiculo      String?
  fotoDni              String?
  notas                String?
  reservas             Reserva[]
}

model TarifaMatriz {
  id           String   @id @default(cuid())
  cantPersonas Int
  cantNoches   Int
  precioTotal  Decimal
  updatedAt    DateTime @updatedAt

  @@unique([cantPersonas, cantNoches])
}

model ListaNegra {
  id        String   @id @default(cuid())
  numeroDni String   @unique
  nombre    String?
  motivo    String?
  createdAt DateTime @default(now())
}

model ConfiguracionGeneral {
  id                    String  @id @default(cuid())
  porcentajeSenia       Decimal @default(30)
  plazoVencimientoHoras Int     @default(24)
  textoReglas           String  @default("")
  updatedAt             DateTime @updatedAt
}

enum EstadoReserva {
  PENDIENTE
  CONFIRMADA
  SENIA_PAGADA
  RECHAZADA
  CANCELADA_SIN_SENIA
}

enum Planta {
  BAJA
  ALTA
}
```

> `ConfiguracionGeneral` es una tabla de una sola fila (fila singleton) que guarda el % de seña, el plazo de vencimiento y el texto de reglas, todo editable desde el panel admin sin tocar código.

---

## 5. Endpoints de la API

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/disponibilidad` | Chequea disponibilidad según fechas/accesibilidad |
| POST | `/api/reservas` | Crea reserva, sube fotos, dispara WhatsApp al admin |
| GET | `/api/reservas/[id]` | Detalle completo para panel admin |
| POST | `/api/reservas/[id]/confirmar` | Confirma, crea evento en Calendar, pide seña por WhatsApp |
| POST | `/api/reservas/[id]/rechazar` | Rechaza y avisa por WhatsApp |
| POST | `/api/reservas/[id]/reasignar` | Cambia departamento, valida y actualiza Calendar |
| POST | `/api/reservas/[id]/marcar-senia-pagada` | Marca el pago como recibido |
| GET | `/api/cron/vencimiento-senia` | Cron job que cancela reservas vencidas sin seña |
| GET/POST | `/api/viajantes` | Lista/crea viajantes frecuentes |
| POST | `/api/viajantes/[id]/reservar` | Reserva directa confirmada para viajante frecuente |

---

## 6. Variables de Entorno

```
DATABASE_URL=                      # Connection string de Neon Postgres
BLOB_READ_WRITE_TOKEN=             # Token de Vercel Blob Storage
GOOGLE_SERVICE_ACCOUNT_EMAIL=      # Email de la cuenta de servicio de Google
GOOGLE_PRIVATE_KEY=                # Clave privada de la cuenta de servicio
GOOGLE_CALENDAR_ID=                # ID del calendario de Google
WHATSAPP_ACCESS_TOKEN=             # Token de acceso de Meta WhatsApp Cloud API
WHATSAPP_PHONE_NUMBER_ID=          # ID del número de teléfono en Meta
WHATSAPP_ADMIN_PHONE=              # Número de WhatsApp del admin (con código de país)
ADMIN_PANEL_PASSWORD=              # Contraseña del panel de administración
NEXT_PUBLIC_BASE_URL=              # URL base del sitio (ej: https://losgladiolos.vercel.app)
```

---

## 7. Privacidad y Datos Sensibles

- Las fotos de DNI se guardan con **acceso privado** (nunca con link público).
- Solo se pueden ver desde el panel admin con login.
- Se debe considerar la **Ley de Protección de Datos Personales (25.326)** de Argentina.

---

## 8. Plan de Trabajo por Etapas

> **Nota (2026-08-06):** este documento se había escrito adelantado como especificación. El código real en `los-gladiolos/` era hasta esta fecha solo el scaffold por defecto de `create-next-app`, sin Prisma ni funcionalidades. La tabla de abajo refleja el estado real verificado en el código, no lo planeado.

| Etapa | Descripción | Estado |
|---|---|---|
| 0 | Configuración de cuentas y credenciales (Vercel, Neon DB) | 🔄 EN CURSO (Neon lista, resto pendiente) |
| 1 | Estructura del proyecto Next.js + Prisma + Neon DB | ✅ COMPLETADO (schema, migración inicial y seed aplicados contra Neon) |
| 2 | Página pública + formulario de reserva + Viajantes Frecuentes | ✅ COMPLETADO (falta logo real, fotos reales y tarifas reales — ver nota) |
| 3 | Lógica de disponibilidad y asignación automática | ✅ COMPLETADO (implementada contra la propia base de datos, ver nota) |
| 4 | Integración con Google Calendar | ✅ COMPLETADO (con calendario de PRUEBA, falta migrar al real) |
| 5 | Integración con WhatsApp Cloud API | ⬜ Pendiente (a propósito, se deja para el final) |
| 6 | Panel admin + confirmación/rechazo + Matriz de precios | ✅ COMPLETADO |
| 7 | Viajantes frecuentes (Panel Admin) | ✅ COMPLETADO |
| 8 | Cron job de vencimiento de seña | ✅ COMPLETADO (falta configurar el servicio externo horario) |
| 9 | Deploy final en Vercel | ✅ COMPLETADO — **EN VIVO: https://los-gladiolos.vercel.app** |

---

## 9. Decisiones Confirmadas (2026-08-06)

- **Tipo de estadía:** por noches (check-in/check-out con fecha de entrada y salida), no por turnos/horas.
- **Matriz de tarifas:** tabla fija de combinaciones exactas `(cantPersonas, cantNoches)`. Rango a cargar: 1 a 5 personas × 1 a 7 noches (35 combinaciones). Si se pide una combinación fuera de rango (más de 7 noches), el formulario no permite reservar y avisa que no hay tarifa cargada para esa estadía.
- **Seña:** porcentaje y plazo de vencimiento (horas) son **configurables desde el panel admin**, no hardcodeados. Requiere un modelo `ConfiguracionGeneral` en la base de datos.
- **Reglas del alojamiento:** arranca con texto placeholder, editable desde el panel admin más adelante.
- **Viajante Frecuente:** la reserva hecha por un viajante frecuente desde la web pública queda **confirmada automáticamente** (sin pasar por aprobación del dueño): se valida disponibilidad, se asigna depto, se crea el evento en Calendar y se envía WhatsApp confirmando el depto, todo sin intervención manual.
- **WhatsApp Coexistence:** al 2026-08-06 no hay nada configurado en Meta (ni cuenta de Meta Business ni número conectado). Es la parte con más tiempo de espera (verificación de negocio), conviene iniciarla en paralelo al desarrollo.
- **Pendiente de definir (no bloquea el desarrollo, se carga como dato/config más adelante):** datos bancarios para la seña, dominio final del sitio, si el login del panel admin es solo contraseña o usuario+contraseña.
- **Identificación de Viajante Frecuente:** se agregó `numeroDni` (único) al modelo `ViajanteFrecuente`. En la web pública, el viajante se identifica ingresando **solo su DNI** (no clave, no teléfono).
- **Ajustes de UX (2026-08-06):** no se permite elegir fecha de entrada anterior a hoy (validado en cliente y servidor); las fotos de DNI se pueden subir por cámara o por archivo; "no puede subir escaleras" se renombró a "movilidad reducida" en toda la web; si ambos deptos de planta baja están ocupados y alguno de esos huéspedes (en estado PENDIENTE, sin necesitar planta baja) puede moverse a planta alta libre, el sistema lo reasigna automáticamente para hacerle lugar a quien sí la necesita (`asignarDepartamento`/`aplicarSwap` en `lib/reservas.ts`); el rechazo por lista negra ahora muestra "El alojamiento no cuenta con disponibilidad para esa fecha" en vez de revelar el motivo real.
- **Cron / vencimiento de seña (2026-08-06):** endpoint único `/api/cron`, protegido con `CRON_SECRET` (header `Authorization: Bearer ...`). Hace dos cosas: (1) cancela reservas CONFIRMADA cuya seña venció sin pagarse — las pasa a CANCELADA_SIN_SENIA, libera el depto y borra el evento del Calendar; (2) le recuerda al admin que tiene reservas PENDIENTE sin revisar, como máximo una vez cada 2hs (controlado por `ConfiguracionGeneral.ultimoRecordatorioPendientes`).
  - **Decisión: las reservas PENDIENTE NUNCA se cancelan solas.** Solo generan recordatorio. El dueño mantiene control total sobre qué aprueba.
  - **Limitación de Vercel Hobby:** el plan gratuito solo permite cron **una vez por día**. Por decisión del usuario (2026-08-06) **se quitó el cron de Vercel** de `vercel.json` — el disparador es exclusivamente cron-job.org cada hora. Igual la red de seguridad principal es la **liberación "al vuelo"**: `asignarDepartamento()` llama a `cancelarSeniasVencidas()` antes de decidir, así un cupo vencido se libera en el instante en que otro huésped lo necesita, sin depender de ningún cron.
- **Deploy (2026-08-06): EN VIVO en https://los-gladiolos.vercel.app.** Variables cargadas en Production: `DATABASE_URL`, `GOOGLE_*`, `ADMIN_PANEL_PASSWORD`, `CRON_SECRET`, `NEXT_PUBLIC_BASE_URL`, `BLOB_*`. Verificado en producción: home carga, `/api/disponibilidad` responde contra Neon, `/api/cron` rechaza sin credencial (401), `/admin/login` responde 200.
  - **⚠️ Trampa a recordar:** cargar variables con `valor | vercel env add` desde PowerShell **corrompe el valor** (agrega/corta caracteres) — la `DATABASE_URL` quedó truncada y el sitio tiraba 500. La forma que SÍ funciona: escribir el valor a un archivo con `[System.IO.File]::WriteAllText` (sin newline final) y usar `cmd /c "npx vercel env add VAR production < archivo"`.
  - Todavía está apuntando al **calendario de PRUEBAS** y sin WhatsApp. No difundir la URL hasta hacer la migración a producción real.
- **Cron externo: ✅ CONFIGURADO (2026-08-06).** cron-job.org pega cada hora a `https://los-gladiolos.vercel.app/api/cron` (GET) con el header `Authorization: Bearer <CRON_SECRET>`. Verificado con un TEST RUN que devolvió 200 en los logs de Vercel. La cuenta de cron-job.org es del usuario. El cron de Vercel fue removido a pedido del usuario (solo permitía 1 vez por día).
- **Google Calendar — PENDIENTE AL LANZAR:** hoy apunta al calendario de pruebas **"Los Gladiolos PRUEBAS"**. Para pasar al real solo hay que cambiar `GOOGLE_CALENDAR_ID` por el ID del calendario real del negocio y **compartir ese calendario con `reservas@los-gladiolos.iam.gserviceaccount.com`** dándole permiso "Hacer cambios en los eventos". La cuenta de servicio y la clave privada no cambian.
- **Google Calendar (2026-08-06):** implementado en `lib/googleCalendar.ts` con cuenta de servicio (JWT). Toda la integración es **best effort**: si faltan credenciales o Google falla, la reserva igual se guarda y la app no rompe — la base de datos sigue siendo la fuente de verdad de la disponibilidad, el calendario es solo el reflejo visual para el dueño. El evento se crea al **confirmar** la reserva (no al recibirla), se actualiza al reasignar departamento, y se elimina al rechazar. Las reservas de viajante frecuente crean el evento en el acto porque nacen confirmadas. Detalle técnico: se usan eventos de día completo donde `end.date` es la fecha de salida — en Google ese campo es exclusivo, así que el bloque pintado representa exactamente las noches ocupadas y dos reservas consecutivas no se ven superpuestas.
- **Galería en carrusel (2026-08-06):** `components/site/Gallery.tsx` pasó de grilla estática a un carrusel tipo "coverflow" (foto activa adelante y grande, las demás atrás achicadas a los costados), con flechas, puntos indicadores, teclado (← →) y arrastre táctil/mouse. Sigue usando los mismos placeholders de color hasta que haya fotos reales del interior. Nota técnica: `aspect-[4/5]` de Tailwind no se aplicaba bien en este caso (conflicto de parseo con la barra `/` en clases arbitrarias) — se resolvió usando alto/ancho fijos en vez de aspect-ratio.
- **Reglamento (2026-08-06):** el texto real ya está cargado en `ConfiguracionGeneral.textoReglas` (reemplazó el placeholder). En el formulario público se muestra como **ventana emergente**: el botón "Acepto el reglamento" queda deshabilitado hasta que el huésped hace scroll hasta el final del texto (`components/reserva/ReglasModal.tsx`).
- **Nota de infraestructura:** la demora ocasional (2-3s) en login o al reservar es Neon (plan gratis) "despertando" tras inactividad, no un bug de la app — ya confirmado midiendo tiempos. Se agregó un aviso visual ("puede tardar unos segundos") en los botones afectados.
- **Cambio (2026-08-06):** se reemplazó `claveIngresoFija` por `dominioVehiculo` (dominio de la patente, dato interno del dueño, no se le comunica nada al viajante por WhatsApp sobre esto) y se agregó `fotoDni` (opcional, para cargar la foto del DNI del viajante una sola vez al darlo de alta, ya que no se le vuelve a pedir en cada reserva).
- **Disponibilidad sin depender de Google Calendar:** la Etapa 3 (chequeo de disponibilidad y asignación automática de departamento) se implementó consultando solapamiento de fechas directamente contra la tabla `Reserva` (estados PENDIENTE/CONFIRMADA/SENIA_PAGADA bloquean el departamento), no contra Google Calendar. Esto permite tener el flujo de reservas 100% funcional y testeable sin necesitar credenciales de Google todavía. Cuando se integre Google Calendar (Etapa 4), va a ser solo para crear el evento visual en el calendario del dueño — la base de datos sigue siendo la fuente de verdad para la disponibilidad.
- **Entorno de pruebas vs. real:** se decidió NO usar cuentas separadas para todo. Neon, Vercel y Blob Storage son los mismos en desarrollo y producción (no hay riesgo, todavía no hay operación real corriendo ahí). Antes de lanzar el sistema en serio hay que: (1) crear un Google Calendar de prueba aparte del calendario real del dueño para no ensuciarlo durante el desarrollo, (2) usar el número de prueba gratuito que da Meta para probar WhatsApp sin tocar el número real del negocio, (3) borrar las reservas de prueba de la base antes de ir a producción. La integración de WhatsApp Cloud API se deja para el final del proyecto a pedido del usuario.
- **Matriz de tarifas actual:** son 35 valores FICTICIOS de prueba (fórmula: $15000 base + $4000 por persona extra, por noche) para poder testear el cálculo de precio. Hay que reemplazarlos por precios reales antes de lanzar (se va a poder hacer desde el panel admin en la Etapa 6, o pedírselos directo al usuario para cargarlos por script).
- **Pendiente visual:** falta el logo real (hay un wordmark de texto "Los Gladiolos" como placeholder) y las fotos reales de la galería (hoy son bloques de color placeholder). La paleta de colores de marca ya está cargada y aplicada en toda la web.
- **Panel admin (2026-08-06):** implementado completo — login solo con contraseña (sesión firmada por cookie HMAC, 12hs de duración), listado de reservas con filtro por estado, detalle con fotos de DNI (servidas de forma privada y autenticada vía `/api/admin/file`), confirmar/rechazar, marcar seña pagada, reasignar departamento, matriz de tarifas editable, lista negra, viajantes frecuentes, y configuración general (seña/plazo/reglas). Todo probado en el navegador end to end.
- **Bug encontrado y arreglado:** las fechas de reserva se mostraban un día antes en el panel admin por conversión de zona horaria (Argentina es UTC-3). Se resolvió formateando siempre con `timeZone: "UTC"` ya que son fechas "puras" sin hora asociada (`lib/format.ts`).
- **Rediseño visual (2026-08-06): COMPLETADO.** La página pública ahora es un shell con 3 pestañas (Inicio / Galería / Reservar) sin recarga de página (`components/site/SiteShell.tsx`). Fondo predominante blanco. El header quedó con fondo bordo (uno de los "carteles violeta" pedidos) porque el logo real (`public/images/logo/logo.png`) es un PNG transparente con texto blanco, pensado para ir sobre violeta — sobre blanco quedaba invisible. Inicio tiene la foto real del alojamiento (`public/images/hero.jpg`) como hero protagonista con overlay de texto, más 3 carteles bordo con datos clave (4 departamentos, hasta 5 personas, reserva online).
- **Fotos pendientes:** el usuario mandó 4 imágenes pero solo 1 es foto limpia del edificio (ahora `hero.jpg`). Las otras 2 son piezas de Instagram ya diseñadas (con texto y logo incrustados, en `public/images/galeria/`, sin usar todavía) y 1 es una foto de un cartel/banner físico (también sin usar). La pestaña Galería sigue con placeholders de color hasta que lleguen fotos reales del interior/depas.
