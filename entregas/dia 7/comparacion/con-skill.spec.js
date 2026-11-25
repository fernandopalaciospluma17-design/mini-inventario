```js
import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

// El cliente Supabase simulado mantiene los productos en memoria durante la prueba.
// Esto valida el flujo de interfaz, no Auth, RLS ni el servidor Supabase.
const fakeSupabase = `
(() => {
  const state = window.__miniInventarioE2E ??= { products: new Map() };
  const user = { id: 'playwright-user', email: 'playwright@example.invalid' };
  const session = { user, access_token: 'test-access-token', token_type: 'bearer' };

  window.supabase = {
    createClient() {
      return {
        auth: {
          onAuthStateChange(_event, callback) {
            queueMicrotask(() => callback('SIGNED_IN', session));
            return { data: { subscription: { unsubscribe() {} } } };
          },
          async getSession() { return { data: { session }, error: null }; },
          async getUser() { return { data: { user }, error: null }; },
        },
        from(tableName) {
          if (tableName !== 'productos') throw new Error('Tabla inesperada en el mock.');
          const query = { operation: 'select', values: null, targetId: null };
          query.select = function select() { return this; };
          query.order = async function order() {
            const data = [...state.products.values()].sort((a, b) => a.nombre.localeCompare(b.nombre));
            return { data, error: null };
          };
          query.insert = function insert(values) {
            this.operation = 'insert';
            this.values = values;
            return this;
          };
          query.update = function update(values) {
            this.operation = 'update';
            this.values = values;
            return this;
          };
          query.delete = function remove() {
            this.operation = 'delete';
            return this;
          };
          query.eq = function eq(field, value) {
            if (field !== 'id') throw new Error('Filtro inesperado en el mock.');
            this.targetId = value;
            return this;
          };
          query.single = async function single() {
            const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...this.values };
            if ([...state.products.values()].some((product) => product.sku === row.sku)) {
              return { data: null, error: { code: '23505' } };
            }
            state.products.set(row.id, row);
            return { data: row, error: null };
          };
          query.maybeSingle = async function maybeSingle() {
            const current = state.products.get(this.targetId);
            if (!current) return { data: null, error: null };
            if (this.operation === 'delete') {
              state.products.delete(this.targetId);
              return { data: { id: this.targetId }, error: null };
            }
            const duplicate = [...state.products.values()].some((product) =>
              product.id !== this.targetId && product.sku === this.values.sku);
            if (duplicate) return { data: null, error: { code: '23505' } };
            const updated = { ...current, ...this.values };
            state.products.set(this.targetId, updated);
            return { data: updated, error: null };
          };
          return query;
        },
      };
    },
  };
})();
`;

function uniqueSku() {
  return \`PW-\${randomUUID()}\`.toUpperCase();
}

function rowForSku(page, sku) {
  return page.getByRole('row').filter({ hasText: sku });
}

async function setupMockInventory(page) {
  await page.route('**/config.js', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: "window.MINI_INVENTARIO_CONFIG = Object.freeze({ url: 'https://example.invalid', key: 'test-publishable-key' });",
  }));
  await page.route('**/vendor/supabase.js', (route) => route.fulfill({
    contentType: 'application/javascript',
    body: fakeSupabase,
  }));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Tu inventario' })).toBeVisible();
}

async function addProduct(page, product) {
  await page.getByLabel('Nombre').fill(product.nombre);
  await page.getByLabel('SKU').fill(product.sku);
  await page.getByLabel('Cantidad', { exact: true }).fill(String(product.cantidad));
  await page.getByLabel('Cantidad mínima').fill(String(product.minimo));
  await page.getByRole('button', { name: /Agregar producto/ }).click();
  await expect(rowForSku(page, product.sku)).toBeVisible();
}

async function cleanOwnProducts(page, skus) {
  for (const sku of skus) {
    const row = rowForSku(page, sku);
    if (await row.count()) {
      page.once('dialog', (dialog) => dialog.accept());
      await row.getByRole('button', { name: /^Eliminar / }).click();
      await expect(row).toHaveCount(0);
    }
  }
}

test('edita un producto, conserva una fila y recalcula el estado', async ({ page }) => {
  const createdSkus = [];
  const initialSku = uniqueSku();
  const updatedSku = uniqueSku();
  const initialName = \`Producto E2E \${randomUUID()}\`;
  const updatedName = \`Producto editado E2E \${randomUUID()}\`;

  try {
    await setupMockInventory(page);

    createdSkus.push(initialSku);
    await addProduct(page, {
      nombre: initialName,
      sku: initialSku,
      cantidad: 2,
      minimo: 0,
    });

    const initialRow = rowForSku(page, initialSku);
    await initialRow.getByRole('button', { name: \`Editar \${initialName}\` }).click();

    await expect(page.getByRole('heading', { name: 'Editar producto' })).toBeVisible();
    await expect(page.getByLabel('Nombre')).toHaveValue(initialName);
    await expect(page.getByLabel('SKU')).toHaveValue(initialSku);
    await expect(page.getByLabel('Cantidad', { exact: true })).toHaveValue('2');
    await expect(page.getByLabel('Cantidad mínima')).toHaveValue('0');

    await page.getByLabel('Nombre').fill(updatedName);
    await page.getByLabel('SKU').fill(updatedSku);
    await page.getByLabel('Cantidad', { exact: true }).fill('1');
    await page.getByLabel('Cantidad mínima').fill('5');
    createdSkus.push(updatedSku);

    await page.getByRole('button', { name: /Guardar cambios/ }).click();

    const updatedRow = rowForSku(page, updatedSku);
    await expect(updatedRow).toHaveCount(1);
    await expect(rowForSku(page, initialSku)).toHaveCount(0);
    await expect(updatedRow).toContainText(updatedName);
    await expect(updatedRow.getByRole('cell', { name: '1', exact: true })).toBeVisible();
    await expect(updatedRow.getByRole('cell', { name: '5', exact: true })).toBeVisible();
    await expect(updatedRow).toContainText('Por debajo del mínimo');
    await expect(page.locator('#status-message')).toContainText('Producto actualizado.');
    await expect(page.getByRole('row').filter({ hasText: updatedName })).toHaveCount(1);
  } finally {
    await cleanOwnProducts(page, createdSkus);
  }
});
```