---
name: opensesion
description: Ponerse en contexto del proyecto Los Gladiolos al arrancar una sesión, gastando pocos tokens. Usar cuando el usuario dice "OpenSesion", "/opensesion", "ponete en contexto", "dónde quedamos", "retomemos", "arrancá la sesión" o abre una sesión nueva sin decir en qué trabajar.
---

# OpenSesion — ponerse en contexto de Los Gladiolos

Objetivo: entender el estado real del proyecto y dónde se retoma, **sin leer la
documentación completa**.

## Por qué hay un procedimiento y no un "leé los docs"

Los cuatro documentos maestros de la raíz suman ~1560 líneas (~100 KB, ≈30k
tokens). Leerlos enteros cada sesión es el desperdicio que esta skill evita.
No hace falta: el proyecto mantiene un **punto de retomada curado** al tope de
`PROJECT_CONTEXT.md`, y los mensajes de commit son narrativos. Con eso alcanza
para el 90% de los arranques a ~3.5k tokens.

Los docs son la fuente de verdad, no el código: el estado que importa acá es de
trámites con Meta, decisiones de negocio y credenciales, no de arquitectura.

## Procedimiento

### Capa 0 — Git (≈400 tokens)

Las dos en una sola llamada:

```powershell
git -C C:\LosGladiolos status --short
git -C C:\LosGladiolos log --oneline -15
```

Los commits de este repo describen decisiones y hallazgos, no archivos tocados.
El log solo ya cuenta la historia reciente — leelo como tal.

### Capa 1 — El punto de retomada (≈2.5k tokens)

`Read` de `C:\LosGladiolos\PROJECT_CONTEXT.md` con **`limit: 100`**.

Ahí está, por convención del proyecto, la sección `## ⏸️ Dónde retomar` con:
lo primero que va a pasar, los avances de la última sesión, la decisión de
negocio abierta, lo próximo, los pendientes sueltos y —importante— **"Lo que NO
hay que volver a investigar"**. Respetá esa última lista: son callejones sin
salida ya pagados.

Con capas 0 y 1 normalmente ya se puede dar el briefing. Seguí solo si el tema
concreto de la sesión lo pide.

### Capa 2 — Índice de títulos, no contenido (≈700 tokens)

Cuando la sesión toca WhatsApp, credenciales o la restauración, traé **el mapa**
antes que el texto. Un solo comando devuelve los títulos con número de línea:

```powershell
foreach ($f in @('WHATSAPP.md','CREDENTIALS.md','RESTAURACION.md','PROJECT_CONTEXT.md')) {
  Write-Output "===== $f ====="
  $i = 0
  Get-Content "C:\LosGladiolos\$f" -Encoding UTF8 | ForEach-Object {
    $i++; if ($_ -match '^#{2,3} ') { "{0,4}: {1}" -f $i, $_ }
  }
}
```

`-Encoding UTF8` es obligatorio: sin eso Windows PowerShell 5.1 devuelve los
acentos y emojis destrozados.

### Capa 3 — Lectura dirigida

Con el número de línea del índice, `Read` con `offset` y `limit` ajustados a esa
sección. Nunca el archivo entero. `WHATSAPP.md` son 843 líneas y ninguna sesión
necesita más de dos o tres de sus secciones.

## Prohibido al ponerse en contexto

- Leer `node_modules/`, `.next/`, `package-lock.json` o `tsconfig.tsbuildinfo`.
- Volcar `.env.local`. Si hace falta saber qué variables existen, listá solo los
  nombres y nunca los valores:
  `Select-String -Path C:\LosGladiolos\los-gladiolos\.env.local -Pattern '^[A-Z_]+=' | ForEach-Object { ($_.Line -split '=')[0] }`
- Correr `next build`, `tsc` o la suite de tests "para ver cómo está". Es caro y
  no aporta contexto: el último estado verificado está documentado.
- Recorrer el árbol de código o abrir archivos fuente en exploración. Abrí un
  archivo cuando haya una tarea concreta que lo toque.
- Leer los cuatro docs completos por si acaso. Eso es exactamente lo que esto
  reemplaza.

## Qué entregar

Un briefing de **15 líneas o menos**, en español, con:

1. Estado del sistema en una línea.
2. Dónde se retoma / lo primero que tiene que pasar.
3. El bloqueo o la decisión abierta, si hay.
4. El próximo paso concreto y accionable.
5. Si hay cambios sin commitear, decirlo; si el árbol está limpio, no lo
   menciones.

Cerrá preguntando en qué se trabaja. **No empieces a modificar código** en el
arranque: el briefing es el entregable.

Si algo de lo leído contradice lo que se ve en el repo, decilo en el briefing en
vez de asumir que el doc tiene razón.

## Mantener el atajo vivo

Todo esto es barato porque la sección `## ⏸️ Dónde retomar` está al tope de
`PROJECT_CONTEXT.md` y actualizada. Mantenerla es el trabajo de `/closesesion`,
que es el par de esta skill — es lo que hace que la próxima sesión no tenga que
leer 30k tokens.

⚠️ **Durante la sesión no se actualizan los documentos maestros ni se commitea
nada.** El registro se hace todo junto al cerrar, con `/closesesion`. El código
se edita cuando haga falta y queda en el árbol sin commitear; lo que espera es
la escritura de los docs y los commits. El porqué está en esa skill.

Como consecuencia, **encontrar cambios sin commitear al arrancar es lo normal**,
no una anomalía: puede ser una sesión que se cortó antes de cerrar. Si el árbol
viene sucio, mirá `git diff --stat` y decí en el briefing qué quedó colgado, para
que el usuario decida si eso se registra o se descarta.
