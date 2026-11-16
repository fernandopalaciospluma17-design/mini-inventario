const STORAGE_KEY = 'mini-inventario:productos:v1';
const MAX_INTEGER = 2_147_483_647;

export class ProductDataError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ProductDataError';
  }
}

function normalize(input) {
  if (!input || typeof input !== 'object') {
    throw new ProductDataError('Los datos del producto no son válidos.');
  }

  const nombre = typeof input.nombre === 'string' ? input.nombre.trim() : '';
  const sku = typeof input.sku === 'string' ? input.sku.trim().toUpperCase() : '';
  if (!nombre) throw new ProductDataError('Escribe el nombre del producto.');
  if (!sku) throw new ProductDataError('Escribe el SKU del producto.');
  if (nombre.length > 120) throw new ProductDataError('El nombre no puede superar 120 caracteres.');
  if (sku.length > 80) throw new ProductDataError('El SKU no puede superar 80 caracteres.');

  const cantidad = input.cantidad;
  const minimo = input.minimo;
  for (const [label, value] of [['La cantidad', cantidad], ['La cantidad mínima', minimo]]) {
    if (!Number.isSafeInteger(value) || value < 0 || value > MAX_INTEGER) {
      throw new ProductDataError(`${label} debe ser un entero entre 0 y ${MAX_INTEGER}.`);
    }
  }

  return { nombre, sku, cantidad, minimo };
}

function validateStoredProducts(value) {
  if (!Array.isArray(value)) {
    throw new ProductDataError('Los datos guardados no tienen un formato válido. No se modificaron.');
  }
  return value.map((product) => {
    if (!product || typeof product.id !== 'string' || typeof product.created_at !== 'string') {
      throw new ProductDataError('Hay un producto guardado con formato inválido. No se modificaron los datos.');
    }
    return { id: product.id, ...normalize(product), created_at: product.created_at };
  });
}

export function createProductosStore(storage = globalThis.localStorage) {
  if (!storage) throw new ProductDataError('El almacenamiento local no está disponible en este navegador.');

  function read() {
    let raw;
    try {
      raw = storage.getItem(STORAGE_KEY);
    } catch {
      throw new ProductDataError('No se pudieron leer los productos guardados.');
    }
    if (raw === null) return [];
    try {
      return validateStoredProducts(JSON.parse(raw));
    } catch (error) {
      if (error instanceof ProductDataError) throw error;
      throw new ProductDataError('No se pudieron interpretar los productos guardados. No se modificaron los datos.');
    }
  }

  function write(products) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(products));
    } catch {
      throw new ProductDataError('No se pudieron guardar los cambios en este navegador.');
    }
  }

  return {
    list() {
      return read();
    },

    add(input) {
      const products = read();
      const normalized = normalize(input);
      if (products.some((product) => product.sku === normalized.sku)) {
        throw new ProductDataError('Ya existe un producto con ese SKU.');
      }
      const product = {
        id: globalThis.crypto.randomUUID(),
        ...normalized,
        created_at: new Date().toISOString(),
      };
      write([...products, product]);
      return product;
    },

    update(id, input) {
      const products = read();
      const index = products.findIndex((product) => product.id === id);
      if (index === -1) throw new ProductDataError('No se encontró el producto que quieres editar.');
      const normalized = normalize(input);
      if (products.some((product) => product.id !== id && product.sku === normalized.sku)) {
        throw new ProductDataError('Ya existe otro producto con ese SKU.');
      }
      const updated = { ...products[index], ...normalized };
      products[index] = updated;
      write(products);
      return updated;
    },

    remove(id) {
      const products = read();
      const remaining = products.filter((product) => product.id !== id);
      if (remaining.length === products.length) {
        throw new ProductDataError('No se encontró el producto que quieres eliminar.');
      }
      write(remaining);
    },
  };
}
