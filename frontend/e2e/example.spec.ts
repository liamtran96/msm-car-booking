import { test, expect } from '@playwright/test';

/**
 * Example E2E tests demonstrating basic Playwright patterns
 * These tests serve as templates for writing future tests
 */

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Verify page loads successfully
    await expect(page).toHaveTitle(/MSM|Car Booking/i);
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');

    // Check for common navigation elements
    // Adjust selectors based on your actual UI
    const header = page.locator('header, nav, [role="navigation"]');
    await expect(header.first()).toBeVisible();
  });
});

test.describe('Visual Regression', () => {
  test('homepage screenshot', async ({ page }) => {
    await page.goto('/');

    // Wait for any animations to complete
    await page.waitForLoadState('networkidle');

    // Take a screenshot for visual comparison
    await expect(page).toHaveScreenshot('homepage.png', {
      maxDiffPixels: 100,
    });
  });
});

test.describe('Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Verify page adapts to mobile viewport
    await expect(page).toHaveTitle(/MSM|Car Booking/i);
  });

  test('should display correctly on tablet', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // Verify page adapts to tablet viewport
    await expect(page).toHaveTitle(/MSM|Car Booking/i);
  });
});

test.describe('Accessibility', () => {
  test('should have no accessibility violations on homepage', async ({ page }) => {
    await page.goto('/');

    // Basic accessibility checks
    // For full a11y testing, consider using @axe-core/playwright

    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');

      // Images should have alt text or role="presentation"
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }

    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeLessThanOrEqual(1); // Should have at most one h1
  });
});
