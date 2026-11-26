# Mini Inventario — Día 9: Docker y Render

## Estado de la actividad

Esta bitácora separa las comprobaciones locales de los pasos externos. El servicio inicial ya fue publicado en Render; no se ha provocado una falla remota y no se afirma que la actividad esté completa.

- Rama actual de CI/Render: `dia-09-ci-render`.
- Rama base: `dia-08-mcp`; el PR #14 integró Docker en esta rama con el commit `ea0548fe7ee220615e94da849df952e988345c2a`. El PR #13 del Día 8 sigue abierto hacia `dia-07-skill`.
- Node.js probado: `v22.23.5`.
- Docker CLI/daemon: Docker Desktop `29.8.0` disponible para la segunda ejecución.
- Aplicación: Node.js/Express, comando real `npm start`, puerto `process.env.PORT` con fallback `3000`.

## Contenedor preparado

- `Dockerfile`: usa `node:22-alpine`, instala dependencias de producción con `npm ci --omit=dev`, copia solo `server.js` y `public/`, expone `3000` y ejecuta como usuario `node`.
- `.dockerignore`: excluye `.env`, `.git`, dependencias locales, pruebas y entregas.
- `server.js`: escucha en `0.0.0.0` y respeta `PORT`.
- Las variables de Supabase se suministran al proceso desde el entorno; no se agregan a capas de imagen.
- La imagen se inspeccionó: usuario `node`; variables de entorno estándar de Node, sin `SUPABASE_URL` ni `SUPABASE_KEY`.

## Comprobaciones locales

Ejecutadas con Node `v22.23.5`:

- `npm ci`: completado, 77 paquetes instalados, sin vulnerabilidades reportadas.
- `node --test`: 7/7 pruebas aprobadas.
- `.github/workflows/ci.yml` replica instalación, pruebas y build Docker; los tres pasos se ejecutaron localmente con Node 22 y Docker.
- Servidor iniciado localmente con `PORT=3187`: `/health` respondió 200 y `/` respondió 200.
- `git diff --check`: aprobado.
- El primer `docker build` no pudo ejecutarse porque Docker Desktop no estaba activo. Después de que el usuario lo inició, `docker build -t mini-inventario .` terminó correctamente; contexto transferido: 62.45 kB.
- `docker run --rm --env-file .env -e PORT=3187 -p 3187:3187 mini-inventario`: comprobado localmente. `/health`, `/`, `/config.js` y `/vendor/supabase.js` respondieron 200. No se mostró ni guardó el contenido de `/config.js`.
- El contenedor informó usuario `node` y estado `running`; se detuvo al terminar la prueba.

## Integración continua

- Se añadió `.github/workflows/ci.yml`: en cada Pull Request ejecuta `npm ci`, `npm test` y `docker build`; en `main` y `dia-08-mcp` también corre al recibir un push.
- El workflow limita permisos a `contents: read` y no necesita secretos.
- Estado: workflow ejecutado en GitHub para el PR #15; el job `Tests and Docker build` pasó.

## Publicación inicial en Render

- Servicio: `mini-inventario` (Web Service).
- Runtime: Docker; plan: Free (una instancia); rama: `dia-08-mcp`; Auto-Deploy habilitado.
- Servicio ID: `srv-dc3q9vm1egvs73eec4jg`.
- Despliegue inicial: `dep-dc3q9vu1egvs73eec5dg`, estado `live`.
- Commit desplegado: `22dd7a0e4419365cfb3938fdddf4cf41e3aa69bf`.
- URL pública: https://mini-inventario-fucx.onrender.com
- Variables cargadas desde el panel de Render usando el archivo local ignorado `.env`. Se confirmaron por nombre `SUPABASE_URL` y `SUPABASE_KEY`; sus valores no se mostraron ni se guardaron en esta bitácora.
- Verificación pública posterior al arranque: `/health`, `/`, `/styles.css`, `/config.js`, `/vendor/supabase.js`, `/app.js` y `/productos.js` devolvieron HTTP 200; la consola quedó sin errores.
- Evidencia: `evidencias/02-app-publica.png` muestra la pantalla pública de acceso sin datos personales ni secretos.
- El inicio de sesión real queda pendiente de que una cuenta de prueba autorizada sea introducida directamente en el navegador.

## Pasos externos pendientes

- PR #14 de Docker: fusionado a `dia-08-mcp`; no tenía checks configurados.
- PR #15 de CI abierto; el job `Tests and Docker build` pasó. El merge queda pendiente de aprobación del usuario.
- Configurar Render desde el panel, con `SUPABASE_URL` y `SUPABASE_KEY` privadas, y solicitar aprobación antes del primer despliegue.
- Verificar inicio de sesión con una cuenta de prueba autorizada.
- Render MCP: OAuth completado. Las consultas `list_workspaces` y `list_services` funcionaron en modo de solo lectura; el espacio mostró dos Web Services existentes y no se identificó uno llamado Mini Inventario. No se cambiaron servicios ni se consultaron secretos o logs.
- El MCP confirmó después el servicio nuevo, su URL, rama, runtime y despliegue `live` usando consultas de solo lectura.
- Solo después de un despliegue funcional, decidir con aprobación explícita si se hace la falla intencional. No se ejecutó ni se modificó un Dockerfile desplegado.
- Capturas, IDs de despliegue, logs y resultados de diagnóstico: pendientes; no se inventaron evidencias.

## Bitácora de aprendizaje

- Prompt clave: “continua con el dia 9”. Se usaron las instrucciones locales de `docs/INSTRUCCIONES_CODEX_DIA_09_MINI_INVENTARIO.md`.
- Error detectado y corregido: el primer `npm exec ... npm ci` acabó usando el Node global 24 y mostró `EBADENGINE`. Se verificó la ruta del binario temporal Node 22 y se volvió a ejecutar el CLI de npm y `node --test` bajo Node 22; ambas verificaciones terminaron correctamente.
- Comando aprobado: `npm ci` y `node --test`, por ser comprobaciones locales sin acceso a datos.
- Error detectado y corregido: Docker no tenía daemon en la primera ejecución. Tras iniciar Docker Desktop, el build y la ejecución del contenedor pasaron.

## Referencias del proyecto

- [Instrucciones del Día 9](../../docs/INSTRUCCIONES_CODEX_DIA_09_MINI_INVENTARIO.md)
- [PR del Día 8](https://github.com/fernandopalaciospluma17-design/mini-inventario/pull/13)
- [PR del Día 9 / Docker](https://github.com/fernandopalaciospluma17-design/mini-inventario/pull/14) (fusionado a `dia-08-mcp`).
- [PR del workflow CI](https://github.com/fernandopalaciospluma17-design/mini-inventario/pull/15) (abierto; CI aprobado; merge pendiente de autorización).
