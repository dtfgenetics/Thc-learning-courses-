import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '@playwright/test';
import {
  WEB_QA_ARTIFACT_DIR,
  WEB_QA_BASE_URL,
  WEB_QA_ENFORCE,
  WEB_QA_ROUTE_FILE,
  WEB_QA_VISUAL_MAX_ROUTES,
  WEB_QA_VISUAL_MODE,
} from '../../web-qa.config.mjs';

function loadRoutes() {
  if (!fs.existsSync(WEB_QA_ROUTE_FILE)) return [WEB_QA_BASE_URL];
  const parsed = JSON.parse(fs.readFileSync(WEB_QA_ROUTE_FILE, 'utf8'));
  const routes = parsed.routes?.length ? parsed.routes : [WEB_QA_BASE_URL];
  return routes.slice(0, WEB_QA_VISUAL_MAX_ROUTES);
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
    const response = await page.goto(route, { waitUntil: 'commit', timeout: 30_000 });
    expect(response, 'visual navigation should return a response').not.toBeNull();
    expect(response.status(), `unexpected navigation status for ${route}`).toBeLessThan(400);

    const domReady = await page.waitForLoadState('domcontentloaded', { timeout: 10_000 }).then(() => true).catch(() => false);
    if (!domReady) {
      const finding = `lifecycle-timeout: DOMContentLoaded did not fire within 10s for ${route}`;
      testInfo.annotations.push({ type: 'web-qa-findings', description: finding });
      console.error(finding);
      if (WEB_QA_ENFORCE) expect(domReady, finding).toBe(true);
    }
    if (domReady) await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});

    await page.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      for (const el of document.querySelectorAll('video, iframe')) el.setAttribute('data-web-qa-dynamic', 'true');
    }).catch(() => {});

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
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled', caret: 'hide', timeout: 30_000 });
    await testInfo.attach(`visual-candidate-${safeName(route)}`, { path: file, contentType: 'image/png' });
  });
}
