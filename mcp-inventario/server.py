"""Servidor MCP de solo lectura para consultar el inventario."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any
from urllib.parse import unquote, urlsplit

import psycopg
from dotenv import load_dotenv
from fastmcp import FastMCP
from psycopg.rows import dict_row


ENV_PATH = Path(__file__).resolve().with_name(".env")
load_dotenv(dotenv_path=ENV_PATH)

mcp = FastMCP("inventario")

BUSCAR_SQL = """
    select nombre, cantidad, minimo
    from public.productos
    where nombre ilike %s
    order by nombre asc, id asc
    limit 50
"""

STOCK_BAJO_SQL = """
    select nombre, cantidad, minimo
    from public.productos
    where cantidad < minimo
    order by (minimo - cantidad) desc, nombre asc, id asc
    limit 50
"""


def _database_url() -> str:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        raise RuntimeError(
            "Falta DATABASE_URL. Configure mcp-inventario/.env o el entorno del proceso."
        )
    try:
        parsed_url = urlsplit(database_url)
        username = unquote(parsed_url.username or "")
    except ValueError as exc:
        raise RuntimeError("DATABASE_URL no es una URL PostgreSQL valida.") from exc
    if not (username == "inventario_lector" or username.startswith("inventario_lector.")):
        raise RuntimeError("DATABASE_URL debe usar el rol inventario_lector.")
    return database_url


def _execute_read(query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
    try:
        database_url = _database_url()
        with psycopg.connect(database_url, connect_timeout=5, row_factory=dict_row) as connection:
            with connection.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()
    except RuntimeError:
        raise
    except psycopg.Error as exc:
        # No convertir errores de conexión/consulta en un resultado vacío ni filtrar URLs.
        raise RuntimeError("Falló la consulta de solo lectura a PostgreSQL.") from None


@mcp.tool
def buscar_producto(nombre: str) -> list[dict[str, Any]]:
    """Busca productos por nombre sin permitir cadenas vacias ni SQL libre."""
    if not isinstance(nombre, str) or not nombre.strip():
        raise ValueError("El nombre no puede estar vacio.")

    pattern = f"%{nombre.strip()}%"
    return _execute_read(BUSCAR_SQL, (pattern,))


@mcp.tool
def stock_bajo() -> list[dict[str, Any]]:
    """Devuelve hasta 50 productos con cantidad estrictamente menor que minimo."""
    return _execute_read(STOCK_BAJO_SQL)


if __name__ == "__main__":
    mcp.run()
