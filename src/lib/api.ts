/** API client with Authorization header and 401 handling. */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** Retrieve auth token from localStorage. */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/** Remove auth token from localStorage. */
export function removeToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
}

/**
 * Fetch wrapper that attaches Authorization: Bearer <token> header
 * and handles 401 responses by removing the token and dispatching
 * a custom 'auth:unauthorized' event.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    removeToken();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw new Error('Unauthorized');
  }

  return response;
}

export interface Note {
  id: number;
  text: string;
}

/** Fetch all notes from the API. */
export async function fetchNotes(): Promise<Note[]> {
  const res = await apiFetch('/api/notes');
  return res.json();
}

/** Create a new note via the API. */
export async function createNote(text: string): Promise<Note> {
  const res = await apiFetch('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
  return res.json();
}

/** Delete a note by id via the API. */
export async function deleteNoteApi(id: number): Promise<void> {
  await apiFetch(`/api/notes/${id}`, { method: 'DELETE' });
}
