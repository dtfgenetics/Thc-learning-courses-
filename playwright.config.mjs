import { defineConfig } from '@playwright/test';
import { WEB_QA_ARTIFACT_DIR, WEB_QA_BASE_URL, viewportMatrix } from './web-qa.config.mjs';

export default defineConfig({
  testDir: './tests/web-qa',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['line'], ['html', { outputFolder: `${WEB_QA_ARTIFACT_DIR}/playwright-report`, open: 'never' }]]
    : 'list',
  outputDir: `${WEB_QA_ARTIFACT_DIR}/playwright-results`,
  use: {
    baseURL: process.env.WEB_QA_BASE_URL || WEB_QA_BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    ignoreHTTPSErrors: false,
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: viewportMatrix.map((viewport) => ({
    name: viewport.name,
    use: {
      browserName: 'chromium',
      viewport: { width: viewport.width, height: viewport.height },
    },
  })),
});
