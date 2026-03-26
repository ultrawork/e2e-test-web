import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'e2e-test-secret-key-ultrawork';
const API_URL = process.env.API_URL || 'http://localhost:4130';

function generateToken(userId = 'e2e-test-user-001'): string {
  return jwt.sign({ sub: userId, userId }, JWT_SECRET, { expiresIn: '1h' });
}

async function cleanupNotes(request: any, token: string): Promise<void> {
  const res = await request.get(`${API_URL}/api/notes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.ok()) {
    const notes = await res.json();
    for (const note of notes) {
      await request.delete(`${API_URL}/api/notes/${note.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  }
}

test.describe('Notes API Integration', () => {
  let token: string;

  test.beforeEach(async ({ request }) => {
    token = generateToken();
    await cleanupNotes(request, token);
  });

  test.afterEach(async ({ request }) => {
    try {
      await cleanupNotes(request, token);
    } catch {
      // ignore cleanup errors
    }
  });

  test('SC-001: Load notes list with valid token', async ({ page, request }) => {
    // Seed notes via API
    await request.post(`${API_URL}/api/notes`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { title: 'Seeded Note One', content: 'Content one' },
    });
    await request.post(`${API_URL}/api/notes`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { title: 'Seeded Note Two', content: 'Content two' },
    });

    await page.addInitScript((t) => {
      localStorage.setItem('token', t);
    }, token);

    await page.goto('/notes');

    // Wait for loading to finish
    await expect(page.getByText('Загрузка...')).not.toBeVisible({ timeout: 10000 });

    // Notes should be visible
    await expect(page.getByText('Seeded Note One')).toBeVisible();
    await expect(page.getByText('Seeded Note Two')).toBeVisible();
    await expect(page.getByText('Всего заметок: 2')).toBeVisible();

    // No error alerts
    await expect(page.getByRole('alert')).not.toBeVisible();
  });

  test('SC-002: Show error when token is missing', async ({ page }) => {
    // Do NOT set token in localStorage
    await page.addInitScript(() => {
      localStorage.removeItem('token');
    });

    await page.goto('/notes');

    // Should show token-not-found error
    const alert = page.locator('p[role="alert"]').filter({ hasText: 'Токен не найден' });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('Токен не найден');

    // Input and button should be disabled
    await expect(page.getByLabel('New note')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Add' })).toBeDisabled();
  });

  test('SC-003: Show authorization error with invalid token', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('token', 'invalid-token-value');
    });

    await page.goto('/notes');

    // Should show authorization error
    const alert = page.locator('p[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText(/Необходима авторизация|Сохраните токен/i);
  });

  test('SC-004: Show network error when API is unreachable', async ({ page }) => {
    await page.addInitScript((t) => {
      localStorage.setItem('token', t);
    }, token);

    // Block all API requests to simulate network failure
    await page.route('**/api/notes**', (route) => route.abort('connectionrefused'));

    await page.goto('/notes');

    // Should show network error
    const alert = page.locator('p[role="alert"]');
    await expect(alert).toBeVisible({ timeout: 10000 });
    await expect(alert).toContainText(/[Сс]етевая ошибка|подключение/i);
  });

  test('SC-005: Add a new note via UI', async ({ page }) => {
    await page.addInitScript((t) => {
      localStorage.setItem('token', t);
    }, token);

    await page.goto('/notes');
    await expect(page.getByText('Загрузка...')).not.toBeVisible({ timeout: 10000 });

    // Add a note
    await page.getByLabel('New note').fill('Test Note E2E');
    await page.getByRole('button', { name: 'Add' }).click();

    // Note should appear in the list
    await expect(page.getByText('Test Note E2E')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    // Input should be cleared
    await expect(page.getByLabel('New note')).toHaveValue('');

    // No errors
    await expect(page.getByRole('alert')).not.toBeVisible();
  });

  test('SC-006: Delete a note via UI', async ({ page, request }) => {
    // Seed a note
    await request.post(`${API_URL}/api/notes`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { title: 'Note To Delete', content: 'Will be deleted' },
    });

    await page.addInitScript((t) => {
      localStorage.setItem('token', t);
    }, token);

    await page.goto('/notes');
    await expect(page.getByText('Note To Delete')).toBeVisible({ timeout: 10000 });

    // Delete the note
    await page.getByRole('button', { name: 'Delete note: Note To Delete' }).click();

    // Note should disappear
    await expect(page.getByText('Note To Delete')).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });

  test('SC-007: Show error on failed note creation', async ({ page }) => {
    await page.addInitScript((t) => {
      localStorage.setItem('token', t);
    }, token);

    await page.goto('/notes');
    await expect(page.getByText('Загрузка...')).not.toBeVisible({ timeout: 10000 });

    // Intercept POST to simulate server error
    await page.route('**/api/notes', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' }),
        });
      } else {
        await route.fallback();
      }
    });

    await page.getByLabel('New note').fill('Broken Note');
    await page.getByRole('button', { name: 'Add' }).click();

    // Error should be displayed
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 5000 });

    // Note should NOT be in the list
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    // Input should still have the text
    await expect(page.getByLabel('New note')).toHaveValue('Broken Note');
  });

  test('SC-008: Toggle favorite locally without API call', async ({ page }) => {
    // Seed a note
    await page.addInitScript((t) => {
      localStorage.setItem('token', t);
    }, token);

    // Create note via API first
    await page.goto('/notes');
    await expect(page.getByText('Загрузка...')).not.toBeVisible({ timeout: 10000 });

    await page.getByLabel('New note').fill('Favorite Test Note');
    await page.getByRole('button', { name: 'Add' }).click();
    await expect(page.getByText('Favorite Test Note')).toBeVisible({ timeout: 5000 });

    // Find the favorite button by aria-label
    const favButton = page.getByRole('button', { name: 'Toggle favorite: Favorite Test Note' });
    await expect(favButton).toHaveText('☆');

    // Toggle on
    await favButton.click();
    await expect(favButton).toHaveText('★');

    // Click "Только избранные" filter button
    await page.getByRole('button', { name: /Только избранные/ }).click();

    // Favorite note should still be visible
    await expect(page.getByText('Favorite Test Note')).toBeVisible();

    // Toggle off
    await favButton.click();
    await expect(favButton).toHaveText('☆');
  });
});
