import type { Note } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/** Получить токен из localStorage. */
export function getToken(): string | null {
  return localStorage.getItem('token');
}

/** Сохранить токен в localStorage. */
export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

/** Удалить токен из localStorage. */
export function clearToken(): void {
  localStorage.removeItem('token');
}

/** Типобезопасный запрос к API с авторизацией и обработкой 401. */
async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

/** Получить список заметок. */
export function getNotes(): Promise<Note[]> {
  return apiRequest<Note[]>('GET', '/api/notes');
}

/** Создать заметку с указанным заголовком. */
export function createNote(title: string): Promise<Note> {
  return apiRequest<Note>('POST', '/api/notes', { title, content: title });
}

/** Удалить заметку по id. */
export function deleteNote(id: string): Promise<void> {
  return apiRequest<void>('DELETE', `/api/notes/${id}`);
}
