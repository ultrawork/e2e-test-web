import { test, expect } from '@playwright/test';

const DATE_PATTERN = /^\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}$/;

test.describe('Web Notes', () => {
  test('SC-015: should display current date on create note page', async ({ page }) => {
    await page.goto('/notes/create');
    await expect(page.getByRole('heading', { name: 'Create Note' })).toBeVisible();

    // The CreatedDate component renders current date in a <p> with gray color
    const dateElement = page.locator('p').filter({ hasText: DATE_PATTERN });
    await expect(dateElement).toBeVisible({ timeout: 5000 });
    const dateText = await dateElement.textContent();
    expect(dateText).toMatch(DATE_PATTERN);

    // Fill and submit form
    await page.getByLabel('Title').fill('Первая заметка');
    await page.getByLabel('Content').fill('Содержимое первой заметки');
    await page.getByRole('button', { name: 'Create' }).click();

    // Should redirect after save
    await expect(page).not.toHaveURL(/\/notes\/create/);
  });

  test('SC-016: should display stored date on edit note page', async ({ page, request }) => {
    const apiUrl = process.env.API_URL || process.env.BASE_URL || 'http://localhost:3000';

    // Create a note via API to have a known createdAt
    const createResponse = await request.post(`${apiUrl}/api/notes`, {
      data: { title: 'Edit Test Note', content: 'Some content' },
    });
    const note = await createResponse.json();
    const noteId = note.id;

    // Visit edit page
    await page.goto(`/notes/edit/${noteId}`);
    await expect(page.getByRole('heading', { name: 'Edit Note' })).toBeVisible();

    // Date should be displayed
    const dateElement = page.locator('p').filter({ hasText: DATE_PATTERN });
    await expect(dateElement).toBeVisible({ timeout: 5000 });
    const dateText = await dateElement.textContent();
    expect(dateText).toMatch(DATE_PATTERN);

    // Edit and save
    await page.getByLabel('Title').fill('Обновлённая заметка');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page).not.toHaveURL(/\/notes\/edit/);

    // Reopen and verify date unchanged
    await page.goto(`/notes/edit/${noteId}`);
    const dateElementAfter = page.locator('p').filter({ hasText: DATE_PATTERN });
    await expect(dateElementAfter).toBeVisible({ timeout: 5000 });
    const dateTextAfter = await dateElementAfter.textContent();
    expect(dateTextAfter).toBe(dateText);
  });

  test('SC-017: should display notes list', async ({ page }) => {
    await page.goto('/notes');
    await expect(page).toHaveURL(/\/notes/);
    // Verify list loads without errors
    await expect(page.locator('main')).toBeVisible();
  });

  test('SC-018: should delete a note from list', async ({ page }) => {
    await page.goto('/notes');
    const notesBefore = await page.locator('[data-testid="note-item"]').count();

    // Click delete on first note
    const deleteButton = page.getByRole('button', { name: /delete/i }).first();
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      const notesAfter = await page.locator('[data-testid="note-item"]').count();
      expect(notesAfter).toBeLessThan(notesBefore);
    }
  });

  test('SC-019: should not create note with empty title', async ({ page }) => {
    await page.goto('/notes/create');
    // Leave title empty, fill content
    await page.getByLabel('Content').fill('Заметка без заголовка');
    await page.getByRole('button', { name: 'Create' }).click();

    // The title field has required attribute — form should not submit
    // We should still be on the create page
    await expect(page).toHaveURL(/\/notes\/create/);
  });
});
