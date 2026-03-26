import { Note, LoginResponse } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/** Получить токен из localStorage. */
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/** Очистить токен из localStorage. */
export function clearToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
}

/** Выполнить запрос к API с авторизацией. */
async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
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

  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error(`Ошибка сервера: ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/** Получить список заметок. */
export async function getNotes(): Promise<Note[]> {
  return apiRequest<Note[]>('/api/notes');
}

/** Создать заметку. */
export async function createNote(title: string, content: string): Promise<Note> {
  return apiRequest<Note>('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  });
}

/** Удалить заметку. */
export async function deleteNote(id: string): Promise<void> {
  return apiRequest<void>(`/api/notes/${id}`, {
    method: 'DELETE',
  });
}

/** Переключить статус избранного. */
export async function toggleFavorite(id: string): Promise<Note> {
  return apiRequest<Note>(`/api/notes/${id}/favorite`, {
    method: 'PATCH',
  });
}

/** Авторизация пользователя. */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    throw new Error('Неверные учётные данные');
  }

  return response.json();
}
