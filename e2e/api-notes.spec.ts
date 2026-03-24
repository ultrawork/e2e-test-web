import { test, expect } from '@playwright/test';

const apiUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';

test.describe('Notes API', () => {
  test('SC-1: GET /api/notes returns 200 with array of notes', async ({ request }) => {
    const response = await request.get(`${apiUrl}/api/notes`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);

    if (body.length > 0) {
      const note = body[0];
      expect(note).toHaveProperty('id');
      expect(note).toHaveProperty('title');
      expect(note).toHaveProperty('content');
      expect(note).toHaveProperty('userId');
      expect(note).toHaveProperty('createdAt');
      expect(note).toHaveProperty('updatedAt');
      expect(note).toHaveProperty('categories');
    }
  });

  test('SC-2: POST /api/notes creates a note and it appears in GET', async ({ request }) => {
    const createResponse = await request.post(`${apiUrl}/api/notes`, {
      data: {
        title: 'Тестовая заметка',
        content: 'Содержимое тестовой заметки',
      },
    });

    expect(createResponse.status()).toBe(201);

    const created = await createResponse.json();
    expect(created).toHaveProperty('id');
    expect(created.title).toBe('Тестовая заметка');
    expect(created.content).toBe('Содержимое тестовой заметки');
    expect(created.categories).toEqual([]);

    // Verify note appears in the list
    const listResponse = await request.get(`${apiUrl}/api/notes`);
    expect(listResponse.status()).toBe(200);

    const notes = await listResponse.json();
    const found = notes.find((n: { id: number }) => n.id === created.id);
    expect(found).toBeTruthy();
    expect(found.title).toBe('Тестовая заметка');

    // Cleanup
    await request.delete(`${apiUrl}/api/notes/${created.id}`);
  });

  test('SC-3: POST /api/notes with empty title returns 400', async ({ request }) => {
    const response = await request.post(`${apiUrl}/api/notes`, {
      data: {
        title: '',
      },
    });

    expect(response.status()).toBe(400);

    const body = await response.json();
    expect(body.error).toBe('title and content are required');
  });

  test('SC-4: DELETE /api/notes/:id removes the note', async ({ request }) => {
    // Create a note first
    const createResponse = await request.post(`${apiUrl}/api/notes`, {
      data: {
        title: 'Удалить меня',
        content: 'Тест удаления',
      },
    });
    expect(createResponse.status()).toBe(201);

    const created = await createResponse.json();
    const noteId = created.id;

    // Delete the note
    const deleteResponse = await request.delete(`${apiUrl}/api/notes/${noteId}`);
    expect(deleteResponse.status()).toBe(204);

    // Verify note is gone
    const getResponse = await request.get(`${apiUrl}/api/notes/${noteId}`);
    expect(getResponse.status()).toBe(404);
  });

  test('SC-5: Home page navigation to notes', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Notes App' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to Notes' })).toBeVisible();

    await page.getByRole('link', { name: 'Go to Notes' }).click();

    await expect(page).toHaveURL(/\/notes$/);
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
  });

  test('SC-6: Add a note via form', async ({ page }) => {
    await page.goto('/notes');

    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    await page.getByLabel('New note').fill('Моя первая заметка');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Моя первая заметка')).toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();
    await expect(page.getByLabel('New note')).toHaveValue('');
  });

  test('SC-7: Search filters notes and clear restores all', async ({ page }) => {
    await page.goto('/notes');

    // Add 3 notes
    await page.getByLabel('New note').fill('Купить молоко');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('New note').fill('Написать отчёт');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('New note').fill('Купить хлеб');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Всего заметок: 3')).toBeVisible();

    // Search
    await page.getByPlaceholder('Поиск заметок...').fill('Купить');

    await expect(page.getByText('Купить молоко')).toBeVisible();
    await expect(page.getByText('Купить хлеб')).toBeVisible();
    await expect(page.getByText('Написать отчёт')).not.toBeVisible();
    await expect(page.getByText('Найдено: 2 из 3')).toBeVisible();

    // Clear search
    await page.getByRole('button', { name: 'Очистить поиск' }).click();

    await expect(page.getByText('Всего заметок: 3')).toBeVisible();
    await expect(page.getByText('Купить молоко')).toBeVisible();
    await expect(page.getByText('Написать отчёт')).toBeVisible();
    await expect(page.getByText('Купить хлеб')).toBeVisible();
  });

  test('SC-8: Delete a note from the list', async ({ page }) => {
    await page.goto('/notes');

    await page.getByLabel('New note').fill('Заметка для удаления');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Заметка для удаления')).toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Заметка для удаления' }).click();

    await expect(page.getByText('Заметка для удаления')).not.toBeVisible();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });
});
