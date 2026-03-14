import { test, expect } from '@playwright/test';

test.describe('Notes App', () => {
  test('SC-001: Home page displays heading, welcome text, and link', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Notes App' })).toBeVisible();
    await expect(page.getByText('Welcome to the Notes App. Login or register to get started.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to Notes' })).toBeVisible();
  });

  test('SC-002: Navigate from home to /notes via link', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Go to Notes' }).click();

    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter a note')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });

  test('SC-003: Adding notes increments the counter', async ({ page }) => {
    await page.goto('/notes');

    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    await page.getByLabel('New note').fill('Первая заметка');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Первая заметка')).toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    await page.getByLabel('New note').fill('Вторая заметка');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Вторая заметка')).toBeVisible();
    await expect(page.getByText('Всего заметок: 2')).toBeVisible();
  });

  test('SC-004: Deleting notes decrements the counter', async ({ page }) => {
    await page.goto('/notes');

    await page.getByLabel('New note').fill('Заметка А');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('New note').fill('Заметка Б');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Всего заметок: 2')).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Заметка А' }).click();

    await expect(page.getByText('Заметка А')).not.toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Заметка Б' }).click();

    await expect(page.getByText('Заметка Б')).not.toBeVisible();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });

  test('SC-005: Empty or whitespace input does not add a note', async ({ page }) => {
    await page.goto('/notes');

    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    await page.getByLabel('New note').fill('   ');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });
});
