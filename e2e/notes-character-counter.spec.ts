import { test, expect } from '@playwright/test';

test.describe('Notes App - Character Counter', () => {
  // SC-101: Load home page
  test('SC-101: should load the home page with heading and welcome text', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: 'Notes App' })).toBeVisible();
    await expect(page.getByText('Welcome to the Notes App')).toBeVisible();
  });

  // SC-102: Create note page - form elements and initial counter state
  test('SC-102: should display form elements and initial counter showing 0 символов', async ({ page }) => {
    await page.goto('/notes/create');

    const titleInput = page.getByLabel('Заголовок');
    const contentTextarea = page.getByLabel('Текст заметки');
    const counter = page.getByText('0 символов');

    await expect(titleInput).toBeVisible();
    await expect(contentTextarea).toBeVisible();
    await expect(counter).toBeVisible();
    await expect(titleInput).toHaveValue('');
    await expect(contentTextarea).toHaveValue('');
  });

  // SC-103: Character counter updates in real time
  test('SC-103: should update character counter in real time as text is typed and cleared', async ({ page }) => {
    await page.goto('/notes/create');

    const contentTextarea = page.getByLabel('Текст заметки');

    // Initial state
    await expect(page.getByText('0 символов')).toBeVisible();

    // Type "Привет" (6 characters)
    await contentTextarea.fill('Привет');
    await expect(page.getByText('6 символов')).toBeVisible();

    // Append ", мир!" (total 12 characters)
    await contentTextarea.fill('Привет, мир!');
    await expect(page.getByText('12 символов')).toBeVisible();

    // Clear textarea
    await contentTextarea.fill('');
    await expect(page.getByText('0 символов')).toBeVisible();
  });

  // SC-104: Edit note page - prefilled data and counter
  test('SC-104: should show prefilled data and correct counter on edit page', async ({ page }) => {
    await page.goto('/notes/edit/1');

    const titleInput = page.getByLabel('Заголовок');
    const contentTextarea = page.getByLabel('Текст заметки');

    // Prefilled values should not be empty
    await expect(titleInput).not.toHaveValue('');
    await expect(contentTextarea).not.toHaveValue('');

    // Counter should show > 0 (mock content "Содержимое первой заметки" = 25 chars)
    const contentValue = await contentTextarea.inputValue();
    const expectedCount = contentValue.length;
    await expect(page.getByText(`${expectedCount} символов`)).toBeVisible();

    // Add more text and verify counter increases
    const additionalText = ' доп';
    await contentTextarea.fill(contentValue + additionalText);
    await expect(page.getByText(`${expectedCount + additionalText.length} символов`)).toBeVisible();
  });

  // SC-105: Character counter accessibility attributes
  test('SC-105: should have aria-live polite attribute on counter element', async ({ page }) => {
    await page.goto('/notes/create');

    const counter = page.getByText('0 символов');
    await expect(counter).toBeVisible();
    await expect(counter).toHaveAttribute('aria-live', 'polite');
  });
});
