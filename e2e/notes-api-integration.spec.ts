import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://host.docker.internal:4150';

/**
 * Helper: obtain a dev token from the backend API
 */
async function getDevToken(request: import('@playwright/test').APIRequestContext): Promise<string> {
  const res = await request.post(`${API_URL}/api/auth/dev-token`, {
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.token;
}

/**
 * Helper: create a note via API and return it
 */
async function createNoteViaApi(
  request: import('@playwright/test').APIRequestContext,
  token: string,
  title: string,
): Promise<{ id: string; title: string }> {
  const res = await request.post(`${API_URL}/api/notes`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    data: { title, content: '' },
  });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

/**
 * Helper: delete a note via API
 */
async function deleteNoteViaApi(
  request: import('@playwright/test').APIRequestContext,
  token: string,
  id: string,
): Promise<void> {
  await request.delete(`${API_URL}/api/notes/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * Helper: fetch all notes via API
 */
async function fetchNotesViaApi(
  request: import('@playwright/test').APIRequestContext,
  token: string,
): Promise<{ id: string; title: string }[]> {
  const res = await request.get(`${API_URL}/api/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

/**
 * Helper: clean up all notes created during tests
 */
async function cleanupAllNotes(
  request: import('@playwright/test').APIRequestContext,
  token: string,
): Promise<void> {
  const notes = await fetchNotesViaApi(request, token);
  for (const note of notes) {
    await deleteNoteViaApi(request, token, note.id);
  }
}

test.describe('Notes API Integration', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    token = await getDevToken(request);
  });

  test.beforeEach(async ({ request }) => {
    await cleanupAllNotes(request, token);
  });

  test.afterAll(async ({ request }) => {
    await cleanupAllNotes(request, token);
  });

  // SC-01: Load notes list on page open
  test('SC-01: notes list loads on page open', async ({ page }) => {
    // Pre-create a note via API so we can verify it loads
    const apiReq = page.request;
    await createNoteViaApi(apiReq, token, 'Preloaded Note SC01');

    // Inject token into localStorage and navigate
    await page.goto('/notes');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.reload();

    // Should show loading state
    // After loading completes, note should be visible
    await expect(page.getByText('Preloaded Note SC01')).toBeVisible({ timeout: 10000 });

    // No error alert should be present
    await expect(page.getByRole('alert')).not.toBeVisible();
  });

  // SC-02: Create a new note via the form
  test('SC-02: create a new note via form', async ({ page }) => {
    await page.goto('/notes');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.reload();

    // Wait for loading to finish
    await expect(page.getByText('Загрузка...')).not.toBeVisible({ timeout: 10000 });

    // Fill in and submit
    const uniqueTitle = `Test Note E2E ${Date.now()}`;
    await page.getByLabel('New note').fill(uniqueTitle);
    await page.getByRole('button', { name: 'Добавить' }).click();

    // Note should appear in the list
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10000 });

    // Input should be cleared
    await expect(page.getByLabel('New note')).toHaveValue('');

    // No error
    await expect(page.getByRole('alert')).not.toBeVisible();
  });

  // SC-03: Delete a note from the list
  test('SC-03: delete a note from the list', async ({ page }) => {
    const apiReq = page.request;
    await createNoteViaApi(apiReq, token, 'Note To Delete SC03');

    await page.goto('/notes');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.reload();

    // Wait for the note to appear
    await expect(page.getByText('Note To Delete SC03')).toBeVisible({ timeout: 10000 });

    // Click delete
    await page.getByRole('button', { name: 'Удалить заметку: Note To Delete SC03' }).click();

    // Note should disappear
    await expect(page.getByText('Note To Delete SC03')).not.toBeVisible({ timeout: 10000 });

    // No error
    await expect(page.getByRole('alert')).not.toBeVisible();
  });

  // SC-04: Filter notes via search bar
  test('SC-04: filter notes via search bar', async ({ page, request }) => {
    await createNoteViaApi(request, token, 'Apple Pie Recipe');
    await createNoteViaApi(request, token, 'Banana Smoothie');

    await page.goto('/notes');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.reload();

    // Wait for notes to load
    await expect(page.getByText('Apple Pie Recipe')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Banana Smoothie')).toBeVisible();

    // Search for "Apple"
    await page.getByPlaceholder('Поиск заметок...').fill('Apple');

    // Only Apple note visible
    await expect(page.getByText('Apple Pie Recipe')).toBeVisible();
    await expect(page.getByText('Banana Smoothie')).not.toBeVisible();

    // Counter shows filtered count
    await expect(page.getByText('Найдено: 1 из 2')).toBeVisible();
  });

  // SC-05: Error displayed when backend is unavailable
  test('SC-05: error displayed when backend is unavailable', async ({ page }) => {
    // Intercept all API calls to simulate network failure
    await page.route('**/api/**', (route) => route.abort('connectionrefused'));

    await page.goto('/notes');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.reload();

    // Wait for error to appear
    const alert = page.locator('p[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 15000 });

    // Should contain an error message (use auto-retrying assertion)
    await expect(alert).toContainText(/Ошибка (сети|сервера|авторизации)/);

    // Retry button should be visible
    await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();
  });

  // SC-06: Retry loads notes after backend recovery
  test('SC-06: retry loads notes after simulated recovery', async ({ page }) => {
    // First: block API to simulate backend down
    await page.route('**/api/**', (route) => route.abort('connectionrefused'));

    await page.goto('/notes');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.reload();

    // Error should appear
    const alert = page.locator('p[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();

    // "Recover" backend by removing route interception
    await page.unrouteAll({ behavior: 'ignoreErrors' });

    // Click retry
    await page.getByRole('button', { name: 'Повторить' }).click();

    // Error should disappear and page should load successfully
    await expect(alert).not.toBeVisible({ timeout: 15000 });
  });

  // SC-07: API — get dev token
  test('SC-07: API returns dev token', async ({ request }) => {
    const res = await request.post(`${API_URL}/api/auth/dev-token`, {
      headers: { 'Content-Type': 'application/json' },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('token');
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(0);
  });

  // SC-08: API — notes list without token returns 401
  test('SC-08: API returns 401 without auth token', async ({ request }) => {
    const res = await request.get(`${API_URL}/api/notes`, {
      headers: {},
    });

    expect(res.status()).toBe(401);
  });
});
