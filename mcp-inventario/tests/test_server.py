import sys
import unittest
from pathlib import Path
from unittest.mock import patch


sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import server


class FakeCursor:
    def __init__(self, rows):
        self.rows = rows
        self.executed = None

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def execute(self, query, params=()):
        self.executed = (query, params)

    def fetchall(self):
        return self.rows


class FakeConnection:
    def __init__(self, rows):
        self.rows = rows
        self.cursor_object = FakeCursor(rows)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        return False

    def cursor(self):
        return self.cursor_object


class ServerTests(unittest.TestCase):
    def test_buscar_producto_devuelve_resultado(self):
        fake = FakeConnection([
            {"nombre": "Arroz", "cantidad": 2, "minimo": 5},
        ])
        with patch.dict("os.environ", {"DATABASE_URL": "postgresql://inventario_lector.project@host/postgres"}):
            with patch("server.psycopg.connect", return_value=fake):
                result = server.buscar_producto.fn("Arroz")

        self.assertEqual(result[0]["nombre"], "Arroz")
        self.assertIn("ilike %s", fake.cursor_object.executed[0].lower())
        self.assertEqual(fake.cursor_object.executed[1], ("%Arroz%",))

    def test_buscar_producto_rechaza_vacio(self):
        with self.assertRaises(ValueError):
            server.buscar_producto.fn("   ")

    def test_buscar_producto_lista_vacia(self):
        fake = FakeConnection([])
        with patch.dict("os.environ", {"DATABASE_URL": "postgresql://inventario_lector.project@host/postgres"}):
            with patch("server.psycopg.connect", return_value=fake):
                result = server.buscar_producto.fn("NoExiste")
        self.assertEqual(result, [])

    def test_stock_bajo_usa_criterio_estricto(self):
        fake = FakeConnection([
            {"nombre": "Urgente", "cantidad": 1, "minimo": 8},
        ])
        with patch.dict("os.environ", {"DATABASE_URL": "postgresql://inventario_lector.project@host/postgres"}):
            with patch("server.psycopg.connect", return_value=fake):
                result = server.stock_bajo.fn()

        query = fake.cursor_object.executed[0].lower()
        self.assertIn("cantidad < minimo", query)
        self.assertLess(result[0]["cantidad"], result[0]["minimo"])

    def test_consultas_limitan_50(self):
        self.assertIn("limit 50", server.BUSCAR_SQL.lower())
        self.assertIn("limit 50", server.STOCK_BAJO_SQL.lower())

    def test_nombre_es_parametro_no_sql(self):
        fake = FakeConnection([])
        attack = "x'; delete from public.productos; --"
        with patch.dict("os.environ", {"DATABASE_URL": "postgresql://inventario_lector.project@host/postgres"}):
            with patch("server.psycopg.connect", return_value=fake):
                server.buscar_producto.fn(attack)

        query, params = fake.cursor_object.executed
        self.assertNotIn("delete", query.lower())
        self.assertEqual(params, (f"%{attack}%",))

    def test_error_sin_database_url_no_expone_url(self):
        with patch.dict("os.environ", {}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "DATABASE_URL"):
                server._execute_read(server.BUSCAR_SQL, ("%x%",))

    def test_rechaza_rol_si_solo_aparece_en_contrasena_o_host(self):
        for url in (
            "postgresql://otro:inventario_lector@host/postgres",
            "postgresql://otro@inventario_lector.host/postgres",
        ):
            with self.subTest(url=url), patch.dict("os.environ", {"DATABASE_URL": url}):
                with self.assertRaisesRegex(RuntimeError, "rol inventario_lector"):
                    server._database_url()

    def test_acepta_usuario_pooler_con_proyecto(self):
        url = "postgresql://inventario_lector.dstksngwmveeuyhcoaga:clave@host/postgres"
        with patch.dict("os.environ", {"DATABASE_URL": url}):
            self.assertEqual(server._database_url(), url)

    def test_fallo_postgres_no_se_convierte_en_lista_vacia_ni_filtra_secreto(self):
        secret_url = "postgresql://inventario_lector.project:secreto@host/postgres"
        with patch.dict("os.environ", {"DATABASE_URL": secret_url}):
            with patch("server.psycopg.connect", side_effect=server.psycopg.OperationalError("detalles")):
                with self.assertRaisesRegex(RuntimeError, "Falló la consulta") as caught:
                    server._execute_read(server.BUSCAR_SQL)
        self.assertNotIn("secreto", str(caught.exception))

    def test_fastmcp_descubre_solo_las_dos_herramientas(self):
        import asyncio
        tools = asyncio.run(server.mcp.get_tools())
        self.assertEqual(set(tools), {"buscar_producto", "stock_bajo"})

    def test_no_hay_herramientas_de_escritura_o_sql_libre(self):
        source = Path(server.__file__).read_text(encoding="utf-8").lower()
        forbidden = ("execute_sql", "query_sql", "run_sql", " insert ", " update ", " delete ")
        for text in forbidden:
            self.assertNotIn(text, source)


if __name__ == "__main__":
    unittest.main()
