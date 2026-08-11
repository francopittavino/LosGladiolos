---
name: closesesion
description: Cerrar la sesión de Los Gladiolos volcando a los documentos y a git todo lo que se hizo. REGLA PERMANENTE DE ESTE PROYECTO — mientras no se ejecute esta skill NO se actualizan los documentos maestros ni se commitea nada; el trabajo queda en el árbol y se persiste todo junto al cerrar. Usar cuando el usuario dice "CloseSesion", "/closesesion", "cerrá la sesión", "guardá todo", "terminamos por hoy" o "listo por hoy".
---

# CloseSesion — cerrar la sesión de Los Gladiolos

Objetivo: que la próxima sesión pueda arrancar con `/opensesion` y ~3.5k tokens
sin haberse perdido nada de esta.

Es el par de `opensesion`. Aquella funciona barata **solo si** ésta se ejecuta:
lo que la hace barata es el punto de retomada curado al tope de
`PROJECT_CONTEXT.md`, y mantenerlo es el trabajo de acá.

## La regla: no se guarda nada hasta que se ejecute esto

**Durante la sesión no se tocan los documentos maestros ni se commitea.**
`PROJECT_CONTEXT.md`, `WHATSAPP.md`, `CREDENTIALS.md` y `RESTAURACION.md` se
escriben **una sola vez, acá**, con todo lo de la sesión junto. Los commits
también se hacen todos acá.

El motivo es que el estado que importa en este proyecto no es el código: son
trámites con Meta, decisiones de negocio y callejones sin salida. Eso recién se
entiende del todo cuando la sesión terminó. Escribirlo a medida que pasa produce
docs contradictorios —una decisión "abierta" tres párrafos antes de cerrarse— y
commits que registran cosas que después cambiaron.

Lo que sí pasa durante la sesión, porque no es "guardar":

- **Editar código.** Los archivos de `los-gladiolos/` se modifican cuando haga
  falta; quedan en el árbol sin commitear hasta el cierre.
- **Cargar variables en Vercel, hacer trámites en Meta, correr scripts.** Eso es
  el trabajo, no el registro.

⚠️ **El riesgo asumido:** si la sesión se corta antes de ejecutar esto, se pierde
el registro. Este proyecto ya perdió una carpeta de trabajo entera el 6/8. Si la
sesión fue larga o cara —un trámite con Meta que no se puede repetir, un hallazgo
que costó horas— **decílo y ofrecé cerrar antes**, en vez de esperar a que el
usuario se acuerde.

## Procedimiento

### 1. Reconstruir qué pasó

Antes de escribir, mirá el árbol para no olvidarte de nada:

```powershell
git -C C:\LosGladiolos status --short
git -C C:\LosGladiolos diff --stat
```

Y repasá la conversación buscando estas cinco cosas, que son las que valen:

1. **Decisiones de negocio** tomadas o cerradas, con el porqué.
2. **Hallazgos sobre Meta / servicios externos** — límites, errores, requisitos
   que no estaban documentados.
3. **Callejones sin salida**: lo que se probó y no funciona. Es lo más valioso,
   porque evita volver a pagarlo.
4. **Estado de trámites**: qué quedó hecho, qué quedó a medias y qué falta.
5. **Cambios de código**, si los hubo.

Lo que NO va: la narración de la sesión, lo que se leyó, ni los pasos que
llevaron a una conclusión que ya se registra.

### 2. Reescribir el punto de retomada

Lo primero y lo más importante. `## ⏸️ Dónde retomar`, al tope de
`PROJECT_CONTEXT.md`, con la fecha de hoy. **Se reescribe, no se le agrega
abajo**: es una foto del presente, no un historial. Lo que dejó de ser cierto se
borra.

Su estructura, en este orden:

- **👉 Lo primero que va a pasar** — la próxima acción concreta, con los comandos
  si los hay.
- **Avances de la sesión** — qué quedó resuelto.
- **🔴 Decisión abierta**, si quedó alguna, con las opciones y qué depende de
  cada una. Si se cerró una que estaba abierta, pasala a ✅ con el porqué.
- **Lo próximo** — numerado, y aclarando qué está en el camino crítico y qué no.
- **Pendientes sueltos** — checkboxes.
- **Lo que NO hay que volver a investigar** — sumale los callejones sin salida de
  esta sesión.

Que entre en ~100 líneas: es lo que `opensesion` lee.

### 3. Propagar al doc específico

El punto de retomada es el resumen; el detalle va al doc que corresponda —
`WHATSAPP.md`, `CREDENTIALS.md` o `RESTAURACION.md`. Ubicá la sección con el
índice de títulos (capa 2 de `opensesion`) y editá **esa** sección.

Si algo que el doc daba por abierto se cerró, corregí el texto viejo. Un doc que
acumula estados contradictorios deja de servir. Cambiá también los títulos que
quedaron mintiendo: `### 🔴 Decisión abierta:` pasa a `### ✅ Resuelto (fecha):`.

### 4. Commitear

Un commit por decisión o por hallazgo, **no uno solo con todo**. Los mensajes de
este repo son narrativos: describen qué se decidió y por qué, no qué archivos se
tocaron. Mirá `git log` para el tono.

- Asunto en infinitivo, ~60 caracteres: *"Cerrar la decision: los avisos van al
  celular del personal"*.
- Cuerpo con el porqué y las consecuencias.
- **Sin acentos ni eñes en el mensaje de commit** — es la convención del repo.
- Cerrar con `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>`.

Usá un here-string de PowerShell (`@'...'@`, con el cierre en la columna 0) para
los mensajes de varias líneas.

**No pushear** salvo que el usuario lo pida.

## Prohibido al cerrar

- **Commitear secretos.** Nunca `.env.local`, ni valores de tokens, claves
  privadas o el contenido de una variable `sensitive`. En los docs van los
  *nombres* de las variables y su estado, jamás el valor.
- Correr `next build`, `tsc` o los tests "para dejar todo verde". Si se tocó
  código y hay que verificarlo, se verifica **antes** de llegar acá.
- Inventar avances. Si algo quedó a medias, se escribe que quedó a medias y en
  qué punto exacto.
- Dejar el punto de retomada apuntando a algo que ya pasó.
- Reescribir historia de git o `git add .` a ciegas: agregá los archivos por
  nombre.

## Qué entregar

Un cierre de **10 líneas o menos**, en español:

1. Qué quedó registrado, en una línea.
2. Los commits creados (hash + asunto).
3. Con qué arranca la próxima sesión.
4. Lo que quedó sin registrar y por qué, si hubo algo.

Si la sesión no produjo nada registrable —solo consultas, sin decisiones ni
cambios— **decílo y no commitees**. Un commit vacío de contenido ensucia el log,
que es la otra mitad de lo que `opensesion` lee.
