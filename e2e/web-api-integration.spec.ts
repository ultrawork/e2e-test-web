import { test, expect } from '@playwright/test';

const apiUrl = process.env.API_URL || 'http://localhost:4000';

/** Helper: create a note via API directly. */
async function createNoteViaApi(
  request: import('@playwright/test').APIRequestContext,
  title: string,
  content: string = ''
) {
  const res = await request.post(`${apiUrl}/api/notes`, {
    data: { title, content },
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.status()).toBe(201);
  return res.json();
}

/** Helper: delete all notes so each test starts clean. */
async function deleteAllNotes(request: import('@playwright/test').APIRequestContext) {
  const res = await request.get(`${apiUrl}/api/notes`);
  if (!res.ok()) return;
  const notes = await res.json();
  for (const note of notes) {
    await request.delete(`${apiUrl}/api/notes/${note.id}`);
  }
}

test.describe('Web — Notes page with API integration', () => {
  test.beforeEach(async ({ request }) => {
    await deleteAllNotes(request);
  });

  test.afterEach(async ({ request }) => {
    await deleteAllNotes(request);
  });

  test('SC-005: Home page displays heading and navigates to /notes', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Notes App' })).toBeVisible();
    await expect(page.getByText('Welcome to the Notes App')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to Notes' })).toBeVisible();

    await page.getByRole('link', { name: 'Go to Notes' }).click();

    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter a note')).toBeVisible();
  });

  test('SC-006: Create and display a note via API', async ({ page }) => {
    await page.goto('/notes');

    // Wait for loading to finish
    await expect(page.getByText('Loading...')).toBeHidden({ timeout: 10000 });
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    // Add a note
    await page.getByLabel('New note').fill('Тестовая заметка');
    await page.getByRole('button', { name: 'Add' }).click();

    // Verify it appeared
    await expect(page.getByText('Тестовая заметка')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    // Empty input should not create a note
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    // Input should be cleared after successful add
    await expect(page.getByLabel('New note')).toHaveValue('');
  });

  test('SC-007: Delete a note via API', async ({ page, request }) => {
    // Pre-create a note via API
    await createNoteViaApi(request, 'Note to delete');

    await page.goto('/notes');
    await expect(page.getByText('Loading...')).toBeHidden({ timeout: 10000 });

    // Verify note is shown
    await expect(page.getByText('Note to delete')).toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    // Delete the note
    await page.getByRole('button', { name: 'Delete note: Note to delete' }).click();

    // Verify it was removed
    await expect(page.getByText('Note to delete')).toBeHidden({ timeout: 10000 });
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });

  test('SC-008: Search and filter notes', async ({ page, request }) => {
    // Pre-create 3 notes via API
    await createNoteViaApi(request, 'Купить молоко');
    await createNoteViaApi(request, 'Встреча с командой');
    await createNoteViaApi(request, 'Купить хлеб');

    await page.goto('/notes');
    await expect(page.getByText('Loading...')).toBeHidden({ timeout: 10000 });
    await expect(page.getByText('Всего заметок: 3')).toBeVisible();

    // Search for "Купить"
    await page.getByPlaceholder('Поиск заметок...').fill('Купить');

    await expect(page.getByText('Купить молоко')).toBeVisible();
    await expect(page.getByText('Купить хлеб')).toBeVisible();
    await expect(page.getByText('Встреча с командой')).toBeHidden();
    await expect(page.getByText('Найдено: 2 из 3')).toBeVisible();

    // Clear search
    await page.getByRole('button', { name: 'Очистить поиск' }).click();
    await expect(page.getByText('Всего заметок: 3')).toBeVisible();
    await expect(page.getByText('Встреча с командой')).toBeVisible();

    // Search with no results
    await page.getByPlaceholder('Поиск заметок...').fill('несуществующий текст');
    await expect(page.getByText('Найдено: 0 из 3')).toBeVisible();
  });
});
