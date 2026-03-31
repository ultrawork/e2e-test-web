import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-secret-key-ultrawork';

function signToken(sub: string): string {
  return jwt.sign({ sub, email: `${sub}@e2e.test` }, JWT_SECRET, { expiresIn: '1h' });
}

const TOKEN = signToken('e2e-user-v33');
const INVALID_TOKEN = 'invalid.jwt.token-v33';

test.describe('Notes API Integration', () => {
  test('SC-01: redirects to /login when no auth token', async ({ page }) => {
    await page.goto('/notes');
    await expect(page).toHaveURL(/\/login/);
    await page.screenshot({ path: 'screenshots/SC-01-no-token-redirect.png' });
  });

  test('SC-02: displays notes list with valid Bearer token', async ({ page, request }) => {
    const apiUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';

    // Seed a note via API
    const createRes = await request.post(`${apiUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      data: { title: 'Note A v33' },
    });
    expect(createRes.status()).toBeLessThan(400);

    await page.addInitScript((t) => localStorage.setItem('token', t), TOKEN);
    await page.goto('/notes');

    await expect(page.getByText('Note A v33')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/SC-02-notes-list.png' });
  });

  test('SC-03: shows "No notes yet" when list is empty', async ({ page, request }) => {
    // Use a unique user so the list is guaranteed empty
    const uniqueToken = signToken('empty-user-v33');
    const apiUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';

    // Ensure empty: fetch existing notes and delete them
    const listRes = await request.get(`${apiUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${uniqueToken}` },
    });
    if (listRes.ok()) {
      const notes = await listRes.json() as { id: number }[];
      for (const note of notes) {
        await request.delete(`${apiUrl}/api/notes/${note.id}`, {
          headers: { Authorization: `Bearer ${uniqueToken}` },
        });
      }
    }

    await page.addInitScript((t) => localStorage.setItem('token', t), uniqueToken);
    await page.goto('/notes');

    await expect(page.getByText('No notes yet')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/SC-03-empty-state.png' });
  });

  test('SC-04: creates a note via the form', async ({ page }) => {
    const createToken = signToken('create-user-v33');

    await page.addInitScript((t) => localStorage.setItem('token', t), createToken);
    await page.goto('/notes');

    // Wait for loading to finish
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 });

    await page.getByPlaceholder('Enter a note').fill('New note v33');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('New note v33')).toBeVisible({ timeout: 10000 });
    await page.screenshot({ path: 'screenshots/SC-04-create-note.png' });
  });

  test('SC-05: deletes a note via Delete button', async ({ page, request }) => {
    const deleteToken = signToken('delete-user-v33');
    const apiUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';

    // Seed a note
    const createRes = await request.post(`${apiUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${deleteToken}`, 'Content-Type': 'application/json' },
      data: { title: 'Delete me v33' },
    });
    expect(createRes.status()).toBeLessThan(400);

    await page.addInitScript((t) => localStorage.setItem('token', t), deleteToken);
    await page.goto('/notes');

    await expect(page.getByText('Delete me v33')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Delete note: Delete me v33' }).click();
    await expect(page.getByText('Delete me v33')).not.toBeVisible();
    await page.screenshot({ path: 'screenshots/SC-05-delete-note.png' });
  });

  test('SC-06: shows error alert on API failure', async ({ page }) => {
    const errorToken = signToken('error-user-v33');

    await page.addInitScript((t) => localStorage.setItem('token', t), errorToken);

    // Intercept to monitor — if backend returns error, the UI should show role="alert"
    // We use an intentionally malformed API base to trigger a fetch error
    await page.addInitScript(() => {
      // Override fetch to simulate server error for /api/notes only on first call
      const originalFetch = window.fetch;
      let intercepted = false;
      window.fetch = async (input, init) => {
        if (!intercepted && typeof input === 'string' && input.includes('/api/notes') && (!init || init.method === undefined || init.method === 'GET')) {
          intercepted = true;
          return new Response(JSON.stringify({ message: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return originalFetch(input, init);
      };
    });

    await page.goto('/notes');

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('alert')).toContainText('Internal server error');
    await page.screenshot({ path: 'screenshots/SC-06-api-error.png' });
  });

  test('SC-07: 401 response clears token and redirects to /login', async ({ page }) => {
    // Use an invalid token — backend should return 401
    await page.addInitScript((t) => localStorage.setItem('token', t), INVALID_TOKEN);
    await page.goto('/notes');

    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });

    const stored = await page.evaluate(() => localStorage.getItem('token'));
    expect(stored).toBeNull();
    await page.screenshot({ path: 'screenshots/SC-07-401-redirect.png' });
  });

  test('SC-08: outgoing requests include Authorization: Bearer header', async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('token', t), TOKEN);

    const capturedAuth: string[] = [];

    page.on('request', (req) => {
      if (req.url().includes('/api/notes')) {
        const auth = req.headers()['authorization'];
        if (auth) capturedAuth.push(auth);
      }
    });

    await page.goto('/notes');

    // Wait for the notes API request to complete
    await page.waitForResponse((res) => res.url().includes('/api/notes'));

    expect(capturedAuth.length).toBeGreaterThan(0);
    expect(capturedAuth[0]).toBe(`Bearer ${TOKEN}`);
    await page.screenshot({ path: 'screenshots/SC-08-auth-header.png' });
  });
});
