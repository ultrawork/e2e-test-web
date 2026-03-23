import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getNotes, createNote, deleteNote } from '../api';
import type { Note } from '@/types';

const mockNote: Note = {
  id: '1',
  title: 'Test Note',
  content: 'Test content',
  userId: 'user-1',
  categories: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('getNotes', () => {
  it('returns notes on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([mockNote]),
      })
    );

    const result = await getNotes();
    expect(result).toEqual([mockNote]);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/notes'),
      expect.objectContaining({ headers: expect.objectContaining({ 'Content-Type': 'application/json' }) })
    );
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      })
    );

    await expect(getNotes()).rejects.toThrow('Request failed: 500 Internal Server Error');
  });
});

describe('createNote', () => {
  it('sends POST and returns created note', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockNote),
      })
    );

    const dto = { title: 'Test Note', content: 'Test content' };
    const result = await createNote(dto);

    expect(result).toEqual(mockNote);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/notes'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(dto),
      })
    );
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      })
    );

    await expect(createNote({ title: '', content: '' })).rejects.toThrow('Request failed: 400 Bad Request');
  });
});

describe('deleteNote', () => {
  it('sends DELETE request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true })
    );

    await deleteNote('1');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/notes/1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('throws on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })
    );

    await expect(deleteNote('999')).rejects.toThrow('Request failed: 404 Not Found');
  });
});
