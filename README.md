# Mini Inventario

Aplicación web para llevar el control de productos y detectar existencias por debajo de su cantidad mínima. Usa Python 3.12 para el servidor y ofrece comandos npm para iniciarlo con Node.js 22 instalado.

## Requisitos

- Node.js 22
- Python 3.12
- Credenciales OAuth 2.0 de Google para habilitar el inicio de sesión

## Inicio local

1. Crea y activa un entorno virtual de Python.
2. Instala las dependencias: `python -m pip install -r requirements.txt`.
3. Copia `.env.example` como `.env` y define `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` y un valor aleatorio para `SESSION_SECRET`.
4. En Google Cloud Console, configura el URI de redirección autorizado como `http://127.0.0.1:8000/auth/callback`.
5. Inicia la aplicación con `npm run dev` y abre `http://127.0.0.1:8000`.

Si no configuras credenciales de Google, la pantalla explica que el inicio de sesión no está disponible.

## Comportamiento

- Cada cuenta de Google ve solo sus propios productos.
- El SKU debe ser único por cuenta.
- Nombre y SKU son obligatorios. Cantidad y cantidad mínima deben ser enteros no negativos.
- Un producto aparece como «Por reponer» cuando su cantidad es menor que el mínimo; la igualdad no activa el aviso.
- Los datos se guardan en `inventory.db` (o en la ruta indicada por `DATABASE_PATH`).

## Configuración

| Variable | Uso |
| --- | --- |
| `GOOGLE_CLIENT_ID` | ID de cliente OAuth de Google |
| `GOOGLE_CLIENT_SECRET` | Secreto del cliente OAuth |
| `SESSION_SECRET` | Clave para firmar sesiones; reemplaza el valor de ejemplo |
| `COOKIE_SECURE` | Usa `true` para exigir cookies HTTPS en producción |
| `DATABASE_PATH` | Ruta de la base SQLite; por defecto `inventory.db` |

No guardes credenciales reales ni archivos `.env` en el repositorio.
