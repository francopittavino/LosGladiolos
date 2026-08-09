# Los Gladiolos — Puesta en marcha de WhatsApp

> Es lo único del sistema que falta. **El código ya está escrito y funcionando** (`lib/whatsapp.ts` y `lib/notificaciones.ts`): hoy corre en modo *best effort*, o sea que sin credenciales loguea en consola y sigue, sin romper ninguna reserva.
>
> Creado el 2026-08-07.

---

## Estrategia: terminar todo con recursos de prueba, migrar al final

**Decidido el 2026-08-07.** El sistema se completa y se valida entero usando el **número de prueba de Meta** y el calendario **"Los Gladiolos PRUEBAS"**. Recién cuando todo funcione se migra a los recursos reales de la empresa.

> Por eso el `GOOGLE_CALENDAR_ID` apunta hoy a un calendario de prueba: **es a propósito**, no es un pendiente.

### Qué se hace ahora, con recursos de prueba

Todo esto **sobrevive a la migración** y no hay que rehacerlo:

- **El token permanente.** Está atado a la app y a la cuenta de WhatsApp Business (WABA), **no al número**. Además evita el vencimiento cada 24 hs del token temporal, que hace insoportable desarrollar.
- **Las plantillas.** Se aprueban a nivel **WABA, no a nivel número**. Las que se creen ahora siguen valiendo después.
- **Todo el código**: datos bancarios en `ConfiguracionGeneral` y el cambio de `enviarTexto()` a `enviarPlantilla()`.

### Qué se hace el día de la migración

Cambiar **dos variables de entorno**, redeployar, y listo:

| Variable | De | A |
|---|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | número de prueba de Meta | número real de la empresa |
| `GOOGLE_CALENDAR_ID` | "Los Gladiolos PRUEBAS" | calendario real del alojamiento |

Antes de cambiar el calendario hay que **compartir el calendario real con `reservas@los-gladiolos.iam.gserviceaccount.com`** con permiso de "Hacer cambios en los eventos".

---

## Lo que hay que tener en cuenta para la migración

### La verificación del negocio en Meta — ✅ no hace falta

Se había marcado como el trámite urgente, porque para conectar un número propio a la Cloud API Meta suele exigir el negocio verificado y el trámite tarda días.

**No aplica a este portafolio.** El Centro de seguridad dice textualmente: *"Tu organización no tiene que completar la verificación"*. Puede volver a pedirla más adelante, para límites de envío más altos.

business.facebook.com → Configuración del negocio → **Centro de seguridad** → Verificación del negocio.

### Coexistence

El número que se conecte a la Cloud API deja de funcionar en la app de WhatsApp Business del celular, salvo que se active Coexistence. **Decidido: se usa Coexistence**, para que el dueño siga atendiendo a mano desde el mismo número.

Esto aplica solo a la migración final: el número de prueba de Meta no lo necesita. Al momento de hacerlo, verificar los requisitos vigentes — el número tiene que estar en la app de **WhatsApp Business** (no en WhatsApp común) y el alta se hace por el flujo de Embedded Signup con coexistencia habilitada.

---

## Limitaciones del número de prueba

- Solo se le puede escribir a **hasta 5 destinatarios pre-registrados** (paso A.5). Alcanza para probar el circuito completo con el celular del dueño, pero **no se puede probar con un huésped real** hasta migrar.
- El número lo provee Meta, no es de la empresa: los mensajes llegan desde un número desconocido para el destinatario.
- Un `(#131030)` al escribirle a alguien no registrado **no es un bug**: es esta limitación.

---

## Estado de la cuenta de Meta (relevado el 2026-08-07)

> ⚠️ **Parcialmente superado por el avance del 9/8.** Sigue valiendo lo del portafolio, la WABA real, el número real y la verificación del negocio. Las dos últimas filas y la consecuencia 1 **ya no aplican**: ver la sección de arriba.

Se recorrió la cuenta entera. Esto es lo que hay, y difiere bastante de lo que se suponía:

| Qué | Estado |
|---|---|
| Portafolio empresarial | ✅ **"Los Gladiolos Alojamiento"** — `business_id` `456438748546584`. (Hay un segundo portafolio, "Alemar Accesorios", que no es de este proyecto) |
| Cuenta de WhatsApp Business (WABA) | ✅ **`403489972840929`**, tipo "Aplicación de WhatsApp Business" — se dio de alta desde la app del celular, que es el camino de Coexistence |
| Número conectado | ✅ **+54 9 343 451-2995**, estado *Conectado*. **Es el número real de la empresa**, con perfil completo: logo, "Alojamiento por día", De los Gladiolos 1340, Crespo, Entre Ríos |
| Identificador del número | **`407269815803738`** |
| Verificación del negocio | ✅ **No hace falta.** El Centro de seguridad dice textualmente: *"Tu organización no tiene que completar la verificación"* |
| App de desarrollador | ❌ **No existe ninguna.** La sección Aplicaciones del portafolio está vacía y la cuenta ni siquiera está registrada como desarrollador |
| Usuario del sistema | ❌ No se puede crear: Meta lo bloquea con *"una aplicación debe formar parte de este porfolio"* |

### Consecuencias

1. **No hay número de prueba de Meta.** Viene con la app de desarrollador, que nunca se creó. Lo que está conectado es el número real.
2. **El `WHATSAPP_PHONE_NUMBER_ID` cargado en Vercel probablemente sea `407269815803738`**, o sea el del número real. No se puede confirmar porque esa variable es `sensitive`.
3. **La verificación del negocio sale de la lista de pendientes.** Se había marcado como el trámite urgente por su demora; Meta no la está exigiendo. Puede volver a pedirla más adelante para límites de envío más altos.
4. Para el token permanente hay que **crear la app de desarrollador**, y eso arranca por registrar la cuenta de Facebook como desarrollador.

---

## ✅ Resuelto: el límite antispam y el registro de desarrollador

Durante el 7/8 la cuenta estuvo con el límite antispam de Facebook activo, que impedía recibir cualquier código y dejó el registro de desarrollador parado en "Verify account". **Se levantó y el registro se completó el 2026-08-09.**

> Queda como referencia por si vuelve a aparecer: el mensaje es *"Reduce la frecuencia o tómate un descanso..."*, dura de horas a 24 hs, y **cada reintento lo extiende**. Mientras dura, Meta no manda ningún mensaje y no avisa. El formulario de registro quiere el número **nacional pelado** (`3435074866` con país Argentina), sin el `9` adelante — a diferencia de `WHATSAPP_ADMIN_PHONE`, donde el `9` sí va.

---

## ✅ Toda la Parte A quedó hecha (2026-08-09)

App creada y vinculada, producto WhatsApp activo, usuario del sistema con los activos asignados y **token permanente generado**. Estos son los identificadores reales del sistema:

| Qué | Valor |
|---|---|
| Aplicación | **Los Gladiolos Reservas** — `1379636740973960` |
| Modo de la app | En desarrollo |
| Correo de contacto de la app | `alemaraccesorios@yahoo.com.ar` (el de la cuenta de Facebook; editable en Configuración → Información básica) |
| Usuario del sistema | **`reservas-bot`** — `61592879320056`, rol Admin |
| Token permanente | Generado con caducidad **Nunca** y los permisos `whatsapp_business_management` + `whatsapp_business_messaging`. Guardado en el gestor de contraseñas del dueño |
| Número de prueba | **+1 (555) 197-7380** |
| **Phone Number ID de prueba** | **`1251498061386053`** |
| WABA de prueba | `1815277973155566` ("Test WhatsApp Business Account") |
| WABA real | `403489972840929` ("Los Gladiolos Alojamiento") |
| Phone Number ID real | `407269815803738` |

**El token alcanza las dos WABAs.** Al usuario del sistema se le asignaron con Acceso total la app y **ambas** cuentas de WhatsApp, la de prueba y la real. Por eso el día de la migración **no hay que regenerar el token**: alcanza con cambiar el `WHATSAPP_PHONE_NUMBER_ID`.

### ⚠️ Corrección importante: el número de prueba sí existe

Este documento afirmaba que "no existe un número de prueba de Meta". **Era una conclusión incorrecta**, derivada de que en ese momento no había ninguna app creada. El número de prueba viene con el caso de uso de WhatsApp de la app, y ahora está disponible.

Esto **rehabilita la estrategia original**: completar y validar el sistema entero con recursos de prueba, y migrar al número real al final.

---

## 🔑 Lo que realmente destrabó todo: la autenticación en dos pasos

Vale la pena dejarlo escrito porque costó horas y el síntoma no tiene nada que ver con la causa.

**Síntoma.** Cualquier intento de vincular una app al portafolio devolvía el error genérico de Meta (*"Lo sentimos. Se ha producido un error"* / *"Se ha producido un problema técnico inesperado"*), por los tres caminos posibles. Además, el asistente de creación mostraba *"No hay empresas disponibles"* y deshabilitaba el botón Siguiente.

**Causa.** El usuario administrador **no tenía activada la autenticación en dos pasos**. Meta la exige para las acciones sensibles sobre un portafolio y, en vez de decirlo, falla con un error genérico. La única pista estaba en la pantalla **Personas** del portafolio, en rojo bajo el nombre del usuario: *"La autenticación en dos pasos no está activada"*.

**Efecto de activarla.** Inmediato y total: el asistente pasó a listar los portafolios con "Los Gladiolos Alojamiento" preseleccionado, la vinculación funcionó de una, y la pantalla de **Usuarios del sistema** —que antes rechazaba la creación con *"una aplicación debe formar parte de este porfolio"*— pasó a funcionar normalmente.

> Al activar la 2FA, Meta **cierra la sesión**. Hay que volver a entrar antes de seguir.

### Dos trampas más del camino, por si hay que rehacerlo

**El asistente estándar de creación es un callejón sin salida.** Desde developers.facebook.com → Crear aplicación, el paso "Empresa" no lista ningún portafolio. Hay que entrar desde **business.facebook.com → Configuración del negocio → Aplicaciones → Añadir → Crear un identificador de la aplicación**, que abre el mismo asistente con `?business_id=...` en la URL.

**El caso de uso solo se define al crear la app.** Si el asistente se corta antes de terminar, la app queda con *Tipo: Ninguno* y **no hay ninguna opción en la interfaz para asignarle un caso de uso después**. WhatsApp nunca va a aparecer entre sus productos. La única salida es suprimir la app y rehacerla. Así se perdió la primera app (`2636276260158140`, ya eliminada).

### Acuerdos que hubo que aceptar

- **Condiciones de Facebook para WhatsApp Business** y **Condiciones de alojamiento de Meta para la API en la nube** — en la pantalla del caso de uso.
- **Política de no discriminación de Facebook** — la pide al crear el primer usuario del sistema.

---

## Parte A — Lo que hay que hacer en Meta

> ✅ **A.1 a A.4 están hechos** (9/8). Se dejan como referencia del procedimiento, con las notas de lo que en la práctica resultó distinto. **A.5 sigue pendiente**: es lo único de esta parte que falta.

### A.1 Crear el usuario del sistema

El token temporal que muestra la pantalla de API Setup **dura 24 horas**. Para producción hace falta uno permanente, y eso solo se consigue a través de un usuario del sistema.

1. Entrar a **business.facebook.com** → **Configuración del negocio**
2. Menú izquierdo → **Usuarios** → **Usuarios del sistema**
3. **Agregar** → nombre, por ejemplo `reservas-bot` → rol **Administrador**

### A.2 Darle acceso a los activos ⚠️ el paso que más se saltea

Sin esto, el token se genera igual pero **falla al enviar**.

Con el usuario del sistema seleccionado → **Agregar activos**:

- **Apps** → la app de WhatsApp → activar **Control total**
- **Cuentas de WhatsApp** → la cuenta de WhatsApp Business (WABA) → activar **Control total**

Hay que asignar **las dos cosas**, no solo la app.

> **Lo que se hizo el 9/8:** se asignaron la app y **las dos WABAs** (la de prueba y la real) con Acceso total, para que el mismo token siga sirviendo después de migrar.
>
> Dos detalles de la pantalla real:
> - Hay **dos entradas llamadas "Cuentas de WhatsApp"** en la lista de tipos de activo. Una son las WABAs; la otra son los números sueltos (ahí figura `5493434512995`). **Asignar el número no hace falta**: los permisos bajan desde la WABA que lo contiene. De hecho quedó sin asignar y el token funciona igual.
> - Dentro de "Acceso total" hay **dos toggles llamados "Todo"**. El primero (administrar configuración, asignar usuarios y enviar mensajes) es el que corresponde. El segundo permite además expulsar a otros administradores y suprimir la cuenta de WhatsApp: **no activarlo**, el bot no lo necesita.

### A.3 Generar el token permanente

Con el usuario del sistema seleccionado → **Generar token nuevo**:

- **App:** la app de WhatsApp
- **Caducidad: Nunca** ← esto es lo que lo hace permanente
- **Permisos:** marcar `whatsapp_business_messaging` y `whatsapp_business_management`

Copiar el token. **Se muestra una sola vez.** Guardarlo en el gestor de contraseñas antes de cerrar la ventana.

### A.4 Anotar el identificador del número

Con el Developer Center nuevo, la pantalla es: **developers.facebook.com** → la app → **Casos de uso** → *Conectar en WhatsApp* → **Paso 1. Probar**.

Ahí figura el **Phone Number ID**. Es un número largo. Para el número de prueba es **`1251498061386053`**.

> Ojo: **no** es el "Identificador de la cuenta de WhatsApp Business" (WABA ID), que aparece justo al lado. Son cosas distintas y se confunden fácil. El que va en `WHATSAPP_PHONE_NUMBER_ID` es el del **número de teléfono**.

### A.5 Agregar el celular del dueño como número de prueba

Mientras la app esté en modo desarrollo, Meta solo deja escribirle a números autorizados.

En la misma pantalla de Configuración de la API → campo **Para** → **Administrar lista de números de teléfono** → agregar el celular del dueño.

#### ⚠️ El formato del número (causa #1 de que no llegue el código)

Para WhatsApp, un celular argentino se identifica con un **`9`** después del código de país:

```
+54 9 343 5074866   →   +5493435074866
    ↑
    este 9 es obligatorio
```

Código de país `54`, después `9`, la característica **sin el 0**, el número **sin el 15**. Si falta el `9`, Meta busca un WhatsApp inexistente y **el código no llega, sin dar ningún error**.

#### El código llega por WhatsApp, no por SMS

Llega como mensaje de WhatsApp desde el número de prueba de Meta. Mirar los SMS no sirve.

#### Si aparece "Reduce la frecuencia o tómate un descanso"

Es la protección antispam **a nivel cuenta de Facebook**, no de WhatsApp. Se dispara por reintentar muchas veces seguidas y **cada reintento la extiende**. Dura de horas a un día. Lo único que funciona es dejar de tocarlo y volver más tarde.

**Este paso no bloquea nada más.** El token permanente (A.1–A.3), las plantillas (Parte C) y la verificación del negocio se pueden hacer igual: ninguno envía mensajes.

---

### A.6 Verificar las credenciales SIN enviar mensajes

Cuando el envío está bloqueado, o simplemente para descartar problemas antes de probar, se puede validar todo con una consulta de lectura:

```
GET https://graph.facebook.com/v25.0/{PHONE_NUMBER_ID}
    Authorization: Bearer {ACCESS_TOKEN}
```

Si devuelve los datos del número, quedan probadas las tres cosas que de verdad pueden estar mal: **el token sirve**, **tiene los permisos** y **el identificador del número es el correcto**. No manda ningún mensaje y no cuenta para ningún límite.

---

## Parte B — Cargar las variables

### En Vercel (producción)

Proyecto → **Settings** → **Environment Variables**:

| Variable | Valor | Tipo |
|---|---|---|
| `WHATSAPP_ACCESS_TOKEN` | el token permanente de A.3, guardado en el gestor de contraseñas | **Sensitive** |
| `WHATSAPP_ADMIN_PHONE` | `5493434512995` | Sensitive |
| `WHATSAPP_PHONE_NUMBER_ID` | **`1251498061386053`** (el de prueba) | ya hay uno cargado — **hay que reemplazarlo** |

> ⚠️ **El `WHATSAPP_PHONE_NUMBER_ID` que está hoy en Vercel no sirve.** Apunta al número real (`407269815803738`) bajo la WABA vieja de Coexistence, que no es la que se usa para probar. Mientras se valide con recursos de prueba tiene que estar el **`1251498061386053`**. Se vuelve al real recién en la migración.

Formato del teléfono: solo números, sin `+`, sin espacios ni guiones. Para un celular argentino sería `549` + característica sin el 0 + número sin el 15. Ejemplo: `5493435074866`.

> `lib/whatsapp.ts` limpia todo lo que no sea dígito, así que no rompe si se cargan espacios — pero el código de país tiene que estar.

Después de cargarlas, **hacer un redeploy** para que las tome.

> ⚠️ Guardar los tres valores en un gestor de contraseñas. Las variables `sensitive` de Vercel **no se pueden leer de vuelta** — es exactamente lo que pasó con las credenciales de Google.

### En local (`.env.local`)

Las mismas tres variables. Con eso los avisos se pueden probar desde `npm run dev`.

---

## Parte C — Las plantillas de Meta

Acá está el punto que más trabajo va a dar, y conviene entenderlo antes de empezar.

**Meta solo permite mandar texto libre dentro de las 24 horas posteriores a que la persona te haya escrito.** Los huéspedes de Los Gladiolos nunca escriben primero: llenan un formulario web. Así que **todos los avisos automáticos caen fuera de esa ventana** y necesitan una plantilla aprobada.

Hoy `lib/notificaciones.ts` usa `enviarTexto()` para los seis avisos. Sirve para probar (si el destinatario escribe primero al número de prueba, se abre la ventana), pero **no para producción**.

`lib/whatsapp.ts` ya tiene lista la función `enviarPlantilla(numero, nombrePlantilla, idioma, parametros)`. Lo que falta es crear las plantillas en Meta y cambiar las llamadas.

> Crear plantillas y mandarlas a aprobar **no envía mensajes**: se puede hacer aunque la cuenta esté con el límite antispam activo.

### Plantillas a crear

En **business.facebook.com** → **Administrador de WhatsApp** → **Plantillas de mensajes** → **Crear plantilla**.

Todas van con categoría **Utilidad** (son transaccionales: se aprueban más rápido y son más baratas que las de Marketing) e idioma **Español**.

| Nombre sugerido | Para quién | Variables |
|---|---|---|
| `nueva_reserva_admin` | Admin | nombre, fechas, personas, departamento, total, link |
| `reserva_aprobada` | Huésped | nombre, fechas, total, monto de seña, vencimiento, datos bancarios |
| `reserva_rechazada` | Huésped | nombre, fechas |
| `viajante_confirmado` | Huésped | fechas, departamento |
| `reserva_cancelada_sin_senia` | Huésped | nombre, fechas |
| `recordatorio_pendientes` | Admin | cantidad, link |

Los textos actuales de `lib/notificaciones.ts` sirven como borrador: hay que reemplazar cada dato variable por `{{1}}`, `{{2}}`, etc., respetando el orden en que se pasan los parámetros.

> **Bloqueante de negocio:** la plantilla `reserva_aprobada` necesita los **datos bancarios** para la transferencia. Hoy el código tiene la constante `DATOS_BANCARIOS` con el texto "(Datos bancarios pendientes de cargar)". Conviene moverlos a `ConfiguracionGeneral` para que el dueño los edite desde el panel sin tocar código.

La aprobación de cada plantilla suele tardar entre minutos y algunas horas.

---

## Parte D — Cómo probarlo

En este orden, porque cada paso descarta una causa distinta de falla:

1. **Que el token sirva.** Con `.env.local` cargado, `whatsappConfigurado()` tiene que devolver `true`.
2. **Un mensaje suelto al admin.** El dueño le escribe primero al número desde su celular (esto abre la ventana de 24 hs) y ahí se prueba `enviarTexto`. Si falla, el error de Meta queda logueado con su código: mirar la consola.
3. **El flujo completo.** Crear una reserva desde el sitio → tiene que llegar el aviso al admin con el link a `/admin/reservas/[id]`.
4. **Confirmar desde el panel** → tiene que llegarle al huésped el aviso de seña.
5. **Fuera de la ventana.** Esperar más de 24 hs sin que el destinatario escriba y volver a probar. Acá es donde va a fallar el texto libre — y es la prueba de que hacen falta las plantillas.

### Errores típicos de Meta

| Qué se ve | Qué significa |
|---|---|
| `(#131030) Recipient phone number not in allowed list` | Falta agregar el número en la lista de prueba (paso A.5) — o está cargado **sin el `9`** |
| `(#131047) Re-engagement message` | Pasaron las 24 hs: hay que usar plantilla |
| `(#200) Permissions error` | Faltó asignar la WABA al usuario del sistema (paso A.2) |
| `(#132001) Template name does not exist` | La plantilla no está aprobada, o el idioma no coincide |

Todos quedan logueados por `lib/whatsapp.ts` con el status y el detalle que devuelve Meta.

---

## Resumen

### ✅ Ya resuelto
- [x] ~~Verificación del negocio~~ — **Meta no la exige** para este portafolio
- [x] Datos bancarios editables desde `/admin/configuracion` (falta que el dueño cargue el valor)

- [x] ~~Límite antispam de la cuenta~~ — se levantó el 9/8
- [x] ~~Registro de desarrollador~~ — completado el 9/8
- [x] ~~Autenticación en dos pasos~~ — activada el 9/8, **era la causa de todos los errores genéricos**
- [x] App creada y vinculada al portafolio: **Los Gladiolos Reservas**, `1379636740973960`
- [x] Caso de uso WhatsApp aplicado y número de prueba obtenido
- [x] Usuario del sistema `reservas-bot` con la app y **las dos WABAs** asignadas
- [x] Token permanente generado (caducidad Nunca) y guardado en el gestor de contraseñas

### Etapa 1 — Completar el sistema con el número de prueba

**En Vercel ← lo próximo**
- [ ] `WHATSAPP_ACCESS_TOKEN` = el token permanente
- [ ] `WHATSAPP_PHONE_NUMBER_ID` = `1251498061386053` (**reemplaza** el que está cargado)
- [ ] `WHATSAPP_ADMIN_PHONE` = `5493434512995`
- [ ] Redeploy
- [ ] Verificar con el `GET` de A.6 que el token y el Phone Number ID son correctos

**Del dueño / de negocio:**
- [ ] **Datos bancarios** para la seña ← bloquea la plantilla `reserva_aprobada`
- [ ] Aceptar el mensaje de verificación como destinatario de prueba (A.5)

**En Meta:**
- [ ] A.5: agregar el celular del dueño a la lista de destinatarios de prueba
- [ ] Las 6 plantillas creadas y aprobadas

**De código:**
- [ ] Cambiar `enviarTexto()` por `enviarPlantilla()` en los seis avisos
- [ ] Flujo completo probado de punta a punta

### Etapa 2 — Migración a los recursos reales

- [ ] Número real dado de alta con **Coexistence**
- [ ] Calendario real compartido con `reservas@los-gladiolos.iam.gserviceaccount.com`
- [ ] `WHATSAPP_PHONE_NUMBER_ID` → `407269815803738` (el real)
- [ ] `GOOGLE_CALENDAR_ID` → calendario real
- [ ] `NEXT_PUBLIC_BASE_URL` → dominio definitivo, si se usa uno propio
- [ ] Redeploy y prueba con una reserva real

> **El token no se toca en la migración.** Ya tiene acceso a la WABA real.
>
> La verificación del negocio salió de esta lista: Meta no la exige para este portafolio. Puede volver a pedirla para límites de envío más altos.
