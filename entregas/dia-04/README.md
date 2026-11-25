# Mini Inventario — Día 4

## 1. Datos de la actividad

- **Actividad:** Día 4 — Conecta datos reales e inicio de sesión con Supabase.
- **Repositorio:** `fernandopalaciospluma17-design/mini-inventario`.
- **Rama de trabajo:** `dia-04-supabase`.
- **Fecha:** 24 de noviembre de 2026.
- **Integrantes:** no proporcionados.

## 2. Objetivo

Se preparó la aplicación para registro e inicio de sesión con correo y contraseña, y para guardar productos en Supabase en vez de `localStorage`. La separación entre inventarios queda protegida por políticas RLS en PostgreSQL.

## 3. Diagnóstico inicial

El checkout estaba en `dia-03-web`, con Express, HTML/CSS/JavaScript modular, pruebas y persistencia de productos en `localStorage`. La rama `main` local solo contenía los archivos iniciales del repositorio, por lo que el trabajo se inició desde `dia-03-web` para conservar la aplicación funcional. `docs/diseno.md` ya definía los campos `id`, `user_id`, `nombre`, `sku`, `cantidad`, `minimo` y `created_at`, más unicidad de SKU por usuario.

Se reutilizaron el servidor Express, la interfaz y las reglas de validación. Se reemplazó el almacén local por llamadas a Supabase, se añadió registro/inicio/cierre de sesión, la ruta de configuración pública, el SQL versionado, `.env.example` y pruebas unitarias. El SDK mantiene la sesión según su configuración predeterminada; los datos de productos ya no usan almacenamiento local.

La actividad pide correo y contraseña, mientras que el diseño previo mencionaba Google OAuth y una API Express. Se actualizó el diseño para reflejar el flujo del Día 4. No hay un Project Ref, proyecto Supabase ni conexión MCP disponibles en esta sesión; por eso no se aplicó la migración y no se hicieron pruebas reales con cuentas.

## 4. Herramientas y configuración

- Node.js instalado en el entorno: `v24.15.0`; el proyecto declara Node 22 (`>=22 <23`). Las pruebas se ejecutaron además con Node `v22.23.5`.
- SDK instalado y fijado: `@supabase/supabase-js@2.119.2`.
- `.env.example` define `SUPABASE_URL`, `SUPABASE_KEY` y `PORT` sin valores reales. El servidor carga `.env` con la opción de Node `--env-file-if-exists`.
- `/config.js` publica solo URL y clave pública; falla con 503 si falta configuración y rechaza claves `sb_secret_` o un JWT `service_role`.
- Skills solicitadas instaladas: `.agents/skills/supabase/SKILL.md` y `.agents/skills/supabase-postgres-best-practices/SKILL.md`.
- MCP de Supabase: **pendiente**. No hubo herramienta MCP de Supabase disponible ni se proporcionó el Project Ref, así que no se configuró un servidor ni se consultó un proyecto.

## 5. Diseño de la base de datos

La migración preparada está en `supabase/migrations/20261125014157_create_productos.sql`:

| Campo | Tipo y regla |
| --- | --- |
| `id` | `uuid`, PK y generado por `gen_random_uuid()` |
| `user_id` | `uuid`, obligatorio, FK a `auth.users(id)` con borrado en cascada |
| `nombre` | `text`, obligatorio, de 1 a 120 caracteres tras recortar espacios |
| `sku` | `text`, obligatorio, de 1 a 80 caracteres tras recortar espacios |
| `cantidad` | `integer`, obligatorio, por defecto 0 y no negativo |
| `minimo` | `integer`, obligatorio, por defecto 0 y no negativo |
| `created_at` | `timestamptz`, obligatorio, por defecto `now()` |

Se crea un índice por `user_id` y un índice único por `(user_id, upper(btrim(sku)))`. El mismo SKU puede existir en cuentas distintas, pero no repetirse en una cuenta sin importar mayúsculas o espacios exteriores. No se necesita `updated_at` en las funciones actuales.

## 6. Seguridad RLS

RLS hace que PostgreSQL evalúe quién puede leer o modificar cada fila. `auth.uid()` devuelve el ID de la persona autenticada en la solicitud. La política `SELECT` permite leer filas propias; `INSERT` revisa el propietario con `WITH CHECK`; `UPDATE` limita tanto la fila original (`USING`) como el resultado (`WITH CHECK`); `DELETE` solo permite borrar filas propias. La migración revoca privilegios de `anon` y concede las operaciones necesarias a `authenticated`.

Fragmento de la migración:

```sql
alter table public.productos enable row level security;
revoke all on public.productos from anon;
grant select, insert, update, delete on public.productos to authenticated;

create policy "Cada persona actualiza sus productos"
  on public.productos for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
```

La interfaz no es una frontera de seguridad: las políticas PostgreSQL deben impedir accesos aun cuando alguien cambie solicitudes desde el navegador. El SQL aún no se ha ejecutado en Supabase, así que el estado real de la tabla, políticas y permisos no está verificado.

## 7. Autenticación e integración

La vista ofrece creación de cuenta, inicio con correo y contraseña, restauración de sesión y cierre de sesión. Con confirmación de correo habilitada en Supabase, el alta informa a la persona que confirme el mensaje antes de iniciar. El SDK gestiona la sesión; no se almacena manualmente la contraseña.

Express lee `SUPABASE_URL` y `SUPABASE_KEY`; `/config.js` entrega únicamente esos valores públicos al navegador. El cliente centraliza la inicialización y utiliza la sesión para crear productos con `user_id`. Consultas, altas, cambios y borrados van a `public.productos`, donde RLS decide el acceso. No se usa `service_role` en el frontend.

## 8. Pruebas y resultados

Comando ejecutado: `npm exec --yes --package=node@22 -- node --test` con Node `v22.23.5`.

| Prueba | Resultado esperado | Observado | Estado |
| --- | --- | --- | --- |
| Operaciones CRUD simuladas del cliente | Consultar, crear, editar y borrar en tabla `productos` | 4 pruebas con cliente simulado aprobadas; no se conectaron a Supabase real | Aprobada en unidad |
| Validación antes de insertar | Rechazar nombre vacío y cantidad negativa | Rechazados antes de llamar a Supabase | Aprobada en unidad |
| `/config.js` sin configuración | Error claro, no HTML con 200 | 503 y mensaje de texto | Aprobada |
| `/config.js` configurado | JavaScript solo con URL y clave pública | Content-Type correcto y valores esperados | Aprobada |
| Clave secret o JWT `service_role` | No exponer ni aceptar | 503 sin revelar la clave | Aprobada |
| Inicio/registro/cierre con Supabase real | Sesiones funcionales | Sin proyecto ni cuentas disponibles | Pendiente |
| CRUD real y recarga | Cambios persistentes | Sin conexión al proyecto | Pendiente |
| Aislamiento entre usuarios A y B y pruebas negativas RLS | Cada cuenta ve solo sus filas; operaciones cruzadas bloqueadas | No ejecutado | Pendiente |

Resultado total automatizado: **7 pruebas aprobadas, 0 fallidas**. Las pruebas no demuestran el comportamiento de RLS en una base real.

## 9. Evidencias

No se generaron capturas, porque no existen cuentas Supabase conectadas. La lista exacta de capturas necesarias está en [`evidencias/README.md`](evidencias/README.md). No se simularon sesiones ni resultados visuales.

## 10. Bitácora de uso de IA

- **Prompt principal:** «haz lo que pide el archivo .md de actividad dia 4 que esta en la carpeta docs».
- **Instrucción de la actividad aplicada:** conservar la aplicación existente, integrar Supabase, usar RLS, probar aislamiento y no inventar resultados ni credenciales.
- **Revisión crítica:** el diseño anterior decía Google OAuth y API en Express, pero la actividad vigente exige correo y contraseña. Se detectó al comparar `docs/diseno.md` con la lista de requisitos y se actualizó el diseño para describir la implementación del Día 4.
- **MCP/SQL:** no hubo una operación MCP aprobada o rechazada. No se ejecutó SQL ni se modificó una base de datos. La conexión no está disponible y se necesita el Project Ref. La migración se preparó y requiere revisión y aprobación antes de aplicarla.
- **Verificación:** se revisaron las instrucciones instaladas de Supabase y PostgreSQL, se ejecutaron siete pruebas automatizadas y se comprobó que `/config.js` rechaza claves secretas.

## 11. Conclusión

El código local y la migración están preparados, y las pruebas automatizadas pasan bajo Node 22. La integración funcional con un proyecto real, el estado de RLS, las sesiones A/B, las capturas y el MCP quedan pendientes porque falta el Project Ref y la autorización para aplicar el SQL. La rama parte de `dia-03-web` ya que `main` no contiene la aplicación del Día 3.

## 12. Pull Request

Pendiente de publicar.
