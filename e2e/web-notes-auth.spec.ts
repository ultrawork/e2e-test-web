import { test, expect } from '@playwright/test';

/**
 * Web v23: E2E-верификация /notes и api.ts против backend.
 *
 * SC-01: Без токена — показ требования авторизации.
 * SC-02: С токеном — интерфейс заметок (список, форма, счётчик).
 * SC-03: Создание заметки увеличивает счётчик.
 * SC-04: Удаление заметки уменьшает счётчик.
 * SC-05: Верификация Authorization: Bearer <token> заголовка.
 * SC-06: Верификация обработки 401 в api.ts.
 */

/** Set up route mock for /api/notes and inject token via addInitScript. */
async function setupAuthenticatedPage(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
  token = 'test-token-v23',
): Promise<void> {
  await page.route('**/api/notes', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.addInitScript((t) => {
    localStorage.setItem('token', t);
  }, token);
}

test.describe('Web v23: Notes Auth E2E', () => {
  test('SC-01: без токена показывается требование авторизации', async ({ page }) => {
    // Ensure no token is present (clean context)
    await page.addInitScript(() => {
      localStorage.removeItem('token');
    });
    await page.goto('/notes');
    // Wait for React hydration to complete and auth gate to render
    await expect(page.getByTestId('auth-gate')).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Необходима авторизация')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter a note')).not.toBeVisible();
  });

  test('SC-02: с токеном отображается список и форма', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/notes');

    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter a note')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });

  test('SC-03: создание заметки увеличивает счётчик', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/notes');

    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    await page.getByPlaceholder('Enter a note').fill('E2E тест v23');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('E2E тест v23')).toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    await page.getByPlaceholder('Enter a note').fill('Вторая заметка v23');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Вторая заметка v23')).toBeVisible();
    await expect(page.getByText('Всего заметок: 2')).toBeVisible();
  });

  test('SC-04: удаление заметки уменьшает счётчик', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/notes');

    await page.getByPlaceholder('Enter a note').fill('Заметка для удаления v23');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByPlaceholder('Enter a note').fill('Остаётся v23');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Всего заметок: 2')).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Заметка для удаления v23' }).click();

    await expect(page.getByText('Заметка для удаления v23')).not.toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Остаётся v23' }).click();

    await expect(page.getByText('Остаётся v23')).not.toBeVisible();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });

  test('SC-05: api.ts добавляет заголовок Authorization: Bearer <token>', async ({ page }) => {
    const token = 'bearer-check-token-v23';

    await page.route('**/api/notes', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.addInitScript((t) => {
      localStorage.setItem('token', t);
    }, token);

    // Set up request listener BEFORE navigation to reliably capture the API call
    const requestPromise = page.waitForRequest((request) =>
      request.url().includes('/api/notes'),
    );

    await page.goto('/notes');

    // Wait for the API request triggered by useEffect in page.tsx
    const request = await requestPromise;

    // Verify api.ts added the Authorization header
    const authHeader = request.headers()['authorization'];
    expect(authHeader).toBe(`Bearer ${token}`);
  });

  test('SC-06: при 401 от API токен удаляется и показывается требование авторизации', async ({ page }) => {
    await page.route('**/api/notes', async (route) => {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Unauthorized' }) });
    });

    await page.addInitScript(() => {
      localStorage.setItem('token', 'expired-token-v23');
    });
    await page.goto('/notes');

    await expect(page.getByText('Необходима авторизация')).toBeVisible();

    const tokenAfter = await page.evaluate(() => localStorage.getItem('token'));
    expect(tokenAfter).toBeNull();
  });
});
