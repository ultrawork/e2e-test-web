import type { Note, CreateNoteDto } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

/**
 * Universal request helper with error handling.
 * Throws an Error with the response status text when the response is not ok.
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: HeadersInit = { ...options?.headers };
  if (options?.body) {
    (headers as Record<string, string>)['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/**
 * Fetches all notes from the backend.
 */
export async function getNotes(): Promise<Note[]> {
  return request<Note[]>('/notes');
}

/**
 * Creates a new note.
 */
export async function createNote(dto: CreateNoteDto): Promise<Note> {
  return request<Note>('/notes', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/**
 * Deletes a note by id.
 */
export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/notes/${id}`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
}

/**
 * Toggles the favorite status of a note by id.
 * Returns the updated note from the server.
 */
export async function toggleFavorite(id: string): Promise<Note> {
  return request<Note>(`/notes/${id}/favorite`, { method: 'PATCH' });
}
