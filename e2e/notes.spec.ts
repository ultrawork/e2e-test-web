import { test, expect } from '@playwright/test';

interface MockNote {
  id: string;
  title: string;
  content: string;
  isFavorited: boolean;
  categories: string[];
  createdAt: string;
  updatedAt: string;
}

test.describe('Notes App', () => {
  let mockNotes: MockNote[];
  let nextId: number;

  test.beforeEach(async ({ page }) => {
    mockNotes = [];
    nextId = 1;

    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token');
    });

    await page.route('**/api/notes/*', async (route) => {
      if (route.request().method() !== 'DELETE') {
        await route.fallback();
        return;
      }
      const url = route.request().url();
      const id = url.split('/api/notes/')[1];
      mockNotes = mockNotes.filter((n) => n.id !== id);
      await route.fulfill({ status: 204 });
    });

    await page.route('**/api/notes', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({ status: 200, json: mockNotes });
      } else if (method === 'POST') {
        const body = route.request().postDataJSON();
        const newNote: MockNote = {
          id: String(nextId++),
          title: body.title,
          content: body.content,
          isFavorited: false,
          categories: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        mockNotes.push(newNote);
        await route.fulfill({ status: 201, json: newNote });
      } else {
        await route.fallback();
      }
    });
  });

  test('SC-001: Home page displays heading, welcome text, and link', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Notes App' })).toBeVisible();
    await expect(page.getByText('Welcome to the Notes App. Login or register to get started.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to Notes' })).toBeVisible();
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
    await expect(page.getByText('Заметка А')).toBeVisible();

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
    await expect(page.getByText('Купить молоко')).toBeVisible();

    await page.getByLabel('New note').fill('Позвонить маме');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Позвонить маме')).toBeVisible();

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
    await expect(page.getByText('Заметка раз')).toBeVisible();

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

  test('SC-010: Toggle favorite marks and unmarks a note', async ({ page }) => {
    await page.goto('/notes');

    await page.getByLabel('New note').fill('Избранная заметка');
    await page.getByRole('button', { name: 'Add' }).click();

    const favButton = page.getByTestId('favorite-button-1');
    await expect(favButton).toHaveText('☆');

    await favButton.click();
    await expect(favButton).toHaveText('★');

    await favButton.click();
    await expect(favButton).toHaveText('☆');
  });
});
