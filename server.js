import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export function createApp({ publicDirectory = path.join(projectRoot, 'public'), getConfig = () => process.env } = {}) {
  const app = express();
  app.disable('x-powered-by');

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.get('/config.js', (_request, response) => {
    const { SUPABASE_URL, SUPABASE_KEY } = getConfig();
    if (!isProjectUrl(SUPABASE_URL) || !isPublicKey(SUPABASE_KEY)) {
      return response.status(503).type('text').send('Supabase no está configurado con una clave pública.');
    }
    response.type('application/javascript').send(
      `window.MINI_INVENTARIO_CONFIG = Object.freeze(${JSON.stringify({ url: SUPABASE_URL, key: SUPABASE_KEY })});`,
    );
  });

  app.get('/vendor/supabase.js', (_request, response) => {
    response.sendFile(path.join(projectRoot, 'node_modules/@supabase/supabase-js/dist/umd/supabase.js'));
  });

  app.use(express.static(publicDirectory, { index: 'index.html' }));
  app.use((_request, response) => {
    response.status(404).json({ error: 'No encontrado.' });
  });

  return app;
}

function isPublicKey(key) {
  if (typeof key !== 'string' || key.startsWith('sb_secret_')) return false;
  if (key.startsWith('sb_publishable_')) return true;
  try {
    const payload = key.split('.')[1];
    return Boolean(payload && JSON.parse(Buffer.from(payload, 'base64url').toString()).role === 'anon');
  } catch {
    return false;
  }
  return false;
}

function isProjectUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || (url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
      && !url.username && !url.password;
  } catch {
    return false;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const host = '0.0.0.0';
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT debe ser un entero entre 1 y 65535.');
  }

  const app = createApp();
  app.listen(port, host, () => {
    console.log(`Mini Inventario escuchando en ${host}:${port}`);
  });
}
