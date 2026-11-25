import assert from 'node:assert/strict';
import test from 'node:test';
import { createProductosStore, ProductDataError } from '../public/productos.js';

function makeClient({ products = [], userId = 'user-a' } = {}) {
  const calls = [];
  let result;
  const query = {
    select(fields) { calls.push(['select', fields]); return this; },
    order(field) { calls.push(['order', field]); result = { data: [...products], error: null }; return Promise.resolve(result); },
    insert(value) { calls.push(['insert', value]); result = { data: { id: 'new-id', ...value }, error: null }; return this; },
    update(value) { calls.push(['update', value]); result = { data: { id: 'p1', ...value }, error: null }; return this; },
    delete() { calls.push(['delete']); result = { data: { id: 'p1' }, error: null }; return this; },
    eq(field, value) { calls.push(['eq', field, value]); return this; },
    single() { return Promise.resolve(result); },
    maybeSingle() { return Promise.resolve(result); },
  };
  return {
    calls,
    from(name) { calls.push(['from', name]); return query; },
    auth: { async getUser() { return { data: { user: { id: userId } }, error: null }; } },
  };
}

test('lista productos desde public.productos ordenados por nombre', async () => {
  const client = makeClient({ products: [{ id: 'p1', nombre: 'Té' }] });
  const store = createProductosStore(client);
  assert.deepEqual(await store.list(), [{ id: 'p1', nombre: 'Té' }]);
  assert.ok(client.calls.some((call) => call[0] === 'from' && call[1] === 'productos'));
  assert.ok(client.calls.some((call) => call[0] === 'order' && call[1] === 'nombre'));
});

test('crea producto normalizado y asigna user_id de la sesión', async () => {
  const client = makeClient();
  const store = createProductosStore(client);
  const created = await store.add({ nombre: ' Té verde ', sku: ' te-01 ', cantidad: 8, minimo: 3 });
  assert.equal(created.nombre, 'Té verde');
  assert.equal(created.sku, 'TE-01');
  assert.equal(created.user_id, 'user-a');
  assert.equal(client.calls.find((call) => call[0] === 'insert')[1].user_id, 'user-a');
});

test('actualiza y elimina por id usando las operaciones del cliente', async () => {
  const client = makeClient();
  const store = createProductosStore(client);
  await store.update('p1', { nombre: 'Uno', sku: 'A', cantidad: 4, minimo: 2 });
  await store.remove('p1');
  assert.ok(client.calls.some((call) => call[0] === 'update'));
  assert.ok(client.calls.some((call) => call[0] === 'delete'));
  assert.equal(client.calls.filter((call) => call[0] === 'eq').length, 2);
});

test('rechaza valores inválidos antes de llamar a Supabase', async () => {
  const client = makeClient();
  const store = createProductosStore(client);
  await assert.rejects(store.add({ nombre: '', sku: 'A', cantidad: 1, minimo: 1 }), ProductDataError);
  await assert.rejects(store.add({ nombre: 'Uno', sku: 'A', cantidad: -1, minimo: 1 }), ProductDataError);
  assert.equal(client.calls.some((call) => call[0] === 'insert'), false);
});
