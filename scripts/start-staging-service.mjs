const service = process.env.THC_SERVICE ?? process.argv[2];

if (service === 'web') {
  const { createAcademyWebServer } = await import('../apps/web/server.mjs');
  const port = Number(process.env.ACADEMY_PORT ?? 4173);
  createAcademyWebServer().listen(port, '0.0.0.0', () => {
    process.stdout.write(`${JSON.stringify({ level: 'info', event: 'academy.web.started', port })}\n`);
  });
} else if (service === 'api') {
  const { createApiServer } = await import('../apps/api/src/server.mjs');
  const port = Number(process.env.PORT ?? 8787);
  createApiServer().listen(port, '0.0.0.0', () => {
    process.stdout.write(`${JSON.stringify({ level: 'info', event: 'academy.api.started', port })}\n`);
  });
} else {
  console.error('THC_SERVICE must be "web" or "api"');
  process.exit(64);
}
