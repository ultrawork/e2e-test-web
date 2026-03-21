import type { Category, Note } from '@/types';

interface Store {
  categories: Category[];
  notes: Note[];
}

const globalStore = globalThis as unknown as { __app_store?: Store };

if (!globalStore.__app_store) {
  globalStore.__app_store = {
    categories: [],
    notes: [],
  };
}

export const categories: Category[] = globalStore.__app_store.categories;
export const notes: Note[] = globalStore.__app_store.notes;

export function generateId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // fallback below
  }
  // Fallback UUID v4 generation
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
