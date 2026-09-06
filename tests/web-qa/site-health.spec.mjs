import fs from 'node:fs';
import { test, expect } from '@playwright/test';
import { WEB_QA_BASE_URL, WEB_QA_ENFORCE, WEB_QA_ROUTE_FILE } from '../../web-qa.config.mjs';

function loadRoutes() {
  if (!fs.existsSync(WEB_QA_ROUTE_FILE)) return [WEB_QA_BASE_URL];
  const parsed = JSON.parse(fs.readFileSync(WEB_QA_ROUTE_FILE, 'utf8'));
  return parsed.routes?.length ? parsed.routes : [WEB_QA_BASE_URL];
}

const routes = loadRoutes();

for (const route of routes) {
  test(`health ${route}`, async ({ page }) => {
    const failures = [];
    page.on('pageerror', (error) => failures.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
      if (message.type() === 'error') failures.push(`console.error: ${message.text()}`);
    });
    page.on('requestfailed', (request) => {
      const url = new URL(request.url());
      if (url.origin === new URL(route).origin) failures.push(`requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`);
    });
    page.on('response', (response) => {
      const url = new URL(response.url());
      if (url.origin === new URL(route).origin && response.status() >= 400) {
        failures.push(`http ${response.status()}: ${response.url()}`);
      }
    });

    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, 'navigation should return a response').not.toBeNull();
    expect(response.status(), `unexpected navigation status for ${route}`).toBeLessThan(400);
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});

    const body = page.locator('body');
    await expect(body).toBeVisible();
    const bodyText = (await body.innerText()).trim();
    expect(bodyText.length, `page should render meaningful text for ${route}`).toBeGreaterThan(20);

    const hasMain = await page.locator('main, [role="main"], h1').count();
    if (!hasMain) failures.push('semantic-content: no main landmark, role=main, or h1 found');

    const visualHealth = await page.evaluate(() => {
      const brokenImages = [...document.images]
        .filter((img) => img.currentSrc && img.complete && img.naturalWidth === 0)
        .map((img) => img.currentSrc)
        .slice(0, 20);
      const overflow = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) - window.innerWidth;
      return { brokenImages, overflow };
    });

    for (const src of visualHealth.brokenImages) failures.push(`broken-image: ${src}`);
    if (visualHealth.overflow > 3) failures.push(`horizontal-overflow: ${visualHealth.overflow}px beyond viewport`);

    if (failures.length) {
      const uniqueFailures = [...new Set(failures)];
      const message = `Web QA findings for ${route}:\n${uniqueFailures.join('\n')}`;
      test.info().annotations.push({ type: 'web-qa-findings', description: message });
      console.error(message);
      if (WEB_QA_ENFORCE) expect(uniqueFailures, message).toEqual([]);
    }
  });
}
