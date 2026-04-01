import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-secret-key-ultrawork';

function generateToken(payload: Record<string, unknown> = { sub: 'e2e-test-user-v35' }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

function getApiUrl(): string {
  return process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';
}

test.describe('Web: /notes Authorization v35', () => {
  test('SC-001: redirects to /login when no auth token', async ({ page }) => {
    // Ensure no token is set
    await page.addInitScript(() => localStorage.removeItem('token'));

    await page.goto('/notes');
    await expect(page).toHaveURL(/\/login/);
    await page.screenshot({ path: 'screenshots/SC-001-redirect-no-token.png' });
  });

  test('SC-002: GET /api/notes with Bearer token renders notes list', async ({ page, request }) => {
    const token = generateToken();
    const apiUrl = getApiUrl();

    // Seed notes via real API
    const res1 = await request.post(`${apiUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { title: 'Note A v35' },
    });
    const res2 = await request.post(`${apiUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { title: 'Note B v35' },
    });
    const note1 = await res1.json();
    const note2 = await res2.json();

    // Set token and navigate
    await page.addInitScript((t) => localStorage.setItem('token', t), token);
    await page.goto('/notes');

    await expect(page.getByText('Note A v35')).toBeVisible();
    await expect(page.getByText('Note B v35')).toBeVisible();
    await page.screenshot({ path: 'screenshots/SC-002-notes-list.png' });

    // Cleanup
    await request.delete(`${apiUrl}/api/notes/${note1.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await request.delete(`${apiUrl}/api/notes/${note2.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  });

  test('SC-003: POST /api/notes creates a new note via UI', async ({ page, request }) => {
    const token = generateToken();
    await page.addInitScript((t) => localStorage.setItem('token', t), token);

    await page.goto('/notes');
    await page.getByPlaceholder('Enter a note').fill('New v35 note');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('New v35 note')).toBeVisible();
    await page.screenshot({ path: 'screenshots/SC-003-post-note.png' });

    // Cleanup: find and delete the created note via API
    const apiUrl = getApiUrl();
    const listRes = await request.get(`${apiUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const notes = await listRes.json();
    for (const n of notes) {
      if (n.title === 'New v35 note') {
        await request.delete(`${apiUrl}/api/notes/${n.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    }
  });

  test('SC-004: DELETE note with Authorization Bearer via UI', async ({ page, request }) => {
    const token = generateToken();
    const apiUrl = getApiUrl();

    // Create a note to delete
    const createRes = await request.post(`${apiUrl}/api/notes`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { title: 'Delete me v35' },
    });
    expect(createRes.ok()).toBeTruthy();

    await page.addInitScript((t) => localStorage.setItem('token', t), token);
    await page.goto('/notes');

    await expect(page.getByText('Delete me v35')).toBeVisible();
    await page.getByRole('button', { name: 'Delete note: Delete me v35' }).click();
    await expect(page.getByText('Delete me v35')).not.toBeVisible();
    await page.screenshot({ path: 'screenshots/SC-004-delete-note.png' });
  });

  test('SC-005: outgoing requests include Authorization: Bearer token', async ({ page }) => {
    const token = generateToken();
    await page.addInitScript((t) => localStorage.setItem('token', t), token);

    const capturedAuth: string[] = [];

    page.on('request', (req) => {
      if (req.url().includes('/api/notes')) {
        const auth = req.headers()['authorization'];
        if (auth) capturedAuth.push(auth);
      }
    });

    await page.goto('/notes');
    // Wait for notes page to load (heading visible means fetch completed)
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    // Give a moment for any pending requests
    await page.waitForLoadState('networkidle');

    expect(capturedAuth.length).toBeGreaterThan(0);
    expect(capturedAuth[0]).toBe(`Bearer ${token}`);
    await page.screenshot({ path: 'screenshots/SC-005-auth-header.png' });
  });

  test('SC-006: 401 response clears token and redirects to /login', async ({ page }) => {
    // Use an invalid token that will cause backend to return 401
    const invalidToken = 'invalid-expired-token-v35';

    await page.goto('/login');
    await page.evaluate((t) => localStorage.setItem('token', t), invalidToken);
    await page.goto('/notes');

    await expect(page).toHaveURL(/\/login/);

    const stored = await page.evaluate(() => localStorage.getItem('token'));
    expect(stored).toBeNull();
    await page.screenshot({ path: 'screenshots/SC-006-401-redirect.png' });
  });
});
