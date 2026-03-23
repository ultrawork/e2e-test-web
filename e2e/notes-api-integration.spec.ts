import { test, expect } from '@playwright/test';
import { createHmac } from 'crypto';

/**
 * Create a minimal HS256 JWT using Node built-in crypto.
 */
function createJWT(payload: Record<string, unknown>, secret: string): string {
  const encode = (obj: Record<string, unknown>) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const body = encode({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  });
  const signature = createHmac('sha256', secret)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

const JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-secret-key-ultrawork';
const API_URL = process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';

function authHeaders(): Record<string, string> {
  const token = createJWT({ userId: 'e2e-test-user', email: 'e2e@test.com' }, JWT_SECRET);
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// ─── API Tests ───────────────────────────────────────────────

test.describe('Notes API', () => {
  const headers = authHeaders();

  test('SC-001: GET /api/notes returns a list of notes', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/notes`, { headers });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);

    if (body.length > 0) {
      const note = body[0];
      expect(note).toHaveProperty('id');
      expect(note).toHaveProperty('title');
      expect(note).toHaveProperty('content');
      expect(note).toHaveProperty('userId');
      expect(note).toHaveProperty('categories');
      expect(note).toHaveProperty('createdAt');
      expect(note).toHaveProperty('updatedAt');
    }
  });

  test('SC-002: Full CRUD cycle — create and delete a note', async ({ request }) => {
    // Create
    const createRes = await request.post(`${API_URL}/api/notes`, {
      headers,
      data: { title: 'E2E CRUD Note', content: 'E2E CRUD content' },
    });
    expect(createRes.status()).toBe(201);

    const created = await createRes.json();
    expect(created.title).toBe('E2E CRUD Note');
    expect(created.content).toBe('E2E CRUD content');
    expect(created).toHaveProperty('id');
    const noteId = created.id;

    // Verify it appears in list
    const listRes = await request.get(`${API_URL}/api/notes`, { headers });
    expect(listRes.status()).toBe(200);
    const list = await listRes.json();
    expect(list.some((n: { id: string }) => n.id === noteId)).toBe(true);

    // Delete
    const deleteRes = await request.delete(`${API_URL}/api/notes/${noteId}`, { headers });
    expect(deleteRes.status()).toBe(204);

    // Verify it's gone
    const listAfter = await request.get(`${API_URL}/api/notes`, { headers });
    const listAfterBody = await listAfter.json();
    expect(listAfterBody.some((n: { id: string }) => n.id === noteId)).toBe(false);
  });

  test('SC-003: Validation — POST without required fields returns 400', async ({ request }) => {
    const cases = [
      { title: 'Only title' },
      { content: 'Only content' },
      {},
    ];

    for (const data of cases) {
      const res = await request.post(`${API_URL}/api/notes`, { headers, data });
      expect(res.status()).toBe(400);
    }
  });
});

// ─── UI Tests ────────────────────────────────────────────────

test.describe('Notes UI with backend', () => {
  const headers = authHeaders();

  /**
   * Helper: create a note via API and return its id.
   */
  async function createNoteViaAPI(
    request: import('@playwright/test').APIRequestContext,
    title: string,
    content: string,
  ): Promise<string> {
    const res = await request.post(`${API_URL}/api/notes`, {
      headers,
      data: { title, content },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    return body.id as string;
  }

  /**
   * Helper: delete a note via API (best-effort cleanup).
   */
  async function deleteNoteViaAPI(
    request: import('@playwright/test').APIRequestContext,
    id: string,
  ): Promise<void> {
    await request.delete(`${API_URL}/api/notes/${id}`, { headers });
  }

  test('SC-004: Notes load and display on page open', async ({ page, request }) => {
    const noteId = await createNoteViaAPI(request, 'Preexisting Note', 'Some content');

    try {
      await page.goto('/notes');
      await expect(page.getByText('Loading...')).toBeVisible();
      await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 });

      await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
      await expect(page.getByText('Preexisting Note')).toBeVisible();
      await expect(page.getByText('Some content')).toBeVisible();
      await expect(page.getByText(/Всего заметок: \d+/)).toBeVisible();
    } finally {
      await deleteNoteViaAPI(request, noteId);
    }
  });

  test('SC-005: Create a note via the form', async ({ page, request }) => {
    await page.goto('/notes');
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 });

    const counterBefore = await page.getByText(/Всего заметок: (\d+)/).textContent();
    const countBefore = parseInt(counterBefore?.match(/\d+/)?.[0] ?? '0', 10);

    await page.getByPlaceholder('Title').fill('Новая заметка');
    await page.getByPlaceholder('Content').fill('Содержимое заметки');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Новая заметка')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Содержимое заметки')).toBeVisible();

    // Fields cleared
    await expect(page.getByPlaceholder('Title')).toHaveValue('');
    await expect(page.getByPlaceholder('Content')).toHaveValue('');

    // Counter incremented
    await expect(page.getByText(`Всего заметок: ${countBefore + 1}`)).toBeVisible();

    // No errors
    await expect(page.locator('p[role="alert"]')).not.toBeVisible();

    // Cleanup: delete the note via API
    const listRes = await request.get(`${API_URL}/api/notes`, { headers });
    const notes = await listRes.json();
    const created = notes.find((n: { title: string }) => n.title === 'Новая заметка');
    if (created) {
      await deleteNoteViaAPI(request, created.id);
    }
  });

  test('SC-006: Delete a note via UI', async ({ page, request }) => {
    const noteId = await createNoteViaAPI(request, 'Note To Delete', 'Delete me');

    try {
      await page.goto('/notes');
      await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 });

      await expect(page.getByText('Note To Delete')).toBeVisible();
      const counterBefore = await page.getByText(/Всего заметок: (\d+)/).textContent();
      const countBefore = parseInt(counterBefore?.match(/\d+/)?.[0] ?? '0', 10);

      await page.getByRole('button', { name: 'Delete note: Note To Delete' }).click();

      await expect(page.getByText('Note To Delete')).not.toBeVisible({ timeout: 10000 });
      await expect(page.getByText(`Всего заметок: ${countBefore - 1}`)).toBeVisible();
      await expect(page.locator('p[role="alert"]')).not.toBeVisible();
    } catch {
      // Cleanup in case test fails before delete
      await deleteNoteViaAPI(request, noteId).catch(() => {});
      throw new Error('SC-006 failed');
    }
  });

  test('SC-007: Search filters notes by title', async ({ page, request }) => {
    const id1 = await createNoteViaAPI(request, 'Рабочая задача', 'Work stuff');
    const id2 = await createNoteViaAPI(request, 'Личная заметка', 'Personal stuff');

    try {
      await page.goto('/notes');
      await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 });

      await expect(page.getByText('Рабочая задача')).toBeVisible();
      await expect(page.getByText('Личная заметка')).toBeVisible();

      // Search
      await page.getByPlaceholder('Поиск заметок...').fill('Рабочая');
      await expect(page.getByText('Рабочая задача')).toBeVisible();
      await expect(page.getByText('Личная заметка')).not.toBeVisible();
      await expect(page.getByText(/Найдено: 1 из \d+/)).toBeVisible();

      // Clear search
      await page.getByRole('button', { name: 'Очистить поиск' }).click();
      await expect(page.getByText('Рабочая задача')).toBeVisible();
      await expect(page.getByText('Личная заметка')).toBeVisible();
      await expect(page.getByText(/Всего заметок: \d+/)).toBeVisible();
    } finally {
      await deleteNoteViaAPI(request, id1).catch(() => {});
      await deleteNoteViaAPI(request, id2).catch(() => {});
    }
  });

  test('SC-008: Favorites toggle and filter', async ({ page, request }) => {
    const id1 = await createNoteViaAPI(request, 'Fav Note A', 'Content A');
    const id2 = await createNoteViaAPI(request, 'Fav Note B', 'Content B');

    try {
      await page.goto('/notes');
      await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 });

      await expect(page.getByText('Fav Note A')).toBeVisible();
      await expect(page.getByText('Fav Note B')).toBeVisible();

      // Favorite the first note (☆ → ★)
      await page.getByRole('button', { name: 'Favorite note: Fav Note A' }).click();
      // Verify star changed to filled
      await expect(page.getByRole('button', { name: 'Unfavorite note: Fav Note A' })).toBeVisible();

      // Enable "Show favorites only"
      await page.getByLabel('Show favorites only').check();

      // Only favorited note visible
      await expect(page.getByText('Fav Note A')).toBeVisible();
      await expect(page.getByText('Fav Note B')).not.toBeVisible();
      await expect(page.getByText(/Найдено: 1 из \d+/)).toBeVisible();

      // Disable filter
      await page.getByLabel('Show favorites only').uncheck();
      await expect(page.getByText('Fav Note A')).toBeVisible();
      await expect(page.getByText('Fav Note B')).toBeVisible();

      // Unfavorite
      await page.getByRole('button', { name: 'Unfavorite note: Fav Note A' }).click();
      await expect(page.getByRole('button', { name: 'Favorite note: Fav Note A' })).toBeVisible();
    } finally {
      await deleteNoteViaAPI(request, id1).catch(() => {});
      await deleteNoteViaAPI(request, id2).catch(() => {});
    }
  });
});
