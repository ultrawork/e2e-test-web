import { test, expect } from '@playwright/test';

test.describe('Notes — авторизация и API-интеграция', () => {
  test('SC-001: Auth gate — без токена показывает гейт авторизации', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });

    await page.goto('/notes');

    // No token → auth gate UI shown (not redirect)
    await expect(page.getByText('Необходима авторизация')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Войти' })).toHaveAttribute('href', '/login');
    // Notes form should not be visible
    await expect(page.locator('#new-note')).not.toBeVisible();
  });

  test('SC-002: Auth gate — с токеном страница загружается', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token');
    });

    await page.route(/\/api\/notes$/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/notes');

    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    // URL stays on /notes, no redirect to /login
    expect(page.url()).toContain('/notes');
  });

  test('SC-003: GET /api/notes — Authorization: Bearer header', async ({ page }) => {
    let capturedAuthHeader: string | null = null;

    await page.addInitScript(() => {
      localStorage.setItem('token', 'my-secret-token');
    });

    await page.route(/\/api\/notes$/, async (route) => {
      if (route.request().method() === 'GET') {
        capturedAuthHeader = route.request().headers()['authorization'] ?? null;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: '1', text: 'Test note', createdAt: '2026-01-01T00:00:00Z' },
          ]),
        });
      } else {
        await route.continue();
      }
    });

    await Promise.all([
      page.waitForResponse(/\/api\/notes$/),
      page.goto('/notes'),
    ]);

    await expect(page.getByText('Test note')).toBeVisible();
    expect(capturedAuthHeader).toBe('Bearer my-secret-token');
  });

  test('SC-004: POST /api/notes — Authorization: Bearer header при создании', async ({ page }) => {
    let postAuthHeader: string | null = null;
    const notes: { id: string; text: string; createdAt: string }[] = [];

    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token-v25');
    });

    await page.route(/\/api\/notes$/, async (route) => {
      const method = route.request().method();

      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(notes),
        });
      } else if (method === 'POST') {
        postAuthHeader = route.request().headers()['authorization'] ?? null;
        const newNote = {
          id: '2',
          text: 'New note v25',
          createdAt: '2026-01-01T00:00:00Z',
        };
        notes.push(newNote);
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newNote),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/notes');
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    await page.locator('#new-note').fill('New note v25');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('New note v25')).toBeVisible();
    expect(postAuthHeader).toBe('Bearer test-token-v25');
  });

  test('SC-005: DELETE /api/notes/:id — Authorization: Bearer header при удалении', async ({ page }) => {
    let deleteAuthHeader: string | null = null;
    const notes = [
      { id: '1', text: 'Note to delete', createdAt: '2026-01-01T00:00:00Z' },
    ];

    await page.addInitScript(() => {
      localStorage.setItem('token', 'test-token-v25');
    });

    await page.route(/\/api\/notes$/, async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(notes),
        });
      } else {
        await route.continue();
      }
    });

    await page.route(/\/api\/notes\/[\w-]+/, async (route) => {
      if (route.request().method() === 'DELETE') {
        deleteAuthHeader = route.request().headers()['authorization'] ?? null;
        const url = route.request().url();
        const id = url.split('/').pop();
        const idx = notes.findIndex((n) => n.id === id);
        if (idx !== -1) notes.splice(idx, 1);
        await route.fulfill({ status: 204 });
      } else {
        await route.continue();
      }
    });

    await page.goto('/notes');
    await expect(page.getByText('Note to delete')).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Note to delete' }).click();

    await expect(page.getByText('Note to delete')).not.toBeVisible();
    expect(deleteAuthHeader).toBe('Bearer test-token-v25');
  });

  test('SC-006: 401 от API — clearToken + редирект на /login', async ({ page }) => {
    await page.addInitScript(() => {
      if (window.location.pathname !== '/login') {
        localStorage.setItem('token', 'expired-token');
      }
    });

    await page.route(/\/api\/notes$/, async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    await Promise.all([
      page.waitForResponse(/\/api\/notes$/),
      page.goto('/notes'),
    ]);

    await page.waitForURL(/\/login/, { timeout: 10000 });

    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeNull();
  });
});
