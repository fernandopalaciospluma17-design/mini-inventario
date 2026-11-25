# Día 6: automatizar pruebas con GitHub Actions

## Resumen

Se añade `.github/workflows/ci.yml` para ejecutar Playwright en cada Pull Request hacia `main`. El workflow usa Ubuntu, `actions/checkout@v7`, `actions/setup-node@v7`, Node.js 22, `npm ci`, Chromium y `actions/upload-artifact@v6` para publicar el reporte HTML junto con `test-results/` incluso si el job falla.

Los cuatro secretos se referencian únicamente como `secrets.*` en el paso de pruebas. No se incluyen valores ni archivos `.env`.

## Verificación

- Comando local: `npm exec --yes --package=node@22 -- node node_modules/@playwright/test/cli.js test`.
- Resultado local más reciente: 4 pruebas aprobadas.
- PR: https://github.com/fernandopalaciospluma17-design/mini-inventario/pull/11
- Run remoto inicial verde (SHA `e790bc2123b224300ebfa08711c732b50d77da61`, 4/4 pruebas): https://github.com/fernandopalaciospluma17-design/mini-inventario/actions/runs/45543432373
- El artefacto Playwright se publicó correctamente.
- El primer run avisó que las acciones v4 usaban Node 20. Se actualizaron a las versiones actuales con runtime Node 24; la validación pasó en el run 45544049699 (SHA `e3118c382f50375c8b137b4ebc79b485727a1e72`): https://github.com/fernandopalaciospluma17-design/mini-inventario/actions/runs/45544049699
- Runs rojo y verde final: pendientes de la demostración controlada y autorización expresa.

## Limitaciones

El PR ya tiene su primera ejecución verde. La demostración roja y la ejecución verde final todavía no existen; requieren autorización expresa antes de introducir la mutación temporal.
