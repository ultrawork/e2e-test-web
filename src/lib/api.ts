import type { Category, Note, CreateNoteInput, CreateCategoryInput } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Returns common headers for API requests. */
function getHeaders(): Record<string, string> {
  const token = process.env.NEXT_PUBLIC_API_TOKEN ?? 'dev-token';
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

/** Base fetch wrapper that throws on non-ok responses. */
export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

/** Fetch all categories. */
export function fetchCategories(): Promise<Category[]> {
  return apiFetch<Category[]>('/api/categories');
}

/** Create a new category. */
export function createCategory(input: CreateCategoryInput): Promise<Category> {
  return apiFetch<Category>('/api/categories', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Update an existing category. */
export function updateCategory(id: string, input: CreateCategoryInput): Promise<Category> {
  return apiFetch<Category>(`/api/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

/** Delete a category. */
export function deleteCategory(id: string): Promise<void> {
  return apiFetch<void>(`/api/categories/${id}`, { method: 'DELETE' });
}

/** Fetch notes, optionally filtered by category ID. */
export function fetchNotes(categoryId?: string): Promise<Note[]> {
  const query = categoryId ? `?category=${categoryId}` : '';
  return apiFetch<Note[]>(`/api/notes${query}`);
}

/** Create a new note. */
export function createNote(input: CreateNoteInput): Promise<Note> {
  return apiFetch<Note>('/api/notes', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/** Update an existing note. */
export function updateNote(id: string, input: CreateNoteInput): Promise<Note> {
  return apiFetch<Note>(`/api/notes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

/** Delete a note. */
export function deleteNote(id: string): Promise<void> {
  return apiFetch<void>(`/api/notes/${id}`, { method: 'DELETE' });
}
