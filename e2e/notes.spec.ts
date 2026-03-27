import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getDevToken(): Promise<string> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/auth/dev-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    throw new Error(
      `Failed to reach backend at ${API_URL}/api/auth/dev-token. Is the backend running? (${err})`,
    );
  }
  if (!response.ok) {
    throw new Error(
      `dev-token endpoint returned ${response.status}: ${await response.text()}`,
    );
  }
  const data = await response.json();
  return data.token;
}

test.describe('Notes App — Auth Integration', () => {
  test('SC-001: Home page has "Войти" link leading to /login with form', async ({ page }) => {
    await page.goto('/');

    const loginLink = page.getByRole('link', { name: 'Войти' });
    await expect(loginLink).toBeVisible();

    await loginLink.click();

    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('SC-002: Invalid credentials show error alert', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#email').fill('wrong@example.com');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Войти' }).click();

    await expect(page.getByRole('alert')).toContainText('Неверные учётные данные');
  });

  test('SC-003: Token in localStorage redirects /login to /notes', async ({ page }) => {
    const token = await getDevToken();

    await page.goto('/login');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.goto('/login');

    await expect(page).toHaveURL(/\/notes/);
  });

  test('SC-004: Logout button clears token and redirects to /login', async ({ page }) => {
    const token = await getDevToken();

    await page.goto('/notes');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.goto('/notes');

    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();

    await page.getByRole('button', { name: 'Выйти' }).click();

    await expect(page).toHaveURL(/\/login/);

    const storedToken = await page.evaluate(() => localStorage.getItem('token'));
    expect(storedToken).toBeNull();
  });

  test('SC-005: No token on /notes shows auth required message', async ({ page }) => {
    await page.goto('/notes');
    await page.evaluate(() => localStorage.removeItem('token'));
    await page.goto('/notes');

    await expect(page.getByText('Необходима авторизация')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible();
  });

  test('SC-006: With token, /notes shows heading, logout, form, search, counter', async ({ page }) => {
    const token = await getDevToken();

    await page.goto('/notes');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.goto('/notes');

    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Выйти' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter a note')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
    await expect(page.getByPlaceholder('Поиск заметок...')).toBeVisible();
    await expect(page.getByText(/Всего заметок:/)).toBeVisible();
  });

  test('SC-007: Create a note — appears in list, counter increments, input cleared', async ({ page }) => {
    const token = await getDevToken();

    await page.goto('/notes');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.goto('/notes');

    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();

    const counterBefore = await page.getByText(/Всего заметок:/).textContent();
    const countBefore = parseInt(counterBefore?.match(/\d+/)?.[0] || '0', 10);

    const noteText = `Test note ${Date.now()}`;
    await page.getByLabel('New note').fill(noteText);
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText(noteText)).toBeVisible();
    await expect(page.getByText(`Всего заметок: ${countBefore + 1}`)).toBeVisible();

    const inputValue = await page.getByLabel('New note').inputValue();
    expect(inputValue).toBe('');
  });

  test('SC-008: Delete a note — disappears from list, counter decrements', async ({ page }) => {
    const token = await getDevToken();

    await page.goto('/notes');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.goto('/notes');

    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();

    const noteText = `Delete me ${Date.now()}`;
    await page.getByLabel('New note').fill(noteText);
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText(noteText)).toBeVisible();

    const counterAfterAdd = await page.getByText(/Всего заметок:/).textContent();
    const countAfterAdd = parseInt(counterAfterAdd?.match(/\d+/)?.[0] || '0', 10);

    await page.getByRole('button', { name: `Delete note: ${noteText}` }).click();

    await expect(page.getByText(noteText)).not.toBeVisible();
    await expect(page.getByText(`Всего заметок: ${countAfterAdd - 1}`)).toBeVisible();
  });
});
