import { expect, test } from '@playwright/test';

for (const [label, button, method] of [
  ['iniciar sesión', 'Iniciar sesión', 'signInWithPassword'],
  ['crear cuenta', 'Crear cuenta', 'signUp'],
]) {
  test(`${label} envía correo y contraseña antes de deshabilitar el formulario`, async ({ page }) => {
    await page.route('**/config.js', route => route.fulfill({ contentType: 'application/javascript', body: 'window.MINI_INVENTARIO_CONFIG={url:"https://example.invalid",key:"public"};' }));
    await page.route('**/vendor/supabase.js', route => route.fulfill({ contentType: 'application/javascript', body: `
      window.supabase = { createClient: () => ({ from() {}, auth: {
        onAuthStateChange() {},
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async data => { window.authCall = { method: 'signInWithPassword', data }; return { error: null }; },
        signUp: async data => { window.authCall = { method: 'signUp', data }; return { data: { session: null }, error: null }; }
      } }) };
    ` }));
    await page.goto('/');
    await page.getByLabel('Correo electrónico').fill('persona@example.com');
    await page.getByLabel('Contraseña').fill('clave-ficticia-123');
    await page.getByRole('button', { name: button }).click();
    await expect.poll(() => page.evaluate(() => window.authCall)).toEqual({
      method, data: { email: 'persona@example.com', password: 'clave-ficticia-123' },
    });
  });
}
