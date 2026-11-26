# Mini Inventario — Día 9: Docker y Render

## Estado de la actividad

Esta bitácora separa las comprobaciones locales de los pasos externos. No se ha creado ni desplegado un servicio de Render, no se ha provocado una falla remota y no se afirma que la actividad esté completa.

- Rama: `dia-09-docker`.
- Rama base propuesta: `dia-08-mcp` (el PR del Día 8 sigue abierto y no está integrado).
- Node.js probado: `v22.23.5`.
- Docker CLI: `29.8.0`; el daemon de Docker Desktop no estaba disponible.
- Aplicación: Node.js/Express, comando real `npm start`, puerto `process.env.PORT` con fallback `3000`.

## Contenedor preparado

- `Dockerfile`: usa `node:22-alpine`, instala dependencias de producción con `npm ci --omit=dev`, copia solo `server.js` y `public/`, expone `3000` y ejecuta como usuario `node`.
- `.dockerignore`: excluye `.env`, `.git`, dependencias locales, pruebas y entregas.
- `server.js`: escucha en `0.0.0.0` y respeta `PORT`.
- Las variables de Supabase se suministran al proceso desde el entorno; no se agregan a capas de imagen.

## Comprobaciones locales

Ejecutadas con Node `v22.23.5`:

- `npm ci`: completado, 77 paquetes instalados, sin vulnerabilidades reportadas.
- `node --test`: 7/7 pruebas aprobadas.
- Servidor iniciado localmente con `PORT=3187`: `/health` respondió 200 y `/` respondió 200.
- `git diff --check`: aprobado.
- `docker build -t mini-inventario .`: no pudo ejecutarse porque Docker Desktop no tenía daemon disponible (`dockerDesktopLinuxEngine` no encontrado). Por tanto no hay imagen o contenedor que afirmar como probado.

## Pasos externos pendientes

- Encender Docker Desktop y repetir `docker build` y `docker run`; probar la imagen sin imprimir ni incorporar secretos.
- Crear el PR de Docker y revisar sus comprobaciones. No existe `.github/workflows` en esta rama, por lo que no se detectó CI configurado.
- Configurar Render desde el panel, con `SUPABASE_URL` y `SUPABASE_KEY` privadas, y solicitar aprobación antes del primer despliegue.
- Verificar URL pública e inicio de sesión con una cuenta de prueba autorizada.
- Configurar y comprobar el MCP de Render usando su documentación oficial.
- Solo después de un despliegue funcional, decidir con aprobación explícita si se hace la falla intencional. No se ejecutó ni se modificó un Dockerfile desplegado.
- Capturas, IDs de despliegue, logs y resultados de diagnóstico: pendientes; no se inventaron evidencias.

## Bitácora de aprendizaje

- Prompt clave: “continua con el dia 9”. Se usaron las instrucciones locales de `docs/INSTRUCCIONES_CODEX_DIA_09_MINI_INVENTARIO.md`.
- Error detectado y corregido: el primer `npm exec ... npm ci` acabó usando el Node global 24 y mostró `EBADENGINE`. Se verificó la ruta del binario temporal Node 22 y se volvió a ejecutar el CLI de npm y `node --test` bajo Node 22; ambas verificaciones terminaron correctamente.
- Comando aprobado: `npm ci` y `node --test`, por ser comprobaciones locales sin acceso a datos.
- Docker build intentado: bloqueado por daemon local apagado/no disponible; falta repetirlo cuando Docker Desktop esté iniciado.

## Referencias del proyecto

- [Instrucciones del Día 9](../../docs/INSTRUCCIONES_CODEX_DIA_09_MINI_INVENTARIO.md)
- [PR del Día 8](https://github.com/fernandopalaciospluma17-design/mini-inventario/pull/13)
- PR del Día 9: pendiente de publicación.
