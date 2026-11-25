# Resultados de ejecución — Día 6

## Prueba local

- Fecha local: 2026-11-24 (America/Mexico_City).
- Node.js: 22.23.5.
- Comando: `npm exec --yes --package=node@22 -- node node_modules/@playwright/test/cli.js test`.
- Resultado: 4 aprobadas, 0 fallidas.
- Escenarios: login válido, rechazo de contraseña incorrecta, alta y limpieza del producto propio, detección de stock menor al mínimo.
- Productos de prueba: creados por los escenarios y retirados por la limpieza de cada prueba.

## Reporte local

Playwright generó `playwright-report/` y `test-results/`. Ambas carpetas están ignoradas por Git; se comprobó que sus archivos no contienen los valores locales de `SUPABASE_KEY`, `TEST_EMAIL` ni `TEST_PASSWORD`.

## GitHub Actions

- PR #11: https://github.com/fernandopalaciospluma17-design/mini-inventario/pull/11
- Primer run verde: 45543432373, SHA `e790bc2123b224300ebfa08711c732b50d77da61`.
- Resultado: job Playwright exitoso; artifact upload exitoso.
- Run: https://github.com/fernandopalaciospluma17-design/mini-inventario/actions/runs/45543432373
- Validación posterior de las versiones actuales de las acciones: run 45544049699, SHA `e3118c382f50375c8b137b4ebc79b485727a1e72`, verde y sin advertencia Node 20. https://github.com/fernandopalaciospluma17-design/mini-inventario/actions/runs/45544049699
- Run rojo: 45544687631, SHA `51346adeb856c6b54d58f9cf534ac27108749b2a`. Falló únicamente el test `marca como bajo mínimo`: expectativa temporal `Suficiente`, resultado real `Por debajo del mínimo`. Tres pruebas pasaron. https://github.com/fernandopalaciospluma17-design/mini-inventario/actions/runs/45544687631
- Diagnóstico: `gh pr checks 11` identificó el job `Playwright tests`; `gh run view 45544687631 --log-failed` mostró la aserción exacta en `tests/inventory.spec.js:104`. El upload del reporte también pasó.
- Restauración autorizada: se recuperó la expectativa `Por debajo del mínimo` en el commit `b9f6fc5b74b690548cb4120c15d2bd8d7008ac5b`.
- Verificación local tras restaurar: 4 aprobadas, 0 fallidas.
- Run verde final: 45546572374, SHA `b9f6fc5b74b690548cb4120c15d2bd8d7008ac5b`; pruebas y artefacto aprobados. https://github.com/fernandopalaciospluma17-design/mini-inventario/actions/runs/45546572374
