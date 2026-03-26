import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-secret-key-ultrawork';
const API_URL = process.env.API_URL || process.env.BASE_URL || 'http://localhost:4000';

/** Generate a valid JWT token for E2E tests. */
function generateToken(email = 'e2e-test@example.com'): string {
  return jwt.sign({ sub: email, email }, JWT_SECRET, { expiresIn: '1h' });
}

/** Set JWT token in localStorage before page loads. */
async function setToken(page: import('@playwright/test').Page, token: string): Promise<void> {
  await page.addInitScript((t) => {
    localStorage.setItem('token', t);
  }, token);
}

/** Register a test user via the backend API and return credentials. */
async function registerUser(
  request: import('@playwright/test').APIRequestContext,
  email: string,
  password: string,
): Promise<void> {
  await request.post(`${API_URL}/api/auth/register`, {
    data: { email, password },
  });
}

test.describe('Auth Scenarios (web-auth.md)', () => {
  test('SC-001: Successful login via form', async ({ page, request }) => {
    const email = `e2e-login-${Date.now()}@test.com`;
    const password = 'TestPass123!';

    // Register user via API first
    await registerUser(request, email, password);

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

    await page.locator('#email').fill(email);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: 'Log in' }).click();

    // Should redirect to /notes after successful login
    await expect(page).toHaveURL(/\/notes/, { timeout: 10000 });
    // Should show Notes heading (not auth wall)
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    // Should NOT show auth wall
    await expect(page.getByText('Authorization required')).not.toBeVisible();
  });

  test('SC-002: Login error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.locator('#email').fill('nonexistent@test.com');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Log in' }).click();

    // Should show error alert
    await expect(page.locator('p[role="alert"]')).toContainText('Invalid credentials');
    // Should NOT redirect to /notes
    await expect(page).toHaveURL(/\/login/);
    // Form should still be accessible
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('SC-003: Auto-redirect from /login when token exists', async ({ page }) => {
    const token = generateToken();
    await setToken(page, token);

    await page.goto('/login');

    // Should redirect to /notes automatically
    await expect(page).toHaveURL(/\/notes/, { timeout: 10000 });
  });

  test('SC-004: Logout clears token and redirects to /login', async ({ page }) => {
    const token = generateToken();
    await setToken(page, token);

    // Mock GET /api/notes to avoid backend dependency for logout test
    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      }
      return route.continue();
    });

    await page.goto('/notes');
    await expect(page.getByRole('button', { name: 'Log out' })).toBeVisible();

    await page.getByRole('button', { name: 'Log out' }).click();

    // Should redirect to /login
    await expect(page).toHaveURL(/\/login/);
    // Token should be cleared
    const tokenValue = await page.evaluate(() => localStorage.getItem('token'));
    expect(tokenValue).toBeNull();
  });
});

test.describe('Notes Scenarios (web-notes.md)', () => {
  test('SC-005: Auth wall — /notes without token', async ({ page }) => {
    await page.goto('/notes');

    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    await expect(page.getByText('Authorization required')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();

    // Form and actions should NOT be visible
    await expect(page.locator('#note-title')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Log out' })).not.toBeVisible();
  });

  test('SC-006: Create and delete note via API', async ({ page, request }) => {
    const email = `e2e-crud-${Date.now()}@test.com`;
    const password = 'TestPass123!';

    // Register and login to get a real token
    await registerUser(request, email, password);
    const loginRes = await request.post(`${API_URL}/api/auth/login`, {
      data: { email, password },
    });
    const { token } = await loginRes.json();
    await setToken(page, token);

    await page.goto('/notes');
    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();

    // Wait for loading to finish
    await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 10000 });

    // Create a note
    const noteTitle = `E2E Note ${Date.now()}`;
    await page.locator('#note-title').fill(noteTitle);
    await page.locator('#note-content').fill('E2E test content');
    await page.getByRole('button', { name: 'Add' }).click();

    // Note should appear in the list
    await expect(page.getByText(noteTitle)).toBeVisible({ timeout: 10000 });

    // Delete the note
    await page.getByRole('button', { name: `Delete note: ${noteTitle}` }).click();

    // Note should disappear
    await expect(page.getByText(noteTitle)).not.toBeVisible({ timeout: 10000 });
  });

  test('SC-007: Toggle favorite and favorites filter', async ({ page, request }) => {
    const email = `e2e-fav-${Date.now()}@test.com`;
    const password = 'TestPass123!';

    // Register, login, and create two notes via API
    await registerUser(request, email, password);
    const loginRes = await request.post(`${API_URL}/api/auth/login`, {
      data: { email, password },
    });
    const { token } = await loginRes.json();

    const noteATitle = `Note A ${Date.now()}`;
    const noteBTitle = `Note B ${Date.now()}`;

    await request.post(`${API_URL}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: noteATitle, content: 'Content A' },
    });
    await request.post(`${API_URL}/api/notes`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { title: noteBTitle, content: 'Content B' },
    });

    await setToken(page, token);
    await page.goto('/notes');

    // Wait for both notes to appear
    await expect(page.getByText(noteATitle)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(noteBTitle)).toBeVisible();

    // Find the favorite button for Note A (it's in the same list item)
    const noteAItem = page.locator('li').filter({ hasText: noteATitle });
    const favBtnA = noteAItem.getByRole('button', { name: 'Toggle favorite' });

    // Initially unfavorited (☆)
    await expect(favBtnA).toHaveText('☆');

    // Toggle favorite
    await favBtnA.click();
    await expect(favBtnA).toHaveText('★', { timeout: 5000 });

    // Click "Favorites only" filter
    await page.getByRole('button', { name: 'Favorites only' }).click();

    // Only Note A should be visible
    await expect(page.getByText(noteATitle)).toBeVisible();
    await expect(page.getByText(noteBTitle)).not.toBeVisible();

    // Unclick filter to show all
    await page.getByRole('button', { name: 'Favorites only' }).click();
    await expect(page.getByText(noteATitle)).toBeVisible();
    await expect(page.getByText(noteBTitle)).toBeVisible();

    // Cleanup: delete both notes
    for (const title of [noteATitle, noteBTitle]) {
      await page.getByRole('button', { name: `Delete note: ${title}` }).click();
      await expect(page.getByText(title)).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('SC-008: 5xx error shows error state and 401 redirects to login', async ({ page }) => {
    const token = generateToken();

    // --- Part 1: 5xx error state ---
    await setToken(page, token);
    await page.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: '{"error":"Internal Server Error"}',
        });
      }
      return route.continue();
    });

    await page.goto('/notes');

    // Should show error alert
    await expect(page.getByText('Failed to load notes. Please try again later.')).toBeVisible();
    // Should show Refresh button
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
    // Form should NOT be visible
    await expect(page.locator('#note-title')).not.toBeVisible();

    // --- Part 2: 401 redirects to login ---
    // Clear routes and set up 401
    await page.unrouteAll();

    // Use a new page context to test 401 behavior
    const page2 = await page.context().newPage();
    await page2.addInitScript((t) => {
      localStorage.setItem('token', t);
    }, token);
    await page2.route('**/api/notes', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"Unauthorized"}' });
      }
      return route.continue();
    });

    await page2.goto('/notes');

    // 401 should trigger redirect to /login (via window.location.href in api.ts)
    await expect(page2).toHaveURL(/\/login/, { timeout: 10000 });
    // Token should be cleared
    const tokenValue = await page2.evaluate(() => localStorage.getItem('token'));
    expect(tokenValue).toBeNull();

    await page2.close();
  });
});
