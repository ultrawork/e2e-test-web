import { test, expect, request as pwRequest } from '@playwright/test';

const apiUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';

async function cleanupNotes() {
  const ctx = await pwRequest.newContext();
  const res = await ctx.get(`${apiUrl}/api/notes`);
  if (res.ok()) {
    const notes = await res.json();
    for (const note of notes) {
      await ctx.delete(`${apiUrl}/api/notes/${note.id}`);
    }
  }
  await ctx.dispose();
}

async function createNoteViaApi(title: string, content: string) {
  const ctx = await pwRequest.newContext();
  const res = await ctx.post(`${apiUrl}/api/notes`, {
    data: { title, content },
  });
  const note = await res.json();
  await ctx.dispose();
  return note;
}

test.describe('Notes API Integration', () => {
  test.beforeEach(async () => {
    await cleanupNotes();
  });

  test.afterAll(async () => {
    await cleanupNotes();
  });

  test('SC-001: Loading indicator and notes list from API', async ({ page }) => {
    await createNoteViaApi('Тестовая заметка', 'Содержимое');

    await page.goto('/notes');
    await expect(page.getByText('Loading...')).toBeVisible();
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 });

    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    await expect(page.getByText('Тестовая заметка')).toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();
  });

  test('SC-002: Create note via form', async ({ page }) => {
    await page.goto('/notes');
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    await page.getByLabel('New note').fill('Новая заметка из теста');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByLabel('New note')).toHaveValue('');
    await expect(page.getByText('Новая заметка из теста')).toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();
  });

  test('SC-003: Empty input does not create note', async ({ page }) => {
    await page.goto('/notes');
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });

  test('SC-004: Delete note', async ({ page }) => {
    await createNoteViaApi('Заметка для удаления', 'Содержимое');

    await page.goto('/notes');
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Всего заметок: 1')).toBeVisible();
    await expect(page.getByText('Заметка для удаления')).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Заметка для удаления' }).click();

    await expect(page.getByText('Заметка для удаления')).not.toBeVisible();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });

  test('SC-005: Search notes by title', async ({ page }) => {
    await createNoteViaApi('Рабочая задача', 'Содержимое 1');
    await createNoteViaApi('Личная заметка', 'Содержимое 2');
    await createNoteViaApi('Рабочий план', 'Содержимое 3');

    await page.goto('/notes');
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 });

    await expect(page.getByText('Всего заметок: 3')).toBeVisible();

    await page.getByPlaceholder('Поиск заметок...').fill('Рабоч');

    await expect(page.getByText('Рабочая задача')).toBeVisible();
    await expect(page.getByText('Рабочий план')).toBeVisible();
    await expect(page.getByText('Личная заметка')).not.toBeVisible();
    await expect(page.getByText('Найдено: 2 из 3')).toBeVisible();

    await page.getByRole('button', { name: 'Очистить поиск' }).click();

    await expect(page.getByText('Рабочая задача')).toBeVisible();
    await expect(page.getByText('Личная заметка')).toBeVisible();
    await expect(page.getByText('Рабочий план')).toBeVisible();
    await expect(page.getByText('Всего заметок: 3')).toBeVisible();
  });
});

test.describe('Notes API Endpoints', () => {
  test.beforeEach(async () => {
    await cleanupNotes();
  });

  test.afterAll(async () => {
    await cleanupNotes();
  });

  test('SC-006: GET /api/notes returns notes list', async ({ request }) => {
    await createNoteViaApi('API заметка', 'Содержимое');

    const res = await request.get(`${apiUrl}/api/notes`);
    expect(res.status()).toBe(200);

    const notes = await res.json();
    expect(Array.isArray(notes)).toBe(true);
    expect(notes.length).toBeGreaterThanOrEqual(1);

    const note = notes.find((n: { title: string }) => n.title === 'API заметка');
    expect(note).toBeDefined();
    expect(note).toHaveProperty('id');
    expect(note).toHaveProperty('title');
    expect(note).toHaveProperty('content');
    expect(note).toHaveProperty('userId');
    expect(note).toHaveProperty('categories');
    expect(note).toHaveProperty('createdAt');
    expect(note).toHaveProperty('updatedAt');
  });

  test('SC-007: POST /api/notes creates a note', async ({ request }) => {
    const res = await request.post(`${apiUrl}/api/notes`, {
      data: { title: 'API тестовая заметка', content: 'Содержимое заметки' },
    });
    expect(res.status()).toBe(201);

    const created = await res.json();
    expect(created).toHaveProperty('id');
    expect(created.title).toBe('API тестовая заметка');
    expect(created.content).toBe('Содержимое заметки');
    expect(created).toHaveProperty('createdAt');
    expect(created).toHaveProperty('updatedAt');

    const listRes = await request.get(`${apiUrl}/api/notes`);
    const notes = await listRes.json();
    const found = notes.find((n: { id: string }) => n.id === created.id);
    expect(found).toBeDefined();
  });

  test('SC-008: DELETE /api/notes/:id removes a note', async ({ request }) => {
    const createRes = await request.post(`${apiUrl}/api/notes`, {
      data: { title: 'Для удаления', content: 'Удалить' },
    });
    const created = await createRes.json();

    const delRes = await request.delete(`${apiUrl}/api/notes/${created.id}`);
    expect([200, 204]).toContain(delRes.status());

    const listRes = await request.get(`${apiUrl}/api/notes`);
    const notes = await listRes.json();
    const found = notes.find((n: { id: string }) => n.id === created.id);
    expect(found).toBeUndefined();
  });

  test('SC-009: POST /api/notes without required fields returns 400', async ({ request }) => {
    const res1 = await request.post(`${apiUrl}/api/notes`, {
      data: {},
    });
    expect(res1.status()).toBe(400);

    const res2 = await request.post(`${apiUrl}/api/notes`, {
      data: { title: 'Только заголовок' },
    });
    expect(res2.status()).toBe(400);
  });
});
