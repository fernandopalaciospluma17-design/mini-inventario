import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '@playwright/test';

function getTestCredentials() {
  const required = ['SUPABASE_URL', 'SUPABASE_KEY', 'TEST_EMAIL', 'TEST_PASSWORD'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) {
    throw new Error(`Faltan variables en .env local: ${missing.join(', ')}. No se muestran sus valores.`);
  }
  return { email: process.env.TEST_EMAIL, password: process.env.TEST_PASSWORD };
}

async function signIn(page, password = getTestCredentials().password) {
  const { email } = getTestCredentials();
  await page.goto('/');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
}

function rowForSku(page, sku) {
  return page.getByRole('row').filter({ hasText: sku });
}

async function addProduct(page, { name, sku, quantity, minimum }) {
  await page.getByLabel('Nombre').fill(name);
  await page.getByLabel('SKU').fill(sku);
  await page.getByLabel('Cantidad', { exact: true }).fill(String(quantity));
  await page.getByLabel('Cantidad mínima').fill(String(minimum));
  await page.getByRole('button', { name: /Agregar producto/ }).click();
}

async function removeOwnProduct(page, sku) {
  await page.reload();
  await expect(page.locator('#inventory')).toBeVisible();
  const row = rowForSku(page, sku);
  if (await row.count()) {
    page.once('dialog', (dialog) => dialog.accept());
    await row.getByRole('button', { name: /Eliminar/ }).click();
    await expect(row).toHaveCount(0);
  }
}

test('inicio de sesión correcto abre el inventario privado', async ({ page }) => {
  const { password } = getTestCredentials();
  await signIn(page, password);
  await expect(page.locator('#inventory')).toBeVisible();

  const authStatePath = path.join(process.cwd(), 'playwright', '.auth', 'dia-05-user.json');
  await mkdir(path.dirname(authStatePath), { recursive: true });
  await page.context().storageState({ path: authStatePath });
});

test('rechaza una contraseña incorrecta sin mostrar el inventario', async ({ page }) => {
  const { password } = getTestCredentials();
  const wrongPassword = `${password.slice(0, -1)}${password.endsWith('x') ? 'y' : 'x'}`;
  await signIn(page, wrongPassword);
  await expect(page.locator('#auth-panel')).toBeVisible();
  await expect(page.locator('#auth-message')).toContainText('No se pudo iniciar sesión');
  await expect(page.locator('#inventory')).toBeHidden();
});

test('agrega un producto y limpia solo el producto de esta prueba', async ({ page }) => {
  getTestCredentials();
  const sku = `PW-${randomUUID()}`.toUpperCase();
  const name = 'Producto de prueba Playwright';
  let signedIn = false;
  let createAttempted = false;

  try {
    await signIn(page);
    await expect(page.locator('#inventory')).toBeVisible();
    signedIn = true;
    createAttempted = true;
    await addProduct(page, { name, sku, quantity: 2, minimum: 0 });
    const row = rowForSku(page, sku);
    await expect(row).toBeVisible();
    await expect(row).toContainText(name);
    await expect(row.getByRole('cell').nth(2)).toHaveText('2');
  } finally {
    if (signedIn && createAttempted) await removeOwnProduct(page, sku);
  }
});

test('marca como bajo mínimo un producto con cantidad menor al mínimo', async ({ page }) => {
  getTestCredentials();
  const sku = `PW-${randomUUID()}`.toUpperCase();
  const name = 'Stock bajo de prueba Playwright';
  let signedIn = false;
  let createAttempted = false;

  try {
    await signIn(page);
    await expect(page.locator('#inventory')).toBeVisible();
    signedIn = true;
    createAttempted = true;
    await addProduct(page, { name, sku, quantity: 1, minimum: 5 });
    const row = rowForSku(page, sku);
    await expect(row).toBeVisible();
    await expect(row.getByRole('cell').nth(2)).toHaveText('1');
    await expect(row.getByRole('cell').nth(3)).toHaveText('5');
    await expect(row).toContainText('Por debajo del mínimo');
  } finally {
    if (signedIn && createAttempted) await removeOwnProduct(page, sku);
  }
});
