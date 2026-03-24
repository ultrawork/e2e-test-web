import { test, expect, Page } from '@playwright/test';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-secret-key-ultrawork';

function generateToken(): string {
  return jwt.sign(
    { sub: 'e2e-test-user', email: 'e2e@test.com' },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
}

async function authenticateAndGo(page: Page, path: string): Promise<void> {
  const token = generateToken();
  // Navigate first to set the origin, then set token
  await page.goto(path);
  await page.evaluate((t) => localStorage.setItem('token', t), token);
  await page.goto(path);
}

async function waitForNotesLoaded(page: Page): Promise<void> {
  // Wait for Loading… to disappear
  await expect(page.getByText('Loading…')).not.toBeVisible({ timeout: 10000 });
}

/**
 * Creates a note via API and returns its id.
 */
async function createNoteViaApi(request: import('@playwright/test').APIRequestContext, title: string): Promise<string> {
  const apiUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';
  const token = generateToken();
  const response = await request.post(`${apiUrl}/api/v1/notes`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: { title, content: title },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  return body.id;
}

/**
 * Deletes all notes via API to ensure clean state.
 */
async function deleteAllNotes(request: import('@playwright/test').APIRequestContext): Promise<void> {
  const apiUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';
  const token = generateToken();
  const response = await request.get(`${apiUrl}/api/v1/notes`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (response.ok()) {
    const notes = await response.json();
    for (const note of notes) {
      await request.delete(`${apiUrl}/api/v1/notes/${note.id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
    }
  }
}

test.describe('Notes API Integration', () => {
  test.beforeEach(async ({ request }) => {
    await deleteAllNotes(request);
  });

  test.afterEach(async ({ request }) => {
    await deleteAllNotes(request);
  });

  test('SC-004: Create a new note', async ({ page }) => {
    await authenticateAndGo(page, '/notes');
    await waitForNotesLoaded(page);

    // Check initial counter
    await expect(page.getByText(/Всего заметок: \d+/)).toBeVisible();

    // Enter note text
    await page.getByPlaceholder('Enter a note').fill('Тестовая заметка');
    await page.getByRole('button', { name: 'Add' }).click();

    // Wait for note to appear
    await expect(page.getByText('Тестовая заметка')).toBeVisible({ timeout: 10000 });

    // Input should be cleared
    await expect(page.getByPlaceholder('Enter a note')).toHaveValue('');

    // Counter should show 1
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    // Favorite and Delete buttons should be present
    await expect(page.getByRole('button', { name: 'Toggle favorite' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Delete note/ })).toBeVisible();
  });

  test('SC-005: Delete a note', async ({ page, request }) => {
    // Create a note via API
    await createNoteViaApi(request, 'Удалить меня');

    await authenticateAndGo(page, '/notes');
    await waitForNotesLoaded(page);

    // Verify note exists
    await expect(page.getByText('Удалить меня')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    // Click Delete
    await page.getByRole('button', { name: 'Delete note: Удалить меня' }).click();

    // Note should disappear
    await expect(page.getByText('Удалить меня')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });

  test('SC-006: Toggle favorite and filter', async ({ page, request }) => {
    // Create 2 notes via API
    await createNoteViaApi(request, 'Заметка А');
    await createNoteViaApi(request, 'Заметка Б');

    await authenticateAndGo(page, '/notes');
    await waitForNotesLoaded(page);

    await expect(page.getByText('Заметка А')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Заметка Б')).toBeVisible();

    // Toggle favorite on first note (☆ → ★)
    const favoriteButtons = page.getByRole('button', { name: 'Toggle favorite' });
    await favoriteButtons.first().click();

    // Wait for the star to change
    await expect(favoriteButtons.first()).toContainText('★', { timeout: 5000 });

    // Click "Только избранные"
    const favFilterButton = page.getByRole('button', { name: 'Только избранные' });
    await favFilterButton.click();
    await expect(favFilterButton).toHaveAttribute('aria-pressed', 'true');

    // Only favorited note should be visible
    await expect(page.getByText('Заметка А')).toBeVisible();
    await expect(page.getByText('Заметка Б')).not.toBeVisible();

    // Deactivate filter
    await favFilterButton.click();
    await expect(favFilterButton).toHaveAttribute('aria-pressed', 'false');

    // All notes visible again
    await expect(page.getByText('Заметка А')).toBeVisible();
    await expect(page.getByText('Заметка Б')).toBeVisible();
  });

  test('SC-007: Search notes and counter', async ({ page, request }) => {
    await createNoteViaApi(request, 'Покупки');
    await createNoteViaApi(request, 'Работа');

    await authenticateAndGo(page, '/notes');
    await waitForNotesLoaded(page);

    await expect(page.getByText('Покупки')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Работа')).toBeVisible();
    await expect(page.getByText('Всего заметок: 2')).toBeVisible();

    // Search for "Покупки"
    await page.getByPlaceholder('Поиск заметок...').fill('Покупки');

    await expect(page.getByText('Покупки')).toBeVisible();
    await expect(page.getByText('Работа')).not.toBeVisible();
    await expect(page.getByText('Найдено: 1 из 2')).toBeVisible();

    // Clear search
    await page.getByRole('button', { name: 'Очистить поиск' }).click();

    await expect(page.getByText('Покупки')).toBeVisible();
    await expect(page.getByText('Работа')).toBeVisible();
    await expect(page.getByText('Всего заметок: 2')).toBeVisible();
  });

  test('SC-008: Logout', async ({ page }) => {
    await authenticateAndGo(page, '/notes');
    await waitForNotesLoaded(page);

    // Click logout
    await page.getByRole('button', { name: 'Выйти' }).click();

    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    // Token should be removed
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();

    // Going back to /notes should show auth required
    await page.goto('/notes');
    await expect(page.getByText('Необходима авторизация')).toBeVisible();
  });
});
