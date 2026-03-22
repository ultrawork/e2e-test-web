/** Стабильные data-testid селекторы для E2E тестов. */
export const SELECTORS = {
  favoritesFilter: 'favorites-filter',
  searchInput: 'search-input',
  notesCounter: 'notes-counter',
  noteItem: (title: string) => `note-${title}`,
  favToggle: (title: string) => `fav-${title}`,
  deleteButton: (title: string) => `delete-${title}`,
} as const;
