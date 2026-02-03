import { test, expect } from './fixtures/auth.fixture';

/**
 * Authentication E2E tests
 * Tests login, logout, and role-based access
 */

test.describe('Authentication', () => {
  test.describe('Login Page', () => {
    test('should display login form', async ({ page }) => {
      await page.goto('/login');

      // Verify login form elements
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in|login/i })).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel(/email/i).fill('invalid@example.com');
      await page.getByLabel(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in|login/i }).click();

      // Should show error message
      await expect(page.getByText(/invalid|incorrect|failed/i)).toBeVisible();
    });

    test('should show validation error for empty fields', async ({ page }) => {
      await page.goto('/login');

      // Try to submit without filling fields
      await page.getByRole('button', { name: /sign in|login/i }).click();

      // Should show validation errors
      await expect(page.getByText(/required|email|password/i)).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to login', async ({ page }) => {
      // Try to access a protected route
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Admin Access', () => {
    test('should access admin dashboard', async ({ adminPage }) => {
      await adminPage.goto('/dashboard');

      // Verify admin can see dashboard
      await expect(adminPage).toHaveURL(/\/dashboard/);
    });

    test('should access user management', async ({ adminPage }) => {
      await adminPage.goto('/users');

      // Verify admin can see user management
      await expect(adminPage).not.toHaveURL(/\/login/);
    });
  });

  test.describe('Employee Access', () => {
    test('should access booking page', async ({ employeePage }) => {
      await employeePage.goto('/bookings');

      // Verify employee can see bookings
      await expect(employeePage).not.toHaveURL(/\/login/);
    });

    test('should not access admin pages', async ({ employeePage }) => {
      await employeePage.goto('/users');

      // Should be redirected or see forbidden
      const url = employeePage.url();
      const forbidden = employeePage.getByText(/forbidden|unauthorized|access denied/i);

      // Either redirected away or shown forbidden message
      expect(
        !url.includes('/users') || (await forbidden.isVisible().catch(() => false))
      ).toBeTruthy();
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ authenticatedPage }) => {
      // Look for logout button/link
      const logoutButton = authenticatedPage.getByRole('button', { name: /logout|sign out/i });
      const logoutLink = authenticatedPage.getByRole('link', { name: /logout|sign out/i });

      // Click logout if found
      if (await logoutButton.isVisible().catch(() => false)) {
        await logoutButton.click();
      } else if (await logoutLink.isVisible().catch(() => false)) {
        await logoutLink.click();
      }

      // Should redirect to login
      await expect(authenticatedPage).toHaveURL(/\/login/);
    });
  });
});
