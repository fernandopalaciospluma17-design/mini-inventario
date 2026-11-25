# Mini Inventario

Aplicación web de inventario con Express y Supabase Auth/PostgreSQL. Requiere Node.js 22.

## Iniciar

1. Instala dependencias con `npm install`.
2. Copia `.env.example` a `.env` y completa `SUPABASE_URL` y `SUPABASE_KEY` con la URL del proyecto y una clave pública `publishable` o `anon`.
3. Revisa la migración `supabase/migrations/20261125014157_create_productos.sql` y pide aprobación antes de aplicarla al proyecto Supabase.
4. Ejecuta `npm start` y abre <http://localhost:3000>.

La aplicación necesita configuración y una tabla aplicada en Supabase. Nunca uses una clave `service_role` o `secret` en `.env` ni en el navegador. `/config.js` solo expone la URL y la clave pública.

Durante el desarrollo usa `npm run dev`; las pruebas automatizadas se ejecutan con `npm test`.

## Funciones

- Registro, inicio y cierre de sesión con correo y contraseña.
- Listar, agregar, editar y eliminar productos en Supabase.
- Cada producto tiene nombre, SKU, cantidad y cantidad mínima. El SKU se recorta y normaliza a mayúsculas; es único por usuario.
- Cantidad y mínimo son enteros no negativos. Se marca para reponer cuando la cantidad es menor al mínimo.
- Los productos se aíslan por persona en PostgreSQL con RLS; la interfaz no usa `localStorage` como fuente de inventario.

## Estructura

- `server.js`: servidor Express, archivos estáticos, `/health` y configuración pública `/config.js`.
- `public/`: interfaz y módulos de autenticación/datos.
- `supabase/migrations/`: esquema, permisos y políticas RLS.
- `test/`: pruebas con el módulo integrado `node:test`.
- `entregas/dia-04/README.md`: bitácora, resultados y evidencia pendiente.
