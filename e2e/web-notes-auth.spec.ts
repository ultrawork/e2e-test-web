import { test, expect } from '@playwright/test';

/**
 * Web v23: E2E-верификация /notes против backend.
 *
 * SC-v23-01: Без токена — страница /notes доступна (auth gate не реализован).
 * SC-v23-02: Интерфейс заметок — заголовок, форма, кнопка, счётчик.
 * SC-v23-03: Создание заметки увеличивает счётчик на 1.
 * SC-v23-04: Удаление заметки уменьшает счётчик на 1.
 */
test.describe('Web v23: Notes Auth E2E', () => {
  test('SC-v23-01: без токена страница /notes доступна', async ({ page }) => {
    await page.goto('/notes');

    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter a note')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
  });

  test('SC-v23-02: интерфейс заметок отображает список, форму и счётчик', async ({ page }) => {
    await page.goto('/notes');

    await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter a note')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });

  test('SC-v23-03: создание заметки увеличивает счётчик', async ({ page }) => {
    await page.goto('/notes');

    await expect(page.getByText('Всего заметок: 0')).toBeVisible();

    await page.getByPlaceholder('Enter a note').fill('E2E тест v23');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('E2E тест v23')).toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    await page.getByPlaceholder('Enter a note').fill('Вторая заметка v23');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Вторая заметка v23')).toBeVisible();
    await expect(page.getByText('Всего заметок: 2')).toBeVisible();
  });

  test('SC-v23-04: удаление заметки уменьшает счётчик', async ({ page }) => {
    await page.goto('/notes');

    await page.getByPlaceholder('Enter a note').fill('Заметка для удаления v23');
    await page.getByRole('button', { name: 'Add' }).click();

    await page.getByPlaceholder('Enter a note').fill('Остаётся v23');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('Всего заметок: 2')).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Заметка для удаления v23' }).click();

    await expect(page.getByText('Заметка для удаления v23')).not.toBeVisible();
    await expect(page.getByText('Всего заметок: 1')).toBeVisible();

    await page.getByRole('button', { name: 'Delete note: Остаётся v23' }).click();

    await expect(page.getByText('Остаётся v23')).not.toBeVisible();
    await expect(page.getByText('Всего заметок: 0')).toBeVisible();
  });
});
