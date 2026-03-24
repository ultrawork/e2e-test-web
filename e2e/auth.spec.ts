import { test, expect } from '@playwright/test';

test.describe('Auth', () => {
  test('SC-001: Login page displays heading and form elements', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#email')).toHaveAttribute('type', 'email');
    await expect(page.locator('#email')).toHaveAttribute('placeholder', 'email@example.com');
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('#password')).toHaveAttribute('type', 'password');
    await expect(page.getByRole('button', { name: 'Войти' })).toBeVisible();

    // No error alert should be visible
    await expect(page.getByRole('alert')).not.toBeVisible();
  });

  test('SC-002: Error on invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#email').fill('wrong@example.com');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('alert')).toContainText('Неверные учётные данные');

    // Should stay on /login
    expect(page.url()).toContain('/login');

    // Token should NOT be in localStorage
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });

  test('SC-003: Notes page requires auth — shows authorization message', async ({ page }) => {
    // Ensure no token
    await page.goto('/notes');
    await page.evaluate(() => localStorage.removeItem('token'));
    await page.goto('/notes');

    await expect(page.getByText('Необходима авторизация')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Войти' })).toHaveAttribute('href', '/login');

    // Note creation form and note list should NOT be visible
    await expect(page.getByPlaceholder('Enter a note')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).not.toBeVisible();
  });
});
