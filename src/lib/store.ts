/** Category entity stored in memory. */
interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

/** Note entity stored in memory. */
interface Note {
  id: string;
  title: string;
  content: string;
  categories: Category[];
  createdAt: string;
  updatedAt: string;
}

// Persist arrays on globalThis so data survives dev-mode hot reloads.
const g = globalThis as unknown as {
  __app_categories?: Category[];
  __app_notes?: Note[];
};

if (!g.__app_categories) g.__app_categories = [];
if (!g.__app_notes) g.__app_notes = [];

export const categories: Category[] = g.__app_categories;
export const notes: Note[] = g.__app_notes;

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
