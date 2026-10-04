import { createAcademyWebServer } from '../apps/web/server.mjs';
import { createApiServer, createHandler as createApiHandler } from '../apps/api/src/server.mjs';
import { loadProductionApiOptions } from '../apps/api/src/bootstrap.mjs';

const env = process.env;
if (env.NODE_ENV !== 'production') {
  throw new Error('start-production-service.mjs requires NODE_ENV=production');
}

const service = String(env.THC_SERVICE ?? 'combined').trim().toLowerCase();
const port = Number(env.PORT ?? env.ACADEMY_PORT ?? 8787);
if (!Number.isInteger(port) || port <= 0 || port > 65535) {
  throw new Error('PORT must be a valid TCP port');
}

if (service === 'combined') {
  const apiOptions = await loadProductionApiOptions(env);
  const apiHandler = createApiHandler(apiOptions);
  createAcademyWebServer({ env, apiHandler }).listen(port, '0.0.0.0', () => {
    process.stdout.write(JSON.stringify({
      level: 'info',
      event: 'academy.production.started',
      service: 'combined',
      port
    }) + '\n');
  });
} else if (service === 'api') {
  const apiOptions = await loadProductionApiOptions(env);
  createApiServer(apiOptions).listen(port, '0.0.0.0', () => {
    process.stdout.write(JSON.stringify({
      level: 'info',
      event: 'academy.production.started',
      service: 'api',
      port
    }) + '\n');
  });
} else if (service === 'web') {
  createAcademyWebServer({ env }).listen(port, '0.0.0.0', () => {
    process.stdout.write(JSON.stringify({
      level: 'info',
      event: 'academy.production.started',
      service: 'web',
      port
    }) + '\n');
  });
} else {
  throw new Error('THC_SERVICE must be combined, api, or web');
}
