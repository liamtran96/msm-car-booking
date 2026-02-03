import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Authentication fixture for MSM Car Booking E2E tests
 * Provides authenticated page contexts for different user roles
 */

// Define user credentials for different roles
export interface TestUser {
  email: string;
  password: string;
  role: 'ADMIN' | 'PIC' | 'GA' | 'DRIVER' | 'EMPLOYEE';
}

// Test users - these should match your seed data
export const testUsers: Record<string, TestUser> = {
  admin: {
    email: 'admin@msm.com',
    password: 'admin123',
    role: 'ADMIN',
  },
  pic: {
    email: 'pic@msm.com',
    password: 'pic123',
    role: 'PIC',
  },
  driver: {
    email: 'driver@msm.com',
    password: 'driver123',
    role: 'DRIVER',
  },
  employee: {
    email: 'employee@msm.com',
    password: 'employee123',
    role: 'EMPLOYEE',
  },
};

// Helper function to login
async function login(page: Page, user: TestUser): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: /sign in|login/i }).click();

  // Wait for redirect after successful login
  await expect(page).not.toHaveURL(/\/login/);
}

// Extended test fixture with authentication
type AuthFixtures = {
  authenticatedPage: Page;
  adminPage: Page;
  picPage: Page;
  driverPage: Page;
  employeePage: Page;
};

export const test = base.extend<AuthFixtures>({
  // Generic authenticated page (uses admin by default)
  authenticatedPage: async ({ page }, use) => {
    await login(page, testUsers.admin);
    await use(page);
  },

  // Admin-specific authenticated page
  adminPage: async ({ page }, use) => {
    await login(page, testUsers.admin);
    await use(page);
  },

  // PIC-specific authenticated page
  picPage: async ({ page }, use) => {
    await login(page, testUsers.pic);
    await use(page);
  },

  // Driver-specific authenticated page
  driverPage: async ({ page }, use) => {
    await login(page, testUsers.driver);
    await use(page);
  },

  // Employee-specific authenticated page
  employeePage: async ({ page }, use) => {
    await login(page, testUsers.employee);
    await use(page);
  },
});

export { expect };
