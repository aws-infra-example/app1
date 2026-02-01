import { test, expect } from '@playwright/test';
import {
  waitForAppLoad,
  getDisplayedMeta,
  collectConsoleErrors,
} from '@aws-infra-example/e2e-lib';

/**
 * Smoke tests for app1.
 *
 * These verify that the app loads correctly and displays expected metadata.
 * Run against a deployed environment with E2E_BASE_URL set.
 */

const APP_NAME = 'app1';

// Determine the app path based on environment
function getAppPath() {
  const baseUrl = process.env.E2E_BASE_URL || '';
  // Extract environment from E2E_BASE_URL if it includes path-based routing
  // e.g., E2E_BASE_URL=https://example.com/dev means env=dev
  const envMatch = process.env.E2E_ENV || 'dev';
  return `/${envMatch}/${APP_NAME}`;
}

test.describe('App1 Smoke Tests', () => {
  test('should load page with 200 status', async ({ page }) => {
    const response = await page.goto(getAppPath());
    expect(response?.status()).toBe(200);
  });

  test('should not have console errors', async ({ page }) => {
    const errorCollector = collectConsoleErrors(page);
    await page.goto(getAppPath());
    await waitForAppLoad(page);

    const errors = errorCollector.getErrors();
    // Filter out expected warnings (like manifest load failures in test env)
    const criticalErrors = errors.filter(
      (e) => !e.includes('Failed to load ecosystem manifest')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('should display build ref (not placeholder)', async ({ page }) => {
    await page.goto(getAppPath());
    await waitForAppLoad(page);

    const refElement = page.locator('#ref');
    await expect(refElement).toBeVisible();

    const refText = await refElement.textContent();
    expect(refText).not.toBe('__APP_REF__');
    expect(refText?.trim()).not.toBe('');
  });

  test('should display build SHA', async ({ page }) => {
    await page.goto(getAppPath());
    await waitForAppLoad(page);

    const shaElement = page.locator('#sha');
    await expect(shaElement).toBeVisible();

    const shaText = await shaElement.textContent();
    expect(shaText).not.toBe('__APP_SHA__');
    expect(shaText?.trim()).not.toBe('');
  });

  test('should display detected environment', async ({ page }) => {
    await page.goto(getAppPath());
    await waitForAppLoad(page);

    const envElement = page.locator('#env');
    await expect(envElement).toBeVisible();

    const envText = await envElement.textContent();
    // Environment should be one of: dev, staging, prod, sandbox-*, or local
    expect(envText).toMatch(/^(dev|staging|prod|sandbox-[\w-]+|local|unknown)$/);
  });

  test('should display build time', async ({ page }) => {
    await page.goto(getAppPath());
    await waitForAppLoad(page);

    const timeElement = page.locator('#time');
    await expect(timeElement).toBeVisible();

    const timeText = await timeElement.textContent();
    expect(timeText).not.toBe('__BUILD_TIME__');
    // Should be an ISO timestamp
    expect(timeText).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  test('should have app title', async ({ page }) => {
    await page.goto(getAppPath());

    await expect(page).toHaveTitle(/App 1/);
  });

  test('should have navigation links', async ({ page }) => {
    await page.goto(getAppPath());
    await waitForAppLoad(page);

    const app1Link = page.locator('nav a[data-app="app1"]');
    const app2Link = page.locator('nav a[data-app="app2"]');

    await expect(app1Link).toBeVisible();
    await expect(app2Link).toBeVisible();
  });
});
