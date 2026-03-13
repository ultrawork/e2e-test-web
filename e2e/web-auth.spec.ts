import { test, expect } from '@playwright/test';

test.describe('Web Auth', () => {
  test('SC-011: should display home page with Notes App heading', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Notes App' })).toBeVisible();
    await expect(page.getByText('Login or register to get started')).toBeVisible();
  });

  test('SC-012: should register a new user', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /register/i }).click();
    await page.getByLabel(/email/i).fill('newuser@example.com');
    await page.getByLabel(/password/i).fill('SecurePass123');
    await page.getByRole('button', { name: /register|sign up|submit/i }).click();
    await expect(page).not.toHaveURL(/register/);
  });

  test('SC-013: should login and logout', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /login|sign in/i }).click();
    await page.getByLabel(/email/i).fill('webuser@example.com');
    await page.getByLabel(/password/i).fill('SecurePass123');
    await page.getByRole('button', { name: /login|sign in|submit/i }).click();
    await expect(page.getByRole('heading', { name: /notes/i })).toBeVisible();
    await page.getByRole('button', { name: /logout|sign out/i }).click();
    await expect(page.getByText(/login|sign in|register/i)).toBeVisible();
  });

  test('SC-014: should show error on invalid login', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /login|sign in/i }).click();
    await page.getByLabel(/email/i).fill('webuser@example.com');
    await page.getByLabel(/password/i).fill('WrongPassword');
    await page.getByRole('button', { name: /login|sign in|submit/i }).click();
    await expect(page.getByText(/error|invalid|incorrect|failed/i)).toBeVisible();
  });
});
