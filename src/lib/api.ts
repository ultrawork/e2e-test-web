import type { Note, CreateNoteDto } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

/** Reads JWT token from localStorage (SSR-safe). */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/** Generic fetch wrapper that adds auth header and handles 401. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const body = await res.json();
      if (body.message) message = body.message;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Fetches all notes. */
export function getNotes(): Promise<Note[]> {
  return request<Note[]>('/notes');
}

/** Creates a new note. */
export function createNote(dto: CreateNoteDto): Promise<Note> {
  return request<Note>('/notes', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/** Deletes a note by id. */
export function deleteNote(id: string): Promise<void> {
  return request<void>(`/notes/${id}`, { method: 'DELETE' });
}

/** Toggles the favorite status of a note. */
export function toggleFavorite(id: string): Promise<Note> {
  return request<Note>(`/notes/${id}/favorite`, { method: 'PATCH' });
}

/** Authenticates user and returns JWT token. */
export function login(email: string, password: string): Promise<{ token: string }> {
  return request<{ token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
