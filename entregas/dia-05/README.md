# Mini Inventario — Día 5: Pruebas

## 1. Objetivo

Explorar Mini Inventario en navegador, corregir un defecto visual reproducible y preparar pruebas Playwright para acceso, rechazo de credenciales, alta de producto y stock bajo.

## 2. Entorno

- Rama: `dia-05-pruebas`, creada desde `dia-04-supabase` porque `main` aún no contiene la app.
- Node del entorno: `v24.15.0`; la app del servidor en pruebas se arrancó con Node `v22.23.5`.
- npm: `11.12.1`.
- `playwright-cli`: `0.1.25`; Playwright Test: `1.65.1`; Chromium instalado.
- URL: `http://localhost:3000/`; comando del servidor configurado en Playwright: `npm exec --yes --package=node@22 -- node --env-file-if-exists=.env server.js`.
- `.env` está presente, ignorado por Git, y contiene las cuatro variables requeridas. Solo se verificó la presencia de sus nombres; nunca se leyeron ni imprimieron sus valores.
- MCP autenticado y limitado a `dstksngwmveeuyhcoaga`. La consulta MCP `list_tables` devolvió `{"tables":[]}` para `public`.

## 3. Exploración con playwright-cli

Se abrió la app en Chromium, primero en 1280×800 y después en 390×844. Antes de que existiera `.env`, el formulario estaba deshabilitado y mostraba que faltaba la configuración. La consola registró `/config.js` con HTTP 503 y `/favicon.ico` con HTTP 404; no hubo advertencias del navegador. Se guardaron capturas reales en `capturas/antes/`.

Tras configurar `.env`, la sesión de Playwright Test inició un servidor nuevo. El intento de inicio con la cuenta de prueba no mostró el inventario. Después de la confirmación del usuario de que revisó la configuración, se hizo una única comprobación adicional del login válido; también falló y no se repitió. La consulta MCP siguió sin mostrar tabla `productos`; no se pudo recorrer ni alterar inventario real. El reporte observado está en `consola-inicial.txt` y `consola-despues.txt`.

## 4. Problema real detectado

En el estado sin sesión, el `span` vacío del correo conservaba un estilo anterior de punto ámbar y quedaba solo en la cabecera. Se reprodujo en escritorio y móvil antes de modificar código. La causa y la corrección están descritas en [`problema-detectado.md`](problema-detectado.md). En `public/styles.css` se oculta el span cuando está vacío. Después, Playwright CLI confirmó `display=none` y ancho `0` en ambos viewports; las capturas están en `capturas/despues/`.

## 5. Pruebas automatizadas

Se instaló Playwright Test con `npm init playwright@latest`, usando solo Chromium. `playwright.config.js` carga `.env` mediante la API integrada de Node, arranca la app, ejecuta en serie y desactiva trazas, capturas y videos automáticos para evitar registrar información de acceso. Las pruebas de `tests/inventory.spec.js` leen credenciales del entorno, generan SKU UUID y limpian únicamente los SKU que intentan crear, por la interfaz.

Escenarios: acceso correcto, contraseña incorrecta, alta de producto y producto por debajo del mínimo (`cantidad < minimo`).

## 6. Resultado de las pruebas

`npm exec --yes --package=node@22 -- node --test`: 7 aprobadas, 0 fallidas.

`npx playwright test`: 4 ejecutadas; 1 aprobada (rechazo de contraseña incorrecta) y 3 fallidas (acceso válido y los dos escenarios que requieren sesión). La presencia de variables está comprobada, pero el acceso válido no abrió el inventario. El MCP reporta que `public` sigue sin tablas. No se logró crear ningún producto ni se modificaron datos de la base.

El detalle de la suite completa se encuentra en [`pruebas/resultados-ejecucion.txt`](pruebas/resultados-ejecucion.txt). La comprobación adicional del login válido también falló. No se incluyen capturas de una sesión autenticada porque no se pudo establecer.

## 7. Prueba de mutación

Pendiente. No ejecuté la mutación de `cantidad < minimo`: las pruebas no consiguieron abrir una sesión válida y MCP no reporta la tabla de productos. Cambiar temporalmente la regla sin poder verificar el flujo de extremo a extremo no demostraría que las pruebas detectan el error.

## 8. Bitácora de uso de IA

- Prompt: «ahora haz lo que pide el archivo INSTRUCCIONES CODEX MINI INVENTARIO DIA 5».
- Decisión revisada: al principio un servidor Node de diagnóstico permanecía escuchando en el puerto 3000, así que Playwright Test no pudo iniciar su servidor. Se identificó el PID por su comando (el proceso iniciado en esta sesión), se cerró ese proceso y se repitió la suite.
- Hallazgo de código: una regla CSS anterior seguía dibujando el indicador ámbar del estado local luego del cambio de interfaz. Se verificó comparando capturas reales y se corrigió con un selector de elemento vacío.
- MCP: `get_project_url` coincidió con el Project Ref esperado; `list_tables` devolvió una lista vacía. SQL requiere aprobación MCP, pero el agente informa `approval_policy: never`; no se modificó la base.
- Verificación: comparación visual y medida del elemento antes/después, siete pruebas Node y una ejecución completa de Playwright documentada sin ocultar los tres fallos.

## 9. Limitaciones

- El inicio con la cuenta de prueba no tuvo éxito; revisar localmente que la cuenta esté confirmada y que los datos de `.env` correspondan a esa cuenta. No compartir credenciales por chat.
- `public.productos` aún no aparece en el proyecto, por lo que las pruebas de CRUD, limpieza y aislamiento no se pudieron validar.
- La política de aprobación actual bloquea `execute_sql`; no se reintentó ni se eludió. La migración aprobada de Día 4 debe aplicarse tras habilitar aprobación manual de MCP o desde Supabase Studio.
- No se ejecutó la prueba de mutación ni se obtuvieron capturas autenticadas.

## 10. Pull Request

PR abierto: [#10 — Día 5: exploración y pruebas de Mini Inventario](https://github.com/fernandopalaciospluma17-design/mini-inventario/pull/10), rama `dia-05-pruebas` hacia `main`. `main` todavía no contiene el trabajo de Días 3 y 4, por lo que el PR incluye esas etapas previas. El CRUD real y la mutación siguen pendientes por la falta de tabla visible y de una sesión de prueba válida.
