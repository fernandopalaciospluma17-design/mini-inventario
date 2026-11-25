# Día 6: automatizar pruebas con GitHub Actions

## Resumen

Se añade `.github/workflows/ci.yml` para ejecutar Playwright en cada Pull Request hacia `main`. El workflow usa Ubuntu, Node.js 22, `npm ci`, Chromium y publica el reporte HTML junto con `test-results/` incluso si el job falla.

Los cuatro secretos se referencian únicamente como `secrets.*` en el paso de pruebas. No se incluyen valores ni archivos `.env`.

## Verificación

- Comando local: `npm exec --yes --package=node@22 -- node node_modules/@playwright/test/cli.js test`.
- Resultado local más reciente: 4 pruebas aprobadas.
- Run remoto inicial: pendiente de GitHub Actions.
- Runs rojo y verde final: pendientes de la demostración controlada y autorización expresa.

## Limitaciones

El mismo PR deberá mostrar una ejecución verde inicial, una roja causada por la mutación intencional y una verde final. No se afirma que esos runs existan todavía.
