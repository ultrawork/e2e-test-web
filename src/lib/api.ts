import type { Note, CreateNoteDto } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

export async function getNotes(): Promise<Note[]> {
  const res = await fetch(`${API_BASE_URL}/notes`, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Failed to fetch notes: ${res.status}`);
  }
  return res.json();
}

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

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/notes/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    throw new Error(`Failed to delete note: ${res.status}`);
  }
}
