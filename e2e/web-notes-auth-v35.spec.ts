import { test, expect } from '@playwright/test';
import * as crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-secret-key-ultrawork';

function signJWT(payload: Record<string, unknown>): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const b64url = (s: string) => Buffer.from(s).toString('base64url');
  const h = b64url(JSON.stringify(header));
  const p = b64url(JSON.stringify(payload));
  const sig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${h}.${p}`)
    .digest('base64url');
  return `${h}.${p}.${sig}`;
}

const TOKEN = signJWT({
  sub: 'test-user-v35',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
});

const API_BASE = process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';

function authHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  };
}

test.describe('Web: /notes Authorization v35', () => {
  test('SC-001: redirects to /login when no auth token', async ({ page }) => {
    await page.goto('/notes');
    await expect(page).toHaveURL(/\/login/);
    await page.screenshot({ path: 'screenshots/SC-001-redirect-no-token.png' });
  });

  test('SC-002: GET /api/notes with Bearer token renders notes list', async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('token', t), TOKEN);

    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 1, title: 'Note A v35' },
            { id: 2, title: 'Note B v35' },
          ]),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/notes');

    await expect(page.getByText('Note A v35')).toBeVisible();
    await expect(page.getByText('Note B v35')).toBeVisible();
    await page.screenshot({ path: 'screenshots/SC-002-notes-list.png' });
  });

  test('SC-003: POST /api/notes creates note via UI form', async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('token', t), TOKEN);

    const notes: { id: number; title: string }[] = [{ id: 1, title: 'Existing v35' }];

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
        const created = { id: Date.now(), title: body.title };
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
    await page.getByPlaceholder('Enter a note').fill('New v35 note');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('New v35 note')).toBeVisible();
    await page.screenshot({ path: 'screenshots/SC-003-post-note.png' });
  });

  test('SC-004: DELETE note via UI button', async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem('token', t), TOKEN);

    const notes: { id: number; title: string }[] = [{ id: 1, title: 'Delete me v35' }];

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
        notes.splice(0, 1);
        route.fulfill({ status: 204, body: '' });
      } else {
        route.continue();
      }
    });

    await page.goto('/notes');
    await expect(page.getByText('Delete me v35')).toBeVisible();
    await page.getByRole('button', { name: 'Delete note: Delete me v35' }).click();
    await expect(page.getByText('Delete me v35')).not.toBeVisible();
    await page.screenshot({ path: 'screenshots/SC-004-delete-note.png' });
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

    await page.goto('/notes');
    await page.waitForTimeout(2000);

    expect(capturedAuth.length).toBeGreaterThan(0);
    expect(capturedAuth[0]).toBe(`Bearer ${TOKEN}`);
    await page.screenshot({ path: 'screenshots/SC-005-auth-header.png' });
  });

  test('SC-006: 401 response clears token and redirects to /login', async ({ page }) => {
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
