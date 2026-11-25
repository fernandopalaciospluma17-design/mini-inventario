import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from '../server.js';

test('health responde 200 con status ok y Express sirve la interfaz estática', async (context) => {
  const server = createApp().listen(0, '127.0.0.1');
  context.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const health = await fetch(`${baseUrl}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: 'ok' });

  const page = await fetch(baseUrl);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Mini Inventario/);

  const module = await fetch(`${baseUrl}/productos.js`);
  assert.equal(module.status, 200);
  assert.match(module.headers.get('content-type'), /javascript/);

  const missingConfig = await fetch(`${baseUrl}/config.js`);
  assert.equal(missingConfig.status, 503);
  assert.match(missingConfig.headers.get('content-type'), /text\/plain/);
});

test('config.js entrega solo URL y clave pública configuradas', async (context) => {
  const server = createApp({ getConfig: () => ({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_KEY: 'sb_publishable_demo' }) }).listen(0, '127.0.0.1');
  context.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  await new Promise((resolve) => server.once('listening', resolve));
  const response = await fetch(`http://127.0.0.1:${server.address().port}/config.js`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /application\/javascript/);
  const body = await response.text();
  assert.match(body, /example\.supabase\.co/);
  assert.match(body, /sb_publishable_demo/);
  assert.doesNotMatch(body, /service_role|SUPABASE_/);
});

test('config.js rechaza claves secret, service_role y desconocidas', async (context) => {
  for (const key of ['sb_secret_private', 'not-a-key', `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature`]) {
    const server = createApp({ getConfig: () => ({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_KEY: key }) }).listen(0, '127.0.0.1');
    context.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
    await new Promise((resolve) => server.once('listening', resolve));
    const response = await fetch(`http://127.0.0.1:${server.address().port}/config.js`);
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
