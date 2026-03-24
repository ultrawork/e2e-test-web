import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNotes, createNote, deleteNote, toggleFavorite } from '../api';
import type { Note } from '@/types';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
});

describe('getNotes', () => {
  it('fetches notes and adds isFavorited: false', async () => {
    const backendNotes = [
      { id: '1', title: 'Test', content: 'Body', userId: 'u1', createdAt: '', updatedAt: '', categories: [] },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(backendNotes),
    });

    const notes = await getNotes();

    expect(notes).toHaveLength(1);
    expect(notes[0].isFavorited).toBe(false);
    expect(notes[0].title).toBe('Test');
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal Server Error' }),
    });

    await expect(getNotes()).rejects.toThrow('Internal Server Error');
  });

  it('throws with status code when no error field in body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: () => Promise.resolve({}),
    });

    await expect(getNotes()).rejects.toThrow('Request failed: 502');
  });
});

describe('createNote', () => {
  it('posts note and adds isFavorited: false', async () => {
    const created = { id: '2', title: 'New', content: 'Content', userId: 'u1', createdAt: '', updatedAt: '', categories: [] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(created),
    });

    const note = await createNote({ title: 'New', content: 'Content' });

    expect(note.isFavorited).toBe(false);
    expect(note.title).toBe('New');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/notes'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New', content: 'Content' }),
      }),
    );
  });
});

describe('deleteNote', () => {
  it('sends DELETE request and handles 204', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    await expect(deleteNote('1')).resolves.toBeUndefined();
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/notes/1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

describe('toggleFavorite', () => {
  it('toggles isFavorited for the given note id', () => {
    const notes: Note[] = [
      { id: '1', title: 'A', content: '', userId: '', createdAt: '', updatedAt: '', categories: [], isFavorited: false },
      { id: '2', title: 'B', content: '', userId: '', createdAt: '', updatedAt: '', categories: [], isFavorited: true },
    ];

    const result = toggleFavorite(notes, '1');

    expect(result[0].isFavorited).toBe(true);
    expect(result[1].isFavorited).toBe(true);
  });

  it('returns a new array (immutable)', () => {
    const notes: Note[] = [
      { id: '1', title: 'A', content: '', userId: '', createdAt: '', updatedAt: '', categories: [], isFavorited: false },
    ];

    const result = toggleFavorite(notes, '1');

    expect(result).not.toBe(notes);
    expect(result[0]).not.toBe(notes[0]);
  });

  it('does not modify notes with different id', () => {
    const notes: Note[] = [
      { id: '1', title: 'A', content: '', userId: '', createdAt: '', updatedAt: '', categories: [], isFavorited: false },
      { id: '2', title: 'B', content: '', userId: '', createdAt: '', updatedAt: '', categories: [], isFavorited: false },
    ];

    const result = toggleFavorite(notes, '1');

    expect(result[0].isFavorited).toBe(true);
    expect(result[1].isFavorited).toBe(false);
  });
});
