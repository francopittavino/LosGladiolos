# Los Gladiolos — Puesta en marcha de WhatsApp

> Es lo único del sistema que falta. **El código ya está escrito y funcionando** (`lib/whatsapp.ts` y `lib/notificaciones.ts`): hoy corre en modo *best effort*, o sea que sin credenciales loguea en consola y sigue, sin romper ninguna reserva.
>
> Creado el 2026-08-07.

---

## Antes de empezar: la decisión que hay que tomar primero

**Coexistence.** El número que se conecte a la Cloud API deja de funcionar en la app de WhatsApp Business del celular, salvo que se active el modo Coexistence. Como el dueño usa el número para atender clientes a mano, esto importa:

| Opción | Qué pasa |
|---|---|
| **Coexistence** (lo previsto) | El dueño sigue usando WhatsApp Business en el celular **y** el sistema manda automáticos desde el mismo número. Es lo que se había planeado. |
| **Número nuevo dedicado** | El sistema usa un número aparte. Más simple de configurar, pero el cliente recibe los avisos desde un número distinto al que conoce. |
| **Migración completa** | El número se muda a la Cloud API y el celular deja de usarlo. **No recomendado** para este caso. |

> Definir esto antes de tocar nada en Meta. El resto de los pasos es igual, pero el número que se registra cambia.

---

## Parte A — Lo que hay que hacer en Meta

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

### A.3 Generar el token permanente

Con el usuario del sistema seleccionado → **Generar token nuevo**:

- **App:** la app de WhatsApp
- **Caducidad: Nunca** ← esto es lo que lo hace permanente
- **Permisos:** marcar `whatsapp_business_messaging` y `whatsapp_business_management`

Copiar el token. **Se muestra una sola vez.** Guardarlo en el gestor de contraseñas antes de cerrar la ventana.

### A.4 Anotar el identificador del número

**developers.facebook.com** → la app → **WhatsApp** → **Configuración de la API**.

Ahí figura el **Identificador del número de teléfono** (Phone number ID). Es un número largo.

> Ojo: **no** es el "Identificador de la cuenta de WhatsApp Business" (WABA ID), que aparece justo al lado. Son cosas distintas y se confunden fácil. El que va en `WHATSAPP_PHONE_NUMBER_ID` es el del **número de teléfono**.

### A.5 Agregar el celular del dueño como número de prueba

Mientras la app esté en modo desarrollo, Meta solo deja escribirle a números autorizados.

En la misma pantalla de Configuración de la API → campo **Para** → **Administrar lista de números de teléfono** → agregar el celular del dueño. Le va a llegar un mensaje de WhatsApp que tiene que aceptar.

---

## Parte B — Cargar las variables

### En Vercel (producción)

Proyecto → **Settings** → **Environment Variables**:

| Variable | Valor | Tipo |
|---|---|---|
| `WHATSAPP_ACCESS_TOKEN` | el token permanente de A.3 | **Sensitive** |
| `WHATSAPP_ADMIN_PHONE` | celular del dueño, **solo dígitos con código de país** | Sensitive |
| `WHATSAPP_PHONE_NUMBER_ID` | el identificador de A.4 | ya está cargado — verificar que coincida |

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
| `(#131030) Recipient phone number not in allowed list` | Falta agregar el número en la lista de prueba (paso A.5) |
| `(#131047) Re-engagement message` | Pasaron las 24 hs: hay que usar plantilla |
| `(#200) Permissions error` | Faltó asignar la WABA al usuario del sistema (paso A.2) |
| `(#132001) Template name does not exist` | La plantilla no está aprobada, o el idioma no coincide |

Todos quedan logueados por `lib/whatsapp.ts` con el status y el detalle que devuelve Meta.

---

## Resumen de lo que hace falta

**Del dueño / de negocio:**
- [ ] Decidir Coexistence vs. número nuevo
- [ ] Celular del admin con código de país
- [ ] **Datos bancarios** para la seña
- [ ] Aceptar el mensaje de verificación como número de prueba

**De configuración en Meta:**
- [ ] Usuario del sistema creado
- [ ] App **y** cuenta de WhatsApp asignadas al usuario del sistema
- [ ] Token permanente generado y guardado
- [ ] Identificador del número anotado
- [ ] Las 6 plantillas creadas y aprobadas

**De código:**
- [ ] Mover `DATOS_BANCARIOS` a `ConfiguracionGeneral` y agregarlo al panel
- [ ] Cambiar `enviarTexto()` por `enviarPlantilla()` en los seis avisos
- [ ] Probar el flujo completo de punta a punta

**En Vercel:**
- [ ] Las tres variables cargadas + redeploy
