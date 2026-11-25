# Problema detectado — indicador sin etiqueta al cerrar sesión

## Hallazgo

- **Pantalla:** cabecera de acceso, elemento `#signed-in-email`.
- **Viewports:** escritorio 1280×800 y móvil 390×844.
- **Reproducción:** iniciar la app sin sesión y observar la cabecera.
- **Comportamiento observado:** aparece un punto ámbar sin texto, aunque no hay usuario conectado.
- **Comportamiento esperado:** el encabezado no debe mostrar un indicador de sesión sin etiqueta cuando el correo está vacío.
- **Evidencia anterior:** `capturas/antes/bloqueo-config-escritorio-1280x800.png` y `capturas/antes/bloqueo-config-movil-390x844.png`.

## Causa

La cabecera reutilizaba el `span` del correo vacío y una regla CSS anterior seguía dándole tamaño, forma circular y color ámbar.

## Corrección

Se quitó el estilo de punto de estado y se añadió `#signed-in-email:empty { display: none; }` en `public/styles.css`.

## Verificación posterior

Con Playwright CLI en ambos viewports, `getComputedStyle(...).display` devolvió `none` y el ancho del elemento fue `0`. Las capturas posteriores están en `capturas/despues/`. Esta comprobación no requirió iniciar sesión ni modificar productos.
