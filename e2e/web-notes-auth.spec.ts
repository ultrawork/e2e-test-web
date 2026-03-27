import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:4000';

/**
 * Web v23: E2E-верификация /notes и api.ts против backend.
 *
 * SC-v23-01: Без токена — показ требования авторизации.
 * SC-v23-02: С токеном — интерфейс заметок (список, форма, счётчик).
 * SC-v23-03: Создание заметки увеличивает счётчик.
 * SC-v23-04: Удаление заметки уменьшает счётчик.
 * + Верификация Authorization: Bearer <token> заголовка.
 * + Верификация обработки 401 в api.ts.
 */

/** Set up route mock for /api/notes and inject token via addInitScript. */
async function setupAuthenticatedPage(
  page: Parameters<Parameters<typeof test>[1]>[0]['page'],
  token = 'test-token-v23',
): Promise<void> {
  await page.route(`${API_BASE}/api/notes`, async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });
  await page.addInitScript((t) => {
    localStorage.setItem('token', t);
  }, token);
}

test.describe('Web v23: Notes Auth E2E', () => {
  test('SC-v23-01: без токена показывается требование авторизации', async ({ page }) => {
    await page.goto('/notes');

    await expect(page.getByText('Необходима авторизация')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Войти' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter a note')).not.toBeVisible();
  });

  test('SC-v23-02: с токеном отображается список и форма', async ({ page }) => {
    await setupAuthenticatedPage(page);
    await page.goto('/notes');

    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter a note')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });

  test('SC-v23-03: создание заметки увеличивает счётчик', async ({ page }) => {
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

  test('SC-v23-04: удаление заметки уменьшает счётчик', async ({ page }) => {
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
});

test.describe('Web v23: api.ts — Authorization header', () => {
  test('api.ts добавляет заголовок Authorization: Bearer <token>', async ({ page }) => {
    const token = 'bearer-check-token-v23';
    let capturedAuthHeader: string | null = null;

    await page.route(`${API_BASE}/api/notes`, async (route) => {
      capturedAuthHeader = route.request().headers()['authorization'] ?? null;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    });

    await page.addInitScript((t) => {
      localStorage.setItem('token', t);
    }, token);
    await page.goto('/notes');

    await expect(page.getByPlaceholder('Enter a note')).toBeVisible();
    expect(capturedAuthHeader).toBe(`Bearer ${token}`);
  });
});

test.describe('Web v23: api.ts — обработка 401', () => {
  test('при 401 от API токен удаляется и показывается требование авторизации', async ({ page }) => {
    await page.route(`${API_BASE}/api/notes`, async (route) => {
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
