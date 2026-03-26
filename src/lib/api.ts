import { CreateNoteDto, Note } from '@/types';

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string>) },
    });
  } catch {
    throw new Error('Сетевая ошибка. Проверьте подключение к интернету.');
  }

  if (response.status === 401) {
    throw new Error(
      'Необходима авторизация. Сохраните токен в localStorage под ключом "token".'
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    let message = `Ошибка сервера: ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore parse error, use default message
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function getNotes(): Promise<Note[]> {
  return request<Note[]>('/notes');
}

export async function createNote(dto: CreateNoteDto): Promise<Note> {
  return request<Note>('/notes', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function deleteNote(id: string): Promise<void> {
  return request<void>(`/notes/${id}`, { method: 'DELETE' });
}
