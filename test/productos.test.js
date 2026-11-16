import assert from 'node:assert/strict';
import test from 'node:test';
import { createProductosStore, ProductDataError } from '../public/productos.js';

class MemoryStorage {
  #values = new Map();
  getItem(key) { return this.#values.get(key) ?? null; }
  setItem(key, value) { this.#values.set(key, String(value)); }
}

function makeStore() {
  const storage = new MemoryStorage();
  return { storage, store: createProductosStore(storage) };
}

test('inicia vacío, agrega productos y normaliza el SKU', () => {
  const { storage, store } = makeStore();
  assert.deepEqual(store.list(), []);
  const product = store.add({ nombre: '  Té verde ', sku: ' te-01 ', cantidad: 8, minimo: 3 });
  assert.equal(product.nombre, 'Té verde');
  assert.equal(product.sku, 'TE-01');
  assert.equal(store.list().length, 1);
  assert.ok(product.created_at);
  assert.equal(createProductosStore(storage).list()[0].id, product.id);
});

test('rechaza datos requeridos vacíos, cantidades inválidas y SKU duplicado', () => {
  const { store } = makeStore();
  assert.throws(() => store.add({ nombre: ' ', sku: 'A', cantidad: 1, minimo: 1 }), ProductDataError);
  assert.throws(() => store.add({ nombre: 'Artículo', sku: ' ', cantidad: 1, minimo: 1 }), ProductDataError);
  assert.throws(() => store.add({ nombre: 'Artículo', sku: 'A', cantidad: -1, minimo: 1 }), ProductDataError);
  assert.throws(() => store.add({ nombre: 'Artículo', sku: 'A', cantidad: 1.2, minimo: 1 }), ProductDataError);
  assert.throws(() => store.add({ nombre: 'Artículo', sku: 'A', cantidad: NaN, minimo: 1 }), ProductDataError);
  assert.throws(() => store.add({ nombre: 'Artículo', sku: 'A', cantidad: '2', minimo: 1 }), ProductDataError);
  store.add({ nombre: 'Artículo', sku: 'A', cantidad: 1, minimo: 1 });
  assert.throws(() => store.add({ nombre: 'Otro', sku: ' a ', cantidad: 1, minimo: 1 }), /Ya existe/);
});

test('editar actualiza el registro existente, conserva id y fecha, y revisa SKU duplicados', () => {
  const { store } = makeStore();
  const first = store.add({ nombre: 'Uno', sku: 'A', cantidad: 4, minimo: 2 });
  store.add({ nombre: 'Dos', sku: 'B', cantidad: 4, minimo: 2 });
  const updated = store.update(first.id, { nombre: 'Uno nuevo', sku: 'A-2', cantidad: 1, minimo: 3 });
  assert.equal(store.list().length, 2);
  assert.equal(updated.id, first.id);
  assert.equal(updated.created_at, first.created_at);
  assert.equal(updated.cantidad < updated.minimo, true);
  const backInStock = store.update(first.id, { nombre: 'Uno nuevo', sku: 'A-2', cantidad: 4, minimo: 3 });
  assert.equal(backInStock.cantidad < backInStock.minimo, false);
  assert.throws(() => store.update(first.id, { nombre: 'Uno', sku: 'B', cantidad: 1, minimo: 1 }), /Ya existe/);
});

test('elimina el registro solicitado y rechaza identificadores inexistentes', () => {
  const { store } = makeStore();
  const product = store.add({ nombre: 'Uno', sku: 'A', cantidad: 1, minimo: 2 });
  store.remove(product.id);
  assert.deepEqual(store.list(), []);
  assert.throws(() => store.remove(product.id), /No se encontró/);
});

test('un valor almacenado corrupto se informa y no se sobrescribe', () => {
  const storage = new MemoryStorage();
  storage.setItem('mini-inventario:productos:v1', '{mal json');
  const store = createProductosStore(storage);
  assert.throws(() => store.list(), /No se pudieron interpretar/);
  assert.throws(() => store.add({ nombre: 'Uno', sku: 'A', cantidad: 1, minimo: 1 }), /No se pudieron interpretar/);
  assert.equal(storage.getItem('mini-inventario:productos:v1'), '{mal json');
});

test('conserva tres productos y acepta cantidad igual al mínimo', () => {
  const { store } = makeStore();
  store.add({ nombre: 'Uno', sku: 'A', cantidad: 1, minimo: 1 });
  store.add({ nombre: 'Dos', sku: 'B', cantidad: 0, minimo: 4 });
  store.add({ nombre: 'Tres', sku: 'C', cantidad: 10, minimo: 2 });
  const products = store.list();
  assert.equal(products.length, 3);
  assert.equal(products[0].cantidad < products[0].minimo, false);
  assert.equal(products[1].cantidad < products[1].minimo, true);
});
