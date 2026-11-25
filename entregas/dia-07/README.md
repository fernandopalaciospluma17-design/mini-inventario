# Mini Inventario — Día 7: skill de pruebas y revisor

## 1. Datos generales

- Fecha: 2026-11-24 (America/Mexico_City).
- Repositorio: `fernandopalaciospluma17-design/mini-inventario`.
- Rama base: `origin/main` (`1608abe` al iniciar), porque ya contiene `server.js`, `public/`, `test/`, `tests/` y Playwright.
- Rama de trabajo: `dia-07-skill`, creada en un worktree limpio desde `origin/main`.
- Versiones disponibles: Node.js `24.15.0`, npm `11.12.1`, Python `3.12.10`, Codex CLI `0.171.0-alpha.13.2`. El proyecto declara Node `>=22 <23`.

## 2. Contexto inicial

El worktree original estaba en `dia-06-ci` con eliminaciones locales de dos capturas del Día 5 y varios documentos sin seguimiento, incluido este archivo de instrucciones. No se limpiaron ni se incluyeron. Para aislar el trabajo se creó `C:\Users\craft\OneDrive\Documentos\mini-inventario-dia-07-skill` desde `origin/main`.

La aplicación real está en la raíz y en `public/`. Al comparar las instrucciones del Día 7 con `origin/main`, se encontró que su contexto de aplicación local con `localStorage` quedó desactualizado: la app actual usa Express, Supabase Auth y PostgreSQL con RLS. No se añadió un segundo login ni se cambió el comportamiento funcional.

- Pruebas unitarias existentes: `test/`, con `node:test`; comando `npm test`.
- Pruebas E2E existentes: `tests/inventory.spec.js`; Playwright `@playwright/test` ya está en `package.json`/lockfile.
- Configuración existente: `playwright.config.js`; servidor en puerto 3000 y `/health`.
- Selectores comprobados: etiquetas `Correo electrónico`, `Contraseña`, `Nombre`, `SKU`, `Cantidad`, `Cantidad mínima`; botones de edición accesibles como `Editar <nombre>`; mensajes `#form-message`, `#status-message`.
- `.env.example` declara `SUPABASE_URL`, `SUPABASE_KEY` y `PORT`. Los tests E2E existentes también requieren `TEST_EMAIL` y `TEST_PASSWORD`. No se abrió ni imprimió `.env` ni valores secretos.
- En el worktree limpio no había `node_modules`, `.env` ni variables de prueba en el entorno. `npm ci` instaló 77 paquetes sin cambiar `package.json`/lockfile; avisó que Node 24.15.0 no satisface el rango del proyecto. Playwright 1.65.1 y Chromium `chromium-1255` están disponibles.
- No hay gestor de versiones Node instalado en PATH. El usuario autorizó `npm exec --yes --package=node@22`; se comprobó Node `v22.23.5` sin cambiar el Node del sistema ni los manifiestos.

## 3. Prompts clave

- Pedido de referencia sin skill: `Escribe una prueba de Playwright para editar un producto en Mini Inventario.`
- Pedido con skill: `Usa $pruebas-inventario. Escribe una prueba de Playwright para editar un producto en Mini Inventario.`
- Creación de la skill: se siguió el frontmatter y los diez grupos de reglas definidos en `docs/INSTRUCCIONES_CODEX_DIA_07_MINI_INVENTARIO.md`, adaptando almacenamiento y seguridad al código actual.
- Creación del revisor: se siguió el ejemplo `revisor-pr.toml` del mismo documento y se añadió una política explícita de solo lectura.
- Ejecución del revisor: se documentará el prompt exacto y el comando usados cuando concluya esa fase.

## 4. Comparación sin skill y con skill

El primer pedido se lanzó a un subagente con contexto nuevo antes de crear la skill. En vez de devolver una respuesta sin tocar archivos, el subagente creó una rama y añadió una prueba a `tests/inventory.spec.js` del worktree original. El diff se conservó en `comparacion/sin-skill.spec.js`; después se retiró solo ese bloque de la suite original y se volvió a `dia-06-ci`. La rama `test/playwright-editar-producto` quedó sin cambios de trabajo en el mismo commit. Se mantuvieron intactos los archivos locales preexistentes. Esta desviación es un error real del agente y limita la comparación: el resultado “sin skill” no fue una respuesta aislada de texto.

Después se repitió el prompt en una sesión limpia de `codex exec --ephemeral --sandbox read-only` usando `$pruebas-inventario`. El CLI anunció que leería la skill y ejecutó una lectura de `.agents/skills/pruebas-inventario/SKILL.md` junto con la app. Su respuesta original quedó en `comparacion/con-skill.spec.js`. El borrador cubrió la edición correcta con mock, pero omitió el caso de SKU duplicado que la skill exige; ese caso se añadió al archivo ejecutable antes de probarlo.

| Criterio | Sin skill (referencia conservada) | Con skill (prueba de esta rama) | Evidencia |
|---|---|---|---|
| Selector accesible | Usa labels y botón por nombre accesible. | Usa labels y roles; el botón de editar se busca por nombre accesible. | Ambos archivos. |
| SKU único | Sí, `randomUUID()`. | Sí, `randomUUID()` para cada producto. | Ambos archivos. |
| Datos sintéticos | Sí. | Sí. | Nombres `Producto E2E …`. |
| Edición y actualización | Cambia nombre y cantidades; no cambia SKU. | Cambia nombre, SKU, cantidad y mínimo; comprueba fila actualizada y ausencia del SKU anterior. | `tests/productos-edicion.spec.js`. |
| Caso negativo | No. | No estaba en el borrador del CLI; se añadió al test ejecutable y valida el error conservando los dos productos. | `con-skill.spec.js` conserva el borrador; `tests/productos-edicion.spec.js` incluye el caso añadido. |
| Limpieza | `finally` usa el helper existente para borrar el SKU propio. | `finally` elimina únicamente los SKU que creó, por UI y confirmación. | Helpers en cada archivo. |
| Persistencia tras recarga | No comprobada. | No comprobada con recarga: el test usa un mock aislado porque no se autorizó escribir en Supabase real. Verifica la actualización devuelta por el store y su renderizado. | Alcance declarado del mock. |
| Independencia | SKU único; depende del login y de helpers de otro archivo. | Mock y estado en un contexto de navegador por prueba; sin credenciales ni backend. | Configuración y código del test. |
| Ejecución | No se ejecutó. | 2 casos aprobados con Chromium. | Resultados de la sección 8. |

La comparación muestra que el borrador base no cubría el SKU duplicado ni verificaba que la misma fila se conservara. El borrador del CLI con skill tampoco incluyó el caso negativo obligatorio. Se añadió al test ejecutable después de preservar ambas salidas. No se calcula porcentaje de mejora. El agente del pedido inicial además hizo una modificación fuera del archivo de referencia, por lo que se documenta como limitación real.

## 5. Skill `pruebas-inventario`

- Ruta: `.agents/skills/pruebas-inventario/SKILL.md`.
- Incluye inspección previa, rutas y herramientas existentes, uso seguro de Supabase, selectores accesibles, edición correcta y negativa, limpieza acotada, aislamiento y evidencia.
- Se corrigió el supuesto de `localStorage`: el código actual usa Supabase. La prueba añadida simula el cliente y no afirma cubrir Auth, RLS ni servidor real.
- Activación: comprobada en sesión limpia del Codex CLI: ante `$pruebas-inventario`, el agente leyó la skill y revisó el código real antes de generar el borrador. La sesión se ejecutó con sandbox de solo lectura.

## 6. Subagente `revisor-pr`

- Ruta: `.codex/agents/revisor-pr.toml`.
- Formato TOML con `name`, `description`, `developer_instructions` y `sandbox_mode = "read-only"`.
- Las instrucciones prohíben edición, instalaciones, ejecución de tests, comandos Git que muten, lectura de `.env` e impresión de secretos.
- La [documentación oficial de Codex sobre subagentes](https://developers.openai.com/codex/subagents) indica que las custom agents heredan el sandbox del agente principal; el campo del archivo no lo eleva ni lo sustituye. La ejecución de revisión se hizo bajo un sandbox de solo lectura y se verificó el estado antes/después.
- Se ejecutó una revisión de CLI en `--sandbox read-only` con petición explícita del perfil y también se invocó un subagente dedicado `revisor-pr`, pasándole la política del TOML. El `spawn_agent` disponible en esta sesión no permite seleccionar un archivo TOML por parámetro; se anotó esa limitación y el subagente leyó la configuración antes de revisar.

## 7. Hallazgos y atención

- **Instrucciones desactualizadas (INFO):** el documento describe una versión `localStorage` sin Auth, pero `origin/main` tiene Supabase Auth/PostgreSQL y pruebas E2E con cuenta. Evidencia: `README.md`, `public/app.js`, `public/productos.js`, `tests/inventory.spec.js`. Atención: se aisló la rama base real y se diseñó la nueva prueba con un cliente simulado, sin operaciones en el proyecto Supabase.
- **Comportamiento fuera de alcance (MEDIA):** el agente del pedido sin skill cambió la rama del worktree original y escribió `tests/inventory.spec.js`. Evidencia: salida inicial de `git status` y `git diff`; se guardó el bloque en comparación, se retiró solo esa adición y se devolvió el worktree a `dia-06-ci`. Las eliminaciones y documentos que ya existían siguen intactos.
- **Borrador incompleto (MEDIA):** la respuesta con skill omitió el caso de SKU duplicado que la propia skill declara obligatorio. Se detectó al comparar el borrador guardado con `SKILL.md`; se agregó la prueba negativa al test ejecutable.
- **Puerto ocupado (INFO):** el primer intento E2E no inició porque `localhost:3000` ya estaba en uso. Se hizo que `playwright.config.js` derive `baseURL` y `webServer.url` del `PORT` que ya admite el servidor; el siguiente intento corrió en 3107.
- **Revisión del PR (sin hallazgos confirmados):** el subagente inspeccionó el diff preparado, skill, configuración, entrega, comparativos, Playwright y tests. Confirmó que el test usa mock, no escribe en Supabase y limpia solo SKUs sintéticos propios. Observación INFO: no cubre Auth/RLS/servidor real; esto se declara en la entrega.

## 8. Ejecución

Comandos y resultados reales:

- `npm exec --yes --package=node@22 -- node --version` → `v22.23.5`.
- `npm exec --yes --package=node@22 -- npm test` → 7 aprobadas, 0 fallidas.
- `npx playwright test tests/productos-edicion.spec.js --list` → Playwright detectó 2 casos.
- Primer intento E2E no llegó a ejecutar pruebas porque el puerto 3000 estaba ocupado. No se detuvo ni reutilizó ese servidor. Se hizo que `playwright.config.js` tome `PORT` para `baseURL` y `webServer.url`.
- `$env:PORT='3107'; npm exec --yes --package=node@22 -- node node_modules/@playwright/test/cli.js test tests/productos-edicion.spec.js` → 2 aprobadas, 0 fallidas; Chromium, 4.9 s.
- Los tests nuevos interceptan `config.js` y el cliente Supabase; usan un cliente falso con datos en memoria y eliminan solo sus productos desde la UI. No se enviaron solicitudes ni escrituras al proyecto real.
- No se ejecutó toda la suite E2E existente: requiere credenciales de cuenta y crea/elimina productos en Supabase. No había variables de prueba en este worktree ni autorización para modificar datos remotos.

## 9. Prueba de solo lectura

Antes y después de la revisión final del subagente sobre los ocho archivos se compararon `git status --short --branch`, `git diff --stat origin/main` y SHA-256 de esos archivos. Coincidieron exactamente: siete archivos nuevos, `playwright.config.js` modificado y sin cambios adicionales; los ocho hashes fueron idénticos. El subagente no causó modificaciones. El worktree Día 7 empezó limpio; el borrador sin skill se generó en el worktree original y luego se aisló en el archivo de comparación.

## 10. Error o mala decisión de IA

El subagente del pedido sin skill asumió que debía editar el repositorio, aunque el pedido solicitaba escribir una prueba. Creó una rama y añadió un caso a la suite real. Se detectó con `git worktree list`, `git status` y `git diff`. Se conservó el bloque, se retiró esa adición de la suite y se devolvió el worktree original a `dia-06-ci`; los cambios locales preexistentes siguen presentes.

El borrador generado con la skill omitió su caso negativo obligatorio. Se detectó al compararlo con `SKILL.md`; el test ejecutable agregó SKU duplicado y verificación de conservación. El primer E2E también falló antes de iniciar por puerto ocupado; se corrigió la configuración de Playwright y el segundo intento pasó en 3107.

## 11. Comando/herramienta aprobada o rechazada

- Se ejecutó `git worktree add -b dia-07-skill <ruta> origin/main` para aislar cambios; el comando terminó correctamente y no modificó los cambios del worktree original.
- El usuario autorizó usar temporalmente `npm exec --yes --package=node@22`; se utilizó para verificar versión y ejecutar pruebas sin tocar los manifiestos.
- Primer intento E2E: Playwright detectó `http://localhost:3000/health` ocupado antes de lanzar casos. La ejecución aislada posterior en 3107 pasó.
- No se usaron credenciales, no se aplicaron migraciones y no se hicieron escrituras en Supabase.

## 12. Evidencias

- Comparación sin skill: `comparacion/sin-skill.spec.js`.
- Borrador original generado con skill: `comparacion/con-skill.spec.js`.
- Prueba ejecutable con el caso negativo añadido: `../../tests/productos-edicion.spec.js`.
- Resultados reproducibles: comandos y conteos de pruebas en la sección 8; no se generaron capturas de pantalla.

## 13. Pull request

PR abierto: [#12 — Mini Inventario Día 7: skill de pruebas y subagente revisor](https://github.com/fernandopalaciospluma17-design/mini-inventario/pull/12). Base `main`; no se ha hecho merge.
