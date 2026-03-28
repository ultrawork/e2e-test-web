const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

/** Retrieve the auth token from localStorage. */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/** Remove the auth token from localStorage. */
export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
}

/** Generic API request with Authorization header and 401 handling. */
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    throw new Error(`API error: ${res.status}`);
  }

  // 204 No Content is a success (2xx) so !res.ok above won't catch it
  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export interface Note {
  id: string;
  text: string;
  createdAt: string;
}

/** Fetch all notes from the API. */
export function getNotes(): Promise<Note[]> {
  return apiRequest<Note[]>('/api/notes');
}

/** Create a new note via the API. */
export function createNote(text: string): Promise<Note> {
  return apiRequest<Note>('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

/** Delete a note by ID via the API. */
export function deleteNote(id: string): Promise<void> {
  return apiRequest<void>(`/api/notes/${id}`, { method: 'DELETE' });
}
