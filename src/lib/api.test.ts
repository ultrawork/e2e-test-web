import { getNotes, createNote, deleteNote } from './api';
import type { Note } from '@/types';

const mockNote: Note = {
  id: 'note-1',
  title: 'Test note',
  content: 'Test content',
  userId: 'user-1',
  categories: [],
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

beforeEach(() => {
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('getNotes', () => {
  it('returns array of notes on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockNote],
    });

    const notes = await getNotes();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/notes'),
      expect.objectContaining({ method: 'GET' })
    );
    expect(notes).toEqual([mockNote]);
  });

  it('throws an error when response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    await expect(getNotes()).rejects.toThrow();
  });
});

describe('createNote', () => {
  it('sends POST with title and content, returns created note', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockNote,
    });

    const created = await createNote({ title: 'Test note', content: 'Test content' });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/notes'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ title: 'Test note', content: 'Test content' }),
      })
    );
    expect(created).toEqual(mockNote);
  });

  it('throws an error when response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
    });

    await expect(createNote({ title: 'x', content: 'x' })).rejects.toThrow();
  });
});

describe('deleteNote', () => {
  it('sends DELETE request to /notes/:id', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
    });

    await deleteNote('note-1');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/notes/note-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });

  it('throws an error when response is not ok', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
    });

    await expect(deleteNote('note-1')).rejects.toThrow();
  });
});
