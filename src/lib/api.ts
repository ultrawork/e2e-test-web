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
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

/** Fetches all notes. */
export async function getNotes(): Promise<Note[]> {
  return apiRequest<Note[]>('/api/notes', { method: 'GET' });
}

/** Creates a new note. */
export async function createNote(text: string): Promise<Note> {
  return apiRequest<Note>('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

/** Deletes a note by ID. */
export async function deleteNote(id: string): Promise<void> {
  return apiRequest<void>(`/api/notes/${id}`, { method: 'DELETE' });
}
