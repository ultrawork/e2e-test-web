import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL ?? 'http://localhost:4000';

test.describe('Web Notes Auth v24 — верификация api.ts и /notes', () => {
  test('SC-001: Без токена — гейт авторизации', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto(`${APP_URL}/notes`);

    await expect(page.getByText('Необходима авторизация')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Войти' })).toHaveAttribute('href', '/login');
    await expect(page.locator('#new-note')).not.toBeVisible();
  });

  test('SC-002: С токеном — список заметок из API', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token-v24');
    });

    await page.route(/\/api\/notes$/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: '1', text: 'Заметка из API', createdAt: '2026-03-28T10:00:00Z' },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${APP_URL}/notes`);

    await expect(page.getByText('Заметка из API')).toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();
  });

  test('SC-003: Создание заметки — счётчик растёт + Authorization в POST', async ({ page }) => {
    let postAuthHeader: string | null = null;

    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token-v24');
    });

    await page.route(/\/api\/notes$/, async (route) => {
      const method = route.request().method();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else if (method === 'POST') {
        postAuthHeader = route.request().headers()['authorization'] ?? null;
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'new-1',
            text: 'Тестовая заметка v24',
            createdAt: '2026-03-28T12:00:00Z',
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${APP_URL}/notes`);
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    await page.locator('#new-note').fill('Тестовая заметка v24');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Тестовая заметка v24')).toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();
    expect(postAuthHeader).toBe('Bearer test-token-v24');
  });

  test('SC-004: Удаление заметки — счётчик уменьшается + Authorization в DELETE', async ({ page }) => {
    let deleteAuthHeader: string | null = null;

    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token-v24');
    });

    await page.route(/\/api\/notes$/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'del-1', text: 'Заметка для удаления', createdAt: '2026-03-28T10:00:00Z' },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await page.route(/\/api\/notes\/[\w-]+/, async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteAuthHeader = route.request().headers()['authorization'] ?? null;
        await route.fulfill({ status: 204 });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${APP_URL}/notes`);
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Заметка для удаления' }).click();

    await expect(page.getByText('Заметка для удаления')).not.toBeVisible();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
    expect(deleteAuthHeader).toBe('Bearer test-token-v24');
  });

  test('SC-005: api.ts добавляет Authorization: Bearer к GET-запросу', async ({ page }) => {
    let capturedAuthHeader: string | null = null;

    await page.addInitScript(() => {
      localStorage.setItem('token', 'my-secret-token');
    });

    await page.route(/\/api\/notes$/, async (route) => {
      if (route.request().method() === 'GET') {
        capturedAuthHeader = route.request().headers()['authorization'] ?? null;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto(`${APP_URL}/notes`);

    await page.waitForResponse(/\/api\/notes$/);

    expect(capturedAuthHeader).toBe('Bearer my-secret-token');
  });

  test('SC-006: 401 от API — токен очищается + редирект на /login', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token-v24');
    });

    await page.route(/\/api\/notes$/, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    await page.goto(`${APP_URL}/notes`);

    await page.waitForURL(/\/login/);

    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});
