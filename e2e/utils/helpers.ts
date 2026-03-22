import { type Page, expect } from '@playwright/test';
import { SELECTORS } from './selectors';

/** Создать заметку с указанным заголовком. */
export async function createNote(page: Page, title: string): Promise<void> {
  await page.getByLabel('New note').fill(title);
  await page.getByRole('button', { name: 'Add' }).click();
}

/** Переключить избранное у заметки по заголовку. */
export async function toggleFavoriteByTitle(page: Page, title: string): Promise<void> {
  await page.getByTestId(SELECTORS.favToggle(title)).click();
}

/** Включить или выключить фильтр «Только избранные». */
export async function setFavoritesFilter(page: Page, on: boolean): Promise<void> {
  const checkbox = page.getByTestId(SELECTORS.favoritesFilter);
  if (on) {
    await checkbox.check();
  } else {
    await checkbox.uncheck();
  }
}

/** Ввести текст в поле поиска. */
export async function setSearchQuery(page: Page, query: string): Promise<void> {
  await page.getByPlaceholder('Поиск заметок...').fill(query);
}

/** Удалить заметку по заголовку. */
export async function deleteNoteByTitle(page: Page, title: string): Promise<void> {
  await page.getByRole('button', { name: `Delete note: ${title}` }).click();
}

/** Проверить отображение счётчиков заметок. */
export async function expectCounters(
  page: Page,
  counters: { total?: number; found?: number; of?: number },
): Promise<void> {
  if (counters.total !== undefined) {
    await expect(page.getByText(`Всего заметок: ${counters.total}`)).toBeVisible();
  }
  if (counters.found !== undefined && counters.of !== undefined) {
    await expect(page.getByText(`Найдено: ${counters.found} из ${counters.of}`)).toBeVisible();
  }
}
