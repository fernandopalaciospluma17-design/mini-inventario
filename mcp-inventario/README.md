# Servidor MCP Mini Inventario

Servidor FastMCP de solo lectura que expone exactamente `buscar_producto(nombre)` y `stock_bajo()`.

## Configuracion

Python requerido: 3.12.

Desde la raiz del repositorio:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r mcp-inventario\requirements.txt
Copy-Item mcp-inventario\.env.example mcp-inventario\.env
```

Complete `DATABASE_URL` con la cadena Session pooler del rol `inventario_lector`. No use el usuario `postgres`, una clave administrativa ni el rol `service_role`.

## Herramientas

- `buscar_producto(nombre)`: rechaza texto vacio, usa `ILIKE` parametrizado y limita a 50 resultados.
- `stock_bajo()`: retorna `cantidad < minimo`, ordenado por mayor diferencia descendente y nombre, con limite 50.

La tabla real es `public.productos` y sus columnas son `nombre`, `cantidad` y `minimo`, junto con `id` para el orden estable.

No existe SQL libre ni ninguna herramienta de escritura.

## Inicio local

```powershell
.\.venv\Scripts\python.exe mcp-inventario\server.py
```

## Pruebas

```powershell
python -m unittest discover -s mcp-inventario/tests -v
```
