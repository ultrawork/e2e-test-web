import type { Note, ApiError, Result } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

async function handleResponse<T>(res: Response): Promise<Result<T>> {
  if (res.ok) {
    if (res.status === 204) {
      return { ok: true } as Result<T>;
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  }

  let message = `HTTP ${res.status}`;
  try {
    const body = (await res.json()) as { message?: string };
    if (body.message) message = body.message;
  } catch {
    // response body is not JSON
  }

  return { ok: false, error: { message, status: res.status } as ApiError };
}

/** Fetch all notes. */
export async function fetchNotes(): Promise<Result<Note[]>> {
  const res = await fetch(`${API_BASE}/notes`, {
    headers: { ...authHeaders() },
  });
  return handleResponse<Note[]>(res);
}

/** Create a new note. */
export async function createNote(title: string): Promise<Result<Note>> {
  const res = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify({ title }),
  });
  return handleResponse<Note>(res);
}

/** Delete a note by id. */
export async function deleteNote(id: number): Promise<Result<void>> {
  const res = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'DELETE',
    headers: { ...authHeaders() },
  });
  return handleResponse<void>(res);
}
