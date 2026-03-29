import { test, expect } from '@playwright/test';

test.describe('Web Notes Auth v26', () => {
  test('TC-001: loads /notes without token — shows auth error', async ({ page }) => {
    await page.route('**/api/notes', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthorized' }) })
    );

    await page.goto('/notes');

    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByTestId('error-message')).toContainText('Unauthorized');
  });

  test('TC-002: loads /notes with token — page renders', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('token', 'test-token-v26'));

    await page.route('**/api/notes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, title: 'Test Note' }]),
      })
    );

    await page.goto('/notes');

    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    await expect(page.getByText('Test Note')).toBeVisible();
  });

  test('TC-003: handles 401 from API — shows unauthorized error', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('token', 'test-token-v26'));

    await page.route('**/api/notes', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthorized' }) })
    );

    await page.goto('/notes');

    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByTestId('error-message')).toContainText('Unauthorized');
  });

  test('TC-004: renders notes list on success', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('token', 'test-token-v26'));

    await page.route('**/api/notes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, title: 'Note Alpha' },
          { id: 2, title: 'Note Beta' },
        ]),
      })
    );

    await page.goto('/notes');

    await expect(page.getByText('Note Alpha')).toBeVisible();
    await expect(page.getByText('Note Beta')).toBeVisible();
  });

  test('TC-005: shows network error message', async ({ page }) => {
    await page.route('**/api/notes', (route) => route.abort());

    await page.goto('/notes');

    await expect(page.getByTestId('error-message')).toBeVisible();
  });

  test('TC-006: event-driven 401 via window.dispatchEvent', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('token', 'test-token-v26'));

    await page.route('**/api/notes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 1, title: 'Loaded Note' }]),
      })
    );

    await page.goto('/notes');
    await expect(page.getByText('Loaded Note')).toBeVisible();

    await page.evaluate(() => window.dispatchEvent(new Event('auth:unauthorized')));

    await expect(page.getByTestId('error-message')).toBeVisible();
    await expect(page.getByTestId('error-message')).toContainText('Unauthorized');
  });
});
