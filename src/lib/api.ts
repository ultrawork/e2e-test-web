import { Note } from '@/types';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

function headers(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) {
    h['Authorization'] = `Bearer ${token}`;
  }
  return h;
}

/** Fetch all notes. Returns [] on 401. */
export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch(`${baseUrl}/notes`, { headers: headers() });
  if (res.status === 401) return [];
  if (!res.ok) throw new Error(`fetchNotes failed: ${res.status} ${res.statusText}`);
  return res.json();
}

/** Create a new note. */
export async function createNote(title: string, content: string): Promise<Note> {
  const res = await fetch(`${baseUrl}/notes`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ title, content }),
  });
  if (!res.ok) throw new Error(`createNote failed: ${res.status} ${res.statusText}`);
  return res.json();
}

/** Delete a note by id. */
export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${baseUrl}/notes/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error(`deleteNote failed: ${res.status} ${res.statusText}`);
}
