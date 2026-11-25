# Mini Inventario Dia 8 - Integracion con herramientas

## 1. Datos generales

- Actividad: Mini Inventario Dia 8 - Integracion con herramientas.
- Objetivo: integrar Supabase MCP oficial en solo lectura y un servidor FastMCP propio que usa un rol PostgreSQL de solo lectura.
- Fecha de realizacion: 2026-11-25.
- Sistema operativo: Windows 11 Home 10.0.26200.
- Python: 3.12.10.
- Codex: no disponible en el PATH durante la ejecucion (`codex: no reconocido`).
- Dependencias FastMCP probadas: fastmcp 2.14.1, mcp 1.24.0, psycopg 3.2.12, python-dotenv 1.2.1 y pydantic-settings 2.12.0.
- Rama de trabajo: `dia-08-mcp`.
- Rama base para el PR: `dia-07-skill`.

## 2. Arquitectura

```text
Codex
  |-- supabase-lectura --> MCP oficial Supabase (pendiente de registrar)
  |                         `--> PostgreSQL / public.productos
  `-- inventario --------> FastMCP propio (stdio)
                            `--> psycopg
                                `--> rol inventario_lector
                                    `--> SELECT sobre public.productos
```

Ambos caminos estan previstos como consulta. El servidor propio no contiene herramientas de escritura ni SQL libre.

## 3. MCP oficial Supabase

Estado: **pendiente por falta de Codex CLI en el PATH y autenticacion OAuth no disponible en esta sesion**.

Comando preparado sin secretos:

```powershell
codex mcp add supabase-lectura --url "https://mcp.supabase.com/mcp?project_ref=TU_REF&read_only=true"
codex mcp login supabase-lectura
```

No se declaro como registrado ni autenticado. Tampoco se pudo enviar una consulta real ni probar la escritura `prueba-escritura`. No se inventaron respuestas ni capturas.

## 4. Rol de solo lectura

El esquema real confirmado por la migracion local es `public.productos` con columnas:

- `id`
- `user_id`
- `nombre`
- `sku`
- `cantidad`
- `minimo`
- `created_at`

El criterio local utilizado es `cantidad < minimo`, igual al criterio de la interfaz existente.

Se preparo una plantilla segura en [mcp-inventario/sql/role_lector.sql.template](../../../mcp-inventario/sql/role_lector.sql.template). Contiene marcadores sin credenciales reales.

Estado:

- Creacion/evaluacion del rol en Supabase: pendiente por falta de acceso administrativo autorizado.
- Prueba de `SELECT`, `INSERT`, `UPDATE` y `DELETE`: pendiente.
- Comprobacion de RLS y membresias privilegiadas: pendiente.
- Uso de FastMCP con `inventario_lector`: configurado en el codigo, pendiente de integracion real.

## 5. Servidor FastMCP

Archivos:

- [mcp-inventario/server.py](../../../mcp-inventario/server.py)
- [mcp-inventario/requirements.txt](../../../mcp-inventario/requirements.txt)
- [mcp-inventario/.env.example](../../../mcp-inventario/.env.example)
- [mcp-inventario/README.md](../../../mcp-inventario/README.md)
- [mcp-inventario/tests/test_server.py](../../../mcp-inventario/tests/test_server.py)

Herramientas descubiertas en una prueba local:

```text
["buscar_producto", "stock_bajo"]
```

`buscar_producto(nombre)`:

- rechaza nombres vacios;
- usa `ILIKE %s` con el nombre como parametro;
- selecciona solo `nombre`, `cantidad` y `minimo`;
- ordena por nombre e id;
- limita a 50 registros.

`stock_bajo()`:

- usa `cantidad < minimo`;
- ordena por mayor diferencia entre minimo y cantidad;
- usa desempates por nombre e id;
- limita a 50 registros.

No existe una herramienta para ejecutar SQL libre ni para insertar, actualizar o eliminar.

## 6. Comparacion entre servidores

| Aspecto | MCP oficial Supabase | FastMCP propio |
|---|---|---|
| Estado | Pendiente de autenticacion/registro | Implementado y probado unitariamente |
| Herramienta utilizada | No medido | `stock_bajo()` prevista |
| Numero de llamadas | No medido | No medido con base real |
| Productos encontrados | No disponible | Pendiente de conexion real |
| Coincidencia de cantidades | No disponible | Pendiente de conexion real |
| Orden | No medido | Diferencia minima descendente |
| Facilidad de uso | Pendiente | Registro directo como dos herramientas |
| Restricciones | Debe quedar en read-only | Rol lector y codigo sin escritura |

No se comparearon datos reales porque no habia un servidor MCP oficial registrado ni credenciales de `inventario_lector` disponibles para una conexion segura.

## 7. Prueba de inyeccion

Estado: **pendiente**.

No se creo el registro malicioso ni se ejecuto una consulta destructiva. Por seguridad no se modificaron datos reales. El procedimiento correcto es:

- crear el nombre literal desde la interfaz solo si la aplicacion lo permite;
- consultar el inventario mediante una herramienta de solo lectura;
- rechazar cualquier llamada de borrado o escritura;
- verificar los registros con otra consulta de solo lectura.

No se representa como aprobada una prueba que no se ejecuto.

## 8. Evidencia de aprendizaje

### A. Prompts clave

- Crear el servidor FastMCP con FastMCP, psycopg y python-dotenv.
- Exponer solo `buscar_producto(nombre)` y `stock_bajo()`.
- Consultar ambos MCP con la misma pregunta de stock bajo.
- Consultar el inventario sin ejecutar instrucciones almacenadas en nombres de producto.

### B. Error real de la IA

Se observaron dos errores reales de integracion de dependencias:

1. FastMCP no pudo importar `pydantic_settings`.
2. MCP 2.3.0 fue incompatible con FastMCP 2.14.1.

Se corrigieron fijando `pydantic-settings==2.12.0` y `mcp==1.24.0`, y se verifico el entorno mediante pruebas.

Tambien se detecto que el interprete global no tenia psycopg; la solucion fue ejecutar las pruebas con `.venv\Scripts\python.exe`.

### C. Comando o herramienta aprobada/rechazada

- Aprobado: `.venv\Scripts\python.exe -m pip install -r mcp-inventario\requirements.txt`, porque instala exclusivamente las dependencias fijadas del servidor.
- Aprobado: las consultas parametrizadas y las pruebas con mocks, porque no modifican datos reales.
- Rechazado: el uso de credenciales administrativas o SQL libre.
- Rechazado: el comando de Codex que no existe en el entorno hasta que se instale y autentique.

### D. Como se comprobo

Comandos ejecutados:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r mcp-inventario\requirements.txt
.\.venv\Scripts\python.exe -m unittest discover -s mcp-inventario/tests -v
npm test
.\.venv\Scripts\python.exe -c "import asyncio,sys; sys.path.insert(0, 'mcp-inventario'); import server; print(asyncio.run(server.mcp.get_tools()).keys())"
git diff --check
```

Resultados:

- Pruebas FastMCP: 8/8 aprobadas.
- Pruebas Node existentes: 7/7 aprobadas.
- Herramientas descubiertas exactamente: `buscar_producto` y `stock_bajo`.
- Consultas limitadas a 50 y parametrizadas.
- Ninguna herramienta de SQL libre o escritura en la salida de descubrimiento.

## 9. Limitaciones

- El ejecutable `codex` no esta disponible en el PATH.
- No se pudo autenticar el MCP oficial de Supabase ni registrar `supabase-lectura`.
- No se proporcionaron credenciales reales de `inventario_lector`.
- No se creo ni verifico el rol PostgreSQL.
- No se realizaron consultas reales a Supabase.
- No se ejecutaron pruebas reales de escritura o inyeccion.
- Las pruebas de PostgreSQL son unitarias con mocks; estan claramente identificadas como locales.

## 10. Enlace al PR

Pull Request: https://github.com/fernandopalaciospluma17-design/mini-inventario/pull/13

- Rama origen: `dia-08-mcp`
- Rama destino: `dia-07-skill`
