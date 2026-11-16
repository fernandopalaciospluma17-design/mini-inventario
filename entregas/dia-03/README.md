# Mini Inventario — Día 3

## A. Datos generales

- **Fecha:** 16 de noviembre de 2026.
- **Repositorio:** `fernandopalaciospluma17-design/mini-inventario`.
- **Rama base:** `main` (`1c4d220`, ya estaba al día con `origin/main`).
- **Rama de trabajo:** `dia-03-web`.
- **Preparación:** el árbol estaba limpio en `dia-02-planeacion`. Se creó `dia-03-web` desde `main` y se recuperaron desde `origin/dia-02-planeacion` solamente `docs/requisitos.md` y `docs/diseno.md`; no se incorporó el servidor Python de esa rama.
- **Agente:** Codex; la versión no está disponible en esta sesión.

## B. Prompts clave

- **Implementación:** el usuario pidió «haz lo que pide» para el archivo `actividad_dia_03_mini_inventario_agente.md` y después aprobó el plan con «si ahora hazlo».
- **Revisión acotada solicitada por la actividad:** «Revisa solo `public/productos.js` y dime si algo no cumple `docs/diseno.md`. No modifiques archivos. Señala cada hallazgo con archivo, función o sección, motivo y recomendación.» Se realizó una revisión de solo lectura en esta sesión, no en un contexto compactado o nuevo.
- **Pull request:** se seguirá el prompt de la guía: «Revisa los cambios de esta rama y crea con gh un pull request con un resumen claro. Vincula los issues que resuelve usando Closes #numero. No hagas merge.»

## C. Implementación

- `server.js`: Express sirve `public/`, responde en `GET /health` y escucha en `PORT` o 3000.
- `public/index.html`, `public/styles.css` y `public/app.js`: interfaz adaptable para listar, agregar, editar y eliminar; estados vacíos, mensajes, confirmación de borrado e indicador visual de bajo mínimo.
- `public/productos.js`: único módulo que lee y escribe `localStorage`; valida, normaliza SKU, persiste y expone operaciones de listado, alta, actualización y eliminación. Datos corruptos se reportan y no se sobrescriben.
- `test/`: siete pruebas automatizadas con `node:test` para almacenamiento, validación, persistencia, edición, eliminación, `/health` y archivos estáticos.
- `README.md`, `package.json` y `package-lock.json`: requisitos de ejecución, scripts y dependencia bloqueada de Express.
- `docs/requisitos.md` y `docs/diseno.md`: documentos del proyecto incluidos desde la rama de planificación para mantener visible el objetivo general.

La versión de esta etapa usa los campos `id`, `nombre`, `sku`, `cantidad`, `minimo` y `created_at`. `user_id` no se crea localmente porque se aprobó no implementar identidad/autenticación en el Día 3. Esta etapa usa `localStorage`; no sincroniza entre dispositivos ni separa inventarios por usuario.

**Inicio local:** `npm install`, luego `npm start`, y abrir `http://localhost:3000`. En esta sesión el entorno tenía Node v24.15.0; para cumplir Node 22 se ejecutó mediante `npm exec --yes --package=node@22 -- ...`, que informó v22.23.5.

**Comprobación real del servidor bajo Node 22.23.5:**

| Recurso | Código HTTP | Resultado |
| --- | ---: | --- |
| `/health` | 200 | `{"status":"ok"}` |
| `/` | 200 | Respuesta contiene «Mini Inventario». |
| `/productos.js` | 200 | `text/javascript; charset=utf-8`. |

## D. Pruebas

Comando ejecutado: `npm exec --yes --package=node@22 -- node --test`.

Resultado: 7 pruebas aprobadas, 0 fallidas. `git diff --check` no reportó errores. La instalación informó cero vulnerabilidades auditadas. Las comprobaciones automatizadas ejercitan la lógica de datos y el servidor; no sustituyen la validación visual en un navegador.

| Caso manual de la actividad | Estado | Evidencia u observación |
| --- | --- | --- |
| 1. Abrir sin productos y revisar estado vacío | Pendiente | La prueba automatizada confirma que el almacén inicia vacío; la vista no se verificó visualmente. |
| 2. Agregar producto válido | Pendiente | La operación de alta pasó en pruebas de módulo; falta confirmarla en navegador. |
| 3. Agregar otros dos y ver tres | Pendiente | Prueba automatizada confirma tres registros; presentación visual pendiente. |
| 4. Identificar producto bajo mínimo | Pendiente | La comparación cantidad < mínimo se ejercitó en pruebas; indicador visual pendiente. |
| 5. Recargar y conservar productos | Pendiente | Una nueva instancia del almacén leyó el producto persistido en la prueba; recarga real pendiente. |
| 6. Editar sin duplicar | Pendiente | La prueba de módulo confirma mismo ID y número de registros; edición visual pendiente. |
| 7. Rechazar campos vacíos | Pendiente | La validación del módulo pasó; mensaje del formulario pendiente de navegador. |
| 8. Rechazar valores inválidos o negativos | Pendiente | Pruebas de módulo rechazaron negativos, fracciones, `NaN` y texto; interacción visual pendiente. |
| 9. Cambiar estado bajo mínimo en ambos sentidos | Pendiente | Prueba de módulo cambió de bajo mínimo a suficiente; presentación visual pendiente. |

### Pasos de verificación manual pendientes

1. Ejecuta `npm start` y abre `http://localhost:3000`.
2. Confirma el estado vacío. Agrega Café (SKU `CAF-001`, cantidad 2, mínimo 5), Té (SKU `TE-002`, cantidad 12, mínimo 4) y Taza (SKU `TAZ-003`, cantidad 7, mínimo 3). Confirma tres filas y solo Café marcado «Por debajo del mínimo».
3. Recarga y confirma que siguen los tres productos. Edita Café a cantidad 8 y luego a 1; confirma que el indicador se apaga y vuelve a encender sin cambiar el número de filas.
4. Prueba guardar nombre o SKU vacíos, cantidad negativa y decimal; confirma que se informa el error y no cambia el inventario. Prueba cancelar y confirmar la eliminación.
5. Guarda una captura real de la aplicación con tres productos como `entregas/dia-03/captura-mini-inventario.png` y comunica el resultado de esos pasos.

No hay herramienta de navegador interactivo habilitada en esta sesión. El intento de iniciar Edge headless con `Start-Process` fue bloqueado por la política de herramientas; no se creó una captura ni se marcaron pruebas visuales como aprobadas.

## E. Error o mala decisión de IA detectada

La rama de planificación contenía un servidor Python/FastAPI con SQLite y autenticación Google. La guía del Día 3 requiere Express, `localStorage` y ningún inicio de sesión en esta etapa. Se detectó al comparar la estructura y `package.json` con la actividad; se evitó trasladar ese código creando la rama desde `main` y recuperando solo los documentos. Mantener aquel servidor habría dejado la actividad en una arquitectura distinta de la solicitada.

La revisión de `public/productos.js` frente a `docs/diseno.md` detecta una desviación intencional: el diseño objetivo usa Supabase/RLS y `user_id`, mientras esta etapa usa almacenamiento local sin identidad. No se identificaron otras diferencias de modelo en los campos disponibles. Se conserva esta limitación temporal conforme a la aprobación expresa del usuario.

## F. Comando o herramienta aprobada/rechazada

- **Comando de rama:** `git switch main; git pull --ff-only origin main; git switch -c dia-03-web`.
- **Resultado:** ejecutado. El usuario aprobó el plan que incluía crear la rama desde `main`; no hubo una aprobación de comando separada ni se rechazó el comando de Git.
- **Herramienta de navegador:** se intentó iniciar Edge headless mediante `Start-Process`; la política de herramientas bloqueó la ejecución. No se intentó eludir el bloqueo. La captura y validación visual quedan para la persona usuaria.

## G. Verificación del contexto

- **Antes/después:** no disponible en esta sesión. No hay indicador `/status` accesible para este agente.
- **Compactación o sesión nueva:** no disponible desde las herramientas de esta sesión; no se afirma que haya ocurrido.
- **Revisión acotada:** se hizo en esta sesión actual, con el prompt citado en la sección B. No es una revisión posterior a compactación. La persona usuaria debe consultar el indicador en su interfaz si la rúbrica exige las métricas antes/después.

## H. Pull request

- **Estado:** [PR #8 — Mini Inventario Día 3 con Express y localStorage](https://github.com/fernandopalaciospluma17-design/mini-inventario/pull/8), abierto desde `dia-03-web` hacia `main`.
- **Base:** `main`.
- **Issues vinculados:** `Closes #3` (registro), `Closes #4` (inventario y bajo mínimo), `Closes #5` (edición) y `Closes #6` (eliminación), porque esta rama implementa esas capacidades. El issue #2 de autenticación no se vinculó: la autenticación está expresamente fuera de alcance del Día 3.
- **Resumen y pruebas en el PR:** se documentaron las funciones, inicio local, las 7 pruebas aprobadas, comprobación HTTP y verificación visual pendiente por falta de navegador interactivo.
- **Merge:** no realizado.

## I. Evidencias

- **Captura:** no creada. No existe archivo `entregas/dia-03/captura-mini-inventario.png` en este commit. La persona usuaria puede generarla siguiendo los pasos manuales de la sección D.
- **Salida de pruebas y HTTP:** registrada en las secciones C y D; los comandos se ejecutaron en el entorno local de esta sesión.
