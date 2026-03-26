import { Note } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    throw new Error('Необходима авторизация');
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `Request failed with status ${res.status}`);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

export const api = {
  async getNotes(): Promise<Note[]> {
    const res = await fetch(`${API_URL}/notes`, {
      headers: authHeaders(),
    });
    return handleResponse<Note[]>(res);
  },

  async createNote(data: { title: string; content: string }): Promise<Note> {
    const res = await fetch(`${API_URL}/notes`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Note>(res);
  },

  async deleteNote(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await handleResponse<void>(res);
  },

  async toggleFavorite(id: string): Promise<Note> {
    const res = await fetch(`${API_URL}/notes/${id}/favorite`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    return handleResponse<Note>(res);
  },
};
