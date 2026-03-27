import type { Note } from '@/types';

const TOKEN_KEY = 'auth_token';
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Получить токен из localStorage. */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/** Сохранить токен в localStorage. */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** Очистить токен из localStorage. */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/** Унифицированный fetch с Authorization header и обработкой 401. */
async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
}

/** Получить список заметок. */
export async function getNotes(): Promise<Note[]> {
  const response = await apiFetch('/api/notes');
  if (!response.ok) {
    throw new Error(`Ошибка загрузки заметок: ${response.status}`);
  }
  return response.json();
}

/** Создать заметку. */
export async function createNote(title: string): Promise<Note> {
  const response = await apiFetch('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ title, content: title }),
  });
  if (!response.ok) {
    throw new Error(`Ошибка создания заметки: ${response.status}`);
  }
  return response.json();
}

/** Удалить заметку по id. */
export async function deleteNote(id: string): Promise<void> {
  const response = await apiFetch(`/api/notes/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(`Ошибка удаления заметки: ${response.status}`);
  }
}
