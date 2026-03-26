import { test, expect, Page } from '@playwright/test';

const API_URL = '**/api/notes';

function mockNote(overrides: Record<string, unknown> = {}) {
  return {
    id: '1',
    title: 'Тестовая заметка',
    content: '',
    isFavorited: false,
    categories: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

async function setToken(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('token', 'test-token');
  });
}

async function setupEmptyNotesMock(page: Page) {
  await page.route(API_URL, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
    return route.continue();
  });
}

async function setupNotesMock(page: Page, notes: ReturnType<typeof mockNote>[]) {
  await page.route(API_URL, (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(notes) });
    }
    return route.continue();
  });
}

test.describe('Notes App — без API (legacy)', () => {
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
    await expect(page.getByText('Необходима авторизация')).toBeVisible();
  });
});

test.describe('Notes App — API интеграция', () => {
  test('SC-010: Без токена — показ сообщения авторизации', async ({ page }) => {
    await page.goto('/notes');

    await expect(page.getByText('Необходима авторизация')).toBeVisible();
    await expect(page.getByPlaceholder('Enter a note')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).not.toBeVisible();
  });

  test('SC-011: С токеном — загрузка списка с сервера', async ({ page }) => {
    const notes = [
      mockNote({ id: '1', title: 'Заметка с сервера' }),
      mockNote({ id: '2', title: 'Вторая заметка' }),
    ];
    await setupNotesMock(page, notes);
    await setToken(page);

    await page.goto('/notes');

    await expect(page.getByText('Заметка с сервера')).toBeVisible();
    await expect(page.getByText('Вторая заметка')).toBeVisible();
    await expect(page.getByText('Всего заметок: 2')).toBeVisible();
  });

  test('SC-012: Создание заметки через API', async ({ page }) => {
    await setupEmptyNotesMock(page);
    await page.route(API_URL, (route) => {
      if (route.request().method() === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(mockNote({ id: '10', title: 'Новая заметка' })),
        });
      }
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
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
  });

  test('SC-013: Удаление заметки через API', async ({ page }) => {
    const note = mockNote({ id: '1', title: 'Удаляемая заметка' });
    await setupNotesMock(page, [note]);
    await page.route(`${API_URL}/1`, (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.continue();
    });
    await setToken(page);

    await page.goto('/notes');
    await expect(page.getByText('Удаляемая заметка')).toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Удаляемая заметка' }).click();

    await expect(page.getByText('Удаляемая заметка')).not.toBeVisible();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });

  test('SC-014: Переключение избранного через PATCH', async ({ page }) => {
    const note = mockNote({ id: '1', title: 'Избранная заметка', isFavorited: false });
    await setupNotesMock(page, [note]);
    await page.route(`${API_URL}/1/favorite`, (route) => {
      if (route.request().method() === 'PATCH') {
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
    await expect(page.getByText('Избранная заметка')).toBeVisible();

    const favoriteButton = page.getByRole('button', { name: 'Добавить в избранное: Избранная заметка' });
    await expect(favoriteButton).toBeVisible();
    await favoriteButton.click();

    await expect(page.getByRole('button', { name: 'Убрать из избранного: Избранная заметка' })).toBeVisible();

    // Verify persistence: reload with updated data from server
    await page.route(API_URL, (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{ ...note, isFavorited: true }]),
        });
      }
      return route.continue();
    });

    await page.goto('/notes');
    await expect(page.getByRole('button', { name: 'Убрать из избранного: Избранная заметка' })).toBeVisible();
  });

  test('SC-003: Adding notes increments the counter', async ({ page }) => {
    let noteCounter = 0;
    await setupEmptyNotesMock(page);
    await page.route(API_URL, (route) => {
      if (route.request().method() === 'POST') {
        noteCounter++;
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(mockNote({ id: String(noteCounter), title: route.request().postDataJSON().title })),
        });
      }
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }
      return route.continue();
    });
    await setToken(page);

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
    const noteA = mockNote({ id: '1', title: 'Заметка А' });
    const noteB = mockNote({ id: '2', title: 'Заметка Б' });
    await setupNotesMock(page, [noteA, noteB]);
    await page.route(`${API_URL}/1`, (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.continue();
    });
    await page.route(`${API_URL}/2`, (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.continue();
    });
    await setToken(page);

    await page.goto('/notes');
    await expect(page.getByText('Всего заметок: 2')).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Заметка А' }).click();

    await expect(page.getByText('Заметка А')).not.toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Заметка Б' }).click();

    await expect(page.getByText('Заметка Б')).not.toBeVisible();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });

  test('SC-005: Empty or whitespace input does not add a note', async ({ page }) => {
    await setupEmptyNotesMock(page);
    await setToken(page);

    await page.goto('/notes');
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    await page.getByLabel('New note').fill('   ');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });

  test('SC-006: Search filters notes by title', async ({ page }) => {
    const notes = [
      mockNote({ id: '1', title: 'Купить молоко' }),
      mockNote({ id: '2', title: 'Позвонить маме' }),
      mockNote({ id: '3', title: 'Купить хлеб' }),
    ];
    await setupNotesMock(page, notes);
    await setToken(page);

    await page.goto('/notes');
    await expect(page.getByText('Всего заметок: 3')).toBeVisible();

    await page.getByPlaceholder('Поиск заметок...').fill('Купить');

    await expect(page.getByText('Купить молоко')).toBeVisible();
    await expect(page.getByText('Купить хлеб')).toBeVisible();
    await expect(page.getByText('Позвонить маме')).not.toBeVisible();
    await expect(page.getByText('Найдено: 2 из 3')).toBeVisible();
  });

  test('SC-007: Clearing search shows all notes', async ({ page }) => {
    const notes = [
      mockNote({ id: '1', title: 'Заметка раз' }),
      mockNote({ id: '2', title: 'Заметка два' }),
    ];
    await setupNotesMock(page, notes);
    await setToken(page);

    await page.goto('/notes');

    await page.getByPlaceholder('Поиск заметок...').fill('раз');

    await expect(page.getByText('Заметка раз')).toBeVisible();
    await expect(page.getByText('Заметка два')).not.toBeVisible();

    await page.getByRole('button', { name: 'Очистить поиск' }).click();

    await expect(page.getByText('Заметка раз')).toBeVisible();
    await expect(page.getByText('Заметка два')).toBeVisible();
    await expect(page.getByText('Всего заметок: 2')).toBeVisible();
  });

  test('SC-008: Search with no results shows empty list', async ({ page }) => {
    const notes = [mockNote({ id: '1', title: 'Тестовая заметка' })];
    await setupNotesMock(page, notes);
    await setToken(page);

    await page.goto('/notes');
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    await page.getByPlaceholder('Поиск заметок...').fill('несуществующий текст');

    await expect(page.getByText('Тестовая заметка')).not.toBeVisible();
    await expect(page.getByText('Найдено: 0 из 1')).toBeVisible();
  });

  test('SC-009: Search is case-insensitive', async ({ page }) => {
    const notes = [mockNote({ id: '1', title: 'Важная Заметка' })];
    await setupNotesMock(page, notes);
    await setToken(page);

    await page.goto('/notes');

    await page.getByPlaceholder('Поиск заметок...').fill('важная заметка');

    await expect(page.getByText('Важная Заметка')).toBeVisible();
    await expect(page.getByText('Найдено: 1 из 1')).toBeVisible();

    await page.getByPlaceholder('Поиск заметок...').fill('ВАЖНАЯ ЗАМЕТКА');

    await expect(page.getByText('Важная Заметка')).toBeVisible();
    await expect(page.getByText('Найдено: 1 из 1')).toBeVisible();
  });
});
