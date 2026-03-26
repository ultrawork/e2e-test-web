import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';

test.describe('Auth - Login Page', () => {
  test('SC-001: /login page displays heading and login button', async ({ page }) => {
    // Clear any existing token
    await page.addInitScript(() => {
      localStorage.removeItem('auth_token');
    });

    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Войти (dev)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Войти (dev)' })).toBeEnabled();

    // No error messages shown initially
    await expect(page.locator('p[role="alert"]')).not.toBeVisible();
  });

  test('SC-002: Successful login via dev-token redirects to /notes', async ({ page }) => {
    // Clear any existing token
    await page.addInitScript(() => {
      localStorage.removeItem('auth_token');
    });

    await page.goto('/login');

    await page.getByRole('button', { name: 'Войти (dev)' }).click();

    // Should redirect to /notes
    await expect(page).toHaveURL(/\/notes/);

    // Token should be saved in localStorage
    const tokenValue = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(tokenValue).toBeTruthy();
    expect(typeof tokenValue).toBe('string');
    expect(tokenValue!.length).toBeGreaterThan(0);
  });

  test('SC-003: API POST /api/auth/dev-token returns a valid token', async ({ request }) => {
    const apiUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';

    const response = await request.post(`${apiUrl}/api/auth/dev-token`, {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data).toHaveProperty('token');
    expect(typeof data.token).toBe('string');
    expect(data.token.length).toBeGreaterThan(0);
  });
});
