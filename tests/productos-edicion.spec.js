import { randomUUID } from 'node:crypto';
import { expect, test } from '@playwright/test';

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

function sku() {
  return `PW-${randomUUID()}`.toUpperCase();
}

function rowForSku(page, value) {
  return page.getByRole('row').filter({ hasText: value });
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
  for (const value of skus) {
    const row = rowForSku(page, value);
    if (await row.count()) {
      page.once('dialog', (dialog) => dialog.accept());
      await row.getByRole('button', { name: /^Eliminar / }).click();
      await expect(row).toHaveCount(0);
    }
  }
}

test('edita un producto, conserva una fila y recalcula el estado', async ({ page }) => {
  const createdSkus = [];
  const initialSku = sku();
  const updatedSku = sku();
  const initialName = `Producto E2E ${randomUUID()}`;
  const updatedName = `Producto editado E2E ${randomUUID()}`;

  try {
    await setupMockInventory(page);
    createdSkus.push(initialSku);
    await addProduct(page, { nombre: initialName, sku: initialSku, cantidad: 2, minimo: 0 });

    const initialRow = rowForSku(page, initialSku);
    await initialRow.getByRole('button', { name: `Editar ${initialName}` }).click();
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

test('rechaza un SKU duplicado y conserva ambos productos originales', async ({ page }) => {
  const createdSkus = [];
  const firstSku = sku();
  const secondSku = sku();
  const firstName = `Producto E2E A ${randomUUID()}`;
  const secondName = `Producto E2E B ${randomUUID()}`;

  try {
    await setupMockInventory(page);
    createdSkus.push(firstSku);
    await addProduct(page, { nombre: firstName, sku: firstSku, cantidad: 4, minimo: 2 });
    createdSkus.push(secondSku);
    await addProduct(page, { nombre: secondName, sku: secondSku, cantidad: 8, minimo: 3 });

    const firstRow = rowForSku(page, firstSku);
    await firstRow.getByRole('button', { name: `Editar ${firstName}` }).click();
    await page.getByLabel('SKU').fill(secondSku);
    await page.getByRole('button', { name: /Guardar cambios/ }).click();

    await expect(page.locator('#form-message')).toContainText('Ya existe un producto con ese SKU.');
    await expect(page.getByLabel('Nombre')).toHaveValue(firstName);
    await expect(page.getByLabel('SKU')).toHaveValue(secondSku);
    await expect(rowForSku(page, firstSku)).toContainText(firstName);
    await expect(rowForSku(page, firstSku).getByRole('cell', { name: '4', exact: true })).toBeVisible();
    await expect(rowForSku(page, secondSku)).toContainText(secondName);
    await expect(page.getByRole('row').filter({ hasText: /Producto E2E [AB]/ })).toHaveCount(2);
  } finally {
    await cleanOwnProducts(page, createdSkus);
  }
});

test('rechaza al registrar un SKU duplicado normalizado', async ({ page }) => {
  const firstSku = sku();
  await setupMockInventory(page);
  await addProduct(page, { nombre: 'Producto original', sku: firstSku, cantidad: 2, minimo: 0 });

  await page.getByLabel('Nombre').fill('Producto duplicado');
  await page.getByLabel('SKU').fill(`  ${firstSku.toLowerCase()}  `);
  await page.getByLabel('Cantidad', { exact: true }).fill('1');
  await page.getByLabel('Cantidad mínima').fill('0');
  await page.getByRole('button', { name: /Agregar producto/ }).click();

  await expect(page.locator('#form-message')).toContainText('Ya existe un producto con ese SKU.');
  await expect(rowForSku(page, firstSku)).toHaveCount(1);
  await expect(page.getByRole('row').filter({ hasText: 'Producto duplicado' })).toHaveCount(0);
});
