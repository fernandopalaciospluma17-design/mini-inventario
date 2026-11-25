# Mini Inventario Día 7: skill de pruebas y subagente revisor

## Resumen

- Añade `.agents/skills/pruebas-inventario/SKILL.md` con reglas de Playwright adaptadas al código actual, que usa Supabase Auth/PostgreSQL y no `localStorage`.
- Añade pruebas E2E para editar producto correctamente y rechazar un SKU duplicado. El cliente Supabase está simulado, los datos son sintéticos y el cleanup borra solo los productos del test por la UI.
- Guarda las referencias sin/con skill y evalúa sus diferencias en `entregas/dia-07/README.md`. La respuesta con skill omitió el caso negativo; quedó añadido a la prueba ejecutable.
- Añade `.codex/agents/revisor-pr.toml` con instrucciones de solo lectura; el subagente revisó el diff y el estado/hashes antes y después coinciden.
- Hace que la configuración existente de Playwright use el `PORT` que ya acepta el servidor para evitar depender del puerto 3000 ocupado.

## Verificación

- Node 22 temporal autorizado: `v22.23.5`.
- `npm exec --yes --package=node@22 -- npm test`: 7 aprobadas.
- `$env:PORT='3107'; npm exec --yes --package=node@22 -- node node_modules/@playwright/test/cli.js test tests/productos-edicion.spec.js`: 2 aprobadas con Chromium.
- `git diff --cached --check`: sin errores.
- No se usaron credenciales ni se escribieron o eliminaron datos en Supabase real. La suite E2E existente que usa cuenta real no se ejecutó.

## Límites

La prueba nueva valida interfaz y lógica del store con un cliente simulado; no valida Auth, RLS ni el servicio remoto. La comparación documenta que las instrucciones iniciales describían una versión anterior localStorage. No se hizo merge ni despliegue.

## Entrega

Bitácora: [`entregas/dia-07/README.md`](entregas/dia-07/README.md).
