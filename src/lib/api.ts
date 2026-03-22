import { Note } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** Fetch all notes from the API. */
export async function getNotes(): Promise<Note[]> {
  const res = await fetch(`${API_URL}/api/notes`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || res.statusText);
  }
  return res.json();
}

/** Create a new note with the given title and content. */
export async function createNote(data: { title: string; content: string }): Promise<Note> {
  const res = await fetch(`${API_URL}/api/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || res.statusText);
  }
  return res.json();
}

/** Delete a note by ID. */
export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/notes/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || res.statusText);
  }
}

/** Toggle the favorite status of a note by ID. */
export async function toggleFavorite(id: string): Promise<Note> {
  const res = await fetch(`${API_URL}/api/notes/${id}/favorite`, { method: 'PATCH' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || err.message || res.statusText);
  }
  return res.json();
}
