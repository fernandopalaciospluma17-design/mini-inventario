test('edita un producto y limpia solo el producto de esta prueba', async ({ page }) => {
  getTestCredentials();
  const sku = `PW-${randomUUID()}`.toUpperCase();
  const originalName = 'Producto para editar Playwright';
  const updatedName = 'Producto editado Playwright';
  let signedIn = false;
  let createAttempted = false;

  try {
    await signIn(page);
    await expect(page.locator('#inventory')).toBeVisible();
    signedIn = true;
    createAttempted = true;
    await addProduct(page, { name: originalName, sku, quantity: 2, minimum: 0 });

    const row = rowForSku(page, sku);
    await expect(row).toBeVisible();
    await row.getByRole('button', { name: `Editar ${originalName}` }).click();
    await expect(page.locator('#form-title')).toHaveText('Editar producto');
    await expect(page.getByLabel('Nombre')).toHaveValue(originalName);
    await expect(page.getByLabel('SKU')).toHaveValue(sku);

    await page.getByLabel('Nombre').fill(updatedName);
    await page.getByLabel('Cantidad', { exact: true }).fill('7');
    await page.getByLabel('Cantidad mínima').fill('3');
    await page.getByRole('button', { name: /Guardar cambios/ }).click();

    await expect(row).toContainText(updatedName);
    await expect(row.getByRole('cell').nth(2)).toHaveText('7');
    await expect(row.getByRole('cell').nth(3)).toHaveText('3');
    await expect(page.locator('#form-title')).toHaveText('Agregar producto');
  } finally {
    if (signedIn && createAttempted) await removeOwnProduct(page, sku);
  }
});
