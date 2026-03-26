import { test, expect } from '@playwright/test';

/** Вспомогательная функция: установить токен в localStorage перед загрузкой страницы. */
async function setToken(page: import('@playwright/test').Page, token = 'test-token'): Promise<void> {
  await page.addInitScript((t) => {
    localStorage.setItem('token', t);
  }, token);
}

/** Создать mock-ответ Note. */
function mockNote(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '1',
    title: 'Тестовая заметка',
    content: 'Содержание',
    isFavorited: false,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

test.describe('Notes App — Home Page', () => {
  test('SC-001: Home page displays heading, welcome text, and links', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Notes App' })).toBeVisible();
    await expect(page.getByText('Welcome to the Notes App. Login or register to get started.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to Notes' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
  });

  test('SC-002: Navigate from home to /notes via link', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Go to Notes' }).click();
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
  });
});

test.describe('Notes App — Auth Wall (без токена)', () => {
  test('SC-003: Without token shows auth wall, no form', async ({ page }) => {
    await page.goto('/notes');

    await expect(page.getByText('Authorization required')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter a note')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).not.toBeVisible();
  });
});

test.describe('Notes App — Mocked API (с токеном)', () => {
  test('SC-004: With token and empty notes — shows form and counter', async ({ page }) => {
    await setToken(page);
    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
      return route.continue();
    });

    await page.goto('/notes');
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter a note')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });

  test('SC-005: With token — loads notes from API', async ({ page }) => {
    await setToken(page);
    const notes = [
      mockNote({ id: '1', title: 'Заметка 1', content: 'Content 1' }),
      mockNote({ id: '2', title: 'Заметка 2', content: 'Content 2' }),
    ];
    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(notes) });
      }
      return route.continue();
    });

    await page.goto('/notes');
    await expect(page.getByText('Заметка 1')).toBeVisible();
    await expect(page.getByText('Заметка 2')).toBeVisible();
    await expect(page.getByText('Всего заметок: 2')).toBeVisible();
  });

  test('SC-006: Empty or whitespace title does not add a note', async ({ page }) => {
    await setToken(page);
    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
      return route.continue();
    });

    await page.goto('/notes');
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    await page.locator('#note-title').fill('   ');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });

  test('SC-007: Creating a note via API increments counter', async ({ page }) => {
    await setToken(page);
    let noteIdCounter = 1;
    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        const newNote = mockNote({
          id: String(noteIdCounter++),
          title: body.title,
          content: body.content,
        });
        return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(newNote) });
      }
      return route.continue();
    });

    await page.goto('/notes');
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    await page.locator('#note-title').fill('Первая заметка');
    await page.locator('#note-content').fill('Содержание');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Первая заметка')).toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();
  });

  test('SC-008: Deleting a note via API decrements counter', async ({ page }) => {
    await setToken(page);
    const existingNotes = [
      mockNote({ id: '10', title: 'Заметка А' }),
      mockNote({ id: '20', title: 'Заметка Б' }),
    ];
    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(existingNotes) });
      }
      return route.continue();
    });
    await page.route('**/api/notes/*', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({ status: 204 });
      }
      return route.continue();
    });

    await page.goto('/notes');
    await expect(page.getByText('Всего заметок: 2')).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Заметка А' }).click();
    await expect(page.getByText('Заметка А')).not.toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();
  });

  test('SC-009: Search filters notes by title', async ({ page }) => {
    await setToken(page);
    const notes = [
      mockNote({ id: '1', title: 'Купить молоко' }),
      mockNote({ id: '2', title: 'Позвонить маме' }),
      mockNote({ id: '3', title: 'Купить хлеб' }),
    ];
    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(notes) });
      }
      return route.continue();
    });

    await page.goto('/notes');
    await expect(page.getByText('Всего заметок: 3')).toBeVisible();

    await page.getByPlaceholder('Поиск заметок...').fill('Купить');

    await expect(page.getByText('Купить молоко')).toBeVisible();
    await expect(page.getByText('Купить хлеб')).toBeVisible();
    await expect(page.getByText('Позвонить маме')).not.toBeVisible();
    await expect(page.getByText('Найдено: 2 из 3')).toBeVisible();
  });

  test('SC-010: Clearing search shows all notes', async ({ page }) => {
    await setToken(page);
    const notes = [
      mockNote({ id: '1', title: 'Заметка раз' }),
      mockNote({ id: '2', title: 'Заметка два' }),
    ];
    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(notes) });
      }
      return route.continue();
    });

    await page.goto('/notes');
    await page.getByPlaceholder('Поиск заметок...').fill('раз');
    await expect(page.getByText('Заметка раз')).toBeVisible();
    await expect(page.getByText('Заметка два')).not.toBeVisible();

    await page.getByRole('button', { name: 'Очистить поиск' }).click();
    await expect(page.getByText('Заметка раз')).toBeVisible();
    await expect(page.getByText('Заметка два')).toBeVisible();
    await expect(page.getByText('Всего заметок: 2')).toBeVisible();
  });

  test('SC-011: Search with no results shows empty list', async ({ page }) => {
    await setToken(page);
    const notes = [mockNote({ id: '1', title: 'Тестовая заметка' })];
    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(notes) });
      }
      return route.continue();
    });

    await page.goto('/notes');
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    await page.getByPlaceholder('Поиск заметок...').fill('несуществующий текст');
    await expect(page.getByText('Тестовая заметка')).not.toBeVisible();
    await expect(page.getByText('Найдено: 0 из 1')).toBeVisible();
  });

  test('SC-012: Search is case-insensitive', async ({ page }) => {
    await setToken(page);
    const notes = [mockNote({ id: '1', title: 'Важная Заметка' })];
    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(notes) });
      }
      return route.continue();
    });

    await page.goto('/notes');
    await page.getByPlaceholder('Поиск заметок...').fill('важная заметка');
    await expect(page.getByText('Важная Заметка')).toBeVisible();
    await expect(page.getByText('Найдено: 1 из 1')).toBeVisible();

    await page.getByPlaceholder('Поиск заметок...').fill('ВАЖНАЯ ЗАМЕТКА');
    await expect(page.getByText('Важная Заметка')).toBeVisible();
    await expect(page.getByText('Найдено: 1 из 1')).toBeVisible();
  });

  test('SC-013: Toggle favorite via API', async ({ page }) => {
    await setToken(page);
    const note = mockNote({ id: '1', title: 'Fav Note', isFavorited: false });
    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([note]) });
      }
      return route.continue();
    });
    await page.route('**/api/notes/1/favorite', (route) => {
      if (route.request().method() === 'PATCH') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...note, isFavorited: true }),
        });
      }
      return route.continue();
    });

    await page.goto('/notes');
    const favBtn = page.getByTestId('favorite-button-1');
    await expect(favBtn).toHaveText('☆');

    await favBtn.click();
    await expect(favBtn).toHaveText('★');
  });

  test('SC-014: Filter favorites only', async ({ page }) => {
    await setToken(page);
    const notes = [
      mockNote({ id: '1', title: 'Обычная', isFavorited: false }),
      mockNote({ id: '2', title: 'Избранная', isFavorited: true }),
    ];
    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(notes) });
      }
      return route.continue();
    });

    await page.goto('/notes');
    await expect(page.getByText('Обычная')).toBeVisible();
    await expect(page.getByText('Избранная')).toBeVisible();

    await page.getByRole('button', { name: 'Favorites only' }).click();
    await expect(page.getByText('Обычная')).not.toBeVisible();
    await expect(page.getByText('Избранная')).toBeVisible();
    await expect(page.getByText('Найдено: 1 из 2')).toBeVisible();
  });

  test('SC-015: Server 500 error shows error message with refresh button', async ({ page }) => {
    await setToken(page);
    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Internal Server Error"}' });
      }
      return route.continue();
    });

    await page.goto('/notes');
    await expect(page.getByText('Failed to load notes. Please try again later.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
  });

  test('SC-016: Network error shows error state', async ({ page }) => {
    await setToken(page);
    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.abort();
      }
      return route.continue();
    });

    await page.goto('/notes');
    await expect(page.getByText('Failed to load notes. Please try again later.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
  });
});

test.describe('Notes App — Login Page', () => {
  test('SC-017: Login page renders form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Log in' })).toBeVisible();
  });

  test('SC-018: Login error shows alert', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => {
      return route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"Invalid credentials"}' });
    });

    await page.goto('/login');
    await page.locator('#email').fill('test@test.com');
    await page.locator('#password').fill('wrong');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page.locator('p[role="alert"]')).toContainText('Invalid credentials');
  });

  test('SC-019: Logout clears token and redirects to login', async ({ page }) => {
    await setToken(page);
    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
      return route.continue();
    });

    await page.goto('/notes');
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();

    await page.getByRole('button', { name: 'Log out' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Notes App — Live Backend', () => {
  const BACKEND_URL = process.env.BACKEND_URL;

  test.skip(!BACKEND_URL, 'BACKEND_URL not set — skipping live backend tests');

  test('SC-L01: Full CRUD cycle against live backend', async ({ page }) => {
    // Получить dev-токен
    const tokenRes = await page.request.post(`${BACKEND_URL}/api/auth/dev-token`);
    const { token } = await tokenRes.json();

    await page.addInitScript((t) => {
      localStorage.setItem('token', t);
    }, token);

    await page.goto('/notes');
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();

    // Создать заметку
    const uniqueTitle = `E2E-Test-${Date.now()}`;
    await page.locator('#note-title').fill(uniqueTitle);
    await page.locator('#note-content').fill('Live content');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText(uniqueTitle)).toBeVisible();

    // Удалить заметку
    await page.getByRole('button', { name: `Delete note: ${uniqueTitle}` }).click();
    await expect(page.getByText(uniqueTitle)).not.toBeVisible();
  });
});
