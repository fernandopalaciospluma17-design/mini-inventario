# Día 6: automatizar pruebas con GitHub Actions

## Resumen

Se añade `.github/workflows/ci.yml` para ejecutar Playwright en cada Pull Request hacia `main`. El workflow usa Ubuntu, Node.js 22, `npm ci`, Chromium y publica el reporte HTML junto con `test-results/` incluso si el job falla.

Los cuatro secretos se referencian únicamente como `secrets.*` en el paso de pruebas. No se incluyen valores ni archivos `.env`.

## Verificación

- Comando local: `npm exec --yes --package=node@22 -- node node_modules/@playwright/test/cli.js test`.
- Resultado local más reciente: 4 pruebas aprobadas.
- PR: https://github.com/fernandopalaciospluma17-design/mini-inventario/pull/11
- Run remoto inicial verde (SHA `e790bc2123b224300ebfa08711c732b50d77da61`, 4/4 pruebas): https://github.com/fernandopalaciospluma17-design/mini-inventario/actions/runs/45543432373
- El artefacto Playwright se publicó correctamente.
- Runs rojo y verde final: pendientes de la demostración controlada y autorización expresa.

## Limitaciones

El PR ya tiene su primera ejecución verde. La demostración roja y la ejecución verde final todavía no existen; requieren autorización expresa antes de introducir la mutación temporal.
