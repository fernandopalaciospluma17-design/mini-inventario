# Día 5: exploración y pruebas de Mini Inventario

## Cambios
- Corregido el indicador ámbar sin etiqueta de la cabecera en estado sin sesión.
- Agregadas pruebas Playwright de login, rechazo, alta y stock bajo.
- Documentadas capturas y resultados observados en `entregas/dia-05/README.md`.

## Pruebas
- `npm exec --yes --package=node@22 -- node --test`: 7 aprobadas.
- `npx playwright test`: 1 aprobada y 3 fallidas porque el login válido no abrió el inventario.
- Una comprobación adicional del login válido, después de que el usuario revisara la configuración local, también falló; no se repitieron intentos.

## Evidencia y limitaciones
- Capturas auténticas antes/después en escritorio y móvil.
- MCP indica cero tablas en `public`; CRUD real y prueba de mutación pendientes.
- No hay credenciales ni tokens en este archivo. El `.env` local está ignorado.

El código de Día 3 y Día 4 aún no está en `main`; este PR contendría las etapas previas además del Día 5.

PR abierto: https://github.com/fernandopalaciospluma17-design/mini-inventario/pull/10
