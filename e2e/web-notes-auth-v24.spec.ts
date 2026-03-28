import { test, expect } from '@playwright/test';

test.describe('Web Notes v24 — верификация /notes page', () => {
  test('SC-001: /notes page renders initial state correctly', async ({ page }) => {
    await page.goto('/notes');

    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    await expect(page.getByLabel('New note')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
    await expect(page.getByPlaceholder('Поиск заметок...')).toBeVisible();
  });

  test('SC-002: Adding note via Enter key submits form', async ({ page }) => {
    await page.goto('/notes');

    await page.getByLabel('New note').fill('Заметка через Enter');
    await page.getByLabel('New note').press('Enter');

    await expect(page.getByText('Заметка через Enter')).toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();
  });

  test('SC-003: Input field clears after adding a note', async ({ page }) => {
    await page.goto('/notes');

    await page.getByLabel('New note').fill('Тестовая заметка v24');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Тестовая заметка v24')).toBeVisible();
    await expect(page.getByLabel('New note')).toHaveValue('');
  });

  test('SC-004: Delete specific note preserves other notes', async ({ page }) => {
    await page.goto('/notes');

    await page.getByLabel('New note').fill('Первая заметка v24');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('New note').fill('Вторая заметка v24');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('New note').fill('Третья заметка v24');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Всего заметок: 3')).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Вторая заметка v24' }).click();

    await expect(page.getByText('Вторая заметка v24')).not.toBeVisible();
    await expect(page.getByText('Первая заметка v24')).toBeVisible();
    await expect(page.getByText('Третья заметка v24')).toBeVisible();
    await expect(page.getByText('Всего заметок: 2')).toBeVisible();
  });

  test('SC-005: Search + delete interaction updates counter correctly', async ({ page }) => {
    await page.goto('/notes');

    await page.getByLabel('New note').fill('Купить молоко');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('New note').fill('Купить хлеб');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('New note').fill('Позвонить врачу');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Всего заметок: 3')).toBeVisible();

    await page.getByPlaceholder('Поиск заметок...').fill('Купить');

    await expect(page.getByText('Найдено: 2 из 3')).toBeVisible();
    await expect(page.getByText('Позвонить врачу')).not.toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Купить молоко' }).click();

    await expect(page.getByText('Купить молоко')).not.toBeVisible();
    await expect(page.getByText('Найдено: 1 из 2')).toBeVisible();
  });

  test('SC-006: Each note has a working delete button with correct aria-label', async ({ page }) => {
    await page.goto('/notes');

    await page.getByLabel('New note').fill('Заметка Alpha');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByLabel('New note').fill('Заметка Beta');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByRole('button', { name: 'Delete note: Заметка Alpha' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete note: Заметка Beta' })).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Заметка Alpha' }).click();

    await expect(page.getByRole('button', { name: 'Delete note: Заметка Alpha' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Delete note: Заметка Beta' })).toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();
  });
});
