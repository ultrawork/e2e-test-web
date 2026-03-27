import { Note, LoginResponse } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

export function clearToken(): void {
  localStorage.removeItem('token');
}

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

  if (response.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function getNotes(): Promise<Note[]> {
  return apiRequest<Note[]>('/api/notes');
}

export async function createNote(text: string): Promise<Note> {
  return apiRequest<Note>('/api/notes', {
    method: 'POST',
    body: JSON.stringify({ text }),
  });
}

export async function deleteNote(id: string): Promise<void> {
  await apiRequest<void>(`/api/notes/${id}`, {
    method: 'DELETE',
  });
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}
