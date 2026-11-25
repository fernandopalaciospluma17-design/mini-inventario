# Mini Inventario — Día 6: GitHub Actions

## 1. Objetivo

Ejecutar las pruebas Playwright automáticamente en cada Pull Request dirigido a `main`.

## 2. Prerrequisitos

- Repositorio público: `fernandopalaciospluma17-design/mini-inventario`.
- El PR del Día 5 está integrado en `main`; allí están la app, Playwright y las cuatro pruebas.
- Rama de trabajo: `dia-06-ci`.
- Node usado en las pruebas locales: 22.23.5.

## 3. Configuración de secretos

GitHub muestra los nombres `SUPABASE_URL`, `SUPABASE_KEY`, `TEST_EMAIL` y `TEST_PASSWORD` en la lista de secretos de Actions. Los valores no se leyeron ni copiaron al repositorio.

## 4. Workflow de CI

Archivo: `.github/workflows/ci.yml`.

- Se activa con `pull_request` hacia `main`.
- Usa `ubuntu-latest`, `actions/checkout@v7`, `actions/setup-node@v7`, Node.js 22, `npm ci` y Chromium con sus dependencias.
- Ejecuta `npx playwright test` y falla si una prueba falla.
- Proporciona los cuatro secretos solo al paso de Playwright.
- Publica `playwright-report/` y `test-results/` como artefacto con `actions/upload-artifact@v6`, incluso si falla el job.
- El workflow tiene permiso `contents: read` y no requiere `.env`.

## 5. Primera ejecución verde

PR: [#11 — Día 6: automatizar pruebas con GitHub Actions](https://github.com/fernandopalaciospluma17-design/mini-inventario/pull/11).

- SHA: `e790bc2123b224300ebfa08711c732b50d77da61`.
- Run: [45543432373 — exitoso](https://github.com/fernandopalaciospluma17-design/mini-inventario/actions/runs/45543432373).
- Resultado: job `Playwright tests` terminó en verde; instalación, pruebas y subida del artefacto HTML terminaron correctamente.
- La suite contiene cuatro escenarios; además, los cuatro pasaron localmente con Node 22.
- Este primer run usó las versiones v4 de las acciones y GitHub avisó que sus runtime Node 20 se estaban ejecutando sobre Node 24. Después se actualizaron a versiones oficiales con runtime Node 24 y se validaron en un segundo run.
- Validación con las acciones actualizadas: [run 45544049699 — exitoso](https://github.com/fernandopalaciospluma17-design/mini-inventario/actions/runs/45544049699), SHA `e3118c382f50375c8b137b4ebc79b485727a1e72`. Las pruebas y la publicación del artefacto pasaron, sin la advertencia de runtime Node 20.
- Captura: [`evidencias/pr-verde-inicial.png`](evidencias/pr-verde-inicial.png).

## 6. Demostración roja

- Mutación autorizada: se cambió temporalmente la expectativa del test `marca como bajo mínimo` en `tests/inventory.spec.js` de `Por debajo del mínimo` a `Suficiente`.
- Commit rojo: `51346adeb856c6b54d58f9cf534ac27108749b2a`.
- Run rojo en el mismo PR: [45544687631 — fallido](https://github.com/fernandopalaciospluma17-design/mini-inventario/actions/runs/45544687631).
- Resultado del run: 3 pruebas pasaron y falló únicamente el escenario mutado. El reporte se publicó.
- Captura: [`evidencias/pr-rojo.png`](evidencias/pr-rojo.png).

## 7. Diagnóstico con gh

- Comandos: `gh pr checks 11` y `gh run view 45544687631 --log-failed`.
- Job: `Playwright tests`; paso: `Run Playwright tests`.
- La aserción de `tests/inventory.spec.js:104` esperaba `Suficiente`, mientras la fila real mostraba `Por debajo del mínimo`.
- La falla coincide con la mutación intencional. El comportamiento de la app sigue correcto y el test terminó su bloque `finally`, que limpia el producto de prueba propio.
- Resumen redactado: [`evidencias/logs/diagnostico-fallo.txt`](evidencias/logs/diagnostico-fallo.txt).

## 8. Corrección y ejecución verde final

Con autorización expresa, se restauró únicamente la expectativa original `Por debajo del mínimo` en `tests/inventory.spec.js`.

- Commit de corrección: `b9f6fc5b74b690548cb4120c15d2bd8d7008ac5b`.
- Verificación local: prueba puntual y suite completa aprobadas (4/4).
- Run final: [45546572374 — exitoso](https://github.com/fernandopalaciospluma17-design/mini-inventario/actions/runs/45546572374). El test y la carga del artefacto terminaron correctamente.
- Captura: [`evidencias/pr-verde-final.png`](evidencias/pr-verde-final.png).

## 9. Explicación de la falla en mis palabras

**Borrador para revisión del estudiante:** el cambio temporal hizo que el test esperara “Suficiente” para un producto con cantidad 1 y mínimo 5. GitHub Actions falló en esa aserción porque la app mostró “Por debajo del mínimo”, que es el resultado correcto. `gh run view --log-failed` mostró el texto esperado y el recibido. Al restaurar la expectativa original, la prueba y el workflow volvieron a pasar. Adáptalo con tus propias palabras antes de entregar.

## 10. Bitácora de IA

- Solicitud: continuar con la actividad del Día 6.
- Hallazgo y corrección: inspeccionando el payload de registro se encontró que `FormData` omitía correo y contraseña. Se movió la lectura antes de deshabilitar los controles.
- Error de diagnóstico corregido: inicialmente se atribuyó el rechazo a las credenciales; la petición de Supabase mostró que faltaban los campos, y una intercepción local confirmó el problema sin crear una cuenta.
- Verificación: intercepción de las solicitudes de registro e inicio confirmó presencia de ambos campos; la suite completa pasó localmente con 4/4 pruebas.
- Mutación controlada autorizada: se invirtió una expectativa, falló localmente y en GitHub por la diferencia prevista; luego se restauró con autorización y la suite pasó localmente y en GitHub.
- Seguridad: la ejecución de `execute_sql` fue bloqueada anteriormente por la política de aprobación `never`; no se intentó eludir esa restricción. Las pruebas E2E actuales verifican que el usuario de prueba pudo realizar las operaciones previstas en la tabla.

## 11. Evidencias

- Run inicial: [45543432373](https://github.com/fernandopalaciospluma17-design/mini-inventario/actions/runs/45543432373).
- Captura del PR y check verde: `evidencias/pr-verde-inicial.png`.
- Run rojo: [45544687631](https://github.com/fernandopalaciospluma17-design/mini-inventario/actions/runs/45544687631); captura en `evidencias/pr-rojo.png`; diagnóstico redactado en `evidencias/logs/diagnostico-fallo.txt`.
- Restauración: commit `b9f6fc5b74b690548cb4120c15d2bd8d7008ac5b`; run final verde [45546572374](https://github.com/fernandopalaciospluma17-design/mini-inventario/actions/runs/45546572374); captura en `evidencias/pr-verde-final.png`.
- Reporte HTML local: generado en `playwright-report/` (ignorado por Git; no contiene valores de secretos).
- El artefacto `playwright-report` se subió en el run inicial.

## 12. Limitaciones

- Se registraron la ejecución inicial verde, la mutación roja prevista y la restauración verde final.
- Los secretos están presentes por nombre; GitHub no permite comprobar sus valores.

## 13. Pull Request y cierre

PR abierto: [#11](https://github.com/fernandopalaciospluma17-design/mini-inventario/pull/11). El merge final queda pendiente de autorización expresa.
