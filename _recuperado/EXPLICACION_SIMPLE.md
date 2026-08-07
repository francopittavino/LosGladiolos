# Los Gladiolos — Explicación Simple del Stack

> Este documento explica, en criollo y sin tecnicismos, para qué sirve cada pieza del proyecto. Pensalo como el "quién es quién" del sistema.

---

## La idea general con una analogía

Imaginate que el sistema es un **restaurante**:

- **Next.js** es el edificio completo del restaurante: el salón donde entran los clientes (la página web) y también la cocina donde se preparan las cosas (la lógica que procesa reservas, calcula precios, etc.). Todo — lo que ve el huésped y lo que pasa "atrás" — vive en el mismo proyecto Next.js.
- **Neon** es la **despensa/archivo** real donde se guarda todo: reservas, departamentos, DNIs, tarifas. Es una base de datos PostgreSQL, pero en vez de tenerla en una compu propia, vive en la nube (Neon la hostea).
- **Prisma** es el **mozo que habla los dos idiomas**. El código de Next.js no sabe hablar "SQL" (el idioma de las bases de datos) directamente, y a vos tampoco te conviene escribirlo a mano. Prisma es la capa que traduce: vos le decís en código normal "creame una reserva con estos datos" y Prisma la convierte en la instrucción SQL correcta para Neon, y viceversa cuando lee datos. Además, Prisma es quien **crea y actualiza las tablas** en Neon a partir de un archivo llamado `schema.prisma`, que es como el "plano" de la base de datos (qué tablas hay, qué campos tiene cada una).
- **Vercel** es el **local físico** donde funciona el restaurante: el hosting. Cuando el proyecto está "en Vercel", significa que la web ya está online y cualquiera puede entrar a la URL y verla funcionando.
- **Vercel Blob Storage** es un **placard aparte**, separado de la despensa (Neon), pensado para guardar archivos grandes como fotos (las fotos de DNI). No conviene guardar fotos directamente en la base de datos — por eso hay un lugar aparte solo para archivos, con acceso privado.
- **Google Calendar API** es un **enchufe** que conecta el sistema directamente con tu Google Calendar, para que cuando se confirma una reserva, el evento aparezca solo en el calendario, sin que nadie lo cargue a mano.
- **WhatsApp Cloud API (Meta)** es otro **enchufe**, pero para mandar mensajes de WhatsApp automáticos (al admin cuando llega una reserva nueva, al huésped cuando se confirma o se rechaza, etc.), usando el mismo número de WhatsApp Business del celular.
- **Vercel Cron Jobs** es un **despertador**: una tarea programada que se ejecuta sola a cierta hora (por ejemplo, todos los días revisa si alguna seña venció sin pagarse, y si es así, cancela la reserva automáticamente).

---

## ¿Por qué Prisma y no escribir SQL directo?

Tres razones prácticas:

1. **Seguridad de tipos:** si en el código escribís mal el nombre de un campo (ej. `nombreSolicitante` en vez de `nombresolicitante`), Prisma te avisa al instante en el editor, antes de que el error llegue a producción.
2. **Migraciones ordenadas:** cada vez que cambiás el "plano" (`schema.prisma`), Prisma genera automáticamente el archivo SQL necesario para actualizar Neon sin perder los datos que ya había, y queda un historial de todos esos cambios (carpeta `prisma/migrations`).
3. **Menos código repetitivo:** en vez de escribir consultas SQL a mano en cada endpoint, escribís cosas simples como `prisma.reserva.create(...)` o `prisma.reserva.findMany(...)`.

---

## El archivo `.env.local` — la caja fuerte

Es un archivo que vive **solo en tu computadora** (nunca se sube a GitHub, está en `.gitignore`) y guarda todas las claves secretas: la conexión a Neon, el token de Blob Storage, las claves de Google y WhatsApp, la contraseña del panel admin. El código lee esas claves desde ahí en vez de tenerlas escritas directamente — así, si alguien ve el código en GitHub, no ve ninguna contraseña.

Cuando el sitio esté en Vercel, esas mismas claves se cargan de nuevo pero en el panel de Vercel (Settings → Environment Variables), porque `.env.local` no viaja a producción.

---

## Cómo se conectan todas las piezas (resumen visual)

```
Huésped completa el formulario (Next.js, lo que ve en el navegador)
        │
        ▼
El servidor de Next.js procesa la reserva
        │
        ├── Guarda los datos en Neon (a través de Prisma)
        ├── Sube las fotos de DNI a Vercel Blob Storage
        ├── Consulta/crea eventos en Google Calendar
        └── Manda WhatsApp al admin (Meta WhatsApp Cloud API)

Vercel Cron Jobs corre en segundo plano, revisando señas vencidas.

Todo esto vive desplegado en Vercel, y las claves de todos estos
servicios están guardadas en variables de entorno (.env.local en tu
compu, y en la configuración de Vercel una vez deployado).
```

---

## Estado actual (2026-08-06)

- ✅ Neon conectado y funcionando.
- ✅ Prisma configurado, con todas las tablas ya creadas en Neon (`Departamento`, `Reserva`, `PersonaHuesped`, `ViajanteFrecuente`, `TarifaMatriz`, `ListaNegra`, `ConfiguracionGeneral`).
- ⬜ Vercel Blob Storage — pendiente de conseguir el token (ver instrucciones que te pasé aparte).
- ⬜ Google Calendar, WhatsApp — pendientes, se configuran más adelante.
