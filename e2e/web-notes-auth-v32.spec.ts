import { test, expect } from '@playwright/test';

const TOKEN = 'test-token-v32';

interface Note {
  id: number;
  title: string;
}

const SEED_NOTES: Note[] = [
  { id: 1, title: 'Note A v32' },
  { id: 2, title: 'Note B v32' },
];

test.describe('Web: /notes Authorization v32', () => {
  test('SC-001: redirects to /login when no auth token', async ({ page }) => {
    await page.route('**/api/notes', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' }),
      }),
    );

    await page.goto('/notes');
    await expect(page).toHaveURL(/\/login/);
    await page.screenshot({ path: 'screenshots/SC-001-redirect-no-token-v32.png' });
  });

  test('SC-002: GET /api/notes with Bearer token renders notes list', async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('token', t), TOKEN);

    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(SEED_NOTES),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/notes');

    await expect(page.getByText('Note A v32')).toBeVisible();
    await expect(page.getByText('Note B v32')).toBeVisible();
    await page.screenshot({ path: 'screenshots/SC-002-notes-list-v32.png' });
  });

  test('SC-003: POST /api/notes stateful mock with Authorization Bearer', async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('token', t), TOKEN);

    const notes: Note[] = [{ id: 1, title: 'Existing v32' }];

    await page.route('**/api/notes', (route) => {
      const req = route.request();
      if (req.method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(notes),
        });
      } else if (req.method() === 'POST') {
        const body = req.postDataJSON() as { title: string };
        const created: Note = { id: Date.now(), title: body.title };
        notes.push(created);
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/notes');
    await page.getByPlaceholder('Enter a note').fill('New v32 note');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('New v32 note')).toBeVisible();
    await page.screenshot({ path: 'screenshots/SC-003-post-note-v32.png' });
  });

  test('SC-004: DELETE note with Authorization Bearer', async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('token', t), TOKEN);

    const notes: Note[] = [{ id: 1, title: 'Delete me v32' }];

    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(notes),
        });
      } else {
        route.continue();
      }
    });

    await page.route('**/api/notes/*', (route) => {
      if (route.request().method() === 'DELETE') {
        const url = route.request().url();
        const id = Number(url.split('/').pop());
        const idx = notes.findIndex((n) => n.id === id);
        if (idx !== -1) notes.splice(idx, 1);
        route.fulfill({ status: 204, body: '' });
      } else {
        route.continue();
      }
    });

    await page.goto('/notes');
    await expect(page.getByText('Delete me v32')).toBeVisible();
    await page.getByRole('button', { name: 'Delete note: Delete me v32' }).click();
    await expect(page.getByText('Delete me v32')).not.toBeVisible();
    await page.screenshot({ path: 'screenshots/SC-004-delete-note-v32.png' });
  });

  test('SC-005: outgoing requests include Authorization: Bearer token', async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('token', t), TOKEN);

    const capturedAuth: string[] = [];

    page.on('request', (req) => {
      if (req.url().includes('/api/notes')) {
        const auth = req.headers()['authorization'];
        if (auth) capturedAuth.push(auth);
      }
    });

    await page.route('**/api/notes', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(SEED_NOTES),
      }),
    );

    await page.goto('/notes');
    await expect(page.getByText('Note A v32')).toBeVisible();

    expect(capturedAuth.length).toBeGreaterThan(0);
    expect(capturedAuth[0]).toBe(`Bearer ${TOKEN}`);
    await page.screenshot({ path: 'screenshots/SC-005-auth-header-v32.png' });
  });

  test('SC-006: 401 response clears token and redirects to /login', async ({ page }) => {
    await page.route('**/api/notes', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' }),
      }),
    );

    await page.goto('/login');
    await page.evaluate((t) => localStorage.setItem('token', t), TOKEN);
    await page.goto('/notes');

    await expect(page).toHaveURL(/\/login/);

    const stored = await page.evaluate(() => localStorage.getItem('token'));
    expect(stored).toBeNull();
    await page.screenshot({ path: 'screenshots/SC-006-401-redirect-v32.png' });
  });
});
