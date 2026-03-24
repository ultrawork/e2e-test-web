import type { Note } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Reads auth token from localStorage. */
export function getToken(): string | null {
  return localStorage.getItem('token');
}

/** Removes auth token from localStorage. */
export function clearToken(): void {
  localStorage.removeItem('token');
}

/** Generic fetch wrapper that adds Authorization header and handles 401. */
export async function apiRequest<T>(path: string, options: RequestInit = {}, skipAuthRedirect = false): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (options.body) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && !skipAuthRedirect) {
      clearToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Request failed with status ${response.status}`);
  }

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/** Fetches all notes. */
export async function getNotes(): Promise<Note[]> {
  return apiRequest<Note[]>('/api/notes', { method: 'GET' });
}

/** Creates a new note. */
export async function createNote(text: string): Promise<Note> {
  return apiRequest<Note>('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ title: text, content: text }),
  });
}

/** Deletes a note by ID. */
export async function deleteNote(id: string): Promise<void> {
  return apiRequest<void>(`/api/notes/${id}`, { method: 'DELETE' });
}
