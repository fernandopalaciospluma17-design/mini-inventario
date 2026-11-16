import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export function createApp({ publicDirectory = path.join(projectRoot, 'public') } = {}) {
  const app = express();
  app.disable('x-powered-by');

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  app.use(express.static(publicDirectory, { index: 'index.html' }));
  app.use((_request, response) => {
    response.status(404).json({ error: 'No encontrado.' });
  });

  return app;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT debe ser un entero entre 1 y 65535.');
  }

  const app = createApp();
  app.listen(port, () => {
    console.log(`Mini Inventario disponible en http://localhost:${port}`);
  });
}
