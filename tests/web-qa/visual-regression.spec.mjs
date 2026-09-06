import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import { WEB_QA_ARTIFACT_DIR, WEB_QA_BASE_URL, WEB_QA_ROUTE_FILE, WEB_QA_VISUAL_MODE } from '../../web-qa.config.mjs';

function loadRoutes() {
  if (!fs.existsSync(WEB_QA_ROUTE_FILE)) return [WEB_QA_BASE_URL];
  const parsed = JSON.parse(fs.readFileSync(WEB_QA_ROUTE_FILE, 'utf8'));
  return parsed.routes?.length ? parsed.routes : [WEB_QA_BASE_URL];
}

function safeName(route) {
  const url = new URL(route);
  const slug = `${url.pathname}${url.search}`
    .replace(/^\/+/, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);
  return slug || 'home';
}

for (const route of loadRoutes()) {
  test(`visual ${route}`, async ({ page }, testInfo) => {
    await page.goto(route, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {});
    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      for (const el of document.querySelectorAll('video, iframe')) el.setAttribute('data-web-qa-dynamic', 'true');
    });

    if (WEB_QA_VISUAL_MODE === 'compare') {
      await expect(page).toHaveScreenshot(`${safeName(route)}.png`, {
        fullPage: true,
        animations: 'disabled',
        caret: 'hide',
        maxDiffPixels: 0,
        mask: page.locator('[data-web-qa-dynamic="true"]'),
      });
      return;
    }

    const dir = path.join(WEB_QA_ARTIFACT_DIR, 'visual-candidates', testInfo.project.name);
    fs.mkdirSync(dir, { recursive: true });
    const file = path.join(dir, `${safeName(route)}.png`);
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled', caret: 'hide' });
    await testInfo.attach(`visual-candidate-${safeName(route)}`, { path: file, contentType: 'image/png' });
  });
}
