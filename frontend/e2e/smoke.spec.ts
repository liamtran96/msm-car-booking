import { test, expect } from '@playwright/test';

/**
 * Smoke test to verify Playwright setup is working
 */
test.describe('Smoke Test', () => {
  test('dev server is running and serves content', async ({ page }) => {
    // Navigate to the root
    const response = await page.goto('/');

    // Verify we get a successful response
    expect(response?.status()).toBe(200);

    // Verify the page has content (Vite React app renders a root div)
    const rootElement = page.locator('#root');
    await expect(rootElement).toBeAttached();
  });

  test('page has valid HTML structure', async ({ page }) => {
    await page.goto('/');

    // Check for basic HTML structure
    const html = page.locator('html');
    await expect(html).toBeAttached();

    const body = page.locator('body');
    await expect(body).toBeAttached();
  });
});
