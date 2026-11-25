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
- Usa `ubuntu-latest`, Node.js 22, `npm ci` y Chromium con sus dependencias.
- Ejecuta `npx playwright test` y falla si una prueba falla.
- Proporciona los cuatro secretos solo al paso de Playwright.
- Publica `playwright-report/` y `test-results/` como artefacto incluso si falla el job.
- El workflow tiene permiso `contents: read` y no requiere `.env`.

## 5. Primera ejecución verde

PR: [#11 — Día 6: automatizar pruebas con GitHub Actions](https://github.com/fernandopalaciospluma17-design/mini-inventario/pull/11).

- SHA: `e790bc2123b224300ebfa08711c732b50d77da61`.
- Run: [45543432373 — exitoso](https://github.com/fernandopalaciospluma17-design/mini-inventario/actions/runs/45543432373).
- Resultado: job `Playwright tests` terminó en verde; instalación, pruebas y subida del artefacto HTML terminaron correctamente.
- La suite contiene cuatro escenarios; además, los cuatro pasaron localmente con Node 22.
- Captura: [`evidencias/pr-verde-inicial.png`](evidencias/pr-verde-inicial.png).

## 6. Demostración roja

Pendiente. No se introducirá una mutación temporal sin autorización expresa del usuario, tal como requieren las instrucciones del Día 6.

## 7. Diagnóstico con gh

Pendiente de una ejecución roja real. Se registrarán el job, paso, mensaje y run que correspondan a la mutación, sin inventar resultados.

## 8. Corrección y ejecución verde final

Pendiente de la autorización y ejecución de la demostración roja.

## 9. Explicación de la falla en mis palabras

**Borrador para revisión del estudiante:** el registro y el inicio de sesión enviaban campos vacíos porque la app deshabilitaba los controles antes de leerlos con `FormData`. Los campos deshabilitados no aparecen en `FormData`. Al capturar correo y contraseña antes de deshabilitar el formulario, la petición pasó a incluir ambos valores. La demostración de mutación del workflow todavía está pendiente; este borrador no la reemplaza.

## 10. Bitácora de IA

- Solicitud: continuar con la actividad del Día 6.
- Hallazgo y corrección: inspeccionando el payload de registro se encontró que `FormData` omitía correo y contraseña. Se movió la lectura antes de deshabilitar los controles.
- Error de diagnóstico corregido: inicialmente se atribuyó el rechazo a las credenciales; la petición de Supabase mostró que faltaban los campos, y una intercepción local confirmó el problema sin crear una cuenta.
- Verificación: intercepción de las solicitudes de registro e inicio confirmó presencia de ambos campos; la suite completa pasó localmente con 4/4 pruebas.
- Seguridad: la ejecución de `execute_sql` fue bloqueada anteriormente por la política de aprobación `never`; no se intentó eludir esa restricción. Las pruebas E2E actuales verifican que el usuario de prueba pudo realizar las operaciones previstas en la tabla.

## 11. Evidencias

- Run inicial: [45543432373](https://github.com/fernandopalaciospluma17-design/mini-inventario/actions/runs/45543432373).
- Captura del PR y check verde: `evidencias/pr-verde-inicial.png`.
- Reporte HTML local: generado en `playwright-report/` (ignorado por Git; no contiene valores de secretos).
- El artefacto `playwright-report` se subió en el run inicial.

## 12. Limitaciones

- La ejecución inicial ya está verde. La demostración roja y la ejecución verde final siguen pendientes.
- La demostración roja y la ejecución verde final dependen de autorización expresa para introducir y revertir la mutación temporal.
- Los secretos están presentes por nombre; GitHub no permite comprobar sus valores.

## 13. Pull Request y cierre

PR abierto: [#11](https://github.com/fernandopalaciospluma17-design/mini-inventario/pull/11). El merge final queda pendiente de autorización expresa.
