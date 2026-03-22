import type {
  Category,
  Note,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateNoteDto,
  UpdateNoteDto,
} from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Checks the response status and parses JSON.
 * Throws an error with the server message when the response is not ok.
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message: string;
    try {
      const body = await response.json();
      message = body.message || body.error || response.statusText;
    } catch {
      message = response.statusText;
    }
    throw new Error(`HTTP ${response.status}: ${message}`);
  }
  return response.json() as Promise<T>;
}

/**
 * Checks the response status for requests that return no body (e.g. DELETE 204).
 * Throws an error with the server message when the response is not ok.
 */
export async function handleEmptyResponse(response: Response): Promise<void> {
  if (!response.ok) {
    let message: string;
    try {
      const body = await response.json();
      message = body.message || body.error || response.statusText;
    } catch {
      message = response.statusText;
    }
    throw new Error(`HTTP ${response.status}: ${message}`);
  }
}

// ── Categories ──────────────────────────────────────────────────────────────

/** Fetch all categories. */
export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${BASE_URL}/api/categories`, { method: 'GET' });
  return handleResponse<Category[]>(response);
}

/** Create a new category. */
export async function createCategory(dto: CreateCategoryDto): Promise<Category> {
  const response = await fetch(`${BASE_URL}/api/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  return handleResponse<Category>(response);
}

/** Update an existing category by id. */
export async function updateCategory(id: string, dto: UpdateCategoryDto): Promise<Category> {
  const response = await fetch(`${BASE_URL}/api/categories/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  return handleResponse<Category>(response);
}

/** Delete a category by id. */
export async function deleteCategory(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/categories/${id}`, { method: 'DELETE' });
  await handleEmptyResponse(response);
}

// ── Notes ───────────────────────────────────────────────────────────────────

/** Fetch all notes, optionally filtered by category id. */
export async function getNotes(categoryId?: string): Promise<Note[]> {
  const url = new URL(`${BASE_URL}/api/notes`);
  if (categoryId) url.searchParams.set('categoryId', categoryId);
  const response = await fetch(url.toString(), { method: 'GET' });
  return handleResponse<Note[]>(response);
}

/** Create a new note. */
export async function createNote(dto: CreateNoteDto): Promise<Note> {
  const response = await fetch(`${BASE_URL}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  return handleResponse<Note>(response);
}

/** Update an existing note by id. */
export async function updateNote(id: string, dto: UpdateNoteDto): Promise<Note> {
  const response = await fetch(`${BASE_URL}/api/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  return handleResponse<Note>(response);
}

/** Delete a note by id. */
export async function deleteNote(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/api/notes/${id}`, { method: 'DELETE' });
  await handleEmptyResponse(response);
}
