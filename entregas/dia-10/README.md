# Día 10: investigación de reportes de inventario

## Resumen y estado

Se investigaron los reportes de cantidad negativa y SKU duplicado. Ninguno se reprodujo con la evidencia disponible. El usuario confirmó que la interfaz pública impide guardar `-5`; no se observó personalmente el formulario autenticado. No se realizó una corrección de aplicación ni una migración adicional, porque ya existen validaciones y restricciones. Se añadió cobertura local para alta con SKU duplicado. El entorno de pruebas es simulado y no verifica Auth, RLS ni escrituras reales en PostgreSQL.

## Enlaces

- Aplicación: https://mini-inventario-fucx.onrender.com
- Issue: https://github.com/fernandopalaciospluma17-design/mini-inventario/issues/19
- Rama: `dia-10-incidente`; base: `dia-08-mcp`.
- PR: se documenta en GitHub al publicar la rama.

## Evidencia y bitácora

| Evidencia | Resultado |
| --- | --- |
| [Pantalla pública de acceso](evidencias/produccion-acceso.png) | Captura real; no demuestra el formulario autenticado ni un defecto. |
| Supabase MCP en solo lectura | Cero cantidades o mínimos negativos; cero grupos duplicados por usuario y SKU normalizado. Son conteos puntuales. |
| Catálogo PostgreSQL | `CHECK (cantidad >= 0)` validado; índice único válido sobre `(user_id, upper(btrim(sku)))`. |
| Render MCP | Último despliegue observado `live` en `aebd674ee20d11b004d575398d5e371a4d0d80fc`; logs recientes sin errores identificados de cantidad o SKU. |
| Prueba de usuario | Reportó que guardar `-5` muestra una validación y no permite continuar. |
| Playwright local | Las pruebas de edición y alta con SKU duplicado pasaron con datos y cliente simulados. |

Orden de trabajo: inspección del repositorio; consulta de interfaz pública, base y logs sin modificar datos; comprobación informada por el usuario; pruebas locales simuladas; issue y PR. No se hizo una prueba antes/después de una corrección porque no se observó el defecto y no hubo arreglo.

## Prompts y aprendizaje

- Solicitud real: «continua con la fase 1»; produjo la investigación de lectura y la captura de acceso.
- Solicitud real: «no puedes crear uno tu»; llevó a ejecutar las pruebas locales aisladas con un cliente simulado.
- Error detectado: se tomó inicialmente la capacidad de escribir `-5` como posible síntoma; al revisar la validación al guardar, el usuario confirmó que el formulario lo rechaza. Se documenta la diferencia entre teclear y guardar.
- Acción elegida: consultas de solo lectura y simulación local; no se creó ni borró inventario real para probar.

## Cómo se comprobó

- `npm exec --yes --package=node@22 -- node --test`: 7/7 aprobadas.
- Con `PORT=3197`: `npm exec --yes --package=node@22 -- node node_modules/@playwright/test/cli.js test tests/productos-edicion.spec.js tests/auth-form.spec.js --reporter=line`: 5/5 aprobadas.
- No se ejecutó la suite E2E completa que usa cuenta de prueba real y escribe datos. No hay evidencia antes/después de una corrección ni prueba real de alta duplicada en producción.
- El cero es un valor válido; el dominio de la aplicación admite enteros no negativos.

## Siguiente requisito y revisión humana

Preparar una base de pruebas real aislada y verificar alta de SKU normalizado duplicado, además de un alta válida, sin datos personales. Las pruebas automatizadas y la recopilación de resultados pueden delegarse; una persona debe revisar datos, permisos, migraciones, fusión y despliegue. La aplicación publicada mantiene Auto-Deploy en `dia-08-mcp`.
