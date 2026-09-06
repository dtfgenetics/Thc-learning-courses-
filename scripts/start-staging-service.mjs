const service = process.env.THC_SERVICE ?? process.argv[2];

if (service === 'web') {
  await import('../apps/web/server.mjs');
} else if (service === 'api') {
  await import('../apps/api/src/server.mjs');
} else {
  console.error('THC_SERVICE must be "web" or "api"');
  process.exit(64);
}
