import type { Note, CreateNoteDto } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

/**
 * Fetches all notes from the API.
 * @returns Promise resolving to an array of notes.
 * @throws Error if the request fails.
 */
export async function getNotes(): Promise<Note[]> {
  const res = await fetch(`${API_BASE_URL}/notes`, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Failed to fetch notes: ${res.status}`);
  }
  return res.json();
}

/**
 * Creates a new note via the API.
 * @param dto - Data transfer object containing title, content, and optional categoryIds.
 * @returns Promise resolving to the created note.
 * @throws Error if the request fails.
 */
export async function createNote(dto: CreateNoteDto): Promise<Note> {
  const res = await fetch(`${API_BASE_URL}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    throw new Error(`Failed to create note: ${res.status}`);
  }
  return res.json();
}

/**
 * Deletes a note by ID via the API.
 * @param id - The ID of the note to delete.
 * @throws Error if the request fails.
 */
export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/notes/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`Failed to delete note: ${res.status}`);
  }
}
