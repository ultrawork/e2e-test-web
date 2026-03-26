import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL ?? process.env.BASE_URL ?? 'http://localhost:4000';

/** Получить dev-token из backend. */
async function getDevToken(): Promise<string> {
  const response = await fetch(`${API_BASE}/api/auth/dev-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to get dev token: ${response.status}`);
  }
  const data = await response.json();
  return data.token;
}

/** Удалить все заметки текущего пользователя через API. */
async function cleanupNotes(token: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) return;
  const notes = await response.json();
  for (const note of notes) {
    await fetch(`${API_BASE}/api/notes/${note.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

test.describe('Notes App', () => {
  test('SC-001: Home page displays heading, welcome text, and link', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Notes App' })).toBeVisible();
    await expect(page.getByText('Welcome to the Notes App. Login or register to get started.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to Notes' })).toBeVisible();
  });

  test('SC-010: /notes without token shows authorization required', async ({ page }) => {
    await page.goto('/notes');

    await expect(page.getByRole('alert')).toContainText('Необходима авторизация');
  });

  test.describe('Authenticated', () => {
    let token: string;

    test.beforeAll(async () => {
      token = await getDevToken();
    });

    test.beforeEach(async ({ page }) => {
      await page.addInitScript((t) => {
        localStorage.setItem('auth_token', t);
      }, token);
    });

    test.afterEach(async () => {
      await cleanupNotes(token);
    });

    test('SC-002: Navigate from home to /notes via link', async ({ page }) => {
      await page.goto('/');

      await page.getByRole('link', { name: 'Go to Notes' }).click();

      await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
      await expect(page.getByPlaceholder('Enter a note')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
      await expect(page.getByText('Всего заметок: 0')).toBeVisible();
    });

    test('SC-003: Adding notes increments the counter', async ({ page }) => {
      await page.goto('/notes');
      await expect(page.getByText('Всего заметок: 0')).toBeVisible();

      await page.getByLabel('New note').fill('Первая заметка');
      await page.getByRole('button', { name: 'Add' }).click();

      await expect(page.getByText('Первая заметка')).toBeVisible();
      await expect(page.getByText('Всего заметок: 1')).toBeVisible();

      await page.getByLabel('New note').fill('Вторая заметка');
      await page.getByRole('button', { name: 'Add' }).click();

      await expect(page.getByText('Вторая заметка')).toBeVisible();
      await expect(page.getByText('Всего заметок: 2')).toBeVisible();
    });

    test('SC-004: Deleting notes decrements the counter', async ({ page }) => {
      await page.goto('/notes');

      await page.getByLabel('New note').fill('Заметка А');
      await page.getByRole('button', { name: 'Add' }).click();

      await page.getByLabel('New note').fill('Заметка Б');
      await page.getByRole('button', { name: 'Add' }).click();

      await expect(page.getByText('Всего заметок: 2')).toBeVisible();

      await page.getByRole('button', { name: 'Delete note: Заметка А' }).click();

      await expect(page.getByText('Заметка А')).not.toBeVisible();
      await expect(page.getByText('Всего заметок: 1')).toBeVisible();

      await page.getByRole('button', { name: 'Delete note: Заметка Б' }).click();

      await expect(page.getByText('Заметка Б')).not.toBeVisible();
      await expect(page.getByText('Всего заметок: 0')).toBeVisible();
    });

    test('SC-005: Empty or whitespace input does not add a note', async ({ page }) => {
      await page.goto('/notes');

      await expect(page.getByText('Всего заметок: 0')).toBeVisible();

      await page.getByRole('button', { name: 'Add' }).click();

      await expect(page.getByText('Всего заметок: 0')).toBeVisible();

      await page.getByLabel('New note').fill('   ');
      await page.getByRole('button', { name: 'Add' }).click();

      await expect(page.getByText('Всего заметок: 0')).toBeVisible();
    });

    test('SC-006: Search filters notes by title', async ({ page }) => {
      await page.goto('/notes');

      await page.getByLabel('New note').fill('Купить молоко');
      await page.getByRole('button', { name: 'Add' }).click();

      await page.getByLabel('New note').fill('Позвонить маме');
      await page.getByRole('button', { name: 'Add' }).click();

      await page.getByLabel('New note').fill('Купить хлеб');
      await page.getByRole('button', { name: 'Add' }).click();

      await expect(page.getByText('Всего заметок: 3')).toBeVisible();

      await page.getByPlaceholder('Поиск заметок...').fill('Купить');

      await expect(page.getByText('Купить молоко')).toBeVisible();
      await expect(page.getByText('Купить хлеб')).toBeVisible();
      await expect(page.getByText('Позвонить маме')).not.toBeVisible();
      await expect(page.getByText('Найдено: 2 из 3')).toBeVisible();
    });

    test('SC-007: Clearing search shows all notes', async ({ page }) => {
      await page.goto('/notes');

      await page.getByLabel('New note').fill('Заметка раз');
      await page.getByRole('button', { name: 'Add' }).click();

      await page.getByLabel('New note').fill('Заметка два');
      await page.getByRole('button', { name: 'Add' }).click();

      await page.getByPlaceholder('Поиск заметок...').fill('раз');

      await expect(page.getByText('Заметка раз')).toBeVisible();
      await expect(page.getByText('Заметка два')).not.toBeVisible();

      await page.getByRole('button', { name: 'Очистить поиск' }).click();

      await expect(page.getByText('Заметка раз')).toBeVisible();
      await expect(page.getByText('Заметка два')).toBeVisible();
      await expect(page.getByText('Всего заметок: 2')).toBeVisible();
    });

    test('SC-008: Search with no results shows empty list', async ({ page }) => {
      await page.goto('/notes');

      await page.getByLabel('New note').fill('Тестовая заметка');
      await page.getByRole('button', { name: 'Add' }).click();

      await expect(page.getByText('Всего заметок: 1')).toBeVisible();

      await page.getByPlaceholder('Поиск заметок...').fill('несуществующий текст');

      await expect(page.getByText('Тестовая заметка')).not.toBeVisible();
      await expect(page.getByText('Найдено: 0 из 1')).toBeVisible();
    });

    test('SC-009: Search is case-insensitive', async ({ page }) => {
      await page.goto('/notes');

      await page.getByLabel('New note').fill('Важная Заметка');
      await page.getByRole('button', { name: 'Add' }).click();

      await page.getByPlaceholder('Поиск заметок...').fill('важная заметка');

      await expect(page.getByText('Важная Заметка')).toBeVisible();
      await expect(page.getByText('Найдено: 1 из 1')).toBeVisible();

      await page.getByPlaceholder('Поиск заметок...').fill('ВАЖНАЯ ЗАМЕТКА');

      await expect(page.getByText('Важная Заметка')).toBeVisible();
      await expect(page.getByText('Найдено: 1 из 1')).toBeVisible();
    });

    test('SC-011: 401 response clears token and redirects to /login', async ({ page }) => {
      await page.goto('/notes');
      await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();

      // Intercept only POST API calls to return 401
      await page.route('**/api/notes', (route) => {
        if (route.request().method() === 'POST') {
          route.fulfill({ status: 401, body: JSON.stringify({ error: 'Unauthorized' }) });
        } else {
          route.continue();
        }
      });

      // Trigger an API call by adding a note
      await page.getByLabel('New note').fill('Test note');
      await Promise.all([
        page.waitForURL(/\/login/, { timeout: 15000 }),
        page.getByRole('button', { name: 'Add' }).click(),
      ]);

      // Should be on /login
      await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

      // Token should be cleared
      const tokenValue = await page.evaluate(() => localStorage.getItem('auth_token'));
      expect(tokenValue).toBeNull();
    });
  });
});
