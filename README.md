# Mini Inventario — Día 3

Primera versión local de Mini Inventario. Express sirve la página estática y `/health`; los productos se guardan en el `localStorage` del navegador mediante el módulo central `public/productos.js`.

Esta etapa no incluye inicio de sesión, Supabase ni sincronización entre dispositivos. Los datos pertenecen al perfil local del navegador y no quedan vinculados a una cuenta.

## Requisitos

- Node.js 22
- npm

## Iniciar

```bash
npm install
npm start
```

Abre <http://localhost:3000>. Para usar otro puerto, define `PORT` antes de iniciar. El servidor responde en `/health` con `{"status":"ok"}`.

Durante el desarrollo usa `npm run dev`; ejecuta las pruebas automatizadas con `npm test`.

## Funciones

- Listar, agregar, editar y eliminar productos.
- Cada producto tiene nombre, SKU, cantidad y cantidad mínima. El SKU se recorta y se normaliza a mayúsculas; es único en este inventario local.
- Cantidad y mínimo son enteros de cero a 2 147 483 647. El producto se marca para reponer cuando cantidad es menor que mínimo.
- Nombre y SKU admiten hasta 120 y 80 caracteres, respectivamente.
- El acceso a datos está centralizado en `public/productos.js`; la interfaz no usa `localStorage` directamente.

## Estructura

- `server.js`: servidor Express, archivos estáticos y health check.
- `public/index.html`, `public/styles.css`, `public/app.js`: interfaz sin framework.
- `public/productos.js`: normalización, validación y persistencia local.
- `test/`: pruebas con el módulo integrado `node:test`.
- `docs/`: requisitos del producto y diseño técnico objetivo. La persistencia local y la falta temporal de autenticación son una excepción de etapa documentada en la actividad del Día 3.
