# Historias de usuario — Mini Inventario

## 1. Iniciar sesión con Google

**Como persona usuaria, quiero iniciar sesión con Google para acceder a mi inventario.**

### Criterios de aceptación

- [ ] Al completar correctamente la autenticación de Google, la aplicación muestra el inventario de esa cuenta.
- [ ] Si la autenticación falla o se cancela, no se concede acceso y se muestra un mensaje comprensible.
- [ ] Una cuenta no puede consultar ni modificar los productos de otra.

## 2. Registrar productos

**Como persona usuaria, quiero registrar productos para llevar control de sus existencias.**

### Criterios de aceptación

- [ ] Puedo guardar un producto indicando nombre, SKU, cantidad y cantidad mínima.
- [ ] Se rechaza el registro si falta algún dato o si el nombre o SKU están vacíos.
- [ ] Cantidad y cantidad mínima aceptan enteros desde cero y rechazan valores negativos, decimales y texto.
- [ ] Se rechaza un SKU ya registrado en mi inventario y se explica el motivo.

## 3. Consultar inventario y detectar existencias bajas

**Como persona usuaria, quiero ver mis productos y reconocer los que tienen existencias bajas para saber cuáles requieren atención.**

### Criterios de aceptación

- [ ] El inventario muestra nombre, SKU, cantidad y cantidad mínima de cada producto.
- [ ] Un producto se marca como «Por debajo del mínimo» cuando cantidad < cantidad mínima.
- [ ] Un producto con cantidad igual o mayor que el mínimo no se marca como «Por debajo del mínimo».
- [ ] Si no hay productos registrados, la vista indica que el inventario está vacío.

## 4. Editar productos y existencias

**Como persona usuaria, quiero editar los datos y cantidades de un producto para mantener actualizado mi inventario.**

### Criterios de aceptación

- [ ] Puedo modificar nombre, SKU, cantidad y cantidad mínima de un producto propio.
- [ ] Se aplican al editar las mismas validaciones de datos y cantidades que al registrar.
- [ ] Si cambio el SKU por uno usado en otro producto de mi inventario, se rechaza el cambio y se conservan los datos anteriores.
- [ ] Después de guardar, la vista muestra los valores actualizados y recalcula si el producto está por debajo del mínimo.

## 5. Eliminar productos

**Como persona usuaria, quiero eliminar productos que ya no forman parte de mi inventario.**

### Criterios de aceptación

- [ ] Puedo solicitar la eliminación de un producto de mi inventario.
- [ ] Antes de eliminarlo, la aplicación pide confirmación.
- [ ] Si confirmo, el producto desaparece del inventario y deja de contarse entre los productos por debajo del mínimo.
- [ ] Si cancelo, el producto permanece sin cambios.
