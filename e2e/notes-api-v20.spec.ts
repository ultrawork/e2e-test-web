import { test, expect, Page } from '@playwright/test';

const API_URL = '**/api/notes';

function mockNote(overrides: Record<string, unknown> = {}) {
  return {
    id: '1',
    title: 'Тестовая заметка',
    content: 'Содержимое заметки',
    isFavorited: false,
    categories: [],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

async function setToken(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
  });
}

test.describe('Notes API v20', () => {
  test('SC-001: Без токена — отображение сообщения об авторизации', async ({ page }) => {
    await page.goto('/notes');

    const alertMsg = page.locator('main p[role="alert"]');
    await expect(alertMsg).toBeVisible();
    await expect(alertMsg).toHaveText('Необходима авторизация');
    await expect(page.getByPlaceholder('Enter a note')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).not.toBeVisible();
    await expect(page.locator('main ul')).not.toBeVisible();
  });

  test('SC-002: С токеном — загрузка списка с отображением избранного', async ({ page }) => {
    const notes = [
      mockNote({ id: '1', title: 'Первая заметка', isFavorited: false }),
      mockNote({ id: '2', title: 'Вторая заметка', isFavorited: true }),
    ];
    await page.route(API_URL, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(notes) });
      }
      return route.continue();
    });
    await setToken(page);

    await page.goto('/notes');

    await expect(page.getByText('Первая заметка')).toBeVisible();
    await expect(page.getByText('Вторая заметка')).toBeVisible();
    await expect(page.locator('main p[role="alert"]')).not.toBeVisible();

    // Verify favorite icons: unfavorited = ☆, favorited = ★
    await expect(page.getByRole('button', { name: 'Добавить в избранное: Первая заметка' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Убрать из избранного: Вторая заметка' })).toBeVisible();
  });

  test('SC-003: Создание заметки через API', async ({ page }) => {
    let postCalled = false;
    await page.route(API_URL, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        expect(body.title).toBe('Новая заметка');
        expect(body.content).toBe('');
        postCalled = true;
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(mockNote({ id: '10', title: 'Новая заметка' })),
        });
      }
      return route.continue();
    });
    await setToken(page);

    await page.goto('/notes');
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    await page.getByLabel('New note').fill('Новая заметка');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Новая заметка')).toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();
    expect(postCalled).toBe(true);
  });

  test('SC-004: Удаление заметки через API', async ({ page }) => {
    const note = mockNote({ id: '5', title: 'Удалить меня' });
    let deleteCalled = false;

    await page.route((url) => url.pathname.includes('/api/notes'), (route) => {
      const method = route.request().method();
      const pathname = new URL(route.request().url()).pathname;

      if (method === 'GET' && pathname.endsWith('/api/notes')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([note]),
        });
      }
      if (method === 'DELETE' && pathname.endsWith('/api/notes/5')) {
        deleteCalled = true;
        return route.fulfill({ status: 204 });
      }
      return route.continue();
    });
    await setToken(page);

    await page.goto('/notes');
    await expect(page.getByText('Удалить меня')).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Удалить меня' }).click();

    await expect(page.getByText('Удалить меня')).not.toBeVisible();
    expect(deleteCalled).toBe(true);
  });

  test('SC-005: Переключение избранного через PATCH и персистентность после перезагрузки', async ({ page }) => {
    const note = mockNote({ id: '3', title: 'Важная', isFavorited: false });
    let patchCalled = false;
    let reloadCount = 0;

    await page.route(API_URL, (route) => {
      if (route.request().method() === 'GET') {
        reloadCount++;
        const data = reloadCount <= 1
          ? [note]
          : [{ ...note, isFavorited: true }];
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
      }
      return route.continue();
    });
    await page.route('**/api/notes/3/favorite', (route) => {
      if (route.request().method() === 'PATCH') {
        patchCalled = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...note, isFavorited: true }),
        });
      }
      return route.continue();
    });
    await setToken(page);

    await page.goto('/notes');
    await expect(page.getByRole('button', { name: 'Добавить в избранное: Важная' })).toBeVisible();

    await page.getByRole('button', { name: 'Добавить в избранное: Важная' }).click();

    await expect(page.getByRole('button', { name: 'Убрать из избранного: Важная' })).toBeVisible();
    expect(patchCalled).toBe(true);

    // Verify persistence after reload
    await page.reload();
    await expect(page.getByRole('button', { name: 'Убрать из избранного: Важная' })).toBeVisible();
  });

  test('SC-006: Обработка ошибки 401 от API при загрузке заметок', async ({ page }) => {
    await page.route(API_URL, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthorized' }) });
      }
      return route.continue();
    });
    await setToken(page);

    await page.goto('/notes');

    const alertMsg = page.locator('main p[role="alert"]');
    await expect(alertMsg).toBeVisible();
    await expect(alertMsg).toHaveText('Необходима авторизация');
    await expect(page.getByPlaceholder('Enter a note')).not.toBeVisible();
  });
});
