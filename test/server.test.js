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
});
