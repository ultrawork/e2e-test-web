import { test, expect } from '@playwright/test';

// SC-001: Home page — greeting display
test('SC-001: should display welcome heading and message on home page', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Notes App' })).toBeVisible();
  await expect(page.getByText('Welcome to the Notes App. Login or register to get started.')).toBeVisible();
});

// SC-002: Notes page — full list display
test('SC-002: should display notes heading, search input and full list of 5 notes', async ({ page }) => {
  await page.goto('/notes');
  await expect(page.getByRole('heading', { level: 1, name: 'Заметки' })).toBeVisible();

  const searchInput = page.getByLabel('Поиск заметок');
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toHaveAttribute('placeholder', 'Поиск заметок...');
  await expect(searchInput).toHaveAttribute('type', 'search');

  const items = page.getByRole('listitem');
  await expect(items).toHaveCount(5);
  await expect(page.getByText('Покупки')).toBeVisible();
  await expect(page.getByText('Идеи для проекта')).toBeVisible();
  await expect(page.getByText('Заметки с встречи')).toBeVisible();
  await expect(page.getByText('Рецепты')).toBeVisible();
  await expect(page.getByText('Планы на неделю')).toBeVisible();
});

// SC-003: Search notes by title — successful filtering
test('SC-003: should filter notes by exact match, partial match and case-insensitive', async ({ page }) => {
  await page.goto('/notes');
  const searchInput = page.getByLabel('Поиск заметок');

  // Exact match
  await searchInput.fill('Покупки');
  await expect(page.getByRole('listitem')).toHaveCount(1);
  await expect(page.getByText('Покупки')).toBeVisible();

  // Partial match
  await searchInput.fill('ки');
  await expect(page.getByRole('listitem')).toHaveCount(2);
  await expect(page.getByText('Покупки')).toBeVisible();
  await expect(page.getByText('Заметки с встречи')).toBeVisible();

  // Case-insensitive
  await searchInput.fill('рецепты');
  await expect(page.getByRole('listitem')).toHaveCount(1);
  await expect(page.getByText('Рецепты')).toBeVisible();
});

// SC-004: Search notes — no results
test('SC-004: should show empty message when no notes match search query', async ({ page }) => {
  await page.goto('/notes');
  const searchInput = page.getByLabel('Поиск заметок');

  await searchInput.fill('Несуществующая заметка');
  await expect(page.locator('ul')).not.toBeVisible();
  await expect(page.getByText('Заметки не найдены')).toBeVisible();
});

// SC-005: Clear search — restore full list
test('SC-005: should restore full list after clearing search input', async ({ page }) => {
  await page.goto('/notes');
  const searchInput = page.getByLabel('Поиск заметок');

  await searchInput.fill('Покупки');
  await expect(page.getByRole('listitem')).toHaveCount(1);

  await searchInput.fill('');
  await expect(page.getByRole('listitem')).toHaveCount(5);
});
