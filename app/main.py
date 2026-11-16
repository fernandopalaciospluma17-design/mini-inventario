import os
import sqlite3
from pathlib import Path

from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import FileResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from starlette.middleware.sessions import SessionMiddleware

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")
DB_PATH = Path(os.getenv("DATABASE_PATH", ROOT / "inventory.db"))
app = FastAPI(title="Mini Inventario")
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET") or f"local-{os.urandom(32).hex()}",
    same_site="lax",
    https_only=os.getenv("COOKIE_SECURE", "false").lower() == "true",
)
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")

oauth = OAuth()
GOOGLE_READY = bool(os.getenv("GOOGLE_CLIENT_ID") and os.getenv("GOOGLE_CLIENT_SECRET"))
if GOOGLE_READY:
    oauth.register(
        name="google",
        client_id=os.environ["GOOGLE_CLIENT_ID"],
        client_secret=os.environ["GOOGLE_CLIENT_SECRET"],
        server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
        client_kwargs={"scope": "openid email profile"},
    )


def connect():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with connect() as db:
        db.execute(
            """CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner TEXT NOT NULL,
                name TEXT NOT NULL,
                sku TEXT NOT NULL,
                quantity INTEGER NOT NULL CHECK(quantity >= 0),
                minimum INTEGER NOT NULL CHECK(minimum >= 0),
                UNIQUE(owner, sku)
            )"""
        )


init_db()


class ProductInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    sku: str = Field(min_length=1, max_length=80)
    quantity: int = Field(ge=0)
    minimum: int = Field(ge=0)

    def normalized(self):
        data = self.model_dump()
        data["name"] = data["name"].strip()
        data["sku"] = data["sku"].strip()
        if not data["name"] or not data["sku"]:
            raise HTTPException(422, "El nombre y el SKU no pueden estar vacíos.")
        return data


def owner_for(request: Request):
    owner = request.session.get("owner")
    if not owner:
        raise HTTPException(401, "Inicia sesión para continuar.")
    return owner


def serialize(row):
    product = dict(row)
    product["low_stock"] = product["quantity"] < product["minimum"]
    return product


@app.get("/")
def home():
    return FileResponse(ROOT / "static" / "index.html")


@app.get("/api/session")
def session_info(request: Request):
    return {"user": request.session.get("user"), "google_ready": GOOGLE_READY}


@app.get("/auth/google")
async def google_login(request: Request):
    if not GOOGLE_READY:
        raise HTTPException(503, "El inicio con Google no está configurado.")
    callback = request.url_for("google_callback")
    return await oauth.google.authorize_redirect(request, callback)


@app.get("/auth/callback", name="google_callback")
async def google_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        profile = token.get("userinfo") or await oauth.google.userinfo(token=token)
        if not profile or not profile.get("email") or profile.get("email_verified") is False:
            raise HTTPException(403, "Google no confirmó el correo de esta cuenta.")
        request.session.clear()
        request.session["owner"] = profile["sub"]
        request.session["user"] = {"name": profile.get("name", ""), "email": profile["email"]}
        return RedirectResponse("/", status_code=303)
    except HTTPException:
        raise
    except Exception:
        return RedirectResponse("/?login_error=1", status_code=303)


@app.post("/auth/logout")
def logout(request: Request):
    request.session.clear()
    return Response(status_code=204)


@app.get("/api/products")
def list_products(request: Request):
    owner = owner_for(request)
    with connect() as db:
        rows = db.execute("SELECT * FROM products WHERE owner=? ORDER BY name COLLATE NOCASE", (owner,)).fetchall()
    return [serialize(row) for row in rows]


@app.post("/api/products", status_code=201)
def create_product(body: ProductInput, request: Request):
    owner = owner_for(request)
    data = body.normalized()
    try:
        with connect() as db:
            cursor = db.execute(
                "INSERT INTO products(owner,name,sku,quantity,minimum) VALUES(?,?,?,?,?)",
                (owner, data["name"], data["sku"], data["quantity"], data["minimum"]),
            )
            row = db.execute("SELECT * FROM products WHERE id=?", (cursor.lastrowid,)).fetchone()
        return serialize(row)
    except sqlite3.IntegrityError:
        raise HTTPException(409, "Ese SKU ya existe en tu inventario.")


@app.put("/api/products/{product_id}")
def update_product(product_id: int, body: ProductInput, request: Request):
    owner = owner_for(request)
    data = body.normalized()
    try:
        with connect() as db:
            cursor = db.execute(
                "UPDATE products SET name=?,sku=?,quantity=?,minimum=? WHERE id=? AND owner=?",
                (data["name"], data["sku"], data["quantity"], data["minimum"], product_id, owner),
            )
            if cursor.rowcount == 0:
                raise HTTPException(404, "No se encontró el producto.")
            row = db.execute("SELECT * FROM products WHERE id=? AND owner=?", (product_id, owner)).fetchone()
        return serialize(row)
    except sqlite3.IntegrityError:
        raise HTTPException(409, "Ese SKU ya existe en tu inventario.")


@app.delete("/api/products/{product_id}", status_code=204)
def delete_product(product_id: int, request: Request):
    owner = owner_for(request)
    with connect() as db:
        cursor = db.execute("DELETE FROM products WHERE id=? AND owner=?", (product_id, owner))
    if cursor.rowcount == 0:
        raise HTTPException(404, "No se encontró el producto.")
