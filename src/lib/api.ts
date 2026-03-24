import type { Note, CreateNoteDto } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

/** Fetches all notes from the API. Adds `isFavorited: false` to each note. */
export async function getNotes(): Promise<Note[]> {
  const data = await request<Omit<Note, 'isFavorited'>[]>('/notes');
  return data.map((note) => ({ ...note, isFavorited: false }));
}

/** Creates a new note via the API. Adds `isFavorited: false` to the result. */
export async function createNote(dto: CreateNoteDto): Promise<Note> {
  const data = await request<Omit<Note, 'isFavorited'>>('/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  return { ...data, isFavorited: false };
}

/** Deletes a note by id. Expects 204 No Content from backend. */
export async function deleteNote(id: string): Promise<void> {
  await request<void>(`/notes/${id}`, { method: 'DELETE' });
}

/** Pure function: toggles `isFavorited` for the note with the given id. */
export function toggleFavorite(notes: Note[], id: string): Note[] {
  return notes.map((note) =>
    note.id === id ? { ...note, isFavorited: !note.isFavorited } : note,
  );
}
