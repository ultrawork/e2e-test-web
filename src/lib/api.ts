import type { Note, CreateNoteDto } from '@/types/note';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch {
      // ignore parse error
    }
    throw new ApiError(message, res.status);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(`${BASE_URL}/api/notes`, {
    headers: getHeaders(),
  });
  return handleResponse<Note[]>(res);
}

export async function createNote(dto: CreateNoteDto): Promise<Note> {
  const res = await fetch(`${BASE_URL}/api/notes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(dto),
  });
  return handleResponse<Note>(res);
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/notes/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse<void>(res);
}

export async function getDevToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/auth/dev-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await handleResponse<{ token: string }>(res);
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', data.token);
  }
  return data.token;
}
