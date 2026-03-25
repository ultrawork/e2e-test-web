import { test, expect } from '@playwright/test';

const apiUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';

/**
 * Helper: log in via the /login page UI flow.
 * After this, the browser has a valid token in localStorage and is on /notes.
 */
async function loginViaUI(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL('**/notes');
  await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
}

/**
 * Helper: obtain a dev-token directly from the backend API.
 */
async function getDevToken(request: import('@playwright/test').APIRequestContext): Promise<string> {
  const res = await request.post(`${apiUrl}/api/auth/dev-token`, {
    headers: { 'Content-Type': 'application/json' },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.token;
}

// ── UI Tests ──────────────────────────────────────────────────────────────

test.describe('Notes API Integration — UI', () => {
  test('SC-LOGIN: Login page redirects to /notes after obtaining token', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
    await page.getByRole('button', { name: 'Войти' }).click();
    await page.waitForURL('**/notes');
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
  });

  test('SC-UNAUTH: Accessing /notes without token redirects to /login', async ({ page }) => {
    // Ensure no token in localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('token'));
    await page.goto('/notes');
    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();
  });

  test('SC-001: Notes load from backend on page open', async ({ page, request }) => {
    // Obtain token via API to avoid dependency on login page rendering
    const token = await getDevToken(request);
    await page.goto('/');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.goto('/notes');

    // After login, notes page is displayed with counter
    await expect(page.getByText(/Всего заметок: \d+/)).toBeVisible();
    // The heading is present and loading is done
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
  });

  test('SC-002: Create a note via the form', async ({ page, request }) => {
    // Obtain token via API to avoid dependency on login page rendering
    const token = await getDevToken(request);
    await page.goto('/');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.goto('/notes');
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();

    // Get initial count
    const counterText = await page.getByText(/Всего заметок: \d+/).textContent();
    const initialCount = parseInt(counterText!.match(/\d+/)![0], 10);

    // Fill and submit
    await page.getByLabel('New note').fill('Test note from E2E');
    await page.getByRole('button', { name: 'Add' }).click();

    // Verify note appears
    await expect(page.getByText('Test note from E2E')).toBeVisible();
    await expect(page.getByText(`Всего заметок: ${initialCount + 1}`)).toBeVisible();

    // Input should be cleared
    await expect(page.getByLabel('New note')).toHaveValue('');

    // No error alert
    await expect(page.getByRole('alert')).not.toBeVisible();
  });

  test('SC-003: Delete a note via Delete button', async ({ page, request }) => {
    // Obtain token via API to avoid dependency on login page rendering
    const token = await getDevToken(request);
    await page.goto('/');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.goto('/notes');
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();

    // Create a note to ensure we have one to delete
    const noteTitle = 'Note to delete E2E';
    await page.getByLabel('New note').fill(noteTitle);
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText(noteTitle)).toBeVisible();

    // Get count before deletion
    const counterText = await page.getByText(/Всего заметок: \d+/).textContent();
    const countBefore = parseInt(counterText!.match(/\d+/)![0], 10);

    // Delete the note
    await page.getByRole('button', { name: `Delete note: ${noteTitle}` }).click();

    // Note should disappear
    await expect(page.getByText(noteTitle)).not.toBeVisible();
    await expect(page.getByText(`Всего заметок: ${countBefore - 1}`)).toBeVisible();
    await expect(page.getByRole('alert')).not.toBeVisible();
  });

  test('SC-004: Filter notes via search bar', async ({ page, request }) => {
    // Obtain token via API to avoid dependency on login page rendering
    const token = await getDevToken(request);
    await page.goto('/');
    await page.evaluate((t) => localStorage.setItem('token', t), token);
    await page.goto('/notes');
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();

    // Create two notes with distinct titles
    await page.getByLabel('New note').fill('Alpha unique note');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Alpha unique note')).toBeVisible();

    await page.getByLabel('New note').fill('Beta unique note');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Beta unique note')).toBeVisible();

    // Search for "Alpha"
    await page.getByPlaceholder('Поиск заметок...').fill('Alpha unique');
    await expect(page.getByText('Alpha unique note')).toBeVisible();
    await expect(page.getByText('Beta unique note')).not.toBeVisible();
    await expect(page.getByText(/Найдено: \d+ из \d+/)).toBeVisible();

    // Clear search
    await page.getByRole('button', { name: 'Очистить поиск' }).click();
    await expect(page.getByText('Alpha unique note')).toBeVisible();
    await expect(page.getByText('Beta unique note')).toBeVisible();
    await expect(page.getByText(/Всего заметок: \d+/)).toBeVisible();
  });

  test('SC-LOGOUT: Logout clears token and redirects to /login', async ({ page }) => {
    await loginViaUI(page);
    await page.getByRole('button', { name: 'Выйти' }).click();
    await page.waitForURL('**/login');
    await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();

    // Token should be cleared
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});

// ── API Tests ─────────────────────────────────────────────────────────────

test.describe('Notes API Integration — API', () => {
  test('SC-006: GET /api/notes returns a list of notes', async ({ request }) => {
    const token = await getDevToken(request);

    const res = await request.get(`${apiUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);

    if (body.length > 0) {
      expect(typeof body[0].id).toBe('string');
      expect(typeof body[0].title).toBe('string');
      expect(body[0]).toHaveProperty('content');
    }
  });

  test('SC-007: POST /api/notes creates a note and GET returns it', async ({ request }) => {
    const token = await getDevToken(request);

    const createRes = await request.post(`${apiUrl}/api/notes`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: { title: 'E2E API test note', content: 'Test content for E2E' },
    });

    expect(createRes.status()).toBe(201);
    const created = await createRes.json();
    expect(created.title).toBe('E2E API test note');
    expect(typeof created.id).toBe('string');

    // Verify it appears in GET
    const listRes = await request.get(`${apiUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const notes = await listRes.json();
    const found = notes.find((n: { id: string }) => n.id === created.id);
    expect(found).toBeTruthy();
    expect(found.title).toBe('E2E API test note');
  });
});
