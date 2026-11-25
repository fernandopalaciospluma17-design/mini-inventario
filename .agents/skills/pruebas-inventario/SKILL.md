---
name: pruebas-inventario
description: Diseña, implementa y revisa pruebas Playwright para Mini Inventario. Actívala cuando se soliciten pruebas E2E, pruebas de interfaz, regresiones o validaciones de los flujos de productos (alta, consulta, edición y eliminación).
---

# Pruebas de Mini Inventario

## Inspección antes de probar

- Lee `AGENTS.md`, `README.md`, `package.json`, la configuración de Playwright y el flujo real de `public/` antes de proponer selectores o comandos.
- Confirma la versión de Node requerida, cómo inicia el servidor y qué pruebas ya existen.
- No asumas rutas, textos, atributos accesibles ni variables: compruébalos en el código.
- La versión actual usa Express, Supabase Auth y la tabla `public.productos`; no usa `localStorage` como fuente del inventario. No añadas una API o login distinto.

## Ubicación y herramientas

- Conserva las pruebas unitarias existentes de `node:test` en `test/`.
- Guarda las pruebas de navegador en `tests/` y usa la configuración existente `playwright.config.js`.
- Usa `@playwright/test` que ya figura en `package.json`; no dupliques configuración ni agregues dependencias sin una necesidad verificada.
- Ejecuta primero `npm test`; para E2E usa `npm run test:e2e` o el filtro puntual de Playwright. Registra versión, comando y resultado reales.

## Supabase y datos

- Revisa los nombres de variables en `.env.example` y en los tests; nunca abras, imprimas, copies ni registres valores de `.env`, secretos, cookies o credenciales.
- La suite E2E existente espera `SUPABASE_URL`, `SUPABASE_KEY`, `TEST_EMAIL` y `TEST_PASSWORD` en el entorno. Usa solo una cuenta de prueba autorizada.
- No hagas escrituras ni borrados en un proyecto Supabase real sin autorización expresa. Para probar el flujo de interfaz, prefiere un cliente Supabase simulado y aislado o un entorno local de prueba.
- Si una prueba crea datos, usa datos sintéticos y un SKU único. Limpia únicamente los registros creados por esa prueba, preferiblemente mediante la interfaz. Nunca borres todo el inventario, una tabla, ni el almacenamiento completo.
- No atribuyas al test simulado cobertura de Auth, RLS o comportamiento real del servidor Supabase.

## Selectores y edición

- Prioriza `getByRole`, `getByLabel` y nombres accesibles comprobados en el HTML.
- El formulario tiene etiquetas para Nombre, SKU, Cantidad y Cantidad mínima. El botón de edición tiene un nombre accesible `Editar <nombre>`; confirma la implementación antes de usarlo.
- Evita XPath, clases de presentación, índices de fila y `nth()` cuando haya una alternativa semántica. Si un índice es inevitable, explica la columna o estructura que lo hace estable.
- Para edición correcta, verifica precarga, cambio de nombre/SKU/cantidad/mínimo, mensaje de éxito, actualización de la misma fila y estado calculado (`cantidad < minimo`). Comprueba persistencia del servidor solo cuando el entorno de prueba permita hacerlo sin tocar datos ajenos.
- Para el error de SKU duplicado, crea dos productos sintéticos bajo el mismo test/fixture, intenta asignar el SKU del segundo al primero y verifica mensaje comprensible, valores anteriores intactos y ausencia de duplicados.
- Sincroniza con roles, locators y estados observables; no uses `waitForTimeout` como sincronización normal.

## Aislamiento y calidad

- Cada prueba debe poder ejecutarse sola y en cualquier orden, con estado independiente.
- La limpieza en `finally`/`afterEach` debe tolerar fallos parciales y solo apuntar a los SKUs/IDs propios.
- No uses `localStorage.clear()`, datos personales, productos preexistentes ni servicios externos para simular una validación local.
- Registra las limitaciones de mocks y no declares éxito porque el archivo compila: ejecuta la prueba y la suite pertinente cuando exista un runtime compatible y el entorno necesario.
- Mantén reportes y capturas sin credenciales; no fabriques evidencia.
